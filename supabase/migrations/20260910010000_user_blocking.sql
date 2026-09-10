-- Admin ability to block a user for misconduct. Blocking is enforced at the
-- database level (RESTRICTIVE RLS policies), not just in the app UI, so a
-- blocked user's existing session can't be used to hit Supabase directly
-- and bypass the app.

alter table public.job_profiles
  add column is_blocked boolean not null default false,
  add column blocked_at timestamptz,
  add column blocked_reason text,
  add column blocked_by uuid references public.job_profiles(id) on delete set null;

-- ---------------------------------------------------------------------------
-- is_blocked_self(): true if the CURRENT session's own user is blocked.
-- SECURITY DEFINER so it reads job_profiles.is_blocked even though the
-- restrictive policies below (which reference this function) would
-- otherwise prevent a blocked user from reading their own row.
-- ---------------------------------------------------------------------------
create or replace function public.is_blocked_self()
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select coalesce((select is_blocked from public.job_profiles where id = auth.uid()), false);
$$;

revoke all on function public.is_blocked_self() from public;
grant execute on function public.is_blocked_self() to authenticated;
revoke execute on function public.is_blocked_self() from anon;

-- For a friendlier message on the login attempt itself (before any redirect).
create or replace function public.get_my_block_reason()
returns text
language sql
stable
security definer set search_path = public
as $$
  select blocked_reason from public.job_profiles where id = auth.uid() and is_blocked;
$$;

revoke all on function public.get_my_block_reason() from public;
grant execute on function public.get_my_block_reason() to authenticated;
revoke execute on function public.get_my_block_reason() from anon;

-- ---------------------------------------------------------------------------
-- Restrictive policies: a RESTRICTIVE policy is AND-ed with every permissive
-- policy on the same table, so one of these per table is enough to lock a
-- blocked user out of all of their own rows everywhere — no need to touch
-- the existing "_own" or "_admin_select" policies.
-- ---------------------------------------------------------------------------
create policy "job_profiles_block_suspended" on public.job_profiles as restrictive
  for all using (not public.is_blocked_self());
create policy "resumes_block_suspended" on public.resumes as restrictive
  for all using (not public.is_blocked_self());
create policy "resume_versions_block_suspended" on public.resume_versions as restrictive
  for all using (not public.is_blocked_self());
create policy "jsp_block_suspended" on public.job_search_profiles as restrictive
  for all using (not public.is_blocked_self());
create policy "companies_block_suspended" on public.companies as restrictive
  for all using (not public.is_blocked_self());
create policy "jobs_block_suspended" on public.jobs as restrictive
  for all using (not public.is_blocked_self());
create policy "recruiters_block_suspended" on public.recruiters as restrictive
  for all using (not public.is_blocked_self());
create policy "applications_block_suspended" on public.applications as restrictive
  for all using (not public.is_blocked_self());
create policy "ash_block_suspended" on public.application_status_history as restrictive
  for all using (not public.is_blocked_self());
create policy "interviews_block_suspended" on public.interviews as restrictive
  for all using (not public.is_blocked_self());
create policy "followups_block_suspended" on public.followups as restrictive
  for all using (not public.is_blocked_self());
create policy "job_sources_block_suspended" on public.job_sources as restrictive
  for all using (not public.is_blocked_self());
create policy "job_snapshots_block_suspended" on public.job_snapshots as restrictive
  for all using (not public.is_blocked_self());
create policy "csh_block_suspended" on public.company_sponsorship_history as restrictive
  for all using (not public.is_blocked_self());
create policy "notifications_block_suspended" on public.notifications as restrictive
  for all using (not public.is_blocked_self());
create policy "cover_letters_block_suspended" on public.cover_letters as restrictive
  for all using (not public.is_blocked_self());
create policy "ai_generations_block_suspended" on public.ai_generations as restrictive
  for all using (not public.is_blocked_self());
create policy "resume_facts_block_suspended" on public.resume_facts as restrictive
  for all using (not public.is_blocked_self());
