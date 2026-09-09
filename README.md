# JobPilot — Job Search & Application Management Platform

A personal job-search operating system: discover and organize opportunities from real
company ATS feeds, get a transparent match score against your resume, tailor and track
applications through the full hiring pipeline, and keep visa-sponsorship research in one
place. AI is used where it adds real value (resume tailoring, cover letters, a search
assistant) — always grounded in your own truthful resume data, never inventing facts —
and application submission always stays manual and user-initiated.

This repository implements **Phases 1 through 5** of the build plan (see Roadmap below).
Phase 6 (browser-assisted application automation, email/calendar OAuth integrations) is
intentionally out of scope — it would require either automating third-party sites (which
the product itself is designed to avoid) or credentials this project doesn't hold.

## Stack

- **Next.js 16** (App Router) + **TypeScript** + **React 19**
- **Tailwind CSS v4** with a hand-rolled shadcn/ui-style component set (Radix UI primitives)
- **Supabase**: Postgres, Auth (email/password + magic link), Row Level Security, Edge
  Functions, `pg_cron` + `pg_net` for scheduled jobs
- **Zod** for server-action input validation, **@dnd-kit** for the Kanban board
- Pluggable AI provider layer (`src/lib/ai`) — Anthropic or OpenAI via env vars, used for
  resume tailoring, cover letters, and the Job Search Assistant
- **Playwright** for end-to-end tests (`e2e/`)

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in your Supabase project URL + anon/publishable key
npm run dev
```

The database schema and RLS policies live in `supabase/migrations/`. Apply them to your
own Supabase project with the Supabase CLI (`supabase db push`) or the SQL editor. The
scheduled discovery function lives in `supabase/functions/daily-discovery` — deploy it
with `supabase functions deploy daily-discovery`, then wire up the `pg_cron` job as shown
in `supabase/migrations/20260909010000_phase2_3_4_schema.sql` and the cron migration
(store your project URL and anon/publishable key in Supabase Vault first).

To enable AI features, set `ANTHROPIC_API_KEY` (preferred) or `OPENAI_API_KEY` in
`.env.local` — see `.env.example`. Every AI feature degrades to a clear "not configured"
state when neither is set; nothing else in the app depends on AI being available.

### End-to-end tests

```bash
npm run test:e2e
```

`e2e/smoke.spec.ts` covers everything that doesn't need Supabase to be reachable
(redirects, page rendering, graceful degradation on a failed request) — safe to run
anywhere. `e2e/auth-and-core-flows.spec.ts` exercises the real signup → job → resume →
application → analytics flow against a live Supabase project; run it wherever that
project is actually reachable (your machine, CI) with `.env.local` configured.

## What's implemented

**Phase 1 — Foundation**
- Email/password + magic-link auth, with every table protected by Postgres RLS
  (`auth.uid() = user_id` on every row, verified with two-user isolation tests)
- **Master Resume**: structured editor (contact, summary, skills, experience, education,
  certifications) with a Verified/User-added/AI-reworded status per bullet, raw-text
  paste mode, full version history, restore/download
- **Application Tracker**: drag-and-drop Kanban across all 15 hiring stages, auto-logged
  status history, application checklist, minimal interview tracking
- **Company Tracker** and **Recruiter CRM**, **Search Profiles**, dashboard, dark/light
  theme, toasts, empty states, confirm dialogs

**Phase 2 — Job Discovery**
- Real job discovery from official Greenhouse, Lever, and Ashby public APIs (no
  scraping) — configure a company's board token under Job Sources and sync manually or
  let the scheduled function do it
- Deduplication by external job ID, technology extraction from descriptions
- A transparent, deterministic (non-AI) match-scoring engine — 0–100 across technical,
  experience, seniority, location, sponsorship, compensation, and preference fit, with
  explicit "why it matches" and "potential gaps" — powering **Recommended Jobs**

**Phase 3 — Intelligence & Automation**
- In-app notifications (high match, sponsorship confirmed, job changed/closed, sync
  errors, follow-ups, interviews)
- Job change/expiration detection via point-in-time snapshots
- Sponsorship history auto-logged per company
- A Supabase Edge Function (`daily-discovery`) run daily via `pg_cron` — syncs every
  active job source across all users and raises reminders, unattended

**Phase 4 — AI (optional, pluggable)**
- **Resume Tailoring**: per-bullet reword suggestions strictly grounded in your existing
  master resume (the system prompt forbids inventing companies/titles/tech/metrics),
  reviewed and approved individually before anything is applied
- **Cover Letter** generation with tone selection and an explicit approval step
- **Job Search Assistant** chat, grounded only in your own stored data
- Every AI generation is logged to `ai_generations` for auditability

**Phase 5 — Analytics**
- Response/interview/offer rates and applications-per-week (Phase 1), plus **Skills Gap**
  (frequency of missing skills across your tracked jobs), **Market Insights** (top
  technologies, role keywords, salary range, sponsorship/remote distribution, most active
  companies), and **Resume Performance** (response rate by resume version) — all computed
  from your own stored data, no external assumptions

## Security notes

- No third-party job-site credentials are ever stored.
- Application submission stays manual and user-initiated by design.
- Service-role keys are never used client-side; server actions run under the user's own
  session so RLS always applies. The scheduled Edge Function is the one place a
  service-role key is used, and it runs entirely server-side on Supabase's infrastructure.
