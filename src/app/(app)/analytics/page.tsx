import { BarChart3 } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SkillsGapTab } from "@/components/analytics/skills-gap-tab";
import { MarketInsightsTab, type MarketInsights } from "@/components/analytics/market-insights-tab";
import { ResumePerformanceTab, type ResumePerformanceRow } from "@/components/analytics/resume-performance-tab";
import type { ResumeContent } from "@/lib/resume-types";

const RESPONDED_STATUSES = [
  "recruiter_contacted",
  "recruiter_screen",
  "technical_interview",
  "hiring_manager_interview",
  "final_interview",
  "offer",
];
const INTERVIEW_STATUSES = ["technical_interview", "hiring_manager_interview", "final_interview"];
const APPLIED_OR_LATER = ["applied", ...RESPONDED_STATUSES, "rejected", "withdrawn", "closed"];

const TITLE_STOPWORDS = new Set([
  "of", "the", "and", "for", "a", "an", "in", "to", "-", "&", "i", "ii", "iii", "sr", "jr",
]);

function pct(n: number, d: number) {
  if (d === 0) return "0%";
  return `${Math.round((n / d) * 100)}%`;
}

function median(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export default async function AnalyticsPage() {
  const supabase = await createClient();

  const [{ data: applications }, { data: jobs }, { data: masterResume }, { data: appResumeLinks }] =
    await Promise.all([
      supabase.from("applications").select("id, status, date_applied, created_at, resume_version_id"),
      supabase
        .from("jobs")
        .select("title, company_name, technologies, work_arrangement, sponsorship_status, salary_min, salary_max")
        .neq("status", "closed"),
      supabase
        .from("resumes")
        .select("current_version_id")
        .eq("is_master", true)
        .eq("status", "active")
        .maybeSingle(),
      supabase
        .from("applications")
        .select("resume_version_id, status, resume_versions(resume_id, resumes(id, title, is_master))"),
    ]);

  const total = applications?.length ?? 0;

  // --- Skills gap ---
  const techFrequency = new Map<string, number>();
  (jobs ?? []).forEach((j) => j.technologies.forEach((t) => techFrequency.set(t, (techFrequency.get(t) ?? 0) + 1)));

  const resumeTechs = new Set<string>();
  if (masterResume?.current_version_id) {
    const { data: version } = await supabase
      .from("resume_versions")
      .select("content")
      .eq("id", masterResume.current_version_id)
      .maybeSingle();
    const content = version?.content as ResumeContent | undefined;
    if (content) {
      content.skills.forEach((g) => g.items.forEach((i) => resumeTechs.add(i.toLowerCase())));
      content.experience.forEach((e) => e.technologies.forEach((t) => resumeTechs.add(t.toLowerCase())));
    }
  }

  const gaps = Array.from(techFrequency.entries())
    .filter(([tech]) => !resumeTechs.has(tech.toLowerCase()))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([skill, count]) => ({ skill, count }));

  // --- Market insights ---
  const titleWordFrequency = new Map<string, number>();
  (jobs ?? []).forEach((j) => {
    j.title
      .split(/[\s/,-]+/)
      .map((w) => w.trim())
      .filter((w) => w.length > 1 && !TITLE_STOPWORDS.has(w.toLowerCase()))
      .forEach((w) => titleWordFrequency.set(w, (titleWordFrequency.get(w) ?? 0) + 1));
  });

  const workArrangement: Record<string, number> = {};
  const sponsorship: Record<string, number> = {};
  const companyFrequency = new Map<string, number>();
  const salaries: number[] = [];

  (jobs ?? []).forEach((j) => {
    if (j.work_arrangement) workArrangement[j.work_arrangement] = (workArrangement[j.work_arrangement] ?? 0) + 1;
    sponsorship[j.sponsorship_status] = (sponsorship[j.sponsorship_status] ?? 0) + 1;
    companyFrequency.set(j.company_name, (companyFrequency.get(j.company_name) ?? 0) + 1);
    if (j.salary_min) salaries.push(j.salary_min);
    if (j.salary_max) salaries.push(j.salary_max);
  });

  const marketInsights: MarketInsights = {
    totalJobs: jobs?.length ?? 0,
    topTechnologies: Array.from(techFrequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({ name, count })),
    topTitleWords: Array.from(titleWordFrequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({ name, count })),
    workArrangement,
    sponsorship,
    topCompanies: Array.from(companyFrequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count })),
    salary:
      salaries.length > 0
        ? { min: Math.min(...salaries), median: median(salaries), max: Math.max(...salaries), sampleSize: salaries.length }
        : null,
  };

  // --- Resume performance ---
  const resumeStats = new Map<string, { title: string; isMaster: boolean; applications: number; responses: number }>();
  (appResumeLinks ?? []).forEach((a) => {
    const version = Array.isArray(a.resume_versions) ? a.resume_versions[0] : a.resume_versions;
    const resume = version && (Array.isArray(version.resumes) ? version.resumes[0] : version.resumes);
    if (!resume) return;
    const existing = resumeStats.get(resume.id) ?? {
      title: resume.title,
      isMaster: resume.is_master,
      applications: 0,
      responses: 0,
    };
    existing.applications++;
    if (RESPONDED_STATUSES.includes(a.status)) existing.responses++;
    resumeStats.set(resume.id, existing);
  });
  const resumePerformance: ResumePerformanceRow[] = Array.from(resumeStats.entries()).map(([resumeId, v]) => ({
    resumeId,
    ...v,
  }));

  if (!applications || total === 0) {
    return (
      <div>
        <PageHeader
          title="Job Search Analytics"
          description="Real numbers from your own tracked applications — no estimates."
        />
        <EmptyState
          icon={BarChart3}
          title="Not enough data yet"
          description="Track a few applications to see response rate, interview rate, and offer rate here."
        />
      </div>
    );
  }

  const appliedCount = applications.filter((a) => APPLIED_OR_LATER.includes(a.status)).length;
  const respondedCount = applications.filter((a) => RESPONDED_STATUSES.includes(a.status)).length;
  const interviewCount = applications.filter((a) => INTERVIEW_STATUSES.includes(a.status)).length;
  const offerCount = applications.filter((a) => a.status === "offer").length;
  const rejectedCount = applications.filter((a) => a.status === "rejected").length;

  const weeks: { label: string; count: number }[] = [];
  const now = new Date();
  for (let i = 7; i >= 0; i--) {
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - i * 7 - now.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);
    const count = applications.filter((a) => {
      const d = new Date(a.date_applied || a.created_at);
      return d >= weekStart && d < weekEnd;
    }).length;
    weeks.push({ label: weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" }), count });
  }
  const maxWeekCount = Math.max(1, ...weeks.map((w) => w.count));

  const stats = [
    { label: "Total applications", value: total },
    { label: "Applied", value: appliedCount },
    { label: "Recruiter responses", value: respondedCount },
    { label: "Response rate", value: pct(respondedCount, appliedCount) },
    { label: "Interviews", value: interviewCount },
    { label: "Interview rate", value: pct(interviewCount, appliedCount) },
    { label: "Offers", value: offerCount },
    { label: "Offer rate", value: pct(offerCount, appliedCount) },
    { label: "Rejections", value: rejectedCount },
  ];

  return (
    <div>
      <PageHeader
        title="Job Search Analytics"
        description="Real numbers from your own tracked applications — no estimates or projections."
      />

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="skills-gap">Skills Gap</TabsTrigger>
          <TabsTrigger value="market">Market Insights</TabsTrigger>
          <TabsTrigger value="resumes">Resume Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 pt-4">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
            {stats.map((s) => (
              <Card key={s.label}>
                <CardContent className="pt-6">
                  <p className="text-2xl font-semibold">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Applications per week</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex h-40 items-end gap-2">
                {weeks.map((w) => (
                  <div key={w.label} className="flex flex-1 flex-col items-center gap-1">
                    <div
                      className="w-full rounded-t bg-primary/80"
                      style={{ height: `${Math.max(4, (w.count / maxWeekCount) * 120)}px` }}
                      title={`${w.count} applications`}
                    />
                    <span className="text-[10px] text-muted-foreground">{w.label}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="skills-gap" className="pt-4">
          <SkillsGapTab gaps={gaps} totalJobs={jobs?.length ?? 0} />
        </TabsContent>

        <TabsContent value="market" className="pt-4">
          <MarketInsightsTab data={marketInsights} />
        </TabsContent>

        <TabsContent value="resumes" className="pt-4">
          <ResumePerformanceTab rows={resumePerformance} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
