-- Fixes two classes of RLS performance debt flagged by the Postgres advisor:
--   1. auth_rls_initplan: auth.uid()/auth.jwt() calls re-evaluated per row instead
--      of once per query. Wrapping them as (select auth.uid()) lets Postgres cache
--      the result as an InitPlan.
--   2. multiple_permissive_policies: separate "_select_own" and "_admin_select"
--      policies on the same table/action are merged into one combined policy so
--      Postgres evaluates a single USING clause instead of OR-ing two policies.
-- No behavior change: each merged policy is logically equivalent to the two it
-- replaces (own-row access OR admin access), and existing insert/update/delete/
-- block-suspended policies are left in place, only rewritten to use the cached
-- auth.uid() form.

drop policy if exists "ai_generations_select_own" on public.ai_generations;
drop policy if exists "ai_generations_admin_select" on public.ai_generations;
create policy "ai_generations_select" on public.ai_generations for select using (((select auth.uid()) = user_id) or (select public.is_admin()));
alter policy "ai_generations_insert_own" on public.ai_generations with check ((select auth.uid()) = user_id);
alter policy "ai_generations_block_suspended" on public.ai_generations using (not (select public.is_blocked_self()));

drop policy if exists "ash_select_own" on public.application_status_history;
drop policy if exists "ash_admin_select" on public.application_status_history;
create policy "ash_select" on public.application_status_history for select using (((select auth.uid()) = user_id) or (select public.is_admin()));
alter policy "ash_insert_own" on public.application_status_history with check ((select auth.uid()) = user_id);
alter policy "ash_block_suspended" on public.application_status_history using (not (select public.is_blocked_self()));

drop policy if exists "applications_select_own" on public.applications;
drop policy if exists "applications_admin_select" on public.applications;
create policy "applications_select" on public.applications for select using (((select auth.uid()) = user_id) or (select public.is_admin()));
alter policy "applications_insert_own" on public.applications with check ((select auth.uid()) = user_id);
alter policy "applications_update_own" on public.applications using ((select auth.uid()) = user_id);
alter policy "applications_delete_own" on public.applications using ((select auth.uid()) = user_id);
alter policy "applications_block_suspended" on public.applications using (not (select public.is_blocked_self()));

drop policy if exists "companies_select_own" on public.companies;
drop policy if exists "companies_admin_select" on public.companies;
create policy "companies_select" on public.companies for select using (((select auth.uid()) = user_id) or (select public.is_admin()));
alter policy "companies_insert_own" on public.companies with check ((select auth.uid()) = user_id);
alter policy "companies_update_own" on public.companies using ((select auth.uid()) = user_id);
alter policy "companies_delete_own" on public.companies using ((select auth.uid()) = user_id);
alter policy "companies_block_suspended" on public.companies using (not (select public.is_blocked_self()));

drop policy if exists "csh_select_own" on public.company_sponsorship_history;
drop policy if exists "csh_admin_select" on public.company_sponsorship_history;
create policy "csh_select" on public.company_sponsorship_history for select using (((select auth.uid()) = user_id) or (select public.is_admin()));
alter policy "csh_insert_own" on public.company_sponsorship_history with check ((select auth.uid()) = user_id);
alter policy "csh_block_suspended" on public.company_sponsorship_history using (not (select public.is_blocked_self()));

drop policy if exists "cover_letters_select_own" on public.cover_letters;
drop policy if exists "cover_letters_admin_select" on public.cover_letters;
create policy "cover_letters_select" on public.cover_letters for select using (((select auth.uid()) = user_id) or (select public.is_admin()));
alter policy "cover_letters_insert_own" on public.cover_letters with check ((select auth.uid()) = user_id);
alter policy "cover_letters_update_own" on public.cover_letters using ((select auth.uid()) = user_id);
alter policy "cover_letters_delete_own" on public.cover_letters using ((select auth.uid()) = user_id);
alter policy "cover_letters_block_suspended" on public.cover_letters using (not (select public.is_blocked_self()));

