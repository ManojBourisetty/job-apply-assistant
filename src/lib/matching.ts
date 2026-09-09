// A transparent, deterministic (non-AI) job-matching engine. Every score
// component is computed from literal comparisons between the job's stored
// fields and the candidate's master resume / active search profile — never
// inferred or fabricated. This intentionally does NOT call an LLM: the goal
// is a scoring system the user can fully audit, matching the spec's
// requirement that match scores be "transparent."
import type { ResumeContent } from "./resume-types";
import type { Tables } from "./supabase/database.types";

const SENIORITY_LADDER = [
  "intern",
  "junior",
  "associate",
  "mid",
  "senior",
  "staff",
  "principal",
  "lead",
  "director",
  "vp",
  "head",
];

export type MatchBreakdown = {
  technical: number;
  experience: number;
  seniority: number;
  location: number;
  sponsorship: number;
  compensation: number;
  preferences: number;
  total: number;
  matched: string[];
  gaps: string[];
};

export const MATCH_WEIGHTS = {
  technical: 30,
  experience: 20,
  seniority: 15,
  location: 10,
  sponsorship: 15,
  compensation: 5,
  preferences: 5,
} as const;

type JobLike = Pick<
  Tables<"jobs">,
  | "technologies"
  | "min_years_experience"
  | "title"
  | "work_arrangement"
  | "sponsorship_status"
  | "salary_min"
  | "salary_max"
  | "description"
  | "location"
>;

type SearchProfileLike = Pick<
  Tables<"job_search_profiles">,
  "remote_preference" | "sponsorship_requirement" | "min_salary" | "max_salary" | "keywords" | "technologies"
> | null;

function seniorityLevel(text: string): number | null {
  const lower = text.toLowerCase();
  let best: number | null = null;
  SENIORITY_LADDER.forEach((word, idx) => {
    if (new RegExp(`\\b${word}\\b`).test(lower)) {
      best = best === null ? idx : Math.max(best, idx);
    }
  });
  return best;
}

function flattenResumeTechnologies(resume: ResumeContent): Set<string> {
  const set = new Set<string>();
  resume.skills.forEach((g) => g.items.forEach((i) => set.add(i.toLowerCase())));
  resume.experience.forEach((e) => e.technologies.forEach((t) => set.add(t.toLowerCase())));
  return set;
}

function scoreTechnical(job: JobLike, resume: ResumeContent, matched: string[], gaps: string[]) {
  const max = MATCH_WEIGHTS.technical;
  const jobTechs = job.technologies ?? [];
  if (jobTechs.length === 0) return max;

  const resumeTechs = flattenResumeTechnologies(resume);
  const hits = jobTechs.filter((t) => resumeTechs.has(t.toLowerCase()));
  const misses = jobTechs.filter((t) => !resumeTechs.has(t.toLowerCase()));

  hits.slice(0, 6).forEach((t) => matched.push(`${t} explicitly requested and present in your resume`));
  misses.slice(0, 6).forEach((t) => gaps.push(`Job requests ${t}; no evidence found in your current resume`));

  return Math.round((hits.length / jobTechs.length) * max);
}

function scoreExperience(job: JobLike, resume: ResumeContent, matched: string[], gaps: string[]) {
  const max = MATCH_WEIGHTS.experience;
  const required = job.min_years_experience;
  if (required == null) return max;

  const have = resume.years_experience;
  if (have == null) {
    gaps.push(`Job requests ${required}+ years of experience; your resume doesn't specify years of experience`);
    return Math.round(max * 0.5);
  }
  if (have >= required) {
    matched.push(`${required}+ years relevant experience requested; your resume shows ${have}`);
    return max;
  }
  gaps.push(`Job requests ${required}+ years of experience; your resume shows ${have}`);
  return Math.max(0, Math.round(max * (have / required)));
}

function scoreSeniority(job: JobLike, resume: ResumeContent, matched: string[], gaps: string[]) {
  const max = MATCH_WEIGHTS.seniority;
  const jobLevel = seniorityLevel(job.title ?? "");
  if (jobLevel === null) return max;

  const candidateTitles = [resume.current_title, ...resume.target_titles].filter(Boolean).join(" ");
  const resumeLevel = seniorityLevel(candidateTitles);
  if (resumeLevel === null) {
    gaps.push("Couldn't determine your seniority level from your current/target titles — add one to improve this score");
    return Math.round(max * 0.5);
  }

  const diff = jobLevel - resumeLevel;
  if (diff <= 0) {
    matched.push(`Seniority level (${SENIORITY_LADDER[jobLevel]}) matches or is below your current level`);
    return max;
  }
  if (diff === 1) {
    gaps.push(`Job is one seniority level above your current/target title (${SENIORITY_LADDER[jobLevel]})`);
    return Math.round(max * 0.65);
  }
  gaps.push(`Job seniority (${SENIORITY_LADDER[jobLevel]}) is notably above your current/target title`);
  return Math.round(max * 0.25);
}

