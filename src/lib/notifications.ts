import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "./supabase/database.types";

type NotificationType =
  | "new_high_match"
  | "sponsorship_confirmed"
  | "followup_due"
  | "interview_approaching"
  | "job_changed"
  | "job_closed"
  | "recruiter_response"
  | "daily_digest"
  | "sync_error";

export async function createNotification(
  supabase: SupabaseClient<Database>,
  userId: string,
  type: NotificationType,
  title: string,
  body?: string,
  link?: string
) {
  await supabase.from("notifications").insert({
    user_id: userId,
    type,
    title,
    body: body ?? null,
    link: link ?? null,
  });
}
