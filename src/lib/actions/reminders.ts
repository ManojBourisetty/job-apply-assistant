"use server";

import { createClient } from "@/lib/supabase/server";
import { createNotification } from "@/lib/notifications";

const DEDUPE_WINDOW_HOURS = 20;

async function alreadyNotified(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  type: string,
  link: string
) {
  const since = new Date(Date.now() - DEDUPE_WINDOW_HOURS * 3600000).toISOString();
  const { data } = await supabase
    .from("notifications")
    .select("id")
    .eq("user_id", userId)
    .eq("type", type)
    .eq("link", link)
    .gte("created_at", since)
    .limit(1);
  return (data?.length ?? 0) > 0;
}

// Best-effort, idempotent reminder generation. Runs on dashboard load rather
// than a strict schedule — see supabase/functions/daily-discovery for the
// version that runs unattended via pg_cron.
export async function refreshReminderNotifications() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const followupWindow = new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10);
  const { data: dueFollowups } = await supabase
    .from("followups")
    .select("id, due_date, application_id")
    .eq("user_id", user.id)
    .eq("completed", false)
    .lte("due_date", followupWindow);

  for (const f of dueFollowups ?? []) {
    const link = `/applications/${f.application_id}`;
    if (await alreadyNotified(supabase, user.id, "followup_due", link)) continue;
    await createNotification(
      supabase,
      user.id,
      "followup_due",
      "Follow-up due",
      `Due ${f.due_date}`,
      link
    );
  }

  const now = new Date().toISOString();
  const interviewWindow = new Date(Date.now() + 48 * 3600000).toISOString();
  const { data: upcoming } = await supabase
    .from("interviews")
    .select("id, scheduled_at, application_id, stage")
    .eq("user_id", user.id)
    .eq("result", "pending")
    .gte("scheduled_at", now)
    .lte("scheduled_at", interviewWindow);

  for (const i of upcoming ?? []) {
    const link = `/applications/${i.application_id}`;
    if (await alreadyNotified(supabase, user.id, "interview_approaching", link)) continue;
    await createNotification(
      supabase,
      user.id,
      "interview_approaching",
      "Interview approaching",
      `${i.stage.replace(/_/g, " ")} scheduled soon`,
      link
    );
  }
}
