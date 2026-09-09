import { BarChart3 } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const RESPONDED_STATUSES = [
  "recruiter_contacted",
  "recruiter_screen",
  "technical_interview",
  "hiring_manager_interview",
  "final_interview",
  "offer",
];
const INTERVIEW_STATUSES = [
  "technical_interview",
  "hiring_manager_interview",
  "final_interview",
];
const APPLIED_OR_LATER = [
  "applied",
  ...RESPONDED_STATUSES,
  "rejected",
  "withdrawn",
  "closed",
];

function pct(n: number, d: number) {
  if (d === 0) return "0%";
  return `${Math.round((n / d) * 100)}%`;
}

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const { data: applications } = await supabase
    .from("applications")
    .select("id, status, date_applied, created_at");

  const total = applications?.length ?? 0;

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

  // Applications per week for the last 8 weeks.
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
    weeks.push({
      label: weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      count,
    });
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

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-3">
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

      <p className="mt-4 text-xs text-muted-foreground">
        Resume-version performance, skills-gap analysis, and market insights arrive in Phase 5 once
        more applications and resume versions have accumulated.
      </p>
    </div>
  );
}
