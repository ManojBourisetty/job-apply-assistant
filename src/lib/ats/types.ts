import type { EmploymentType, JobSource, WorkArrangement } from "@/lib/constants";

export type NormalizedJob = {
  external_job_id: string;
  title: string;
  // Only set by multi-employer aggregators (e.g. Adzuna), where each result
  // can be from a different company. ATS fetchers leave this unset — the
  // caller falls back to the job source's own display name.
  company_name?: string;
  location: string | null;
  work_arrangement: WorkArrangement | null;
  employment_type: EmploymentType;
  job_url: string;
  application_url: string;
  description: string;
  posted_date: string | null;
  technologies: string[];
};

export type AtsProvider = Extract<JobSource, "greenhouse" | "lever" | "ashby" | "workday">;
export type AggregatorProvider = Extract<JobSource, "adzuna">;

export class AtsFetchError extends Error {
  constructor(
    message: string,
    public readonly provider: AtsProvider | AggregatorProvider,
    public readonly boardToken: string
  ) {
    super(message);
    this.name = "AtsFetchError";
  }
}
