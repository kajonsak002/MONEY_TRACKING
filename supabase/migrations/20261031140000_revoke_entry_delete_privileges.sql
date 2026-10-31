-- Financial history is append-only from the browser application.
-- The app can create and read entries; it must never physically delete them.
revoke delete on table public.entries from public, anon, authenticated;
grant select, insert, update on table public.entries to authenticated;
