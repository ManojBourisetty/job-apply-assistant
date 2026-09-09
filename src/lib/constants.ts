export const SPONSORSHIP_STATUSES = [
  "confirmed",
  "likely",
  "unknown",
  "unlikely",
  "not_eligible",
] as const;
export type SponsorshipStatus = (typeof SPONSORSHIP_STATUSES)[number];

export const WORK_ARRANGEMENTS = ["remote", "hybrid", "onsite"] as const;
export type WorkArrangement = (typeof WORK_ARRANGEMENTS)[number];

export const EMPLOYMENT_TYPES = [
  "full_time",
  "contract",
  "contract_to_hire",
  "part_time",
  "internship",
] as const;
export type EmploymentType = (typeof EMPLOYMENT_TYPES)[number];

export const JOB_SOURCES = [
  "manual",
  "company_careers",
  "greenhouse",
  "lever",
  "ashby",
  "workday",
  "other",
] as const;
export type JobSource = (typeof JOB_SOURCES)[number];

export const APPLICATION_STATUSES = [
  "discovered",
  "saved",
  "reviewing",
  "resume_tailored",
  "ready_to_apply",
  "applied",
  "recruiter_contacted",
  "recruiter_screen",
  "technical_interview",
  "hiring_manager_interview",
  "final_interview",
  "offer",
  "rejected",
  "withdrawn",
  "closed",
] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export const APPLICATION_STATUS_GROUPS: { id: ApplicationStatus; title: string }[] = [
  { id: "discovered", title: "Discovered" },
  { id: "saved", title: "Saved" },
  { id: "reviewing", title: "Reviewing" },
  { id: "resume_tailored", title: "Resume Tailored" },
  { id: "ready_to_apply", title: "Ready to Apply" },
  { id: "applied", title: "Applied" },
  { id: "recruiter_contacted", title: "Recruiter Contacted" },
  { id: "recruiter_screen", title: "Recruiter Screen" },
  { id: "technical_interview", title: "Technical Interview" },
  { id: "hiring_manager_interview", title: "Hiring Manager Interview" },
  { id: "final_interview", title: "Final Interview" },
  { id: "offer", title: "Offer" },
  { id: "rejected", title: "Rejected" },
  { id: "withdrawn", title: "Withdrawn" },
  { id: "closed", title: "Closed" },
];

export const COMPANY_RELATIONSHIPS = [
  "none",
  "target",
  "preferred",
  "avoid",
  "sponsorship_priority",
  "follow",
] as const;
export type CompanyRelationship = (typeof COMPANY_RELATIONSHIPS)[number];

export const RECRUITER_STATUSES = [
  "contacted",
  "responded",
  "screening",
  "interviewing",
  "closed",
] as const;
export type RecruiterStatus = (typeof RECRUITER_STATUSES)[number];

export const TECHNOLOGY_SUGGESTIONS = [
  "AWS",
  "GCP",
  "Azure",
  "Kubernetes",
  "Docker",
  "Terraform",
  "CloudFormation",
  "Ansible",
  "GitLab",
  "GitHub Actions",
  "Jenkins",
  "Helm",
  "Vault",
  "Datadog",
  "Dynatrace",
  "Splunk",
  "Prometheus",
  "Grafana",
  "Python",
  "Bash",
  "Linux",
];
