-- Phase 1 schema for the Job Search & Application Management Platform.
-- Additive only: this Supabase project also hosts an unrelated app's tables
-- (stores, products, bills, ...) which are left untouched.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- updated_at trigger helper
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- profiles: 1:1 extension of auth.users
-- ---------------------------------------------------------------------------
create table public.job_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  phone text,
  location text,
  linkedin_url text,
  github_url text,
  portfolio_url text,
  current_title text,
  target_titles text[] not null default '{}',
  years_experience numeric,
  professional_summary text,
  theme text not null default 'system',
  notification_settings jsonb not null default '{}'::jsonb,
  digest_enabled boolean not null default false,
  digest_frequency text not null default 'daily' check (digest_frequency in ('daily','weekly','off')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_updated_at before update on public.job_profiles
  for each row execute function public.set_updated_at();

alter table public.job_profiles enable row level security;

create policy "profiles_select_own" on public.job_profiles for select using (auth.uid() = id);
create policy "profiles_insert_own" on public.job_profiles for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.job_profiles for update using (auth.uid() = id);
create policy "profiles_delete_own" on public.job_profiles for delete using (auth.uid() = id);

-- Auto-create a profile row when a new auth user signs up.
create or replace function public.handle_new_job_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.job_profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_job_profile on auth.users;
create trigger on_auth_user_created_job_profile
  after insert on auth.users
  for each row execute function public.handle_new_job_user();

-- ---------------------------------------------------------------------------
-- resumes + resume_versions
-- ---------------------------------------------------------------------------
create table public.resumes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  is_master boolean not null default false,
  source_job_id uuid, -- FK added after jobs table exists
  status text not null default 'active' check (status in ('active','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index resumes_user_id_idx on public.resumes(user_id);
-- Only one master resume per user.
create unique index resumes_one_master_per_user
  on public.resumes(user_id) where (is_master and status = 'active');

create trigger set_updated_at before update on public.resumes
  for each row execute function public.set_updated_at();

alter table public.resumes enable row level security;

create policy "resumes_select_own" on public.resumes for select using (auth.uid() = user_id);
create policy "resumes_insert_own" on public.resumes for insert with check (auth.uid() = user_id);
create policy "resumes_update_own" on public.resumes for update using (auth.uid() = user_id);
create policy "resumes_delete_own" on public.resumes for delete using (auth.uid() = user_id);

create table public.resume_versions (
  id uuid primary key default gen_random_uuid(),
  resume_id uuid not null references public.resumes(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  version_number int not null,
  content jsonb not null default '{}'::jsonb,
  raw_text text,
  change_summary text,
  ai_reasoning text,
  created_by text not null default 'user' check (created_by in ('user','ai')),
  approved boolean not null default true,
  created_at timestamptz not null default now(),
  unique (resume_id, version_number)
);

create index resume_versions_user_id_idx on public.resume_versions(user_id);
create index resume_versions_resume_id_idx on public.resume_versions(resume_id);

alter table public.resume_versions enable row level security;

create policy "resume_versions_select_own" on public.resume_versions for select using (auth.uid() = user_id);
create policy "resume_versions_insert_own" on public.resume_versions for insert with check (auth.uid() = user_id);
create policy "resume_versions_update_own" on public.resume_versions for update using (auth.uid() = user_id);
create policy "resume_versions_delete_own" on public.resume_versions for delete using (auth.uid() = user_id);

alter table public.resumes
  add column current_version_id uuid references public.resume_versions(id) on delete set null;

-- ---------------------------------------------------------------------------
-- job_search_profiles (saved search / preferences)
-- ---------------------------------------------------------------------------
create table public.job_search_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  titles text[] not null default '{}',
  keywords text[] not null default '{}',
  technologies text[] not null default '{}',
  locations text[] not null default '{}',
  remote_preference text not null default 'any' check (remote_preference in ('remote','hybrid','onsite','any')),
  min_salary numeric,
  max_salary numeric,
  min_years_experience numeric,
  max_years_experience numeric,
  sponsorship_requirement text not null default 'not_required'
    check (sponsorship_requirement in ('required','preferred','not_required')),
  employment_types text[] not null default '{full_time}',
  hard_filters jsonb not null default '{}'::jsonb,
  soft_preferences jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index job_search_profiles_user_id_idx on public.job_search_profiles(user_id);

create trigger set_updated_at before update on public.job_search_profiles
  for each row execute function public.set_updated_at();

alter table public.job_search_profiles enable row level security;

create policy "jsp_select_own" on public.job_search_profiles for select using (auth.uid() = user_id);
create policy "jsp_insert_own" on public.job_search_profiles for insert with check (auth.uid() = user_id);
create policy "jsp_update_own" on public.job_search_profiles for update using (auth.uid() = user_id);
create policy "jsp_delete_own" on public.job_search_profiles for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- companies
-- ---------------------------------------------------------------------------
create table public.companies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  website text,
  careers_url text,
  industry text,
  locations text[] not null default '{}',
  company_size text,
  relationship text not null default 'none'
    check (relationship in ('target','preferred','avoid','sponsorship_priority','follow','none')),
  sponsorship_status text not null default 'unknown'
    check (sponsorship_status in ('confirmed','likely','unknown','unlikely','not_eligible')),
  sponsorship_evidence text,
  sponsorship_source text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, name)
);

create index companies_user_id_idx on public.companies(user_id);

create trigger set_updated_at before update on public.companies
  for each row execute function public.set_updated_at();

alter table public.companies enable row level security;

create policy "companies_select_own" on public.companies for select using (auth.uid() = user_id);
create policy "companies_insert_own" on public.companies for insert with check (auth.uid() = user_id);
create policy "companies_update_own" on public.companies for update using (auth.uid() = user_id);
create policy "companies_delete_own" on public.companies for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- jobs
-- ---------------------------------------------------------------------------
create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  company_id uuid references public.companies(id) on delete set null,
  company_name text not null,
  title text not null,
  external_job_id text,
  job_url text,
  application_url text,
  location text,
  work_arrangement text check (work_arrangement in ('remote','hybrid','onsite')),
  employment_type text not null default 'full_time'
    check (employment_type in ('full_time','contract','contract_to_hire','part_time','internship')),
  salary_min numeric,
  salary_max numeric,
  salary_currency text not null default 'USD',
  posted_date date,
  updated_date date,
  description text,
  requirements text,
  preferred_qualifications text,
  technologies text[] not null default '{}',
  min_years_experience numeric,
  education_requirement text,
  sponsorship_status text not null default 'unknown'
    check (sponsorship_status in ('confirmed','likely','unknown','unlikely','not_eligible')),
  sponsorship_evidence text,
  sponsorship_source text,
  source text not null default 'manual'
    check (source in ('manual','company_careers','greenhouse','lever','ashby','workday','other')),
  is_saved boolean not null default false,
  saved_at timestamptz,
  status text not null default 'discovered' check (status in ('discovered','saved','closed')),
  date_discovered timestamptz not null default now(),
  last_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index jobs_user_id_idx on public.jobs(user_id);
create index jobs_company_id_idx on public.jobs(company_id);
create index jobs_status_idx on public.jobs(user_id, status);
create unique index jobs_user_url_unique on public.jobs(user_id, job_url) where job_url is not null;

create trigger set_updated_at before update on public.jobs
  for each row execute function public.set_updated_at();

alter table public.jobs enable row level security;

create policy "jobs_select_own" on public.jobs for select using (auth.uid() = user_id);
create policy "jobs_insert_own" on public.jobs for insert with check (auth.uid() = user_id);
create policy "jobs_update_own" on public.jobs for update using (auth.uid() = user_id);
create policy "jobs_delete_own" on public.jobs for delete using (auth.uid() = user_id);

alter table public.resumes
  add constraint resumes_source_job_id_fkey
  foreign key (source_job_id) references public.jobs(id) on delete set null;

-- ---------------------------------------------------------------------------
-- recruiters
-- ---------------------------------------------------------------------------
create table public.recruiters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  company_id uuid references public.companies(id) on delete set null,
  company_name text,
  email text,
  linkedin_url text,
  phone text,
  status text not null default 'contacted'
    check (status in ('contacted','responded','screening','interviewing','closed')),
  first_contact_date date,
  last_contact_date date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index recruiters_user_id_idx on public.recruiters(user_id);

create trigger set_updated_at before update on public.recruiters
  for each row execute function public.set_updated_at();

alter table public.recruiters enable row level security;

create policy "recruiters_select_own" on public.recruiters for select using (auth.uid() = user_id);
create policy "recruiters_insert_own" on public.recruiters for insert with check (auth.uid() = user_id);
create policy "recruiters_update_own" on public.recruiters for update using (auth.uid() = user_id);
create policy "recruiters_delete_own" on public.recruiters for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- applications + status history
-- ---------------------------------------------------------------------------
create table public.applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete cascade,
  resume_version_id uuid references public.resume_versions(id) on delete set null,
  recruiter_id uuid references public.recruiters(id) on delete set null,
  status text not null default 'discovered' check (status in (
    'discovered','saved','reviewing','resume_tailored','ready_to_apply','applied',
    'recruiter_contacted','recruiter_screen','technical_interview','hiring_manager_interview',
    'final_interview','offer','rejected','withdrawn','closed'
  )),
  date_discovered timestamptz not null default now(),
  date_applied date,
  salary_discussed text,
  notes text,
  follow_up_date date,
  interview_feedback text,
  rejection_reason text,
  checklist jsonb not null default '{
    "resume_reviewed": false,
    "resume_tailored": false,
    "sponsorship_checked": false,
    "salary_reviewed": false,
    "location_reviewed": false,
    "application_submitted": false
  }'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, job_id)
);

