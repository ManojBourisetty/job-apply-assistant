"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

export type ActionState = { error?: string; success?: string };

export async function updateProfile(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const targetTitles = String(formData.get("target_titles") ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  const yearsExperienceRaw = formData.get("years_experience");
  const years_experience =
    typeof yearsExperienceRaw === "string" && yearsExperienceRaw.trim() !== ""
      ? Number(yearsExperienceRaw)
      : null;

  const { error } = await supabase
    .from("job_profiles")
    .update({
      full_name: String(formData.get("full_name") ?? "") || null,
      phone: String(formData.get("phone") ?? "") || null,
      location: String(formData.get("location") ?? "") || null,
      linkedin_url: String(formData.get("linkedin_url") ?? "") || null,
      github_url: String(formData.get("github_url") ?? "") || null,
      portfolio_url: String(formData.get("portfolio_url") ?? "") || null,
      current_title: String(formData.get("current_title") ?? "") || null,
      professional_summary: String(formData.get("professional_summary") ?? "") || null,
      target_titles: targetTitles,
      years_experience,
      digest_enabled: formData.get("digest_enabled") === "on",
      digest_frequency: String(formData.get("digest_frequency") ?? "daily"),
    })
    .eq("id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/settings");
  return { success: "Settings saved." };
}
