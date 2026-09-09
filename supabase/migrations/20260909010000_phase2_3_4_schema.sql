-- Phase 2/3/4 schema additions: job discovery sources, change detection,
-- notifications, sponsorship history, AI generation tracking, cover letters.

-- ---------------------------------------------------------------------------
-- job_sources: user-configured ATS boards for automated discovery
-- ---------------------------------------------------------------------------
create table public.job_sources (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  provider text not null check (provider in ('greenhouse', 'lever', 'ashby')),
  board_token text not null,
  is_active boolean not null default true,
  last_synced_at timestamptz,
  last_sync_status text not null default 'never' check (last_sync_status in ('never', 'success', 'error')),
  last_sync_error text,
  last_sync_job_count int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, provider, board_token)
);

create index job_sources_user_id_idx on public.job_sources(user_id);

create trigger set_updated_at before update on public.job_sources
  for each row execute function public.set_updated_at();

alter table public.job_sources enable row level security;

create policy "job_sources_select_own" on public.job_sources for select using (auth.uid() = user_id);
create policy "job_sources_insert_own" on public.job_sources for insert with check (auth.uid() = user_id);
create policy "job_sources_update_own" on public.job_sources for update using (auth.uid() = user_id);
create policy "job_sources_delete_own" on public.job_sources for delete using (auth.uid() = user_id);

alter table public.jobs
  add column job_source_id uuid references public.job_sources(id) on delete set null;

create index jobs_job_source_id_idx on public.jobs(job_source_id);

-- ---------------------------------------------------------------------------
-- job_snapshots: point-in-time capture of a job's key fields, for change
-- and expiration detection across syncs.
-- ---------------------------------------------------------------------------
create table public.job_snapshots (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  captured_at timestamptz not null default now(),
  presence text not null default 'active' check (presence in ('active', 'removed')),
  salary_min numeric,
  salary_max numeric,
  sponsorship_status text,
  location text,
  work_arrangement text,
  technologies text[] not null default '{}',
  min_years_experience numeric,
  closing_date date
);

create index job_snapshots_job_id_idx on public.job_snapshots(job_id);
create index job_snapshots_user_id_idx on public.job_snapshots(user_id);

alter table public.job_snapshots enable row level security;

create policy "job_snapshots_select_own" on public.job_snapshots for select using (auth.uid() = user_id);
create policy "job_snapshots_insert_own" on public.job_snapshots for insert with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- company_sponsorship_history: auto-logged on every sponsorship change
-- ---------------------------------------------------------------------------
create table public.company_sponsorship_history (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  from_status text,
  to_status text not null,
  evidence text,
  source text,
  changed_at timestamptz not null default now()
);

create index company_sponsorship_history_company_id_idx on public.company_sponsorship_history(company_id);

alter table public.company_sponsorship_history enable row level security;

create policy "csh_select_own" on public.company_sponsorship_history for select using (auth.uid() = user_id);
create policy "csh_insert_own" on public.company_sponsorship_history for insert with check (auth.uid() = user_id);

create or replace function public.log_company_sponsorship_change()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if (tg_op = 'INSERT') then
    insert into public.company_sponsorship_history (company_id, user_id, from_status, to_status, evidence, source)
    values (new.id, new.user_id, null, new.sponsorship_status, new.sponsorship_evidence, new.sponsorship_source);
  elsif (tg_op = 'UPDATE' and new.sponsorship_status is distinct from old.sponsorship_status) then
    insert into public.company_sponsorship_history (company_id, user_id, from_status, to_status, evidence, source)
    values (new.id, new.user_id, old.sponsorship_status, new.sponsorship_status, new.sponsorship_evidence, new.sponsorship_source);
  end if;
  return new;
end;
$$;

revoke execute on function public.log_company_sponsorship_change() from anon, authenticated;

create trigger company_sponsorship_history_trigger
  after insert or update on public.companies
  for each row execute function public.log_company_sponsorship_change();

