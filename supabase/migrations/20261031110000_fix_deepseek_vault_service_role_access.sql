-- The Edge Function invokes these RPCs with the service-role client.
-- EXECUTE is restricted to service_role, so a second JWT-claim check inside
-- SECURITY DEFINER is redundant and can reject valid service-role RPC calls.
create or replace function public.admin_set_deepseek_api_key(p_api_key text, p_actor_id uuid)
returns void
language plpgsql
security definer
set search_path to ''
as $function$
declare secret_id uuid;
begin
  if p_actor_id is null or p_api_key is null or length(trim(p_api_key)) < 20 or length(p_api_key) > 500 then
    raise exception 'invalid input' using errcode = '22023';
  end if;

  select id into secret_id
  from vault.secrets
  where name = 'deepseek_api_key'
  order by updated_at desc
  limit 1;

  if secret_id is null then
    perform vault.create_secret(trim(p_api_key), 'deepseek_api_key', 'DeepSeek API key managed by MONEY_TRACKING Admin');
  else
    perform vault.update_secret(secret_id, trim(p_api_key), 'deepseek_api_key', 'DeepSeek API key managed by MONEY_TRACKING Admin');
  end if;

  insert into public.admin_audit_logs(actor_id, action, details)
  values (p_actor_id, 'settings.deepseek_key.updated', jsonb_build_object('secret_name', 'deepseek_api_key'));
end;
$function$;

create or replace function public.admin_remove_deepseek_api_key(p_actor_id uuid)
returns void
language plpgsql
security definer
set search_path to ''
as $function$
begin
  if p_actor_id is null then
    raise exception 'actor required' using errcode = '22023';
  end if;

  delete from vault.secrets where name = 'deepseek_api_key';

  insert into public.admin_audit_logs(actor_id, action, details)
  values (p_actor_id, 'settings.deepseek_key.removed', jsonb_build_object('secret_name', 'deepseek_api_key'));
end;
$function$;

revoke all on function public.admin_set_deepseek_api_key(text, uuid) from public, anon, authenticated;
grant execute on function public.admin_set_deepseek_api_key(text, uuid) to service_role;
revoke all on function public.admin_remove_deepseek_api_key(uuid) from public, anon, authenticated;
grant execute on function public.admin_remove_deepseek_api_key(uuid) to service_role;