function scoreLocation(job: JobLike, profile: SearchProfileLike, matched: string[], gaps: string[]) {
  const max = MATCH_WEIGHTS.location;
  const preference = profile?.remote_preference ?? "any";
  if (preference === "any" || !job.work_arrangement) return max;

  if (job.work_arrangement === preference) {
    matched.push(`Work arrangement (${job.work_arrangement}) matches your preference`);
    return max;
  }
  if (preference === "remote" || job.work_arrangement === "remote") {
    gaps.push(`Job is ${job.work_arrangement}; you prefer ${preference}`);
    return Math.round(max * 0.4);
  }
  gaps.push(`Job is ${job.work_arrangement}; you prefer ${preference}`);
  return Math.round(max * 0.6);
}

function scoreSponsorship(job: JobLike, profile: SearchProfileLike, matched: string[], gaps: string[]) {
  const max = MATCH_WEIGHTS.sponsorship;
  const requirement = profile?.sponsorship_requirement ?? "not_required";
  const status = job.sponsorship_status;

  if (requirement === "not_required") return max;

  if (requirement === "required") {
    if (status === "confirmed") {
      matched.push("Sponsorship confirmed for this role");
      return max;
    }
    if (status === "likely") {
      matched.push("Sponsorship likely supported based on available evidence");
      return Math.round(max * 0.65);
    }
    gaps.push(`You require sponsorship; this job's sponsorship status is "${status}"`);
    return 0;
  }

  // preferred
  if (status === "confirmed" || status === "likely") return max;
  if (status === "unknown") return Math.round(max * 0.65);
  gaps.push(`You prefer sponsorship support; this job's sponsorship status is "${status}"`);
  return Math.round(max * 0.3);
}

function scoreCompensation(job: JobLike, profile: SearchProfileLike, matched: string[]) {
  const max = MATCH_WEIGHTS.compensation;
  if (!profile?.min_salary && !profile?.max_salary) return max;
  if (!job.salary_min && !job.salary_max) return max;

  const jobMin = job.salary_min ?? job.salary_max ?? 0;
  const jobMax = job.salary_max ?? job.salary_min ?? Infinity;
  const wantMin = profile.min_salary ?? 0;
  const wantMax = profile.max_salary ?? Infinity;

  const overlaps = jobMax >= wantMin && jobMin <= wantMax;
  if (overlaps) {
    matched.push("Salary range overlaps your target range");
    return max;
  }
  return Math.round(max * 0.3);
}

function scorePreferences(job: JobLike, profile: SearchProfileLike, matched: string[]) {
  const max = MATCH_WEIGHTS.preferences;
  const keywords = [...(profile?.keywords ?? []), ...(profile?.technologies ?? [])];
  if (keywords.length === 0) return max;

  const haystack = `${job.title} ${(job.technologies ?? []).join(" ")} ${job.description ?? ""}`.toLowerCase();
  const hits = keywords.filter((k) => haystack.includes(k.toLowerCase()));
  if (hits.length > 0) {
    matched.push(`Matches ${hits.length} of your saved preference keyword(s)`);
  }
  return Math.round((hits.length / keywords.length) * max);
}

type HardFilterJobLike = Pick<
  Tables<"jobs">,
  "sponsorship_status" | "salary_min" | "salary_max" | "min_years_experience" | "employment_type"
>;

type HardFilterProfileLike = Pick<
  Tables<"job_search_profiles">,
  "sponsorship_requirement" | "min_salary" | "max_salary" | "min_years_experience" | "max_years_experience" | "employment_types"
>;

export function passesHardFilters(job: HardFilterJobLike, profile: HardFilterProfileLike): boolean {
  if (profile.sponsorship_requirement === "required") {
    if (!["confirmed", "likely"].includes(job.sponsorship_status)) return false;
  }

  if (profile.min_salary != null && job.salary_max != null && job.salary_max < profile.min_salary) {
    return false;
  }
  if (profile.max_salary != null && job.salary_min != null && job.salary_min > profile.max_salary) {
    return false;
  }

  if (job.min_years_experience != null) {
    if (profile.min_years_experience != null && job.min_years_experience < profile.min_years_experience) {
      return false;
    }
    if (profile.max_years_experience != null && job.min_years_experience > profile.max_years_experience) {
      return false;
    }
  }

  if (profile.employment_types.length > 0 && !profile.employment_types.includes(job.employment_type)) {
    return false;
  }

  return true;
}

export function computeMatch(
  job: JobLike,
  resume: ResumeContent,
  profile: SearchProfileLike = null
): MatchBreakdown {
  const matched: string[] = [];
  const gaps: string[] = [];

  const technical = scoreTechnical(job, resume, matched, gaps);
  const experience = scoreExperience(job, resume, matched, gaps);
  const seniority = scoreSeniority(job, resume, matched, gaps);
  const location = scoreLocation(job, profile, matched, gaps);
  const sponsorship = scoreSponsorship(job, profile, matched, gaps);
  const compensation = scoreCompensation(job, profile, matched);
  const preferences = scorePreferences(job, profile, matched);

  const total = technical + experience + seniority + location + sponsorship + compensation + preferences;

  return { technical, experience, seniority, location, sponsorship, compensation, preferences, total, matched, gaps };
}
