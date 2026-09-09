-- Cover foreign keys added in the Phase 2-5 migrations with indexes.
create index if not exists ai_generations_job_id_idx on public.ai_generations(job_id);
create index if not exists ai_generations_resume_version_id_idx on public.ai_generations(resume_version_id);
create index if not exists applications_cover_letter_id_idx on public.applications(cover_letter_id);
create index if not exists applications_recruiter_id_idx on public.applications(recruiter_id);
create index if not exists applications_resume_version_id_idx on public.applications(resume_version_id);
create index if not exists company_sponsorship_history_user_id_idx on public.company_sponsorship_history(user_id);
create index if not exists cover_letters_resume_version_id_idx on public.cover_letters(resume_version_id);
create index if not exists followups_application_id_idx on public.followups(application_id);
create index if not exists recruiters_company_id_idx on public.recruiters(company_id);
create index if not exists resume_facts_ai_generation_id_idx on public.resume_facts(ai_generation_id);
create index if not exists resume_facts_user_id_idx on public.resume_facts(user_id);
create index if not exists resumes_current_version_id_idx on public.resumes(current_version_id);
create index if not exists resumes_source_job_id_idx on public.resumes(source_job_id);
