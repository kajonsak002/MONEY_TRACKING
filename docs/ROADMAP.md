# Development roadmap — MONEY_TRACKING

Last reviewed: 2026-10-30

## Product split
- Partner application: mobile-first personal income/expense tracking at /app.
- Admin back office: separate responsive management dashboard at /admin.
- Both experiences share one React/Vite app, Supabase Auth and PostgreSQL. Role checks in the UI improve navigation; Supabase RLS remains the security boundary.

## M1–M8: Core application
- [x] Workspace, design system and mobile-first shell
- [x] Supabase schema, allowlist, profiles and RLS policies
- [x] Google OAuth and protected application routes
- [x] Income/expense CRUD and soft delete
- [x] DeepSeek parse-entry Edge Function code
- [x] Reports, categories, monthly budgets, theme and exports
- [x] Initial AdminPage and PWA shell
- [ ] Production integration and end-to-end verification

## M9: Separate Admin experience (in progress)
- [x] Dedicated AdminShell with desktop sidebar and mobile navigation
- [x] Separate /admin and /app route groups
- [x] Role-based landing route after authentication
- [x] Admin overview with member count, entry count, income and expense aggregates
- [x] Member list with role and signup date
- [ ] User lifecycle management through secured server-side operations
- [ ] Activity/audit log backed by a defined audit schema
- [ ] Admin settings and operational health panels
- [ ] Dedicated all-transactions page with privacy-aware filters

## M10: Security and integration verification
- [ ] Test Admin and Partner OAuth accounts end-to-end
- [ ] Verify Partner cannot read another Partner's records
- [ ] Verify Admin cross-user visibility is read-only; owner-only writes remain enforced
- [ ] Review every route, query and mutation against RLS
- [ ] Deploy and verify parse-entry Edge Function and server-side DeepSeek secret
- [ ] Run typecheck, lint, unit tests and production build
- [ ] Verify PWA update/cache behavior and production callback

## M11: Operations and release
- [ ] Confirm automated backup/PITR availability and retention for the selected Supabase plan
- [ ] Perform and document a restore test
- [ ] Add monitoring and error reporting
- [ ] Production acceptance checklist and release notes

## Security invariants
- Current app_role values are admin and partner.
- Never expose allowlist management or service-role operations to the browser.
- Admin cross-user visibility does not grant cross-user write/delete access.
- Avoid displaying identifiable financial details unnecessarily.
- Money is stored as integer satang, displayed as THB; business date is Asia/Bangkok.
