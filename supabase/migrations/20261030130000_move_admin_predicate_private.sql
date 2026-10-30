-- Keep the SECURITY DEFINER role predicate outside the exposed PostgREST schema.
create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create or replace function private.current_user_is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role = 'admin'
  );
$function$;

revoke all on function private.current_user_is_admin() from public, anon;
grant execute on function private.current_user_is_admin() to authenticated;

alter policy "Admins can read audit logs" on public.admin_audit_logs
  using ((select private.current_user_is_admin()));
alter policy "Profiles visible to owner and admin" on public.profiles
  using (id = (select auth.uid()) or (select private.current_user_is_admin()));
alter policy "Categories visible to owner and admin" on public.categories
  using (user_id = (select auth.uid()) or (select private.current_user_is_admin()));
alter policy "Active entries visible to owner and admin" on public.entries
  using (deleted_at is null and (user_id = (select auth.uid()) or (select private.current_user_is_admin())));
alter policy "Monthly budgets visible to owner and admin" on public.monthly_budgets
  using (user_id = (select auth.uid()) or (select private.current_user_is_admin()));

drop function public.current_user_is_admin();
