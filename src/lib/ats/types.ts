import type { EmploymentType, JobSource, WorkArrangement } from "@/lib/constants";

export type NormalizedJob = {
  external_job_id: string;
  title: string;
  location: string | null;
  work_arrangement: WorkArrangement | null;
  employment_type: EmploymentType;
  job_url: string;
  application_url: string;
  description: string;
  posted_date: string | null;
  technologies: string[];
};

export type AtsProvider = Extract<JobSource, "greenhouse" | "lever" | "ashby">;

export class AtsFetchError extends Error {
  constructor(
    message: string,
    public readonly provider: AtsProvider,
    public readonly boardToken: string
  ) {
    super(message);
    this.name = "AtsFetchError";
  }
}
