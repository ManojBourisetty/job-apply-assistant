-- Adds Workday as a valid job_sources.provider value. jobs.source already
-- allowed 'workday' from the phase 1 schema; only job_sources.provider was
-- still restricted to the original three ATS connectors.

alter table public.job_sources drop constraint job_sources_provider_check;
alter table public.job_sources add constraint job_sources_provider_check
  check (provider in ('greenhouse', 'lever', 'ashby', 'adzuna', 'workday'));
