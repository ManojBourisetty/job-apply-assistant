# JobPilot — Job Search & Application Management Platform

A personal job-search operating system: discover and organize opportunities, track
applications through the full hiring pipeline, maintain a truthful master resume, and
keep visa-sponsorship research in one place. AI-powered matching and resume tailoring
are designed in but arrive in a later phase — automation never submits an application
for you.

This repository currently implements **Phase 1** of the build plan (see below).

## Stack

- **Next.js 16** (App Router) + **TypeScript** + **React 19**
- **Tailwind CSS v4** with a hand-rolled shadcn/ui-style component set (Radix UI primitives)
- **Supabase**: Postgres, Auth (email/password + magic link), Row Level Security
- **Zod** for server-action input validation, **@dnd-kit** for the Kanban board

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in your Supabase project URL + anon/publishable key
npm run dev
```

The database schema and RLS policies live in `supabase/migrations/`. Apply them to your
own Supabase project with the Supabase CLI (`supabase db push`) or the SQL editor.

## What's implemented (Phase 1)

- Email/password + magic-link auth, with every table protected by Postgres RLS
  (`auth.uid() = user_id` on every row; verified with a two-user isolation test — see
  `supabase/migrations/`)
- **Master Resume**: structured editor (contact, summary, skills, experience, education,
  certifications) with a Verified/User-added status per bullet, plus a raw-text paste
  mode, full version history, and restore/download
- **Job Discovery / Saved Jobs**: manual job entry with sponsorship evidence fields,
  search/filter/sort/pagination
- **Application Tracker**: drag-and-drop Kanban across all 15 hiring stages, with an
  auto-logged status history and an application checklist
- **Company Tracker** and **Recruiter CRM**: lightweight CRUD with relationship and
  sponsorship classification
- **Sponsorship Intelligence**: a classification view (Confirmed / Likely / Unknown /
  Unlikely / Not Eligible) driven entirely by evidence you record — never inferred from
  company size or reputation
- **Search Profiles**: saved search configurations (titles, technologies, locations,
  salary/experience range, sponsorship requirement) that will drive automated discovery
  in Phase 2
- **Analytics**: response rate, interview rate, offer rate, and applications-per-week,
  computed from your own tracked data
- Dashboard, dark/light theme, responsive layout, toasts, empty states, confirm dialogs

Recommended Jobs (AI matching) and Resume Tailoring (AI rewriting) show clearly labeled
"coming in Phase 4" states — the UI they'll live in is built, the AI behind them is not,
and no fabricated resume content is ever generated automatically.

## Roadmap

1. **Phase 1 (this repo)** — auth, schema, master resume, preferences, dashboard, manual
   job entry, application tracker
2. **Phase 2** — job discovery from official career pages/ATS feeds, deduplication
3. **Phase 3** — sponsorship intelligence automation, company profiles, notifications
4. **Phase 4** — AI resume tailoring, cover letters, job matching engine, search assistant
5. **Phase 5** — analytics, skills-gap analysis, market insights
6. **Phase 6** — integrations, browser-assisted application workflow

## Security notes

- No third-party job-site credentials are ever stored.
- Application submission stays manual and user-initiated by design — see the
  "Application Submission Philosophy" in the product spec.
- Service-role keys are never used client-side; server actions run under the user's own
  session so RLS always applies.
