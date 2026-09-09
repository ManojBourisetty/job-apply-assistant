// Runs unattended (via pg_cron, see supabase/migrations) once a day per the
// spec's "Daily Job Search" workflow: syncs every active job source across
// every user, detects job changes/closures, and raises follow-up and
// interview reminders. Uses the service-role key to operate across users;
// every write still sets the correct user_id so per-user RLS remains
// meaningful for all other access paths.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient, type SupabaseClient } from "jsr:@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

type NormalizedJob = {
  external_job_id: string;
  title: string;
  location: string | null;
  work_arrangement: string | null;
  employment_type: string;
  job_url: string;
  application_url: string;
  description: string;
  posted_date: string | null;
  technologies: string[];
};

const KNOWN_TECHNOLOGIES = [
  "AWS", "GCP", "Azure", "Kubernetes", "Docker", "Terraform", "CloudFormation",
  "Ansible", "GitLab", "GitHub Actions", "Jenkins", "Helm", "Vault", "Datadog",
  "Dynatrace", "Splunk", "Prometheus", "Grafana", "Python", "Bash", "Linux",
  "Java", "JavaScript", "TypeScript", "Node.js", "React", "Go", "Ruby", "Rust",
  "PostgreSQL", "MySQL", "MongoDB", "Redis", "Kafka", "Istio", "Nginx",
];

function extractTechnologies(text: string): string[] {
  if (!text) return [];
  const found = new Set<string>();
  for (const tech of KNOWN_TECHNOLOGIES) {
    const regex = new RegExp(`(?<![\\w.])${tech.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![\\w])`, "i");
    if (regex.test(text)) found.add(tech);
  }
  return Array.from(found);
}

function htmlToText(html: string | null | undefined): string {
  if (!html) return "";

  // Some ATS APIs (e.g. Greenhouse) return this field HTML-entity-encoded —
  // decode entities BEFORE stripping tags, or encoded "&lt;div&gt;" never
  // matches the tag-stripping regex and leaks into the output.
  let text = html
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&");

  text = text
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<\/(p|div|li|h[1-6]|br)>/gi, "\n")
    .replace(/<li>/gi, "• ")
    .replace(/<[^>]+>/g, "");

  return text.trim();
}

async function fetchGreenhouse(boardToken: string): Promise<NormalizedJob[]> {
  const res = await fetch(`https://boards-api.greenhouse.io/v1/boards/${boardToken}/jobs?content=true`);
  if (!res.ok) throw new Error(`Greenhouse returned ${res.status}`);
  const data = await res.json();
  return (data.jobs ?? []).map((job: Record<string, unknown>) => {
    const location = (job.location as { name?: string } | undefined)?.name ?? "";
    const description = htmlToText(job.content as string);
    return {
      external_job_id: String(job.id),
      title: job.title as string,
      location: location || null,
      work_arrangement: /remote/i.test(location + description) ? "remote" : null,
      employment_type: "full_time",
      job_url: job.absolute_url as string,
      application_url: job.absolute_url as string,
      description,
      posted_date: job.updated_at ? String(job.updated_at).slice(0, 10) : null,
      technologies: extractTechnologies(description),
    };
  });
}

async function fetchLever(boardToken: string): Promise<NormalizedJob[]> {
  const res = await fetch(`https://api.lever.co/v0/postings/${boardToken}?mode=json`);
  if (!res.ok) throw new Error(`Lever returned ${res.status}`);
  const data = await res.json();
  return (data as Record<string, unknown>[]).map((p) => {
    const description = (p.descriptionPlain as string) || htmlToText(p.description as string);
    const workplaceType = ((p.workplaceType as string) ?? "").toLowerCase();
    return {
      external_job_id: p.id as string,
      title: p.text as string,
      location: (p.categories as { location?: string } | undefined)?.location ?? null,
      work_arrangement: ["remote", "hybrid", "onsite"].includes(workplaceType) ? workplaceType : null,
      employment_type: "full_time",
      job_url: p.hostedUrl as string,
      application_url: (p.applyUrl as string) ?? (p.hostedUrl as string),
      description,
      posted_date: p.createdAt ? new Date(p.createdAt as number).toISOString().slice(0, 10) : null,
      technologies: extractTechnologies(description),
    };
  });
}

async function fetchAshby(boardToken: string): Promise<NormalizedJob[]> {
  const res = await fetch(`https://api.ashbyhq.com/posting-api/job-board/${boardToken}`);
  if (!res.ok) throw new Error(`Ashby returned ${res.status}`);
  const data = await res.json();
  return (data.jobs ?? []).map((job: Record<string, unknown>) => {
    const description = (job.descriptionPlain as string) || htmlToText(job.descriptionHtml as string);
    return {
      external_job_id: job.id as string,
      title: job.title as string,
      location: (job.location as string) ?? null,
      work_arrangement: job.isRemote ? "remote" : null,
      employment_type: "full_time",
      job_url: (job.jobUrl as string) ?? "",
      application_url: (job.applyUrl as string) ?? (job.jobUrl as string) ?? "",
      description,
      posted_date: job.publishedDate ? String(job.publishedDate).slice(0, 10) : null,
      technologies: extractTechnologies(description),
    };
  });
}

async function fetchFromProvider(provider: string, boardToken: string): Promise<NormalizedJob[]> {
  if (provider === "greenhouse") return fetchGreenhouse(boardToken);
  if (provider === "lever") return fetchLever(boardToken);
  if (provider === "ashby") return fetchAshby(boardToken);
  throw new Error(`Unknown provider: ${provider}`);
}

type JobSourceRow = {
  id: string;
  user_id: string;
  name: string;
  provider: string;
  board_token: string;
};

