"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { generateText, isAiConfigured } from "@/lib/ai";
import { RESUME_TAILORING_SYSTEM_PROMPT } from "@/lib/ai/prompts";
import type { ResumeContent } from "@/lib/resume-types";
import type { Json } from "@/lib/supabase/database.types";

export type ActionState = { error?: string; success?: string };

const suggestionSchema = z.object({
  summary_suggestion: z.string().nullable().optional(),
  bullet_suggestions: z.array(
    z.object({
      experience_index: z.number().int().min(0),
      bullet_index: z.number().int().min(0),
      suggested: z.string().min(1),
      reasoning: z.string().min(1),
    })
  ),
});

function extractJson(text: string): unknown {
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();
  return JSON.parse(cleaned);
}

function buildResumeSummaryForPrompt(content: ResumeContent) {
  return {
    professional_summary: content.professional_summary,
    current_title: content.current_title,
    experience: content.experience.map((exp) => ({
      company: exp.company,
      title: exp.title,
      bullets: exp.bullets.map((b, i) => ({ bullet_index: i, text: b.text })),
    })),
  };
}

export async function startResumeTailoring(
  jobId: string,
  mode: "conservative" | "balanced" | "aggressive"
): Promise<{ resumeId: string } | { error: string }> {
  if (!isAiConfigured()) {
    return { error: "No AI provider is configured. Add ANTHROPIC_API_KEY or OPENAI_API_KEY." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const [{ data: job }, { data: masterResume }] = await Promise.all([
    supabase.from("jobs").select("*").eq("id", jobId).maybeSingle(),
    supabase
      .from("resumes")
      .select("current_version_id")
      .eq("user_id", user.id)
      .eq("is_master", true)
      .eq("status", "active")
      .maybeSingle(),
  ]);

  if (!job) return { error: "Job not found." };
  if (!masterResume?.current_version_id) return { error: "Create a master resume first." };

  const { data: masterVersion } = await supabase
    .from("resume_versions")
    .select("content")
    .eq("id", masterResume.current_version_id)
    .maybeSingle();

  const masterContent = masterVersion?.content as ResumeContent | undefined;
  if (!masterContent) return { error: "Master resume has no content yet." };

  // Create the tailored resume + a working version identical to master,
  // then layer AI-suggested edits on top as pending resume_facts.
  const { data: newResume, error: resumeError } = await supabase
    .from("resumes")
    .insert({
      user_id: user.id,
      title: `Tailored — ${job.title} at ${job.company_name}`,
      is_master: false,
      source_job_id: jobId,
    })
    .select("id")
    .single();
  if (resumeError || !newResume) return { error: resumeError?.message ?? "Couldn't create resume." };

  const { data: version, error: versionError } = await supabase
    .from("resume_versions")
    .insert({
      resume_id: newResume.id,
      user_id: user.id,
      version_number: 1,
      content: masterContent as unknown as Json,
      change_summary: `Draft copy of master resume, tailoring for ${job.title} at ${job.company_name}`,
      created_by: "user",
    })
    .select("id")
    .single();
  if (versionError || !version) return { error: versionError?.message ?? "Couldn't create resume version." };

  await supabase.from("resumes").update({ current_version_id: version.id }).eq("id", newResume.id);

  const userPrompt = JSON.stringify({
    mode,
    job: {
      title: job.title,
      company: job.company_name,
      description: job.description,
      requirements: job.requirements,
      preferred_qualifications: job.preferred_qualifications,
      technologies: job.technologies,
    },
    resume: buildResumeSummaryForPrompt(masterContent),
  });

  let aiText = "";
  let modelUsed = "";
  try {
    const result = await generateText({
      system: RESUME_TAILORING_SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
      maxTokens: 4096,
    });
    aiText = result.text;
    modelUsed = result.model;
  } catch (err) {
    return { error: err instanceof Error ? err.message : "AI request failed." };
  }

  let parsed;
  try {
    parsed = suggestionSchema.parse(extractJson(aiText));
  } catch {
    return { error: "The AI response wasn't in the expected format. Try again." };
  }

  const { data: generation } = await supabase
    .from("ai_generations")
    .insert({
      user_id: user.id,
      type: "resume_tailoring",
      job_id: jobId,
      resume_version_id: version.id,
      model: modelUsed,
      input_summary: `${mode} tailoring for ${job.title} at ${job.company_name}`,
      output: aiText,
    })
    .select("id")
    .single();

  const facts = parsed.bullet_suggestions
    .filter((s) => masterContent.experience[s.experience_index]?.bullets[s.bullet_index])
    .map((s) => ({
      resume_version_id: version.id,
      user_id: user.id,
      section: `experience[${s.experience_index}].bullets[${s.bullet_index}]`,
      original_text: masterContent.experience[s.experience_index].bullets[s.bullet_index].text,
      suggested_text: s.suggested,
      reasoning: s.reasoning,
      status: "ai_suggested_pending" as const,
      ai_generation_id: generation?.id ?? null,
    }));

  if (parsed.summary_suggestion && parsed.summary_suggestion !== masterContent.professional_summary) {
    facts.push({
      resume_version_id: version.id,
      user_id: user.id,
      section: "professional_summary",
      original_text: masterContent.professional_summary,
      suggested_text: parsed.summary_suggestion,
      reasoning: "Aligns your summary with this job's language, using only your existing background.",
      status: "ai_suggested_pending" as const,
      ai_generation_id: generation?.id ?? null,
    });
  }

  if (facts.length > 0) {
    await supabase.from("resume_facts").insert(facts);
  }

  revalidatePath(`/resumes/${newResume.id}`);
  revalidatePath(`/resumes/${newResume.id}/tailor`);
  return { resumeId: newResume.id };
}

export async function approveResumeFact(factId: string) {
  const supabase = await createClient();
  const { data: fact } = await supabase.from("resume_facts").select("*").eq("id", factId).maybeSingle();
  if (!fact) throw new Error("Suggestion not found.");

  const { data: version } = await supabase
    .from("resume_versions")
    .select("content, resume_id")
    .eq("id", fact.resume_version_id)
    .maybeSingle();
  if (!version) throw new Error("Resume version not found.");

  const content = version.content as unknown as ResumeContent;

  if (fact.section === "professional_summary") {
    content.professional_summary = fact.suggested_text;
  } else {
    const match = fact.section.match(/experience\[(\d+)\]\.bullets\[(\d+)\]/);
    if (match) {
      const expIdx = Number(match[1]);
      const bulletIdx = Number(match[2]);
      const bullet = content.experience[expIdx]?.bullets[bulletIdx];
      if (bullet) {
        bullet.text = fact.suggested_text;
        bullet.status = "ai_reworded";
      }
    }
  }

  await supabase
    .from("resume_versions")
    .update({ content: content as unknown as Json })
    .eq("id", fact.resume_version_id);
  await supabase.from("resume_facts").update({ status: "ai_reworded" }).eq("id", factId);
  if (fact.ai_generation_id) {
    await supabase.from("ai_generations").update({ approved: true }).eq("id", fact.ai_generation_id);
  }

  revalidatePath(`/resumes/${version.resume_id}`);
  revalidatePath(`/resumes/${version.resume_id}/tailor`);
}

export async function rejectResumeFact(factId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("resume_facts").delete().eq("id", factId);
  if (error) throw new Error(error.message);
}

export async function approveAllResumeFacts(resumeVersionId: string) {
  const supabase = await createClient();
  const { data: facts } = await supabase
    .from("resume_facts")
    .select("id")
    .eq("resume_version_id", resumeVersionId)
    .eq("status", "ai_suggested_pending");

  for (const f of facts ?? []) {
    await approveResumeFact(f.id);
  }
}
