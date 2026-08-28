# Apex Performance — Helios Consulting PMS

Production-oriented performance management system for a ~200 person services firm. It replaces email and Excel with a single review cycle, SMART goals, and a manager split-view appraisal.

## Stack

| Layer | Choice |
| --- | --- |
| App | Next.js App Router, TypeScript, Tailwind CSS |
| Auth | Clerk email (demo directory login when Clerk keys are absent) |
| Data | Supabase Postgres + RLS, or a local demo store |
| Email | Resend (`RESEND_API_KEY` is server-only; failures never roll back writes) |
| Deploy | Vercel |

## Stage 0

Read [`docs/performance-framework.md`](docs/performance-framework.md) for KRA/KPI, SMART, the 1–5 scale, state machines, and RLS boundaries.

## Local run (demo)

```bash
cp .env.example .env.local
npm install
npm run dev
```

Leave `NEXT_PUBLIC_DEMO_AUTH=true`. Open `/demo-login` and pick a persona:

- **Priya Sharma** — HR (directory, cycles, reports)
- **Rajesh Kumar / Kavita Nair** — managers
- **Ananya / Vikram / Meera** — employees at different workflow stages

## Production (Clerk + Supabase + Resend)

1. Apply [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql) in the Supabase SQL editor.
2. Create a Clerk application with email. Add a JWT template named `supabase` with `{ "email": "{{user.primary_email_address}}", "sub": "{{user.id}}" }` if you will query Supabase with the user JWT.
3. Provision every employee in `employees` with their work email **before** they sign in. First request matches email and stamps `clerk_user_id`.
4. Set env vars on Vercel (never prefix secrets with `NEXT_PUBLIC_`):

```
NEXT_PUBLIC_DEMO_AUTH=false
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...
CLERK_SECRET_KEY=...
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
RESEND_API_KEY=...
RESEND_FROM_EMAIL=Apex Performance <noreply@your-domain>
APP_BASE_URL=https://your-app.vercel.app
```

Server actions authorize against the session employee (self, manager of, or `hr_admin`). RLS on the anon key is the second fence so URL tampering cannot read another person’s `reviews` row.

## Workflow

```
Goals:   draft → submitted → approved | sent_back
Reviews: not_started → self_appraisal_submitted → manager_reviewed → completed
```

Weightages must sum to **exactly 100** before goal submission. Self-appraisal calls `/api/notify-manager` / Resend as a **non-blocking** side effect.

## Scripts

```bash
npm run dev
npm run build
npm test
npm run lint
```
