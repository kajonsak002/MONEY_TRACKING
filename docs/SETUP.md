# Setup

M1 scaffold is in place. Full deployment instructions will be completed in M8.

## Prerequisites
- Node.js 20+
- pnpm 9+

## Local development
```bash
pnpm install
pnpm dev
```

## Environment policy
Only the Supabase project URL and anon key may be exposed to the browser. DeepSeek keys and Supabase service-role credentials must remain in Supabase Edge Function secrets and must never use a `VITE_` prefix.

## Pending configuration
Google OAuth provider, Supabase project URL/anon key, allowlisted admin and partner email addresses, and DeepSeek API key.
