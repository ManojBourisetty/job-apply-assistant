import { htmlToText } from "./html";
import { AtsFetchError, type NormalizedJob } from "./types";
import { extractTechnologies } from "@/lib/technology-extraction";

type LeverPosting = {
  id: string;
  text: string;
  hostedUrl: string;
  applyUrl?: string;
  createdAt?: number;
  workplaceType?: string;
  categories?: { location?: string; commitment?: string; team?: string };
  descriptionPlain?: string;
  description?: string;
  lists?: { text: string; content: string }[];
};

function mapEmploymentType(commitment?: string): NormalizedJob["employment_type"] {
  const c = (commitment ?? "").toLowerCase();
  if (c.includes("intern")) return "internship";
  if (c.includes("contract to hire")) return "contract_to_hire";
  if (c.includes("contract") || c.includes("temporary")) return "contract";
  if (c.includes("part")) return "part_time";
  return "full_time";
}

function mapWorkArrangement(workplaceType?: string): NormalizedJob["work_arrangement"] {
  const w = (workplaceType ?? "").toLowerCase();
  if (w === "remote") return "remote";
  if (w === "hybrid") return "hybrid";
  if (w === "onsite" || w === "on-site") return "onsite";
  return null;
}

export async function fetchLeverJobs(boardToken: string): Promise<NormalizedJob[]> {
  const url = `https://api.lever.co/v0/postings/${encodeURIComponent(boardToken)}?mode=json`;

  let response: Response;
  try {
    response = await fetch(url, { headers: { Accept: "application/json" } });
  } catch (err) {
    throw new AtsFetchError(
      `Could not reach Lever: ${err instanceof Error ? err.message : String(err)}`,
      "lever",
      boardToken
    );
  }

  if (!response.ok) {
    throw new AtsFetchError(
      `Lever board "${boardToken}" returned ${response.status}. Check the company slug.`,
      "lever",
      boardToken
    );
  }

  const data = (await response.json()) as LeverPosting[];

  return data.map((posting) => {
    const listsText = (posting.lists ?? [])
      .map((l) => `${l.text}\n${htmlToText(l.content)}`)
      .join("\n\n");
    const description = [
      posting.descriptionPlain || htmlToText(posting.description),
      listsText,
    ]
      .filter(Boolean)
      .join("\n\n");

    return {
      external_job_id: posting.id,
      title: posting.text,
      location: posting.categories?.location ?? null,
      work_arrangement: mapWorkArrangement(posting.workplaceType),
      employment_type: mapEmploymentType(posting.categories?.commitment),
      job_url: posting.hostedUrl,
      application_url: posting.applyUrl ?? posting.hostedUrl,
      description,
      posted_date: posting.createdAt
        ? new Date(posting.createdAt).toISOString().slice(0, 10)
        : null,
      technologies: extractTechnologies(description),
    };
  });
}
