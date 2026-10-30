# MONEY_TRACKING

เว็บแอปบันทึกรายรับรายจ่ายส่วนตัวแบบ mobile-first

## Project status

- [x] M1 Project scaffold and design system
- [x] M2 Database schema, RLS and access-control migration
- [x] M3 Google OAuth integration, profile loading and protected routes
- [ ] M4 Categories and entries
- [ ] M5 AI parsing and quick add (DeepSeek server-side)
- [ ] M6 Summary and charts
- [ ] M7 Admin tools
- [ ] M8 PWA, backups, documentation and release

## Stack

- React + Vite + TypeScript
- Supabase Auth + PostgreSQL + Row Level Security
- THB amounts stored as integer satang
- DeepSeek planned for server-side parsing; API key must never be exposed to the browser

See `docs/SETUP.md` for local development and OAuth configuration.
