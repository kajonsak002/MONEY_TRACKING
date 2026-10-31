-- Global app branding and preferences. Only authenticated users may read public display settings;
-- mutations are performed by the admin-settings Edge Function using service_role.
create table if not exists public.app_settings (
  key text primary key check (key in ('app_name','app_tagline','deepseek_low_balance_threshold')),
  value jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);
alter table public.app_settings enable row level security;
revoke all on public.app_settings from anon, authenticated;
grant select on public.app_settings to authenticated;
create policy "Authenticated users can read app settings"
on public.app_settings for select to authenticated using (true);

insert into public.app_settings(key,value)
values
 ('app_name', to_jsonb('MoneyMate'::text)),
 ('app_tagline', to_jsonb('บันทึกรายรับรายจ่ายอย่างเป็นระบบ'::text)),
 ('deepseek_low_balance_threshold', to_jsonb(5))
on conflict (key) do nothing;

-- The app keeps a financial history. Prevent soft-delete through direct UPDATE as well.
create or replace function public.prevent_entry_history_deletion()
returns trigger
language plpgsql
set search_path = ''
as $function$
begin
  if new.deleted_at is distinct from old.deleted_at then
    raise exception 'Transaction history cannot be deleted or hidden'
      using errcode = '42501';
  end if;
  return new;
end;
$function$;

drop trigger if exists entries_prevent_history_deletion on public.entries;
create trigger entries_prevent_history_deletion
before update of deleted_at on public.entries
for each row execute function public.prevent_entry_history_deletion();
