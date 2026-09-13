"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { performSourceSync, type SyncResult } from "@/lib/job-sync";

export type ActionState = { error?: string; success?: string };

function csv(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || !value.trim()) return [];
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

const schema = z.object({
  name: z.string().min(1, "Name is required."),
  provider: z.enum(["greenhouse", "lever", "ashby", "adzuna", "workday"]),
  board_token: z.string().min(1, "Board token is required."),
});

const DUPLICATE_ERROR =
  "You already have a source with this exact name and board token/country/URL — use a different display name if you want a separate source for the same target.";

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

  const search_titles = csv(formData.get("search_titles"));

  const { error } = await supabase
    .from("job_sources")
    .insert({ ...parsed.data, search_titles, user_id: user.id });

  if (error) {
    if (error.code === "23505") return { error: DUPLICATE_ERROR };
    return { error: error.message };
  }

  revalidatePath("/jobs/sources");
  redirect("/jobs/sources");
}

const updateSchema = z.object({
  name: z.string().min(1, "Name is required."),
  board_token: z.string().min(1, "Board token is required."),
});

export async function updateJobSource(
  sourceId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = updateSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const supabase = await createClient();
  const search_titles = csv(formData.get("search_titles"));

  const { error } = await supabase
    .from("job_sources")
    .update({ ...parsed.data, search_titles })
    .eq("id", sourceId);

  if (error) {
    if (error.code === "23505") return { error: DUPLICATE_ERROR };
    return { error: error.message };
  }

  revalidatePath("/jobs/sources");
  return { success: "Source updated." };
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

export type { SyncResult };

export async function syncJobSource(sourceId: string): Promise<SyncResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated.");

  const { data: source } = await supabase.from("job_sources").select("*").eq("id", sourceId).single();
  if (!source) throw new Error("Source not found.");

  const result = await performSourceSync(supabase, user.id, source);

  revalidatePath("/jobs");
  revalidatePath("/jobs/sources");
  revalidatePath("/dashboard");
  revalidatePath("/recommended");

  return result;
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
