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
  return (
    select decrypted_secret
    from vault.decrypted_secrets
    where name = 'deepseek_api_key'
    order by updated_at desc
    limit 1
  );
end;
$$;

revoke all on function public.admin_get_deepseek_api_key() from public, anon, authenticated;
grant execute on function public.admin_get_deepseek_api_key() to service_role;
