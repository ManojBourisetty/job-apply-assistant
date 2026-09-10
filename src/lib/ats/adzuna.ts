import { htmlToText } from "./html";
import { AtsFetchError, type NormalizedJob } from "./types";
import { extractTechnologies } from "@/lib/technology-extraction";

// Adzuna aggregates listings across many employers and job boards per
// country — unlike Greenhouse/Lever/Ashby, a single query returns jobs from
// many different companies, so results carry their own company_name. Free
// tier: https://developer.adzuna.com (sign up for an app_id/app_key).
const ADZUNA_COUNTRIES = [
  "us",
  "gb",
  "ca",
  "au",
  "de",
  "fr",
  "in",
  "nl",
  "sg",
  "za",
] as const;
export type AdzunaCountry = (typeof ADZUNA_COUNTRIES)[number];

export function isAdzunaCountry(value: string): value is AdzunaCountry {
  return (ADZUNA_COUNTRIES as readonly string[]).includes(value);
}

export function isAdzunaConfigured(): boolean {
  return !!(process.env.ADZUNA_APP_ID && process.env.ADZUNA_APP_KEY);
}

type AdzunaResult = {
  id: string;
  title: string;
  company?: { display_name?: string };
  location?: { display_name?: string };
  description?: string;
  redirect_url?: string;
  created?: string;
  contract_time?: string; // "full_time" | "part_time"
  contract_type?: string; // "permanent" | "contract"
  salary_min?: number;
  salary_max?: number;
};

type AdzunaResponse = { results: AdzunaResult[] };

function mapEmploymentType(
  contractTime?: string,
  contractType?: string
): NormalizedJob["employment_type"] {
  if (contractType === "contract") return "contract";
  if (contractTime === "part_time") return "part_time";
  return "full_time";
}

function inferWorkArrangement(location: string, description: string): NormalizedJob["work_arrangement"] {
  const haystack = `${location} ${description}`.toLowerCase();
  if (/\bremote\b/.test(haystack)) return "remote";
  if (/\bhybrid\b/.test(haystack)) return "hybrid";
  return null;
}

/**
 * Searches Adzuna's job aggregator by free-text title/keywords and an
 * optional location, for a single country. Call once per (title, country)
 * pair you want covered — Adzuna's `what` param is a single query string,
 * not a list.
 */
export async function fetchAdzunaJobs({
  country,
  what,
  where,
  resultsPerPage = 20,
}: {
  country: AdzunaCountry;
  what: string;
  where?: string;
  resultsPerPage?: number;
}): Promise<NormalizedJob[]> {
  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_APP_KEY;
  if (!appId || !appKey) {
    throw new AtsFetchError(
      "Adzuna is not configured. Set ADZUNA_APP_ID and ADZUNA_APP_KEY.",
      "adzuna",
      what
    );
  }

  const params = new URLSearchParams({
    app_id: appId,
    app_key: appKey,
    what,
    results_per_page: String(resultsPerPage),
    "content-type": "application/json",
  });
  if (where) params.set("where", where);

  const url = `https://api.adzuna.com/v1/api/jobs/${country}/search/1?${params.toString()}`;

  let response: Response;
  try {
    response = await fetch(url, { headers: { Accept: "application/json" } });
  } catch (err) {
    throw new AtsFetchError(
      `Could not reach Adzuna: ${err instanceof Error ? err.message : String(err)}`,
      "adzuna",
      what
    );
  }

  if (!response.ok) {
    throw new AtsFetchError(
      `Adzuna search for "${what}" returned ${response.status}. Check your API credentials and country code.`,
      "adzuna",
      what
    );
  }

  const data = (await response.json()) as AdzunaResponse;

  return (data.results ?? []).map((job) => {
    const location = job.location?.display_name ?? "";
    const description = htmlToText(job.description);
    return {
      external_job_id: `adzuna_${job.id}`,
      title: job.title,
      company_name: job.company?.display_name || undefined,
      location: location || null,
      work_arrangement: inferWorkArrangement(location, description),
      employment_type: mapEmploymentType(job.contract_time, job.contract_type),
      job_url: job.redirect_url ?? "",
      application_url: job.redirect_url ?? "",
      description,
      posted_date: job.created ? job.created.slice(0, 10) : null,
      technologies: extractTechnologies(description),
    };
  });
}
