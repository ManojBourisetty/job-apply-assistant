"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { COMPANY_RELATIONSHIPS, SPONSORSHIP_STATUSES } from "@/lib/constants";

export type ActionState = { error?: string; success?: string };

const optionalString = z
  .string()
  .optional()
  .transform((v) => (v && v.trim() !== "" ? v.trim() : undefined));

const schema = z.object({
  name: z.string().min(1, "Company name is required."),
  website: optionalString,
  careers_url: optionalString,
  industry: optionalString,
  company_size: optionalString,
  locations: optionalString,
  relationship: z.enum(COMPANY_RELATIONSHIPS),
  sponsorship_status: z.enum(SPONSORSHIP_STATUSES),
  sponsorship_evidence: optionalString,
  sponsorship_source: optionalString,
  notes: optionalString,
});

function parseLocations(input?: string) {
  if (!input) return [];
  return input.split(",").map((s) => s.trim()).filter(Boolean);
}

export async function createCompany(
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

  const { locations, ...rest } = parsed.data;

  const { error } = await supabase.from("companies").insert({
    ...rest,
    locations: parseLocations(locations),
    user_id: user.id,
  });

  if (error) {
    if (error.code === "23505") return { error: "You already track a company with this name." };
    return { error: error.message };
  }

  revalidatePath("/companies");
  redirect("/companies");
}

export async function updateCompany(
  companyId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = schema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const supabase = await createClient();
  const { locations, ...rest } = parsed.data;

  const { error } = await supabase
    .from("companies")
    .update({ ...rest, locations: parseLocations(locations) })
    .eq("id", companyId);

  if (error) return { error: error.message };

  revalidatePath("/companies");
  revalidatePath("/sponsorship");
  redirect("/companies");
}

export async function deleteCompany(companyId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("companies").delete().eq("id", companyId);
  if (error) throw new Error(error.message);
  revalidatePath("/companies");
  revalidatePath("/sponsorship");
}
