"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { emptyResumeContent } from "@/lib/resume-types";
import type { Json } from "@/lib/supabase/database.types";

export type ActionState = { error?: string; success?: string };

export async function createResume(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return { error: "Title is required." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const { count } = await supabase
    .from("resumes")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);
  const isFirst = (count ?? 0) === 0;

  const { data: resume, error: resumeError } = await supabase
    .from("resumes")
    .insert({ user_id: user.id, title, is_master: isFirst })
    .select("id")
    .single();

  if (resumeError) return { error: resumeError.message };

  const { data: version, error: versionError } = await supabase
    .from("resume_versions")
    .insert({
      resume_id: resume.id,
      user_id: user.id,
      version_number: 1,
      content: emptyResumeContent(),
      change_summary: "Initial version",
      created_by: "user",
    })
    .select("id")
    .single();

  if (versionError) return { error: versionError.message };

  await supabase
    .from("resumes")
    .update({ current_version_id: version.id })
    .eq("id", resume.id);

  revalidatePath("/resumes");
  redirect(`/resumes/${resume.id}`);
}

const contentSchema = z.object({}).passthrough();

export async function saveResumeVersion(
  resumeId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const raw = formData.get("content");
  const changeSummary = String(formData.get("change_summary") ?? "Manual edit");
  if (typeof raw !== "string") return { error: "Missing content." };

  let content: unknown;
  try {
    content = JSON.parse(raw);
  } catch {
    return { error: "Could not parse resume content." };
  }
  const parsed = contentSchema.safeParse(content);
  if (!parsed.success) return { error: "Invalid resume content." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const rawText = formData.get("raw_text");

  const { data: latest } = await supabase
    .from("resume_versions")
    .select("version_number")
    .eq("resume_id", resumeId)
    .order("version_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextVersion = (latest?.version_number ?? 0) + 1;

  const { data: version, error } = await supabase
    .from("resume_versions")
    .insert({
      resume_id: resumeId,
      user_id: user.id,
      version_number: nextVersion,
      content: parsed.data as Json,
      raw_text: typeof rawText === "string" && rawText.trim() ? rawText : null,
      change_summary: changeSummary,
      created_by: "user",
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  await supabase.from("resumes").update({ current_version_id: version.id }).eq("id", resumeId);

  revalidatePath(`/resumes/${resumeId}`);
  revalidatePath("/resumes");
  return { success: "Resume saved." };
}

export async function setMasterResume(resumeId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated.");

  await supabase
    .from("resumes")
    .update({ is_master: false })
    .eq("user_id", user.id)
    .eq("is_master", true);

  const { error } = await supabase.from("resumes").update({ is_master: true }).eq("id", resumeId);
  if (error) throw new Error(error.message);

  revalidatePath("/resumes");
}

export async function renameResume(resumeId: string, title: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("resumes").update({ title }).eq("id", resumeId);
  if (error) throw new Error(error.message);
  revalidatePath("/resumes");
  revalidatePath(`/resumes/${resumeId}`);
}

export async function deleteResume(resumeId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("resumes").delete().eq("id", resumeId);
  if (error) throw new Error(error.message);
  revalidatePath("/resumes");
}

export async function restoreResumeVersion(resumeId: string, versionId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("resumes")
    .update({ current_version_id: versionId })
    .eq("id", resumeId);
  if (error) throw new Error(error.message);
  revalidatePath(`/resumes/${resumeId}`);
}
