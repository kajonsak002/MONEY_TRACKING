# Setup

## Prerequisites
- Node.js 20+
- pnpm 9+
- A Supabase project with migration `supabase/migrations/0001_initial_schema.sql` applied

## Local development

1. Install dependencies:
   ```bash
   pnpm install
   ```
2. Copy `apps/web/.env.example` to `apps/web/.env.local`.
3. Fill in the Supabase project URL and publishable key:
   ```dotenv
   VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY
   ```
4. Start the app:
   ```bash
   pnpm dev
   ```

## Supabase Auth configuration

1. In Supabase Dashboard, open Authentication → Providers → Google and enable Google.
2. Configure the Google OAuth Client ID and Client Secret in the Supabase provider settings.
3. In Authentication → URL Configuration, set the Site URL to the deployed app URL (for local development use `http://localhost:5173`).
4. Add the local and production callback URLs to the Google OAuth client's authorized redirect URIs. The Supabase callback is shown in the Google provider settings and normally has the form `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`.
5. Add the app callback route (`/auth/callback`) to the allowed redirect URLs in Supabase.
6. Insert the approved email/role pairs into `public.app_allowlist` using the Supabase SQL Editor. Keep these addresses out of Git. Use roles `admin` and `partner`.

The database trigger rejects users not present in the allowlist. A successful Google OAuth flow is not sufficient by itself: the profile must be created by the allowlist trigger.

## Current authentication behavior

- Unauthenticated visitors are redirected to `/login`.
- Google OAuth uses Supabase Auth and returns to `/auth/callback`.
- The app loads the user's profile and role from `public.profiles`.
- Admin/partner read visibility is enforced by PostgreSQL RLS, not by client-side filtering.
- Sign out clears the Supabase session.
- If Supabase environment variables are missing, the login page shows setup guidance instead of crashing.

## Environment and secret policy

- `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` are safe for the browser.
- Never expose a Supabase service-role key or DeepSeek API key through a `VITE_` variable.
- Store DeepSeek credentials only in server-side secrets (for example, Supabase Edge Function secrets).
- Do not commit `.env.local`, provider credentials, allowlist emails, or backup files.

## Backups

The selected policy is manual plus automated. Export a manual copy periodically and configure scheduled backups/PITR only if supported by the Supabase plan. Test restores periodically; do not treat an untested export as a verified backup.

## Not configured in source control

Google OAuth provider credentials, production redirect URLs, Vercel environment variables, Cloudflare settings, and DeepSeek server secrets must be configured in their respective dashboards by the project owner.
