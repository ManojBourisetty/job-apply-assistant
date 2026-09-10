-- Admin (super-user) role, username-based login, and T&C acceptance tracking.

-- ---------------------------------------------------------------------------
-- job_profiles: new columns
-- ---------------------------------------------------------------------------
alter table public.job_profiles
  add column username text,
  add column is_admin boolean not null default false,
  add column terms_accepted_at timestamptz,
  add column terms_version text;

-- Username format: letters, digits, underscore, 3-20 chars, must start with a letter.
alter table public.job_profiles
  add constraint job_profiles_username_format
  check (username is null or username ~ '^[A-Za-z][A-Za-z0-9_]{2,19}$');

-- Case-insensitive uniqueness.
create unique index job_profiles_username_unique_idx
  on public.job_profiles (lower(username))
  where username is not null;

-- ---------------------------------------------------------------------------
-- is_admin(): SECURITY DEFINER so it can be safely referenced from RLS
-- policies on public.job_profiles without recursive-policy evaluation.
-- ---------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select coalesce((select is_admin from public.job_profiles where id = auth.uid()), false);
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

-- ---------------------------------------------------------------------------
-- Username-based login support. Both functions are SECURITY DEFINER because
-- anonymous callers (not yet signed in) need to resolve/check a username
-- without any RLS access to job_profiles or auth.users.
-- ---------------------------------------------------------------------------
create or replace function public.get_email_for_username(p_username text)
returns text
language plpgsql
stable
security definer set search_path = public, auth
as $$
declare
  v_id uuid;
  v_email text;
begin
  select id into v_id from public.job_profiles where lower(username) = lower(p_username);
  if v_id is null then
    return null;
  end if;
  select email into v_email from auth.users where id = v_id;
  return v_email;
end;
$$;

revoke all on function public.get_email_for_username(text) from public;
grant execute on function public.get_email_for_username(text) to anon, authenticated;

create or replace function public.username_available(p_username text)
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select not exists (
    select 1 from public.job_profiles where lower(username) = lower(p_username)
  );
$$;

revoke all on function public.username_available(text) from public;
grant execute on function public.username_available(text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Signup trigger: capture username + T&C acceptance from signUp metadata.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_job_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.job_profiles (id, email, full_name, username, terms_accepted_at, terms_version)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.raw_user_meta_data->>'username',
    case when new.raw_user_meta_data->>'terms_accepted' = 'true' then now() else null end,
    new.raw_user_meta_data->>'terms_version'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Admin super-visibility: read-only access to every user-owned table, plus
-- the ability to manage the is_admin flag on job_profiles. Admins do NOT get
-- write/delete access to other users' business data (resumes, applications,
-- etc.) — this keeps "manage the portal" from also meaning "edit anyone's
-- job search data."
-- ---------------------------------------------------------------------------
create policy "job_profiles_admin_select" on public.job_profiles for select using (public.is_admin());
create policy "job_profiles_admin_update" on public.job_profiles for update using (public.is_admin());

create policy "resumes_admin_select" on public.resumes for select using (public.is_admin());
create policy "resume_versions_admin_select" on public.resume_versions for select using (public.is_admin());
create policy "jsp_admin_select" on public.job_search_profiles for select using (public.is_admin());
create policy "companies_admin_select" on public.companies for select using (public.is_admin());
create policy "jobs_admin_select" on public.jobs for select using (public.is_admin());
create policy "recruiters_admin_select" on public.recruiters for select using (public.is_admin());
create policy "applications_admin_select" on public.applications for select using (public.is_admin());
create policy "ash_admin_select" on public.application_status_history for select using (public.is_admin());
create policy "interviews_admin_select" on public.interviews for select using (public.is_admin());
create policy "followups_admin_select" on public.followups for select using (public.is_admin());
create policy "job_sources_admin_select" on public.job_sources for select using (public.is_admin());
create policy "job_snapshots_admin_select" on public.job_snapshots for select using (public.is_admin());
create policy "csh_admin_select" on public.company_sponsorship_history for select using (public.is_admin());
create policy "notifications_admin_select" on public.notifications for select using (public.is_admin());
create policy "cover_letters_admin_select" on public.cover_letters for select using (public.is_admin());
create policy "ai_generations_admin_select" on public.ai_generations for select using (public.is_admin());
create policy "resume_facts_admin_select" on public.resume_facts for select using (public.is_admin());

-- Bootstrap: make the platform owner the first super-admin.
update public.job_profiles set is_admin = true where email = 'manoj.bourisetty2510@gmail.com';