-- ---------------------------------------------------------------------------
-- notifications
-- ---------------------------------------------------------------------------
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in (
    'new_high_match', 'sponsorship_confirmed', 'followup_due', 'interview_approaching',
    'job_changed', 'job_closed', 'recruiter_response', 'daily_digest', 'sync_error'
  )),
  title text not null,
  body text,
  link text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index notifications_user_id_idx on public.notifications(user_id, created_at desc);
create index notifications_unread_idx on public.notifications(user_id) where read_at is null;

alter table public.notifications enable row level security;

create policy "notifications_select_own" on public.notifications for select using (auth.uid() = user_id);
create policy "notifications_insert_own" on public.notifications for insert with check (auth.uid() = user_id);
create policy "notifications_update_own" on public.notifications for update using (auth.uid() = user_id);
create policy "notifications_delete_own" on public.notifications for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- cover_letters
-- ---------------------------------------------------------------------------
create table public.cover_letters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete cascade,
  resume_version_id uuid references public.resume_versions(id) on delete set null,
  tone text not null default 'formal' check (tone in ('formal', 'conversational', 'short', 'detailed')),
  content text not null,
  model text,
  approved boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index cover_letters_user_id_idx on public.cover_letters(user_id);
create index cover_letters_job_id_idx on public.cover_letters(job_id);

create trigger set_updated_at before update on public.cover_letters
  for each row execute function public.set_updated_at();

alter table public.cover_letters enable row level security;

create policy "cover_letters_select_own" on public.cover_letters for select using (auth.uid() = user_id);
create policy "cover_letters_insert_own" on public.cover_letters for insert with check (auth.uid() = user_id);
create policy "cover_letters_update_own" on public.cover_letters for update using (auth.uid() = user_id);
create policy "cover_letters_delete_own" on public.cover_letters for delete using (auth.uid() = user_id);

alter table public.applications
  add column cover_letter_id uuid references public.cover_letters(id) on delete set null;

-- ---------------------------------------------------------------------------
-- ai_generations: audit trail for every AI-produced artifact
-- ---------------------------------------------------------------------------
create table public.ai_generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('resume_tailoring', 'cover_letter', 'job_analysis', 'assistant_reply')),
  job_id uuid references public.jobs(id) on delete set null,
  resume_version_id uuid references public.resume_versions(id) on delete set null,
  model text not null,
  input_summary text,
  output text,
  approved boolean,
  created_at timestamptz not null default now()
);

create index ai_generations_user_id_idx on public.ai_generations(user_id, created_at desc);

alter table public.ai_generations enable row level security;

create policy "ai_generations_select_own" on public.ai_generations for select using (auth.uid() = user_id);
create policy "ai_generations_insert_own" on public.ai_generations for insert with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- resume_facts: granular truth-layer status per AI-suggested change,
-- so a tailored bullet can require explicit approval before it's live.
-- ---------------------------------------------------------------------------
create table public.resume_facts (
  id uuid primary key default gen_random_uuid(),
  resume_version_id uuid not null references public.resume_versions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  section text not null,
  original_text text,
  suggested_text text not null,
  reasoning text,
  status text not null default 'ai_suggested_pending'
    check (status in ('verified', 'user_added', 'ai_reworded', 'ai_suggested_pending')),
  ai_generation_id uuid references public.ai_generations(id) on delete set null,
  created_at timestamptz not null default now()
);

create index resume_facts_version_id_idx on public.resume_facts(resume_version_id);

alter table public.resume_facts enable row level security;

create policy "resume_facts_select_own" on public.resume_facts for select using (auth.uid() = user_id);
create policy "resume_facts_insert_own" on public.resume_facts for insert with check (auth.uid() = user_id);
create policy "resume_facts_update_own" on public.resume_facts for update using (auth.uid() = user_id);
create policy "resume_facts_delete_own" on public.resume_facts for delete using (auth.uid() = user_id);
