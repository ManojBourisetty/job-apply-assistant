import { htmlToText } from "./html";
import { AtsFetchError, type NormalizedJob } from "./types";
import { extractTechnologies } from "@/lib/technology-extraction";

// Workday doesn't publish a documented public read API the way Greenhouse/
// Lever/Ashby do. Every Workday-hosted careers page (https://<tenant>.<wdN>
// .myworkdayjobs.com/<site>) is itself a client app that loads its listings
// from an internal JSON endpoint (`/wday/cxs/<tenant>/<site>/jobs`) — the
// same one the page's own browser JS calls, reachable with no login. It's
// not officially supported the way the other three are, and Workday could
// change or restrict it without notice, so this is inherently more fragile
// than the others. It still returns structured JSON rather than requiring
// HTML scraping, so we use it, capped conservatively.
const MAX_JOBS = 100;
const LIST_PAGE_SIZE = 20;
const DETAIL_CONCURRENCY = 8;

function parseCareersUrl(
  url: string
): { host: string; tenant: string; site: string } | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  if (!parsed.hostname.endsWith(".myworkdayjobs.com")) return null;

  const tenant = parsed.hostname.split(".")[0];
  const segments = parsed.pathname.split("/").filter(Boolean);
  // Drop a locale segment like "en-US" if present — the site slug is
  // whichever segment is left (usually the only one, or the last one).
  const site = segments.find((s) => !/^[a-z]{2}-[A-Z]{2}$/.test(s));
  if (!tenant || !site) return null;

  return { host: parsed.hostname, tenant, site };
}

type WorkdayListPosting = {
  title: string;
  externalPath: string;
  locationsText?: string;
  postedOn?: string;
  bulletFields?: string[];
};

type WorkdayListResponse = {
  total: number;
  jobPostings: WorkdayListPosting[];
};

type WorkdayDetailResponse = {
  jobPostingInfo?: {
    title?: string;
    jobDescription?: string;
    location?: string;
    startDate?: string;
    jobReqId?: string;
    timeType?: string;
  };
};

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", Accept: "application/json", ...init?.headers },
  });
  if (!response.ok) {
    throw new Error(`${response.status}`);
  }
  return response.json() as Promise<T>;
}

function mapEmploymentType(timeType?: string): NormalizedJob["employment_type"] {
  const t = (timeType ?? "").toLowerCase();
  if (t.includes("intern")) return "internship";
  if (t.includes("part")) return "part_time";
  if (t.includes("contract")) return "contract";
  return "full_time";
}

function inferWorkArrangement(location: string, description: string): NormalizedJob["work_arrangement"] {
  const haystack = `${location} ${description}`.toLowerCase();
  if (/\bremote\b/.test(haystack)) return "remote";
  if (/\bhybrid\b/.test(haystack)) return "hybrid";
  return null;
}

export async function fetchWorkdayJobs(careersUrl: string): Promise<NormalizedJob[]> {
  const parsed = parseCareersUrl(careersUrl);
  if (!parsed) {
    throw new AtsFetchError(
      "That doesn't look like a Workday careers URL. Paste the full page address, e.g. https://company.wd5.myworkdayjobs.com/en-US/CompanyCareers",
      "workday",
      careersUrl
    );
  }
  const { host, tenant, site } = parsed;
  const jobsEndpoint = `https://${host}/wday/cxs/${tenant}/${site}/jobs`;

  const postings: WorkdayListPosting[] = [];
  let offset = 0;
  let total = Infinity;

  try {
    while (offset < total && postings.length < MAX_JOBS) {
      const page = await fetchJson<WorkdayListResponse>(jobsEndpoint, {
        method: "POST",
        body: JSON.stringify({ appliedFacets: {}, limit: LIST_PAGE_SIZE, offset, searchText: "" }),
      });
      total = page.total ?? 0;
      postings.push(...(page.jobPostings ?? []));
      offset += LIST_PAGE_SIZE;
      if (!page.jobPostings || page.jobPostings.length === 0) break;
    }
  } catch (err) {
    throw new AtsFetchError(
      `Could not reach Workday for "${tenant}/${site}": ${err instanceof Error ? err.message : String(err)}. The careers URL or Workday's internal API may have changed.`,
      "workday",
      careersUrl
    );
  }

  const capped = postings.slice(0, MAX_JOBS);
  const results: NormalizedJob[] = [];

  for (let i = 0; i < capped.length; i += DETAIL_CONCURRENCY) {
    const batch = capped.slice(i, i + DETAIL_CONCURRENCY);
    const detailed = await Promise.all(
      batch.map(async (posting) => {
        let description = (posting.bulletFields ?? []).join("\n");
        let jobReqId = posting.externalPath;
        let timeType: string | undefined;
        try {
          const detail = await fetchJson<WorkdayDetailResponse>(
            `https://${host}/wday/cxs/${tenant}/${site}${posting.externalPath}`
          );
          if (detail.jobPostingInfo?.jobDescription) {
            description = htmlToText(detail.jobPostingInfo.jobDescription);
          }
          jobReqId = detail.jobPostingInfo?.jobReqId || jobReqId;
          timeType = detail.jobPostingInfo?.timeType;
        } catch {
          // Fall back to the list-page summary fields rather than failing
          // the whole sync over one posting's detail call.
        }

        const location = posting.locationsText ?? "";
        const jobUrl = `https://${host}/${tenant}/${site}${posting.externalPath}`;

        const normalized: NormalizedJob = {
          external_job_id: `workday_${jobReqId}`,
          title: posting.title,
          location: location || null,
          work_arrangement: inferWorkArrangement(location, description),
          employment_type: mapEmploymentType(timeType),
          job_url: jobUrl,
          application_url: jobUrl,
          description,
          posted_date: null,
          technologies: extractTechnologies(description),
        };
        return normalized;
      })
    );
    results.push(...detailed);
  }

  return results;
}
