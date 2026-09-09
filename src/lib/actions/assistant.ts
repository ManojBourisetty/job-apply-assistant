"use server";

import { createClient } from "@/lib/supabase/server";
import { generateText, isAiConfigured } from "@/lib/ai";
import { ASSISTANT_SYSTEM_PROMPT } from "@/lib/ai/prompts";
import type { AiMessage } from "@/lib/ai/types";

export async function askAssistant(
  question: string,
  history: AiMessage[]
): Promise<{ answer: string } | { error: string }> {
  if (!isAiConfigured()) {
    return { error: "No AI provider is configured. Add ANTHROPIC_API_KEY or OPENAI_API_KEY." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const [
    { data: applications },
    { data: recentJobs },
    { data: followupsDue },
    { data: recruiters },
  ] = await Promise.all([
    supabase
      .from("applications")
      .select("status, date_applied, jobs(title, company_name, sponsorship_status)")
      .order("updated_at", { ascending: false })
      .limit(50),
    supabase
      .from("jobs")
      .select("title, company_name, sponsorship_status, location, technologies, salary_min, salary_max")
      .neq("status", "closed")
      .order("date_discovered", { ascending: false })
      .limit(30),
    supabase
      .from("followups")
      .select("due_date, application_id")
      .eq("completed", false)
      .order("due_date", { ascending: true })
      .limit(10),
    supabase
      .from("recruiters")
      .select("name, company_name, status")
      .order("updated_at", { ascending: false })
      .limit(20),
  ]);

  const statusCounts: Record<string, number> = {};
  (applications ?? []).forEach((a) => {
    statusCounts[a.status] = (statusCounts[a.status] ?? 0) + 1;
  });

  const context = {
    total_applications: applications?.length ?? 0,
    applications_by_status: statusCounts,
    recent_jobs: recentJobs ?? [],
    followups_due: followupsDue ?? [],
    recruiters: recruiters ?? [],
    recent_applications: (applications ?? []).slice(0, 15),
  };

  const messages: AiMessage[] = [
    ...history.slice(-6),
    {
      role: "user",
      content: `Data:\n${JSON.stringify(context)}\n\nQuestion: ${question}`,
    },
  ];

  let answer = "";
  let model = "";
  try {
    const result = await generateText({
      system: ASSISTANT_SYSTEM_PROMPT,
      messages,
      maxTokens: 1000,
    });
    answer = result.text.trim();
    model = result.model;
  } catch (err) {
    return { error: err instanceof Error ? err.message : "AI request failed." };
  }

  await supabase.from("ai_generations").insert({
    user_id: user.id,
    type: "assistant_reply",
    model,
    input_summary: question.slice(0, 200),
    output: answer,
  });

  return { answer };
}
