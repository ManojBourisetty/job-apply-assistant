import { htmlToText } from "./html";
import { AtsFetchError, type NormalizedJob } from "./types";
import { extractTechnologies } from "@/lib/technology-extraction";

type AshbyJob = {
  id: string;
  title: string;
  location?: string;
  isRemote?: boolean;
  employmentType?: string;
  publishedDate?: string;
  jobUrl?: string;
  applyUrl?: string;
  descriptionPlain?: string;
  descriptionHtml?: string;
};

type AshbyResponse = { jobs: AshbyJob[] };

function mapEmploymentType(type?: string): NormalizedJob["employment_type"] {
  const t = (type ?? "").toLowerCase();
  if (t.includes("intern")) return "internship";
  if (t.includes("contract to hire")) return "contract_to_hire";
  if (t.includes("contract") || t.includes("temporary")) return "contract";
  if (t.includes("part")) return "part_time";
  return "full_time";
}

export async function fetchAshbyJobs(boardToken: string): Promise<NormalizedJob[]> {
  const url = `https://api.ashbyhq.com/posting-api/job-board/${encodeURIComponent(boardToken)}`;

  let response: Response;
  try {
    response = await fetch(url, { headers: { Accept: "application/json" } });
  } catch (err) {
    throw new AtsFetchError(
      `Could not reach Ashby: ${err instanceof Error ? err.message : String(err)}`,
      "ashby",
      boardToken
    );
  }

  if (!response.ok) {
    throw new AtsFetchError(
      `Ashby board "${boardToken}" returned ${response.status}. Check the job board name.`,
      "ashby",
      boardToken
    );
  }

  const data = (await response.json()) as AshbyResponse;

  return (data.jobs ?? []).map((job) => {
    const description = job.descriptionPlain || htmlToText(job.descriptionHtml);
    return {
      external_job_id: job.id,
      title: job.title,
      location: job.location ?? null,
      work_arrangement: job.isRemote ? "remote" : null,
      employment_type: mapEmploymentType(job.employmentType),
      job_url: job.jobUrl ?? "",
      application_url: job.applyUrl ?? job.jobUrl ?? "",
      description,
      posted_date: job.publishedDate ? job.publishedDate.slice(0, 10) : null,
      technologies: extractTechnologies(description),
    };
  });
}
