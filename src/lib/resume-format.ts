import type { ResumeContent } from "./resume-types";

export function resumeContentToText(content: ResumeContent): string {
  const lines: string[] = [];
  const c = content.contact;

  lines.push(c.full_name || "Untitled");
  lines.push(
    [c.location, c.email, c.phone, c.linkedin_url, c.github_url, c.portfolio_url]
      .filter(Boolean)
      .join(" | ")
  );
  lines.push("");

  if (content.professional_summary) {
    lines.push("PROFESSIONAL SUMMARY");
    lines.push(content.professional_summary);
    lines.push("");
  }

  if (content.skills.length > 0) {
    lines.push("SKILLS");
    content.skills.forEach((group) => {
      lines.push(`${group.category}: ${group.items.join(", ")}`);
    });
    lines.push("");
  }

  if (content.experience.length > 0) {
    lines.push("EXPERIENCE");
    content.experience.forEach((exp) => {
      const header = [exp.title, exp.company].filter(Boolean).join(" — ");
      const dates = `${exp.start_date || "?"} – ${exp.is_current ? "Present" : exp.end_date || "?"}`;
      lines.push(`${header} (${dates})`);
      if (exp.location) lines.push(exp.location);
      exp.bullets.forEach((b) => lines.push(`  • ${b.text}`));
      if (exp.technologies.length > 0) lines.push(`  Technologies: ${exp.technologies.join(", ")}`);
      lines.push("");
    });
  }

  if (content.education.length > 0) {
    lines.push("EDUCATION");
    content.education.forEach((edu) => {
      lines.push(`${edu.degree} — ${edu.university} (${edu.start_date} – ${edu.end_date})`);
      if (edu.notes) lines.push(edu.notes);
    });
    lines.push("");
  }

  if (content.certifications.length > 0) {
    lines.push("CERTIFICATIONS");
    content.certifications.forEach((cert) => {
      lines.push(`${cert.name} — ${cert.issuer} (${cert.date})`);
    });
  }

  return lines.join("\n");
}
