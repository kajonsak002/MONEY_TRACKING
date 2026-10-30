-- Final hardening for server-only secret management.
-- The browser must never call Vault management RPCs directly.
drop function if exists public.admin_set_deepseek_api_key(text);
drop function if exists public.admin_remove_deepseek_api_key();
drop function if exists public.admin_set_deepseek_api_key(text, uuid);
drop function if exists public.admin_remove_deepseek_api_key(uuid);

create or replace function public.admin_deepseek_key_status()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from vault.secrets where name = 'deepseek_api_key');
$$;

create or replace function public.admin_set_deepseek_api_key(p_api_key text, p_actor_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  secret_id uuid;
begin
  if coalesce(current_setting('request.jwt.claim.role', true), '') <> 'service_role' then
    raise exception 'service role required' using errcode = '42501';
  end if;
  if p_actor_id is null or p_api_key is null or length(trim(p_api_key)) < 20 or length(p_api_key) > 500 then
    raise exception 'invalid input' using errcode = '22023';
  end if;
  select id into secret_id from vault.secrets where name = 'deepseek_api_key' order by updated_at desc limit 1;
  if secret_id is null then
    perform vault.create_secret(trim(p_api_key), 'deepseek_api_key', 'DeepSeek API key managed by MONEY_TRACKING Admin');
  else
    perform vault.update_secret(secret_id, trim(p_api_key), 'deepseek_api_key', 'DeepSeek API key managed by MONEY_TRACKING Admin');
  end if;
  insert into public.admin_audit_logs(actor_id, action, details)
  values (p_actor_id, 'settings.deepseek_key.updated', jsonb_build_object('secret_name', 'deepseek_api_key'));
end;
$$;

create or replace function public.admin_remove_deepseek_api_key(p_actor_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if coalesce(current_setting('request.jwt.claim.role', true), '') <> 'service_role' then
    raise exception 'service role required' using errcode = '42501';
  end if;
  if p_actor_id is null then raise exception 'actor required' using errcode = '22023'; end if;
  delete from vault.secrets where name = 'deepseek_api_key';
  insert into public.admin_audit_logs(actor_id, action, details)
  values (p_actor_id, 'settings.deepseek_key.removed', jsonb_build_object('secret_name', 'deepseek_api_key'));
end;
$$;

create or replace function public.admin_get_deepseek_api_key()
returns text
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if coalesce(current_setting('request.jwt.claim.role', true), '') <> 'service_role' then
    raise exception 'service role required' using errcode = '42501';
  end if;
  return (select decrypted_secret from vault.decrypted_secrets where name = 'deepseek_api_key' order by updated_at desc limit 1);
end;
$$;

revoke all on function public.admin_deepseek_key_status() from public, anon, authenticated;
revoke all on function public.admin_set_deepseek_api_key(text, uuid) from public, anon, authenticated;
revoke all on function public.admin_remove_deepseek_api_key(uuid) from public, anon, authenticated;
revoke all on function public.admin_get_deepseek_api_key() from public, anon, authenticated;
grant execute on function public.admin_deepseek_key_status() to service_role;
grant execute on function public.admin_set_deepseek_api_key(text, uuid) to service_role;
grant execute on function public.admin_remove_deepseek_api_key(uuid) to service_role;
grant execute on function public.admin_get_deepseek_api_key() to service_role;

create or replace function public.admin_update_user_role(p_target_id uuid, p_new_role public.app_role, p_actor_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $function$
declare
  target_email text;
  old_role public.app_role;
  admin_count integer;
begin
  if coalesce(current_setting('request.jwt.claim.role', true), '') <> 'service_role' then
    raise exception 'service role required' using errcode = '42501';
  end if;
  if p_target_id is null or p_actor_id is null or p_target_id = p_actor_id then
    raise exception 'invalid target or self role change' using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(hashtext('money_tracking_admin_role_change'));
  select email, role into target_email, old_role
  from public.profiles where id = p_target_id for update;
  if target_email is null then raise exception 'member not found' using errcode = 'P0002'; end if;

  if old_role = 'admin' and p_new_role = 'partner' then
    select count(*) into admin_count from public.profiles where role = 'admin';
    if admin_count <= 1 then raise exception 'at least one administrator must remain' using errcode = '23514'; end if;
  end if;

  update public.profiles set role = p_new_role where id = p_target_id;
  insert into public.app_allowlist(email, role) values (lower(target_email), p_new_role)
  on conflict (email) do update set role = excluded.role;
  insert into public.admin_audit_logs(actor_id, action, target_id, details)
  values (p_actor_id, 'users.role.updated', p_target_id,
    jsonb_build_object('from', old_role::text, 'to', p_new_role::text));
end;
$function$;

revoke all on function public.admin_update_user_role(uuid, public.app_role, uuid) from public, anon, authenticated;
grant execute on function public.admin_update_user_role(uuid, public.app_role, uuid) to service_role;

