"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
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

export type ActionState = { error?: string; success?: string };

const schema = z.object({
  name: z.string().min(1, "Name is required."),
  provider: z.enum(["greenhouse", "lever", "ashby", "adzuna"]),
  board_token: z.string().min(1, "Board token is required."),
});

export async function createJobSource(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = schema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const { error } = await supabase.from("job_sources").insert({ ...parsed.data, user_id: user.id });

  if (error) {
    if (error.code === "23505") return { error: "You already have a source with this board token." };
    return { error: error.message };
  }

  revalidatePath("/jobs/sources");
  redirect("/jobs/sources");
}

export async function deleteJobSource(sourceId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("job_sources").delete().eq("id", sourceId);
  if (error) throw new Error(error.message);
  revalidatePath("/jobs/sources");
}

export async function toggleJobSourceActive(sourceId: string, isActive: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("job_sources")
    .update({ is_active: isActive })
    .eq("id", sourceId);
  if (error) throw new Error(error.message);
  revalidatePath("/jobs/sources");
}

export type SyncResult = { added: number; updated: number; closed: number; error?: string };

export async function syncJobSource(sourceId: string): Promise<SyncResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated.");

  const { data: source } = await supabase.from("job_sources").select("*").eq("id", sourceId).single();
  if (!source) throw new Error("Source not found.");

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
      const { data: profiles } = await supabase
        .from("job_search_profiles")
        .select("titles, locations")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .limit(1);
      const profile = profiles?.[0];
      if (!profile || profile.titles.length === 0) {
        throw new AtsFetchError(
          "Add at least one target job title to an active Job Search Profile before syncing Adzuna.",
          "adzuna",
          source.board_token
        );
      }
      const results = await Promise.all(
        profile.titles.map((title) =>
          fetchAdzunaJobs({
            country,
            what: title,
            where: profile.locations[0],
          })
        )
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
      .eq("id", sourceId);
    await createNotification(
      supabase,
      user.id,
      "sync_error",
      `Sync failed for ${source.name}`,
      message,
      "/jobs/sources"
    );
    revalidatePath("/jobs/sources");
    return { added: 0, updated: 0, closed: 0, error: message };
  }

  const [{ data: masterResume }, { data: activeProfiles }] = await Promise.all([
    supabase
      .from("resumes")
      .select("current_version_id")
      .eq("user_id", user.id)
      .eq("is_master", true)
      .eq("status", "active")
      .maybeSingle(),
    supabase.from("job_search_profiles").select("*").eq("user_id", user.id).eq("is_active", true),
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
    .eq("user_id", user.id)
    .eq("job_source_id", sourceId);

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
          user_id: user.id,
          job_source_id: sourceId,
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
        user_id: user.id,
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
            user.id,
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
          user.id,
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
          user_id: user.id,
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
          user.id,
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
        user_id: user.id,
        presence: "removed",
      });
      await createNotification(
        supabase,
        user.id,
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
    .eq("id", sourceId);

  revalidatePath("/jobs");
  revalidatePath("/jobs/sources");
  revalidatePath("/dashboard");
  revalidatePath("/recommended");

  return { added, updated, closed };
}

export async function syncAllActiveSources(): Promise<{
  sources: number;
  added: number;
  updated: number;
  closed: number;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated.");

  const { data: sources } = await supabase
    .from("job_sources")
    .select("id")
    .eq("user_id", user.id)
    .eq("is_active", true);

  let added = 0;
  let updated = 0;
  let closed = 0;
  for (const s of sources ?? []) {
    const result = await syncJobSource(s.id);
    added += result.added;
    updated += result.updated;
    closed += result.closed;
  }

  return { sources: sources?.length ?? 0, added, updated, closed };
}
