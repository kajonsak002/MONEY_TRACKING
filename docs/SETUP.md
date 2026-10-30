# Setup and release checklist

## Prerequisites
- Node.js 20+
- pnpm 9+
- Supabase project

## Local development
1. Run `pnpm install`.
2. Copy `apps/web/.env.example` to `apps/web/.env.local`.
3. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in the local env file.
4. Run `pnpm dev`.

## Database
Apply migrations in order using Supabase CLI or SQL Editor:
1. `supabase/migrations/0001_initial_schema.sql`
2. `supabase/migrations/0002_monthly_budgets.sql`
3. Apply all timestamped migrations in ascending version order.

The schema stores all money as integer satang. RLS is the authorization boundary:
- Admin can read all profiles and active financial records.
- Partner can read only their own profile and financial records.
- Writes remain owner-scoped.
- Entries are soft-deleted; physical delete is not granted.
- Categories and monthly budgets are scoped to the signed-in owner.

Add approved account/role pairs to `public.app_allowlist` privately in Supabase SQL Editor. Do not put real addresses in this public repository.

## Google OAuth
1. Enable Google in Supabase Authentication → Providers.
2. Add Google OAuth Client ID and Client Secret in Supabase.
3. Set Supabase Site URL to the local or production app URL.
4. Add `http://localhost:5173/auth/callback` and the production `/auth/callback` URL to Supabase allowed redirect URLs.
5. In Google Cloud, add the Supabase callback URL shown in the provider settings (normally `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`) to authorized redirect URIs.

## DeepSeek AI quick add
The browser calls the authenticated `parse-entry` Edge Function. The function validates the user's Supabase session and returns a draft only; the user must review and confirm before an entry is written.

Deploy the Edge Functions after database migrations:
```bash
supabase functions deploy parse-entry
supabase functions deploy admin-settings
supabase functions deploy admin-users
```

The Admin enters the DeepSeek API Key at `/admin/settings`. It is stored in Supabase Vault and accessed only by service-role RPCs from the Edge Functions. Do not set a `VITE_` DeepSeek key or add it to GitHub. Supabase injects the service-role key into Edge Functions; never expose it to the browser.

## Cloudflare Workers Builds
- Production trigger: branch `main`, build command `pnpm install --no-frozen-lockfile && pnpm --filter @money-tracking/web build`, deploy command `npx wrangler deploy`.
- Preview trigger: non-production branches, same build command, deploy command `echo Preview-build-only`. This validates the bundle without creating a preview deployment; keep it separate from the production trigger.

## Vercel
After local integration tests pass:
- Import the repository and select the web app root directory (`apps/web`) if required by the project configuration.
- Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in Preview and Production environments.
- Set the production URL in Supabase Auth Site URL and allowed redirects.
- Redeploy after changing environment variables.

## Domain and Cloudflare
A custom domain can be attached in Vercel without changing React routes or API paths. Configure DNS records exactly as Vercel instructs. Cloudflare is optional; use it for DNS/proxy/security only after the Vercel domain is verified. Do not proxy or rewrite Supabase API paths unless deliberately configured.

## Reports, categories and budgets
- Reports support current month, current year and custom date ranges.
- Monthly expense budgets require migration 0002.
- Category operations are owner-scoped.
- Admin reports can aggregate active entries visible under the admin RLS policy.

## Backup policy
- Manual: Settings → สำรอง JSON / ส่งออก CSV. Keep downloaded backups in a private location.
- Automated: `.github/workflows/backup.yml` creates an encrypted PostgreSQL dump and uploads it to a private Cloudflare R2 bucket daily. Configure the required GitHub Actions secrets and R2 lifecycle retention in `docs/OPERATIONS.md` before enabling it.
- Run a restore drill into an isolated database before claiming recovery is verified.
- Never store database passwords, service-role credentials, encryption passphrases, or backup files in source control.

## Final production verification
- Test Google OAuth with both approved Admin and Partner accounts.
- Confirm unapproved Google accounts are rejected.
- Verify Partner A cannot read or mutate Partner B's records.
- Verify Admin can read all profiles and active entries but cannot write another user's entries.
- Test create, soft delete, category changes, report filters, budget, AI parse and export.
- Confirm AI results are drafts and nothing is saved before explicit confirmation.
- Verify secrets are absent from browser bundles and Git history.
- Run `pnpm typecheck`, `pnpm lint`, `pnpm test`, and `pnpm build`.

## Secret policy
- Browser-safe: Supabase project URL and publishable key.
- Server-only: DeepSeek API key, Supabase service-role key and OAuth client secret.
- Never commit `.env.local`, allowlist email addresses, credentials or backup exports.
