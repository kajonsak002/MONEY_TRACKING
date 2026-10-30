-- M7: monthly expense budgets. Amounts are integer satang.
create table public.monthly_budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  month_start date not null check (extract(day from month_start) = 1),
  limit_satang bigint not null check (limit_satang > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, month_start)
);

create index monthly_budgets_user_month_idx
  on public.monthly_budgets (user_id, month_start desc);

create trigger monthly_budgets_set_updated_at
before update on public.monthly_budgets
for each row execute function public.set_updated_at();

alter table public.monthly_budgets enable row level security;

create policy "Monthly budgets visible to owner and admin"
on public.monthly_budgets for select to authenticated
using (user_id = (select auth.uid()) or (select public.current_user_is_admin()));

create policy "Users can create their own monthly budgets"
on public.monthly_budgets for insert to authenticated
with check (user_id = (select auth.uid()));

create policy "Users can update their own monthly budgets"
on public.monthly_budgets for update to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy "Users can delete their own monthly budgets"
on public.monthly_budgets for delete to authenticated
using (user_id = (select auth.uid()));

revoke all on public.monthly_budgets from anon;
grant select, insert, update, delete on public.monthly_budgets to authenticated;
