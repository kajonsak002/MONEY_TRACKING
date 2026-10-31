-- Admin user management is authenticated in the admin-users Edge Function.
-- RPCs are executable only by service_role, so do not depend on request JWT GUCs
-- inside SECURITY DEFINER functions (PostgREST may not populate that claim GUC).

create or replace function public.admin_upsert_allowlist(
  p_email text,
  p_new_role public.app_role,
  p_actor_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $function$
declare
  normalized_email text := lower(trim(p_email));
begin
  if p_actor_id is null or normalized_email is null
    or position('@' in normalized_email) < 2
    or position('.' in split_part(normalized_email, '@', 2)) < 2
    or position(' ' in normalized_email) > 0 then
    raise exception 'invalid email or actor' using errcode = '22023';
  end if;

  insert into public.app_allowlist(email, role)
  values (normalized_email, p_new_role)
  on conflict (email) do update set role = excluded.role;

  insert into public.admin_audit_logs(actor_id, action, details)
  values (p_actor_id, 'users.allowlist.updated',
    jsonb_build_object('email', normalized_email, 'role', p_new_role::text));
end;
$function$;

create or replace function public.admin_update_user_role(
  p_target_id uuid,
  p_new_role public.app_role,
  p_actor_id uuid
)
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
  if p_target_id is null or p_actor_id is null or p_target_id = p_actor_id then
    raise exception 'invalid target or self role change' using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(hashtext('money_tracking_admin_role_change')::bigint);

  select email, role into target_email, old_role
  from public.profiles where id = p_target_id for update;

  if target_email is null then
    raise exception 'member not found' using errcode = 'P0002';
  end if;

  if old_role = 'admin' and p_new_role = 'partner' then
    select count(*) into admin_count from public.profiles where role = 'admin';
    if admin_count <= 1 then
      raise exception 'at least one administrator must remain' using errcode = '23514';
    end if;
  end if;

  update public.profiles set role = p_new_role where id = p_target_id;

  insert into public.app_allowlist(email, role)
  values (lower(target_email), p_new_role)
  on conflict (email) do update set role = excluded.role;

  insert into public.admin_audit_logs(actor_id, action, target_id, details)
  values (p_actor_id, 'users.role.updated', p_target_id,
    jsonb_build_object('from', old_role::text, 'to', p_new_role::text));
end;
$function$;

revoke all on function public.admin_upsert_allowlist(text, public.app_role, uuid) from public, anon, authenticated;
grant execute on function public.admin_upsert_allowlist(text, public.app_role, uuid) to service_role;
revoke all on function public.admin_update_user_role(uuid, public.app_role, uuid) from public, anon, authenticated;
grant execute on function public.admin_update_user_role(uuid, public.app_role, uuid) to service_role;