create index applications_user_id_idx on public.applications(user_id);
create index applications_status_idx on public.applications(user_id, status);
create index applications_job_id_idx on public.applications(job_id);

create trigger set_updated_at before update on public.applications
  for each row execute function public.set_updated_at();

alter table public.applications enable row level security;

create policy "applications_select_own" on public.applications for select using (auth.uid() = user_id);
create policy "applications_insert_own" on public.applications for insert with check (auth.uid() = user_id);
create policy "applications_update_own" on public.applications for update using (auth.uid() = user_id);
create policy "applications_delete_own" on public.applications for delete using (auth.uid() = user_id);

create table public.application_status_history (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  from_status text,
  to_status text not null,
  note text,
  changed_at timestamptz not null default now()
);

create index application_status_history_app_id_idx on public.application_status_history(application_id);
create index application_status_history_user_id_idx on public.application_status_history(user_id);

alter table public.application_status_history enable row level security;

create policy "ash_select_own" on public.application_status_history for select using (auth.uid() = user_id);
create policy "ash_insert_own" on public.application_status_history for insert with check (auth.uid() = user_id);

-- Log every status transition automatically.
create or replace function public.log_application_status_change()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if (tg_op = 'INSERT') then
    insert into public.application_status_history (application_id, user_id, from_status, to_status)
    values (new.id, new.user_id, null, new.status);
  elsif (tg_op = 'UPDATE' and new.status is distinct from old.status) then
    insert into public.application_status_history (application_id, user_id, from_status, to_status)
    values (new.id, new.user_id, old.status, new.status);
  end if;
  return new;
