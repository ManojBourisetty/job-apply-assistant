export type FactStatus = "verified" | "user_added" | "ai_reworded" | "ai_extracted";

export type ResumeContact = {
  full_name: string;
  email: string;
  phone: string;
  location: string;
  linkedin_url: string;
  github_url: string;
  portfolio_url: string;
};

export type ResumeSkillGroup = {
  category: string;
  items: string[];
};

export type ResumeExperience = {
  id: string;
  company: string;
  client: string;
  title: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  location: string;
  employment_type: string;
  technologies: string[];
  bullets: { text: string; status: FactStatus }[];
};

export type ResumeEducation = {
  id: string;
  degree: string;
  university: string;
  start_date: string;
  end_date: string;
  notes: string;
};

export type ResumeCertification = {
  id: string;
  name: string;
  issuer: string;
  date: string;
  expiration: string;
};

export type ResumeContent = {
  contact: ResumeContact;
  professional_summary: string;
  current_title: string;
  target_titles: string[];
  years_experience: number | null;
  skills: ResumeSkillGroup[];
  experience: ResumeExperience[];
  education: ResumeEducation[];
  certifications: ResumeCertification[];
};

export const SKILL_CATEGORIES = [
  "Cloud",
  "DevOps",
  "SRE",
  "Infrastructure",
  "Kubernetes",
  "CI/CD",
  "IaC",
  "Programming",
  "Monitoring",
  "Security",
  "Databases",
  "Networking",
  "Operating Systems",
  "Other",
];

export function emptyResumeContent(): ResumeContent {
  return {
    contact: {
      full_name: "",
      email: "",
      phone: "",
      location: "",
      linkedin_url: "",
      github_url: "",
      portfolio_url: "",
    },
    professional_summary: "",
    current_title: "",
    target_titles: [],
    years_experience: null,
    skills: [],
    experience: [],
    education: [],
    certifications: [],
  };
}

export function newId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
}
