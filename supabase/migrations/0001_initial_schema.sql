-- M2: initial database schema for MONEY_TRACKING
-- Apply with: supabase db push (after linking the intended Supabase project).
-- Monetary values are stored as integer satang; never use floating-point currency.

create type public.app_role as enum ('admin', 'partner');
create type public.entry_type as enum ('income', 'expense');

create table public.app_allowlist (
  email text primary key,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  constraint app_allowlist_email_normalized check (email = lower(trim(email)))
);

insert into public.app_allowlist (email, role) values
  ('kajonsak.dev@gmail.com', 'admin'),
  ('kajonsak6210035@gmail.com', 'partner');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  display_name text,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 40),
  type public.entry_type not null,
  icon text not null default 'circle',
  color text not null default 'slate',
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  unique (id, user_id),
  unique (user_id, name, type)
);

create table public.entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  category_id uuid,
  type public.entry_type not null,
  amount_satang bigint not null check (amount_satang > 0),
  note text check (note is null or char_length(note) <= 500),
  occurred_on date not null default (timezone('Asia/Bangkok', now()))::date,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint entries_category_owner_fk
    foreign key (category_id, user_id)
    references public.categories(id, user_id)
    on delete set null (category_id)
);

create index entries_user_date_idx
  on public.entries (user_id, occurred_on desc, id desc)
  where deleted_at is null;
create index entries_user_type_date_idx
  on public.entries (user_id, type, occurred_on desc)
  where deleted_at is null;
create index categories_user_type_idx on public.categories (user_id, type);

create function public.set_updated_at()
returns trigger language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger entries_set_updated_at
before update on public.entries
for each row execute function public.set_updated_at();

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  allowed_role public.app_role;
begin
  select a.role into allowed_role
  from public.app_allowlist a
  where a.email = lower(trim(new.email));

  if allowed_role is null then
    raise exception 'This Google account is not allowlisted';
  end if;

  insert into public.profiles (id, email, display_name, role)
  values (
    new.id,
    lower(trim(new.email)),
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    allowed_role
  );

  insert into public.categories (user_id, name, type, icon, color, is_default)
  values
    (new.id, 'เงินเดือน', 'income', 'wallet', 'emerald', true),
    (new.id, 'รายได้เสริม', 'income', 'trending-up', 'teal', true),
    (new.id, 'อาหาร', 'expense', 'utensils', 'orange', true),
    (new.id, 'เดินทาง', 'expense', 'car', 'blue', true),
    (new.id, 'ของใช้', 'expense', 'shopping-bag', 'violet', true),
    (new.id, 'บิล/ค่าใช้จ่าย', 'expense', 'receipt', 'rose', true),
    (new.id, 'อื่น ๆ', 'expense', 'shapes', 'slate', true);

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.entries enable row level security;
alter table public.app_allowlist enable row level security;

create policy "Users can read their own profile"
on public.profiles for select to authenticated
using (id = (select auth.uid()));

create policy "Users can read their own categories"
on public.categories for select to authenticated
using (user_id = (select auth.uid()));

create policy "Users can create their own categories"
on public.categories for insert to authenticated
with check (user_id = (select auth.uid()));

create policy "Users can update their own categories"
on public.categories for update to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy "Users can delete their own non-default categories"
on public.categories for delete to authenticated
using (user_id = (select auth.uid()) and is_default = false);

create policy "Users can read their own active entries"
on public.entries for select to authenticated
using (user_id = (select auth.uid()) and deleted_at is null);

create policy "Users can create their own entries"
on public.entries for insert to authenticated
with check (user_id = (select auth.uid()));

create policy "Users can update their own entries"
on public.entries for update to authenticated
using (user_id = (select auth.uid()) and deleted_at is null)
with check (user_id = (select auth.uid()));

-- Soft delete is performed through UPDATE (set deleted_at); physical DELETE is not granted.

-- The allowlist is intentionally inaccessible to browser roles.
revoke all on public.app_allowlist from anon, authenticated;
revoke all on public.profiles from anon;
revoke all on public.categories from anon;
revoke all on public.entries from anon;

grant select on public.profiles to authenticated;
grant select, insert, update, delete on public.categories to authenticated;
grant select, insert, update on public.entries to authenticated;
