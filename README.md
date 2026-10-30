# MONEY_TRACKING

เว็บแอปบันทึกรายรับรายจ่ายส่วนตัวแบบ mobile-first

## Project status

- [x] M1 Project scaffold and design system
- [x] M2 Database schema, RLS and access-control migration
- [x] M3 Google OAuth integration, profile loading and protected routes
- [x] M4 Income/expense entry creation, history and soft delete
- [x] M5 AI quick add through authenticated Supabase Edge Function (DeepSeek)
- [x] M6 Daily/monthly/yearly/custom-range reports and charts
- [x] M7 Owner-scoped categories and monthly expense budgets
- [x] M8 Theme preferences, manual JSON/CSV export, admin overview and installable PWA shell
- [ ] Production integration, OAuth credentials, secrets, deployment and end-to-end verification

## Stack

- React + Vite + TypeScript
- Supabase Auth + PostgreSQL + Row Level Security
- THB amounts stored as integer satang
- DeepSeek API called only from Supabase Edge Functions; no browser API key

## Important setup

- Apply migrations in order: `supabase/migrations/0001_initial_schema.sql`, then `0002_monthly_budgets.sql`.
- Deploy the `parse-entry` Supabase Edge Function and set its server-side secrets as described in `docs/SETUP.md`.
- Configure Google OAuth and add the approved account/role pairs privately in Supabase `app_allowlist`.
- Set browser environment variables only in local/Vercel environments. Never commit `.env.local`, service-role keys, OAuth credentials, DeepSeek keys or personal backup files.

See [docs/SETUP.md](docs/SETUP.md) for the complete checklist.
