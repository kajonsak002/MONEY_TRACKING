# Database and access control (M2)

The first migration is `supabase/migrations/0001_initial_schema.sql`.

## Account allowlist

The allowlist is stored in `public.app_allowlist`, with no browser-role grants. Approved email/role pairs must be inserted privately in the Supabase SQL editor after migration; do not commit real email addresses to this public repository. A database trigger checks the normalized Google account email before creating a profile. Accounts not on the allowlist are rejected.

## Data model

- `profiles`: one row per Supabase Auth user; role is assigned from the private allowlist.
- `categories`: user-owned income/expense categories; default categories are created at signup.
- `entries`: user-owned income/expense records; amounts are positive integer satang and dates use Thailand local date.
- Entries are soft-deleted by setting `deleted_at`; authenticated clients are not granted physical DELETE.

## Visibility and RLS

The selected access model is **admin visibility**:
- Admin can read all profiles and all active entries/categories.
- Partner can read only their own profile and their own active entries/categories.
- Both roles can create, update, and delete (categories only) only their own records.
- Admin visibility does not imply permission to edit or delete another user's financial records.
- The allowlist has no SELECT/INSERT/UPDATE/DELETE grants for `anon` or `authenticated`.

RLS is enabled on all four tables. The helper `private.current_user_is_admin()` is SECURITY DEFINER with a fixed empty search path and lives outside the exposed PostgREST schema to avoid recursive profile-policy evaluation without exposing a callable public RPC.

## Currency and AI

- Currency: THB. Amounts are stored as integer satang (100 satang = 1 THB).
- AI provider: DeepSeek. The DeepSeek API key is stored in Supabase Vault. Only service-role Edge Functions can read it; the Admin UI writes it through the authenticated `admin-settings` Edge Function. It must never use a `VITE_` prefix or be committed to Git.
- The browser may call a protected server endpoint for AI parsing; the server must validate the authenticated user and enforce request limits before calling DeepSeek.

## Backups

The selected policy is both manual and automated:
- Manual: periodically export/download a database backup and keep a copy outside the Supabase project.
- Automated: use the scheduled encrypted PostgreSQL dump workflow in `.github/workflows/backup.yml`, upload to a private Cloudflare R2 bucket, and configure the required GitHub Actions secrets and `BACKUP_ENABLED` repository variable as documented in `docs/OPERATIONS.md`.
- Test restoration periodically; an export is not a verified backup until it has been restored successfully.

## Apply to Supabase

1. Confirm the project URL and publishable key in the local environment; do not commit real environment files.
2. Install and authenticate the Supabase CLI.
3. Run `supabase link --project-ref YOUR_PROJECT_REF`.
4. Review the migration, then run `supabase db push`.
5. Insert the approved account/role pairs into `public.app_allowlist` privately in the Supabase SQL editor.
6. Configure Google as an Auth provider and add the app's callback URL to the Google/Supabase OAuth configuration.

Timestamped migrations are tracked in Git and applied to the designated MONEY_TRACKING Supabase project as part of the controlled release process. Verify the migration history in Supabase before any re-application. Do not put service-role keys or DeepSeek API keys in Vite environment variables or GitHub source.
