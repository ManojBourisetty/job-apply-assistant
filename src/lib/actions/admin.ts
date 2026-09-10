"use server";

import { revalidatePath } from "next/cache";

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
