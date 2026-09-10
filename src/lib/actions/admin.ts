"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

export type ActionState = { error?: string; success?: string };

export async function setUserAdminStatus(targetUserId: string, isAdmin: boolean) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated.");
  if (user.id === targetUserId) {
    throw new Error("You can't change your own admin status.");
  }

  // RLS enforces that only an existing admin can perform this update
  // (job_profiles_admin_update policy).
  const { error } = await supabase
    .from("job_profiles")
    .update({ is_admin: isAdmin })
    .eq("id", targetUserId);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${targetUserId}`);
}

export async function setUserBlockedStatus(
  targetUserId: string,
  blocked: boolean,
  reason?: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated.");
  if (user.id === targetUserId) {
    throw new Error("You can't block your own account.");
  }

  // The blocked user's own session is locked out at the RLS level
  // (restrictive "*_block_suspended" policies) the moment this flag flips —
  // this update itself only needs the job_profiles_admin_update policy.
  const { error } = await supabase
    .from("job_profiles")
    .update(
      blocked
        ? {
            is_blocked: true,
            blocked_at: new Date().toISOString(),
            blocked_reason: reason?.trim() || null,
            blocked_by: user.id,
          }
        : { is_blocked: false, blocked_at: null, blocked_reason: null, blocked_by: null }
    )
    .eq("id", targetUserId);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${targetUserId}`);
}

const optionalString = z
  .string()
  .optional()
  .transform((v) => (v && v.trim() !== "" ? v.trim() : null));

const adminEditProfileSchema = z.object({
  full_name: optionalString,
  username: z
    .string()
    .optional()
    .transform((v) => (v && v.trim() !== "" ? v.trim() : null))
    .refine((v) => v === null || /^[A-Za-z][A-Za-z0-9_]{2,19}$/.test(v), {
      message: "Username must be 3-20 characters, start with a letter, and use only letters, numbers, or underscores.",
    }),
  phone: optionalString,
  location: optionalString,
  linkedin_url: optionalString,
  github_url: optionalString,
  portfolio_url: optionalString,
  current_title: optionalString,
  professional_summary: optionalString,
  target_titles: optionalString,
  years_experience: optionalString,
});

export async function updateUserProfileAsAdmin(
  targetUserId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = adminEditProfileSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  if (parsed.data.username) {
    const { data: available } = await supabase.rpc("username_available", {
      p_username: parsed.data.username,
    });
    if (!available) {
      // username_available() only reports false for a username someone
      // else already holds, since we already know this one is the target's
      // current value in that case — check for the no-op before erroring.
      const { data: existing } = await supabase
        .from("job_profiles")
        .select("username")
        .eq("id", targetUserId)
        .maybeSingle();
      if (existing?.username?.toLowerCase() !== parsed.data.username.toLowerCase()) {
        return { error: "That username is already taken." };
      }
    }
  }

  const targetTitles = parsed.data.target_titles
    ? parsed.data.target_titles.split(",").map((t) => t.trim()).filter(Boolean)
    : [];

  const { error } = await supabase
    .from("job_profiles")
    .update({
      full_name: parsed.data.full_name,
      username: parsed.data.username,
      phone: parsed.data.phone,
      location: parsed.data.location,
      linkedin_url: parsed.data.linkedin_url,
      github_url: parsed.data.github_url,
      portfolio_url: parsed.data.portfolio_url,
      current_title: parsed.data.current_title,
      professional_summary: parsed.data.professional_summary,
      target_titles: targetTitles,
      years_experience: parsed.data.years_experience ? Number(parsed.data.years_experience) : null,
    })
    .eq("id", targetUserId);

  if (error) return { error: error.message };

  revalidatePath(`/admin/users/${targetUserId}`);
  return { success: "Profile updated." };
}
