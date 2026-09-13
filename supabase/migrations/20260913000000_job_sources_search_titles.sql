-- Adds a per-source "search_titles" field for aggregator-style sources
-- (currently just Adzuna) so a user can attach job titles directly to a
-- source instead of relying solely on Job Search Profiles or the resume's
-- Target Titles. Also loosens the job_sources uniqueness constraint from
-- (user_id, provider, board_token) to include name, so two Adzuna sources
-- for the same country (e.g. distinct role searches) can coexist as long
-- as they have different display names.

alter table public.job_sources add column search_titles text[] not null default '{}';

alter table public.job_sources drop constraint job_sources_user_id_provider_board_token_key;
alter table public.job_sources add constraint job_sources_user_id_provider_board_token_name_key
  unique (user_id, provider, board_token, name);
