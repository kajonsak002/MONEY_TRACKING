# Database and access control (M2)

The first migration is `supabase/migrations/0001_initial_schema.sql`.

## Account allowlist

The allowlist is stored in `public.app_allowlist`, with no browser-role grants. Approved email/role pairs must be inserted privately in the Supabase SQL editor after migration; do not commit real email addresses to this public repository. A database trigger checks the normalized Google account email before creating a profile. Accounts not on the allowlist are rejected.

## Data model

- `profiles`: one row per Supabase Auth user; role is assigned from the private allowlist.
- `categories`: user-owned income/expense categories; default categories are created at signup.
- `entries`: user-owned income/expense records; amounts are positive integer satang and dates use Thailand local date.
- Entries are soft-deleted by setting `deleted_at`; authenticated clients are not granted physical DELETE.

## Row-level security

RLS is enabled on all four tables. Profiles, categories and entries are scoped to `auth.uid()`. The allowlist has no SELECT/INSERT/UPDATE/DELETE grants for `anon` or `authenticated`. No policy trusts a client-supplied user ID without matching the authenticated subject.

## Apply to Supabase

1. Create/select the intended Supabase project.
2. Install and authenticate the Supabase CLI.
3. Run `supabase link --project-ref YOUR_PROJECT_REF`.
4. Review the migration, then run `supabase db push`.
5. Configure Google as an Auth provider and add the app's callback URL to the Google/Supabase OAuth configuration.

The migration is committed to the repository only; it has **not** been applied to a live Supabase project. Do not put service-role keys or DeepSeek API keys in Vite environment variables or GitHub source.
