# Architecture

## Runtime
- Frontend: React 18 + Vite + TypeScript (strict)
- Routing: React Router
- Server state: TanStack Query
- UI-only state: Zustand (introduced only where a real cross-component UI state exists)
- Validation: Zod
- Backend: Supabase Auth, Postgres/RLS and Deno Edge Functions

## Dependency direction

`ui -> application -> data -> domain`

Domain modules must not import React, Supabase, or browser APIs. Each feature exposes cross-feature contracts through its public `index.ts` only. Repositories are interfaces in application/domain-facing contracts and Supabase implementations live in data.

## Planned features

- auth: Google OAuth, allowlist and session lifecycle
- categories: per-user categories and default-category onboarding
- entries: quick-add, cursor-paginated list and soft delete
- summary: period calculations and database RPC
- admin: aggregate-only user and AI operational metrics

All persisted monetary values use integer satang. Date grouping follows Asia/Bangkok.
