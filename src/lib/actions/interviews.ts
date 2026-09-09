"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

export type ActionState = { error?: string; success?: string };

const optionalString = z
  .string()
  .optional()
  .transform((v) => (v && v.trim() !== "" ? v.trim() : undefined));

const schema = z.object({
  stage: z.string().min(1),
  scheduled_at: optionalString,
  interviewer_name: optionalString,
  meeting_url: optionalString,
  topics: optionalString,
  preparation_notes: optionalString,
  questions: optionalString,
  result: z.enum(["pending", "passed", "failed", "cancelled"]),
});

function parseTopics(input?: string) {
  if (!input) return [];
  return input.split(",").map((t) => t.trim()).filter(Boolean);
}

export async function createInterview(
  applicationId: string,
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

  const { topics, scheduled_at, ...rest } = parsed.data;

  const { error } = await supabase.from("interviews").insert({
    ...rest,
    application_id: applicationId,
    user_id: user.id,
    scheduled_at: scheduled_at ? new Date(scheduled_at).toISOString() : null,
    topics: parseTopics(topics),
  });

  if (error) return { error: error.message };

  revalidatePath(`/applications/${applicationId}`);
  return { success: "Interview added." };
}

export async function deleteInterview(interviewId: string, applicationId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("interviews").delete().eq("id", interviewId);
  if (error) throw new Error(error.message);
  revalidatePath(`/applications/${applicationId}`);
}

export async function updateInterviewResult(
  interviewId: string,
  applicationId: string,
  result: "pending" | "passed" | "failed" | "cancelled"
) {
  const supabase = await createClient();
  const { error } = await supabase.from("interviews").update({ result }).eq("id", interviewId);
  if (error) throw new Error(error.message);
  revalidatePath(`/applications/${applicationId}`);
}