drop policy if exists "followups_select_own" on public.followups;
drop policy if exists "followups_admin_select" on public.followups;
create policy "followups_select" on public.followups for select using (((select auth.uid()) = user_id) or (select public.is_admin()));
alter policy "followups_insert_own" on public.followups with check ((select auth.uid()) = user_id);
alter policy "followups_update_own" on public.followups using ((select auth.uid()) = user_id);
alter policy "followups_delete_own" on public.followups using ((select auth.uid()) = user_id);
alter policy "followups_block_suspended" on public.followups using (not (select public.is_blocked_self()));

drop policy if exists "interviews_select_own" on public.interviews;
drop policy if exists "interviews_admin_select" on public.interviews;
create policy "interviews_select" on public.interviews for select using (((select auth.uid()) = user_id) or (select public.is_admin()));
alter policy "interviews_insert_own" on public.interviews with check ((select auth.uid()) = user_id);
alter policy "interviews_update_own" on public.interviews using ((select auth.uid()) = user_id);
alter policy "interviews_delete_own" on public.interviews using ((select auth.uid()) = user_id);
alter policy "interviews_block_suspended" on public.interviews using (not (select public.is_blocked_self()));

drop policy if exists "jsp_select_own" on public.job_search_profiles;
drop policy if exists "jsp_admin_select" on public.job_search_profiles;
create policy "jsp_select" on public.job_search_profiles for select using (((select auth.uid()) = user_id) or (select public.is_admin()));
alter policy "jsp_insert_own" on public.job_search_profiles with check ((select auth.uid()) = user_id);
alter policy "jsp_update_own" on public.job_search_profiles using ((select auth.uid()) = user_id);
alter policy "jsp_delete_own" on public.job_search_profiles using ((select auth.uid()) = user_id);
alter policy "jsp_block_suspended" on public.job_search_profiles using (not (select public.is_blocked_self()));

drop policy if exists "job_snapshots_select_own" on public.job_snapshots;
drop policy if exists "job_snapshots_admin_select" on public.job_snapshots;
create policy "job_snapshots_select" on public.job_snapshots for select using (((select auth.uid()) = user_id) or (select public.is_admin()));
alter policy "job_snapshots_insert_own" on public.job_snapshots with check ((select auth.uid()) = user_id);
alter policy "job_snapshots_block_suspended" on public.job_snapshots using (not (select public.is_blocked_self()));

drop policy if exists "job_sources_select_own" on public.job_sources;
drop policy if exists "job_sources_admin_select" on public.job_sources;
create policy "job_sources_select" on public.job_sources for select using (((select auth.uid()) = user_id) or (select public.is_admin()));
alter policy "job_sources_insert_own" on public.job_sources with check ((select auth.uid()) = user_id);
alter policy "job_sources_update_own" on public.job_sources using ((select auth.uid()) = user_id);
alter policy "job_sources_delete_own" on public.job_sources using ((select auth.uid()) = user_id);
alter policy "job_sources_block_suspended" on public.job_sources using (not (select public.is_blocked_self()));

drop policy if exists "jobs_select_own" on public.jobs;
drop policy if exists "jobs_admin_select" on public.jobs;
create policy "jobs_select" on public.jobs for select using (((select auth.uid()) = user_id) or (select public.is_admin()));
alter policy "jobs_insert_own" on public.jobs with check ((select auth.uid()) = user_id);
alter policy "jobs_update_own" on public.jobs using ((select auth.uid()) = user_id);
alter policy "jobs_delete_own" on public.jobs using ((select auth.uid()) = user_id);
alter policy "jobs_block_suspended" on public.jobs using (not (select public.is_blocked_self()));

