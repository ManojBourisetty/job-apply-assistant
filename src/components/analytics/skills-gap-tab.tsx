import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { EmptyState } from "@/components/empty-state";
import { AlertTriangle } from "lucide-react";

export function SkillsGapTab({
  gaps,
  totalJobs,
}: {
  gaps: { skill: string; count: number }[];
  totalJobs: number;
}) {
  if (totalJobs === 0) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title="No jobs to analyze yet"
        description="Add or discover some jobs to see which skills appear most often but aren't in your resume."
      />
    );
  }

  if (gaps.length === 0) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title="No gaps found"
        description="Every technology mentioned across your jobs also appears in your master resume."
      />
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Most frequently missing skills</CardTitle>
        <p className="text-sm text-muted-foreground">
          Technologies that appear often across your {totalJobs} tracked job(s) with no evidence found
          in your current master resume.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {gaps.map((g) => {
          const percent = Math.round((g.count / totalJobs) * 100);
          return (
            <div key={g.skill}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="font-medium">{g.skill}</span>
                <span className="text-muted-foreground">
                  {percent}% of jobs ({g.count})
                </span>
              </div>
              <Progress value={percent} className="h-1.5" />
            </div>
          );
        })}
        <p className="text-xs text-muted-foreground">
          &ldquo;No evidence found&rdquo; means the skill doesn&apos;t appear in your master resume&apos;s
          skills or experience technologies — not a claim that you lack the skill entirely.
        </p>
      </CardContent>
    </Card>
  );
}
