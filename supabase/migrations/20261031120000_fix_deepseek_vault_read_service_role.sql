-- The parser Edge Function reads this secret using a service-role Supabase client.
-- Restrict RPC execution to service_role; do not depend on a request JWT GUC
-- inside SECURITY DEFINER, which can be absent in PostgREST RPC execution.
create or replace function public.admin_get_deepseek_api_key()
returns text
language sql
stable
security definer
set search_path to ''
as $function$
  select decrypted_secret
  from vault.decrypted_secrets
  where name = 'deepseek_api_key'
  order by updated_at desc
  limit 1;
$function$;

revoke all on function public.admin_get_deepseek_api_key() from public, anon, authenticated;
grant execute on function public.admin_get_deepseek_api_key() to service_role;