async function syncSource(supabase: SupabaseClient, source: JobSourceRow) {
  const normalized = await fetchFromProvider(source.provider, source.board_token);

  const { data: existingJobs } = await supabase
    .from("jobs")
    .select("id, external_job_id, technologies, location, work_arrangement, status")
    .eq("user_id", source.user_id)
    .eq("job_source_id", source.id);

  const existingByExternalId = new Map((existingJobs ?? []).map((j) => [j.external_job_id, j]));
  const fetchedIds = new Set(normalized.map((j) => j.external_job_id));

  let added = 0;
  let updated = 0;
  let closed = 0;

  for (const job of normalized) {
    const existing = existingByExternalId.get(job.external_job_id);
    if (!existing) {
      const { data: inserted, error } = await supabase
        .from("jobs")
        .insert({
          user_id: source.user_id,
          job_source_id: source.id,
          company_name: source.name,
          title: job.title,
          external_job_id: job.external_job_id,
          job_url: job.job_url || null,
          application_url: job.application_url || null,
          location: job.location,
          work_arrangement: job.work_arrangement,
          employment_type: job.employment_type,
          description: job.description,
          technologies: job.technologies,
          posted_date: job.posted_date,
          source: source.provider,
        })
        .select("id, sponsorship_status")
        .single();
      if (error || !inserted) continue;

      await supabase.from("job_snapshots").insert({
        job_id: inserted.id,
        user_id: source.user_id,
        presence: "active",
        location: job.location,
        work_arrangement: job.work_arrangement,
        technologies: job.technologies,
      });
      added++;
    } else {
      const techsChanged =
        JSON.stringify([...(existing.technologies as string[])].sort()) !==
        JSON.stringify([...job.technologies].sort());
      const changed =
        existing.location !== job.location || existing.work_arrangement !== job.work_arrangement || techsChanged;

      await supabase
        .from("jobs")
        .update({
          title: job.title,
          location: job.location,
          work_arrangement: job.work_arrangement,
          description: job.description,
          technologies: job.technologies,
          last_verified_at: new Date().toISOString(),
          status: existing.status === "closed" ? "discovered" : existing.status,
        })
        .eq("id", existing.id);

      if (changed) {
        await supabase.from("job_snapshots").insert({
          job_id: existing.id,
          user_id: source.user_id,
          presence: "active",
          location: job.location,
          work_arrangement: job.work_arrangement,
          technologies: job.technologies,
        });
        await supabase.from("notifications").insert({
          user_id: source.user_id,
          type: "job_changed",
          title: `Job posting changed: ${job.title}`,
          body: "Location, work arrangement, or required technologies were updated.",
          link: `/jobs/${existing.id}`,
        });
        updated++;
      }
    }
  }

  for (const existing of existingJobs ?? []) {
    if (!fetchedIds.has(existing.external_job_id) && existing.status !== "closed") {
      await supabase.from("jobs").update({ status: "closed" }).eq("id", existing.id);
      await supabase.from("job_snapshots").insert({ job_id: existing.id, user_id: source.user_id, presence: "removed" });
      await supabase.from("notifications").insert({
        user_id: source.user_id,
        type: "job_closed",
        title: "A tracked job may have closed",
        link: `/jobs/${existing.id}`,
      });
      closed++;
    }
  }

  await supabase
    .from("job_sources")
    .update({
      last_synced_at: new Date().toISOString(),
      last_sync_status: "success",
      last_sync_error: null,
      last_sync_job_count: normalized.length,
    })
    .eq("id", source.id);

  return { added, updated, closed };
}

async function raiseReminders(supabase: SupabaseClient) {
  const followupWindow = new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10);
  const { data: dueFollowups } = await supabase
    .from("followups")
    .select("id, user_id, due_date, application_id")
    .eq("completed", false)
    .lte("due_date", followupWindow);

  for (const f of dueFollowups ?? []) {
    const link = `/applications/${f.application_id}`;
    const { data: existing } = await supabase
      .from("notifications")
      .select("id")
      .eq("user_id", f.user_id)
      .eq("type", "followup_due")
      .eq("link", link)
      .gte("created_at", new Date(Date.now() - 20 * 3600000).toISOString())
      .limit(1);
    if ((existing?.length ?? 0) > 0) continue;
    await supabase.from("notifications").insert({
      user_id: f.user_id,
      type: "followup_due",
      title: "Follow-up due",
      body: `Due ${f.due_date}`,
      link,
    });
  }
}

Deno.serve(async () => {
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const { data: sources } = await supabase.from("job_sources").select("*").eq("is_active", true);

  let sourcesProcessed = 0;
  let jobsAdded = 0;
  let jobsUpdated = 0;
  let jobsClosed = 0;
  const errors: string[] = [];

  for (const source of (sources ?? []) as JobSourceRow[]) {
    try {
      const result = await syncSource(supabase, source);
      jobsAdded += result.added;
      jobsUpdated += result.updated;
      jobsClosed += result.closed;
      sourcesProcessed++;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      errors.push(`${source.name}: ${message}`);
      await supabase
        .from("job_sources")
        .update({ last_sync_status: "error", last_sync_error: message, last_synced_at: new Date().toISOString() })
        .eq("id", source.id);
      await supabase.from("notifications").insert({
        user_id: source.user_id,
        type: "sync_error",
        title: `Sync failed for ${source.name}`,
        body: message,
        link: "/jobs/sources",
      });
    }
  }

  await raiseReminders(supabase);

  return new Response(
    JSON.stringify({ sourcesProcessed, jobsAdded, jobsUpdated, jobsClosed, errors }),
    { headers: { "Content-Type": "application/json" } }
  );
});