drop policy if exists "notifications_select_own" on public.notifications;
drop policy if exists "notifications_admin_select" on public.notifications;
create policy "notifications_select" on public.notifications for select using (((select auth.uid()) = user_id) or (select public.is_admin()));
alter policy "notifications_insert_own" on public.notifications with check ((select auth.uid()) = user_id);
alter policy "notifications_update_own" on public.notifications using ((select auth.uid()) = user_id);
alter policy "notifications_delete_own" on public.notifications using ((select auth.uid()) = user_id);
alter policy "notifications_block_suspended" on public.notifications using (not (select public.is_blocked_self()));

drop policy if exists "recruiters_select_own" on public.recruiters;
drop policy if exists "recruiters_admin_select" on public.recruiters;
create policy "recruiters_select" on public.recruiters for select using (((select auth.uid()) = user_id) or (select public.is_admin()));
alter policy "recruiters_insert_own" on public.recruiters with check ((select auth.uid()) = user_id);
alter policy "recruiters_update_own" on public.recruiters using ((select auth.uid()) = user_id);
alter policy "recruiters_delete_own" on public.recruiters using ((select auth.uid()) = user_id);
alter policy "recruiters_block_suspended" on public.recruiters using (not (select public.is_blocked_self()));

drop policy if exists "resume_facts_select_own" on public.resume_facts;
drop policy if exists "resume_facts_admin_select" on public.resume_facts;
create policy "resume_facts_select" on public.resume_facts for select using (((select auth.uid()) = user_id) or (select public.is_admin()));
alter policy "resume_facts_insert_own" on public.resume_facts with check ((select auth.uid()) = user_id);
alter policy "resume_facts_update_own" on public.resume_facts using ((select auth.uid()) = user_id);
alter policy "resume_facts_delete_own" on public.resume_facts using ((select auth.uid()) = user_id);
alter policy "resume_facts_block_suspended" on public.resume_facts using (not (select public.is_blocked_self()));

drop policy if exists "resume_versions_select_own" on public.resume_versions;
drop policy if exists "resume_versions_admin_select" on public.resume_versions;
create policy "resume_versions_select" on public.resume_versions for select using (((select auth.uid()) = user_id) or (select public.is_admin()));
alter policy "resume_versions_insert_own" on public.resume_versions with check ((select auth.uid()) = user_id);
alter policy "resume_versions_update_own" on public.resume_versions using ((select auth.uid()) = user_id);
alter policy "resume_versions_delete_own" on public.resume_versions using ((select auth.uid()) = user_id);
alter policy "resume_versions_block_suspended" on public.resume_versions using (not (select public.is_blocked_self()));

drop policy if exists "resumes_select_own" on public.resumes;
drop policy if exists "resumes_admin_select" on public.resumes;
create policy "resumes_select" on public.resumes for select using (((select auth.uid()) = user_id) or (select public.is_admin()));
alter policy "resumes_insert_own" on public.resumes with check ((select auth.uid()) = user_id);
alter policy "resumes_update_own" on public.resumes using ((select auth.uid()) = user_id);
alter policy "resumes_delete_own" on public.resumes using ((select auth.uid()) = user_id);
alter policy "resumes_block_suspended" on public.resumes using (not (select public.is_blocked_self()));

drop policy if exists "profiles_select_own" on public.job_profiles;
drop policy if exists "job_profiles_admin_select" on public.job_profiles;
create policy "job_profiles_select" on public.job_profiles for select using (((select auth.uid()) = id) or (select public.is_admin()));
drop policy if exists "profiles_update_own" on public.job_profiles;
drop policy if exists "job_profiles_admin_update" on public.job_profiles;
create policy "job_profiles_update" on public.job_profiles for update using (((select auth.uid()) = id) or (select public.is_admin()));
alter policy "profiles_insert_own" on public.job_profiles with check ((select auth.uid()) = id);
alter policy "profiles_delete_own" on public.job_profiles using ((select auth.uid()) = id);
alter policy "job_profiles_block_suspended" on public.job_profiles using (not (select public.is_blocked_self()));
