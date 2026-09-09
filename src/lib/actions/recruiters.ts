"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { RECRUITER_STATUSES } from "@/lib/constants";

export type ActionState = { error?: string; success?: string };

const optionalString = z
  .string()
  .optional()
  .transform((v) => (v && v.trim() !== "" ? v.trim() : undefined));

const schema = z.object({
  name: z.string().min(1, "Name is required."),
  company_name: optionalString,
  email: optionalString,
  linkedin_url: optionalString,
  phone: optionalString,
  status: z.enum(RECRUITER_STATUSES),
  first_contact_date: optionalString,
  last_contact_date: optionalString,
  notes: optionalString,
});

export async function createRecruiter(
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

  const { error } = await supabase.from("recruiters").insert({ ...parsed.data, user_id: user.id });
  if (error) return { error: error.message };

  revalidatePath("/recruiters");
  redirect("/recruiters");
}

export async function updateRecruiter(
  recruiterId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = schema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const supabase = await createClient();
  const { error } = await supabase.from("recruiters").update(parsed.data).eq("id", recruiterId);
  if (error) return { error: error.message };

  revalidatePath("/recruiters");
  redirect("/recruiters");
}

export async function deleteRecruiter(recruiterId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("recruiters").delete().eq("id", recruiterId);
  if (error) throw new Error(error.message);
  revalidatePath("/recruiters");
}