end;
$$;

create trigger applications_status_history_trigger
  after insert or update on public.applications
  for each row execute function public.log_application_status_change();

-- ---------------------------------------------------------------------------
-- interviews
-- ---------------------------------------------------------------------------
create table public.interviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  application_id uuid not null references public.applications(id) on delete cascade,
  stage text not null default 'technical_interview',
  scheduled_at timestamptz,
  interviewer_name text,
  meeting_url text,
  topics text[] not null default '{}',
  preparation_notes text,
  questions text,
  feedback text,
  result text not null default 'pending' check (result in ('pending','passed','failed','cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index interviews_user_id_idx on public.interviews(user_id);
create index interviews_application_id_idx on public.interviews(application_id);

create trigger set_updated_at before update on public.interviews
  for each row execute function public.set_updated_at();

alter table public.interviews enable row level security;

create policy "interviews_select_own" on public.interviews for select using (auth.uid() = user_id);
create policy "interviews_insert_own" on public.interviews for insert with check (auth.uid() = user_id);
create policy "interviews_update_own" on public.interviews for update using (auth.uid() = user_id);
create policy "interviews_delete_own" on public.interviews for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- followups
-- ---------------------------------------------------------------------------
create table public.followups (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  application_id uuid not null references public.applications(id) on delete cascade,
  due_date date not null,
  note text,
  completed boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index followups_user_id_idx on public.followups(user_id);
create index followups_due_date_idx on public.followups(user_id, due_date) where not completed;

create trigger set_updated_at before update on public.followups
  for each row execute function public.set_updated_at();

alter table public.followups enable row level security;

create policy "followups_select_own" on public.followups for select using (auth.uid() = user_id);
create policy "followups_insert_own" on public.followups for insert with check (auth.uid() = user_id);
create policy "followups_update_own" on public.followups for update using (auth.uid() = user_id);
create policy "followups_delete_own" on public.followups for delete using (auth.uid() = user_id);
