import type { SupabaseClient } from "@supabase/supabase-js";

import { createNotification } from "@/lib/notifications";
import {
  fetchFromProvider,
  fetchAdzunaJobs,
  isAdzunaConfigured,
  isAdzunaCountry,
  AtsFetchError,
  type AtsProvider,
  type NormalizedJob,
} from "@/lib/ats";
import { computeMatch } from "@/lib/matching";
import type { ResumeContent } from "@/lib/resume-types";
import type { Database, Tables } from "@/lib/supabase/database.types";

export type SyncResult = { added: number; updated: number; closed: number; error?: string };

/**
 * Runs a single job source's sync end to end: fetch (ATS or Adzuna),
 * diff against existing jobs, insert/update/close, and notify. Shared
 * between the user-triggered "Sync now" action (cookie-scoped client) and
 * the daily cron job (service-role client iterating every user's active
 * sources) — the caller supplies whichever client and the source's owner.
 */
export async function performSourceSync(
  supabase: SupabaseClient<Database>,
  userId: string,
  source: Tables<"job_sources">
): Promise<SyncResult> {
  let normalized: NormalizedJob[];
  try {
    if (source.provider === "adzuna") {
      if (!isAdzunaConfigured()) {
        throw new AtsFetchError(
          "Adzuna is not configured. Set ADZUNA_APP_ID and ADZUNA_APP_KEY.",
          "adzuna",
          source.board_token
        );
      }
      if (!isAdzunaCountry(source.board_token)) {
        throw new AtsFetchError(
          `"${source.board_token}" is not a supported Adzuna country code (e.g. us, gb, in, ca, au).`,
          "adzuna",
          source.board_token
        );
      }
      const country = source.board_token;

      // Titles configured directly on this source take priority — this is
      // the most specific, intentional signal (e.g. two Adzuna/"us" sources
      // for two different role searches). Falls back to every ACTIVE Job
      // Search Profile (not just one: there's no rule limiting a user to a
      // single active profile, so having e.g. both "DevOps" and "SRE"
      // profiles active is valid and both should contribute titles — using
      // only the first silently dropped the rest) and finally to the
      // master resume's own "Target titles" field, since a user may have
      // set one there without realizing Job Search Profiles is separate.
      let titles: string[] = source.search_titles ?? [];
      let where: string | undefined;

      if (titles.length === 0) {
        const { data: profiles } = await supabase
          .from("job_search_profiles")
          .select("titles, locations")
          .eq("user_id", userId)
          .eq("is_active", true);
        titles = Array.from(new Set((profiles ?? []).flatMap((p) => p.titles)));
        where = (profiles ?? []).find((p) => p.locations.length > 0)?.locations[0];
      }

      if (titles.length === 0) {
        const { data: masterResume } = await supabase
          .from("resumes")
          .select("current_version_id")
          .eq("user_id", userId)
          .eq("is_master", true)
          .eq("status", "active")
          .maybeSingle();
        if (masterResume?.current_version_id) {
          const { data: version } = await supabase
            .from("resume_versions")
            .select("content")
            .eq("id", masterResume.current_version_id)
            .maybeSingle();
          const content = version?.content as ResumeContent | undefined;
          titles = content?.target_titles ?? [];
          where = where || content?.contact.location || undefined;
        }
      }

      if (titles.length === 0) {
        throw new AtsFetchError(
          "Add at least one target job title — on this source itself, in an active Job Search Profile (Search Profiles page), or your master resume's \"Target titles\" field — before syncing Adzuna.",
          "adzuna",
          source.board_token
        );
      }

      const results = await Promise.all(
        titles.map((title) => fetchAdzunaJobs({ country, what: title, where }))
      );
      const seen = new Set<string>();
      normalized = results.flat().filter((job) => {
        if (seen.has(job.external_job_id)) return false;
        seen.add(job.external_job_id);
        return true;
      });
    } else {
      normalized = await fetchFromProvider(source.provider as AtsProvider, source.board_token);
    }
  } catch (err) {
    const message = err instanceof AtsFetchError ? err.message : "Sync failed unexpectedly.";
    await supabase
      .from("job_sources")
      .update({
        last_sync_status: "error",
        last_sync_error: message,
        last_synced_at: new Date().toISOString(),
      })
      .eq("id", source.id);
    await createNotification(
      supabase,
      userId,
      "sync_error",
      `Sync failed for ${source.name}`,
      message,
      "/jobs/sources"
    );
    return { added: 0, updated: 0, closed: 0, error: message };
  }

  const [{ data: masterResume }, { data: activeProfiles }] = await Promise.all([
    supabase
      .from("resumes")
      .select("current_version_id")
      .eq("user_id", userId)
      .eq("is_master", true)
      .eq("status", "active")
      .maybeSingle(),
    supabase.from("job_search_profiles").select("*").eq("user_id", userId).eq("is_active", true),
  ]);

  let resumeContent: ResumeContent | null = null;
  if (masterResume?.current_version_id) {
    const { data: version } = await supabase
      .from("resume_versions")
      .select("content")
      .eq("id", masterResume.current_version_id)
      .maybeSingle();
    resumeContent = (version?.content as ResumeContent) ?? null;
  }
  const activeProfile = activeProfiles?.[0] ?? null;

  const { data: existingJobs } = await supabase
    .from("jobs")
    .select(
      "id, external_job_id, salary_min, salary_max, sponsorship_status, location, work_arrangement, technologies, min_years_experience, status"
    )
    .eq("user_id", userId)
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
          user_id: userId,
          job_source_id: source.id,
          company_name: job.company_name || source.name,
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
        .select("*")
        .single();

      if (error || !inserted) {
        // Most likely a URL collision with a manually-added job; skip rather than fail the sync.
        continue;
      }

      await supabase.from("job_snapshots").insert({
        job_id: inserted.id,
        user_id: userId,
        presence: "active",
        location: job.location,
        work_arrangement: job.work_arrangement,
        technologies: job.technologies,
      });

      added++;

      if (resumeContent) {
        const match = computeMatch(inserted, resumeContent, activeProfile);
        if (match.total >= 85) {
          await createNotification(
            supabase,
            userId,
            "new_high_match",
            `Strong match: ${job.title} at ${source.name}`,
            `${match.total}/100 match score`,
            `/jobs/${inserted.id}`
          );
        }
      }
      if (inserted.sponsorship_status === "confirmed") {
        await createNotification(
          supabase,
          userId,
          "sponsorship_confirmed",
          `Sponsorship-confirmed opportunity: ${job.title}`,
          source.name,
          `/jobs/${inserted.id}`
        );
      }
    } else {
      const techsChanged =
        JSON.stringify([...existing.technologies].sort()) !== JSON.stringify([...job.technologies].sort());
      const changed =
        existing.location !== job.location ||
        existing.work_arrangement !== job.work_arrangement ||
        techsChanged;

      await supabase
        .from("jobs")
        .update({
          title: job.title,
          location: job.location,
          work_arrangement: job.work_arrangement,
          employment_type: job.employment_type,
          description: job.description,
          technologies: job.technologies,
          last_verified_at: new Date().toISOString(),
          status: existing.status === "closed" ? "discovered" : existing.status,
        })
        .eq("id", existing.id);

      if (changed) {
        await supabase.from("job_snapshots").insert({
          job_id: existing.id,
          user_id: userId,
          presence: "active",
          salary_min: existing.salary_min,
          salary_max: existing.salary_max,
          sponsorship_status: existing.sponsorship_status,
          location: job.location,
          work_arrangement: job.work_arrangement,
          technologies: job.technologies,
          min_years_experience: existing.min_years_experience,
        });
        await createNotification(
          supabase,
          userId,
          "job_changed",
          `Job posting changed: ${job.title}`,
          "Location, work arrangement, or required technologies were updated.",
          `/jobs/${existing.id}`
        );
        updated++;
      }
    }
  }

  for (const existing of existingJobs ?? []) {
    if (!(existing.external_job_id && fetchedIds.has(existing.external_job_id)) && existing.status !== "closed") {
      await supabase.from("jobs").update({ status: "closed" }).eq("id", existing.id);
      await supabase.from("job_snapshots").insert({
        job_id: existing.id,
        user_id: userId,
        presence: "removed",
      });
      await createNotification(
        supabase,
        userId,
        "job_closed",
        "A tracked job may have closed",
        undefined,
        `/jobs/${existing.id}`
      );
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
