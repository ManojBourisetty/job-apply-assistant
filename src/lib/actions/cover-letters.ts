"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { generateText, isAiConfigured } from "@/lib/ai";
import { COVER_LETTER_SYSTEM_PROMPT } from "@/lib/ai/prompts";
import type { ResumeContent } from "@/lib/resume-types";

type Tone = "formal" | "conversational" | "short" | "detailed";

export async function generateCoverLetter(
  jobId: string,
  tone: Tone
): Promise<{ id: string; content: string } | { error: string }> {
  if (!isAiConfigured()) {
    return { error: "No AI provider is configured. Add ANTHROPIC_API_KEY or OPENAI_API_KEY." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const [{ data: job }, { data: tailoredResume }, { data: masterResume }] = await Promise.all([
    supabase.from("jobs").select("*").eq("id", jobId).maybeSingle(),
    supabase
      .from("resumes")
      .select("current_version_id")
      .eq("user_id", user.id)
      .eq("source_job_id", jobId)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("resumes")
      .select("current_version_id")
      .eq("user_id", user.id)
      .eq("is_master", true)
      .eq("status", "active")
      .maybeSingle(),
  ]);

  if (!job) return { error: "Job not found." };

  const versionId = tailoredResume?.current_version_id ?? masterResume?.current_version_id;
  if (!versionId) return { error: "Create a master resume first." };

  const { data: version } = await supabase
    .from("resume_versions")
    .select("content")
    .eq("id", versionId)
    .maybeSingle();
  const resumeContent = version?.content as ResumeContent | undefined;
  if (!resumeContent) return { error: "Resume has no content yet." };

  const userPrompt = JSON.stringify({
    tone,
    job: {
      title: job.title,
      company: job.company_name,
      description: job.description,
      requirements: job.requirements,
    },
    resume: {
      full_name: resumeContent.contact.full_name,
      professional_summary: resumeContent.professional_summary,
      current_title: resumeContent.current_title,
      years_experience: resumeContent.years_experience,
      skills: resumeContent.skills,
      experience: resumeContent.experience.map((e) => ({
        company: e.company,
        title: e.title,
        bullets: e.bullets.map((b) => b.text),
      })),
    },
  });

  let text = "";
  let model = "";
  try {
    const result = await generateText({
      system: COVER_LETTER_SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
      maxTokens: 1500,
    });
    text = result.text.trim();
    model = result.model;
  } catch (err) {
    return { error: err instanceof Error ? err.message : "AI request failed." };
  }

  const { data: letter, error } = await supabase
    .from("cover_letters")
    .insert({
      user_id: user.id,
      job_id: jobId,
      resume_version_id: versionId,
      tone,
      content: text,
      model,
    })
    .select("id, content")
    .single();

  if (error || !letter) return { error: error?.message ?? "Couldn't save cover letter." };

  await supabase.from("ai_generations").insert({
    user_id: user.id,
    type: "cover_letter",
    job_id: jobId,
    resume_version_id: versionId,
    model,
    input_summary: `${tone} cover letter for ${job.title} at ${job.company_name}`,
    output: text,
  });

  revalidatePath(`/jobs/${jobId}/cover-letter`);
  return { id: letter.id, content: letter.content };
}

export async function updateCoverLetterContent(letterId: string, content: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("cover_letters").update({ content }).eq("id", letterId);
  if (error) throw new Error(error.message);
}

export async function approveCoverLetter(letterId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("cover_letters").update({ approved: true }).eq("id", letterId);
  if (error) throw new Error(error.message);
}
