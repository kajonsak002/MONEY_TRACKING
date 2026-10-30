create table if not exists public.admin_audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null check (char_length(action) between 1 and 100),
  target_id uuid,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists admin_audit_logs_created_at_idx
  on public.admin_audit_logs (created_at desc);

alter table public.admin_audit_logs enable row level security;

drop policy if exists "Admins can read audit logs" on public.admin_audit_logs;
create policy "Admins can read audit logs"
  on public.admin_audit_logs for select to authenticated
  using ((select public.current_user_is_admin()));

revoke all on public.admin_audit_logs from anon, authenticated;
grant select on public.admin_audit_logs to authenticated;

create or replace function public.admin_deepseek_key_status()
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or not public.current_user_is_admin() then
    raise exception 'admin access required' using errcode = '42501';
  end if;
  return exists (select 1 from vault.secrets where name = 'deepseek_api_key');
end;
$$;

create or replace function public.admin_set_deepseek_api_key(p_api_key text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  secret_id uuid;
  actor uuid := auth.uid();
begin
  if actor is null or not public.current_user_is_admin() then
    raise exception 'admin access required' using errcode = '42501';
  end if;
  if p_api_key is null or length(trim(p_api_key)) < 20 or length(p_api_key) > 500 then
    raise exception 'invalid API key format' using errcode = '22023';
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
  values (actor, 'settings.deepseek_key.updated', jsonb_build_object('secret_name', 'deepseek_api_key'));
end;
$$;

create or replace function public.admin_remove_deepseek_api_key()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
begin
  if actor is null or not public.current_user_is_admin() then
    raise exception 'admin access required' using errcode = '42501';
  end if;

  delete from vault.secrets where name = 'deepseek_api_key';
  insert into public.admin_audit_logs(actor_id, action, details)
  values (actor, 'settings.deepseek_key.removed', jsonb_build_object('secret_name', 'deepseek_api_key'));
end;
$$;

revoke all on function public.admin_deepseek_key_status() from public, anon;
revoke all on function public.admin_set_deepseek_api_key(text) from public, anon;
revoke all on function public.admin_remove_deepseek_api_key() from public, anon;
grant execute on function public.admin_deepseek_key_status() to authenticated;
grant execute on function public.admin_set_deepseek_api_key(text) to authenticated;
grant execute on function public.admin_remove_deepseek_api_key() to authenticated;
