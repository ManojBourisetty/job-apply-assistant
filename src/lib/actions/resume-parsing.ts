"use server";

import { z } from "zod";

import { generateText, isAiConfigured } from "@/lib/ai";
import { RESUME_PARSING_SYSTEM_PROMPT } from "@/lib/ai/prompts";
import { newId, type ResumeContent } from "@/lib/resume-types";
import { calculateYearsExperience } from "@/lib/experience-duration";

const MAX_RESUME_FILE_BYTES = 8 * 1024 * 1024;

export async function extractResumeFileText(
  formData: FormData
): Promise<{ text: string } | { error: string }> {
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { error: "No file received." };
  }
  if (file.size === 0) {
    return { error: "That file is empty." };
  }
  if (file.size > MAX_RESUME_FILE_BYTES) {
    return { error: "File is too large (max 8MB)." };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const name = file.name.toLowerCase();

  try {
    if (name.endsWith(".pdf") || file.type === "application/pdf") {
      const { PDFParse } = await import("pdf-parse");
      const parser = new PDFParse({ data: buffer });
      try {
        const result = await parser.getText();
        // pdf-parse appends a "-- N of M --" page-separator marker per page;
        // strip it so it never leaks into the extracted resume text.
        const text = result.text.replace(/^--\s*\d+\s*of\s*\d+\s*--$/gm, "").trim();
        if (!text) {
          return { error: "Couldn't find any text in that PDF — is it a scanned image?" };
        }
        return { text };
      } finally {
        await parser.destroy();
      }
    }

    if (
      name.endsWith(".docx") ||
      file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      const mammoth = await import("mammoth");
      const result = await mammoth.extractRawText({ buffer });
      const text = result.value.trim();
      if (!text) {
        return { error: "Couldn't find any text in that document." };
      }
      return { text };
    }

    if (name.endsWith(".doc")) {
      return {
        error: "Legacy .doc files aren't supported — please save as .docx or .pdf and try again.",
      };
    }

    return { error: "Unsupported file type — upload a .pdf or .docx file." };
  } catch {
    return { error: "Couldn't read that file. Try a different PDF or DOCX export." };
  }
}

function extractJson(text: string): unknown {
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();
  return JSON.parse(cleaned);
}

const parsedResumeSchema = z.object({
  contact: z.object({
    full_name: z.string().default(""),
    email: z.string().default(""),
    phone: z.string().default(""),
    location: z.string().default(""),
    linkedin_url: z.string().default(""),
    github_url: z.string().default(""),
    portfolio_url: z.string().default(""),
  }),
  professional_summary: z.string().default(""),
  current_title: z.string().default(""),
  years_experience: z.number().nullable().default(null),
  skills: z
    .array(z.object({ category: z.string(), items: z.array(z.string()) }))
    .default([]),
  experience: z
    .array(
      z.object({
        company: z.string().default(""),
        client: z.string().default(""),
        title: z.string().default(""),
        start_date: z.string().default(""),
        end_date: z.string().default(""),
        is_current: z.boolean().default(false),
        location: z.string().default(""),
        employment_type: z.string().default(""),
        technologies: z.array(z.string()).default([]),
        bullets: z.array(z.string()).default([]),
      })
    )
    .default([]),
  education: z
    .array(
      z.object({
        degree: z.string().default(""),
        university: z.string().default(""),
        start_date: z.string().default(""),
        end_date: z.string().default(""),
        notes: z.string().default(""),
      })
    )
    .default([]),
  certifications: z
    .array(
      z.object({
        name: z.string().default(""),
        issuer: z.string().default(""),
        date: z.string().default(""),
        expiration: z.string().default(""),
      })
    )
    .default([]),
});

export async function parseResumeText(
  rawText: string
): Promise<{ content: ResumeContent } | { error: string }> {
  if (!isAiConfigured()) {
    return { error: "No AI provider is configured. Add ANTHROPIC_API_KEY or OPENAI_API_KEY." };
  }
  if (!rawText.trim()) {
    return { error: "Paste your resume text first." };
  }

  let aiText = "";
  try {
    const result = await generateText({
      system: RESUME_PARSING_SYSTEM_PROMPT,
      messages: [{ role: "user", content: rawText }],
      maxTokens: 4096,
    });
    aiText = result.text;
  } catch (err) {
    return { error: err instanceof Error ? err.message : "AI request failed." };
  }

  let parsed;
  try {
    parsed = parsedResumeSchema.parse(extractJson(aiText));
  } catch {
    return { error: "The AI response wasn't in the expected format. Try again." };
  }

  const content: ResumeContent = {
    contact: parsed.contact,
    professional_summary: parsed.professional_summary,
    current_title: parsed.current_title,
    target_titles: [],
    years_experience: parsed.years_experience,
    skills: parsed.skills,
    experience: parsed.experience.map((exp) => ({
      id: newId(),
      company: exp.company,
      client: exp.client,
      title: exp.title,
      start_date: exp.start_date,
      end_date: exp.end_date,
      is_current: exp.is_current,
      location: exp.location,
      employment_type: exp.employment_type,
      technologies: exp.technologies,
      bullets: exp.bullets.map((text) => ({ text, status: "ai_extracted" as const })),
    })),
    education: parsed.education.map((edu) => ({ id: newId(), ...edu })),
    certifications: parsed.certifications.map((cert) => ({ id: newId(), ...cert })),
  };

  // The AI is deliberately forbidden from computing years of experience
  // (it's a derived number, not something "extracted" from text), so it's
  // almost always null. Compute it ourselves from the experience dates it
  // did extract — deterministic date math, not an AI guess.
  if (content.years_experience === null) {
    content.years_experience = calculateYearsExperience(content.experience);
  }

  return { content };
}
