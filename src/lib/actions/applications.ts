"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { APPLICATION_STATUSES, type ApplicationStatus } from "@/lib/constants";
import type { TablesUpdate } from "@/lib/supabase/database.types";

export async function updateApplicationStatus(applicationId: string, status: ApplicationStatus) {
  if (!APPLICATION_STATUSES.includes(status)) throw new Error("Invalid status.");

  const supabase = await createClient();
  const update: TablesUpdate<"applications"> = { status };
  if (status === "applied") {
    const { data: existing } = await supabase
      .from("applications")
      .select("date_applied")
      .eq("id", applicationId)
      .maybeSingle();
    if (!existing?.date_applied) {
      update.date_applied = new Date().toISOString().slice(0, 10);
    }
  }

  const { error } = await supabase.from("applications").update(update).eq("id", applicationId);
  if (error) throw new Error(error.message);

  revalidatePath("/applications");
  revalidatePath(`/applications/${applicationId}`);
  revalidatePath("/dashboard");
}

export async function updateApplicationDetails(applicationId: string, formData: FormData) {
  const supabase = await createClient();

  const notes = formData.get("notes");
  const followUpDate = formData.get("follow_up_date");
  const dateApplied = formData.get("date_applied");
  const salaryDiscussed = formData.get("salary_discussed");
  const rejectionReason = formData.get("rejection_reason");
  const interviewFeedback = formData.get("interview_feedback");

  const { error } = await supabase
    .from("applications")
    .update({
      notes: typeof notes === "string" ? notes || null : undefined,
      follow_up_date: typeof followUpDate === "string" ? followUpDate || null : undefined,
      date_applied: typeof dateApplied === "string" ? dateApplied || null : undefined,
      salary_discussed: typeof salaryDiscussed === "string" ? salaryDiscussed || null : undefined,
      rejection_reason: typeof rejectionReason === "string" ? rejectionReason || null : undefined,
      interview_feedback:
        typeof interviewFeedback === "string" ? interviewFeedback || null : undefined,
    })
    .eq("id", applicationId);

  if (error) throw new Error(error.message);

  revalidatePath(`/applications/${applicationId}`);
  revalidatePath("/applications");
}

export async function updateApplicationChecklistItem(
  applicationId: string,
  key: string,
  value: boolean
) {
  const supabase = await createClient();
  const { data: app } = await supabase
    .from("applications")
    .select("checklist")
    .eq("id", applicationId)
    .maybeSingle();

  const checklist = { ...(app?.checklist as Record<string, boolean> | null), [key]: value };

  const { error } = await supabase
    .from("applications")
    .update({ checklist })
    .eq("id", applicationId);

  if (error) throw new Error(error.message);

  revalidatePath(`/applications/${applicationId}`);
}

export async function deleteApplication(applicationId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("applications").delete().eq("id", applicationId);
  if (error) throw new Error(error.message);

  revalidatePath("/applications");
  revalidatePath("/dashboard");
}
