"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { EMPLOYMENT_TYPES } from "@/lib/constants";

export type ActionState = { error?: string; success?: string };

function csv(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || !value.trim()) return [];
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function num(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || value.trim() === "") return null;
  return Number(value);
}

const schema = z.object({
  name: z.string().min(1, "Name is required."),
  remote_preference: z.enum(["remote", "hybrid", "onsite", "any"]),
  sponsorship_requirement: z.enum(["required", "preferred", "not_required"]),
});

function buildPayload(formData: FormData) {
  return {
    name: formData.get("name"),
    titles: csv(formData.get("titles")),
    keywords: csv(formData.get("keywords")),
    technologies: csv(formData.get("technologies")),
    locations: csv(formData.get("locations")),
    remote_preference: formData.get("remote_preference"),
    min_salary: num(formData.get("min_salary")),
    max_salary: num(formData.get("max_salary")),
    min_years_experience: num(formData.get("min_years_experience")),
    max_years_experience: num(formData.get("max_years_experience")),
    sponsorship_requirement: formData.get("sponsorship_requirement"),
    employment_types: EMPLOYMENT_TYPES.filter((t) => formData.get(`employment_${t}`) === "on"),
    is_active: formData.get("is_active") === "on",
  };
}

export async function createSearchProfile(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const payload = buildPayload(formData);
  const parsed = schema.safeParse(payload);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const { error } = await supabase
    .from("job_search_profiles")
    .insert({ ...payload, user_id: user.id } as never);

  if (error) return { error: error.message };

  revalidatePath("/search-profiles");
  redirect("/search-profiles");
}

export async function updateSearchProfile(
  profileId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const payload = buildPayload(formData);
  const parsed = schema.safeParse(payload);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("job_search_profiles")
    .update(payload as never)
    .eq("id", profileId);

  if (error) return { error: error.message };

  revalidatePath("/search-profiles");
  redirect("/search-profiles");
}

export async function deleteSearchProfile(profileId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("job_search_profiles").delete().eq("id", profileId);
  if (error) throw new Error(error.message);
  revalidatePath("/search-profiles");
}

export async function toggleSearchProfileActive(profileId: string, isActive: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("job_search_profiles")
    .update({ is_active: isActive })
    .eq("id", profileId);
  if (error) throw new Error(error.message);
  revalidatePath("/search-profiles");
}
