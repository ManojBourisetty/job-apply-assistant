-- Adds Adzuna as a valid job_sources.provider / jobs.source value. Unlike
-- Greenhouse/Lever/Ashby (one company's own ATS board), Adzuna is a
-- multi-employer aggregator queried by job title + country, so each synced
-- job can carry its own company_name rather than inheriting the source's.

alter table public.job_sources drop constraint job_sources_provider_check;
alter table public.job_sources add constraint job_sources_provider_check
  check (provider in ('greenhouse', 'lever', 'ashby', 'adzuna'));

alter table public.jobs drop constraint jobs_source_check;
alter table public.jobs add constraint jobs_source_check
  check (source in ('manual','company_careers','greenhouse','lever','ashby','adzuna','workday','other'));
