import { htmlToText } from "./html";
import { AtsFetchError, type NormalizedJob } from "./types";
import { extractTechnologies } from "@/lib/technology-extraction";

type GreenhouseJob = {
  id: number;
  title: string;
  updated_at: string;
  absolute_url: string;
  location?: { name?: string };
  content?: string;
  metadata?: { name: string; value: unknown }[];
};

type GreenhouseResponse = { jobs: GreenhouseJob[] };

function inferWorkArrangement(location: string, content: string): NormalizedJob["work_arrangement"] {
  const haystack = `${location} ${content}`.toLowerCase();
  if (/\bremote\b/.test(haystack)) return "remote";
  if (/\bhybrid\b/.test(haystack)) return "hybrid";
  return null;
}

export async function fetchGreenhouseJobs(boardToken: string): Promise<NormalizedJob[]> {
  const url = `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(boardToken)}/jobs?content=true`;

  let response: Response;
  try {
    response = await fetch(url, { headers: { Accept: "application/json" } });
  } catch (err) {
    throw new AtsFetchError(
      `Could not reach Greenhouse: ${err instanceof Error ? err.message : String(err)}`,
      "greenhouse",
      boardToken
    );
  }

  if (!response.ok) {
    throw new AtsFetchError(
      `Greenhouse board "${boardToken}" returned ${response.status}. Check the board token.`,
      "greenhouse",
      boardToken
    );
  }

  const data = (await response.json()) as GreenhouseResponse;

  return (data.jobs ?? []).map((job) => {
    const location = job.location?.name ?? "";
    const description = htmlToText(job.content);
    return {
      external_job_id: String(job.id),
      title: job.title,
      location: location || null,
      work_arrangement: inferWorkArrangement(location, description),
      employment_type: "full_time",
      job_url: job.absolute_url,
      application_url: job.absolute_url,
      description,
      posted_date: job.updated_at ? job.updated_at.slice(0, 10) : null,
      technologies: extractTechnologies(description),
    };
  });
}
