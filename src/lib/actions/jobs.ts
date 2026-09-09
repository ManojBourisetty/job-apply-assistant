"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import {
  EMPLOYMENT_TYPES,
  JOB_SOURCES,
  SPONSORSHIP_STATUSES,
  WORK_ARRANGEMENTS,
} from "@/lib/constants";

export type ActionState = { error?: string; success?: string };

const optionalString = z
  .string()
  .optional()
  .transform((v) => (v && v.trim() !== "" ? v.trim() : undefined));

const optionalNumber = z
  .string()
  .optional()
  .transform((v) => (v && v.trim() !== "" ? Number(v) : undefined));

const jobSchema = z.object({
  title: z.string().min(1, "Title is required."),
  company_name: z.string().min(1, "Company name is required."),
  job_url: optionalString,
  application_url: optionalString,
  location: optionalString,
  work_arrangement: z.enum(WORK_ARRANGEMENTS).optional().or(z.literal("")),
  employment_type: z.enum(EMPLOYMENT_TYPES),
  salary_min: optionalNumber,
  salary_max: optionalNumber,
  salary_currency: optionalString,
  posted_date: optionalString,
  description: optionalString,
  requirements: optionalString,
  preferred_qualifications: optionalString,
  technologies: optionalString,
  min_years_experience: optionalNumber,
  education_requirement: optionalString,
  sponsorship_status: z.enum(SPONSORSHIP_STATUSES),
  sponsorship_evidence: optionalString,
  sponsorship_source: optionalString,
  source: z.enum(JOB_SOURCES),
});

function parseTechnologies(input?: string) {
  if (!input) return [];
  return input
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

function toRecord(formData: FormData) {
  const parsed = jobSchema.safeParse(Object.fromEntries(formData.entries()));
  return parsed;
}

export async function createJob(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = toRecord(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const { technologies, work_arrangement, ...rest } = parsed.data;

  const { data, error } = await supabase
    .from("jobs")
    .insert({
      ...rest,
      work_arrangement: work_arrangement || null,
      user_id: user.id,
      technologies: parseTechnologies(technologies),
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      return { error: "You've already added a job with this URL." };
    }
    return { error: error.message };
  }

  revalidatePath("/jobs");
  revalidatePath("/dashboard");
  redirect(`/jobs/${data.id}`);
}

export async function updateJob(
  jobId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = toRecord(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const supabase = await createClient();
  const { technologies, work_arrangement, ...rest } = parsed.data;

  const { error } = await supabase
    .from("jobs")
    .update({
      ...rest,
      work_arrangement: work_arrangement || null,
      technologies: parseTechnologies(technologies),
    })
    .eq("id", jobId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/jobs");
  revalidatePath(`/jobs/${jobId}`);
  redirect(`/jobs/${jobId}`);
}

export async function deleteJob(jobId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("jobs").delete().eq("id", jobId);
  if (error) throw new Error(error.message);
  revalidatePath("/jobs");
  revalidatePath("/dashboard");
}

export async function toggleSaveJob(jobId: string, isSaved: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("jobs")
    .update({
      is_saved: isSaved,
      saved_at: isSaved ? new Date().toISOString() : null,
      status: isSaved ? "saved" : "discovered",
    })
    .eq("id", jobId);
  if (error) throw new Error(error.message);
  revalidatePath("/jobs");
  revalidatePath(`/jobs/${jobId}`);
  revalidatePath("/dashboard");
}

export async function createApplicationFromJob(jobId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated.");

  const { data: existing } = await supabase
    .from("applications")
    .select("id")
    .eq("job_id", jobId)
    .maybeSingle();

  if (existing) {
    redirect("/applications");
  }

  const { error } = await supabase.from("applications").insert({
    user_id: user.id,
    job_id: jobId,
    status: "saved",
  });

  if (error) throw new Error(error.message);

  revalidatePath("/applications");
  revalidatePath(`/jobs/${jobId}`);
  redirect("/applications");
}
