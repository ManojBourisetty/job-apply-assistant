import Link from "next/link";
import { Sparkles, FileText } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { SaveJobButton } from "@/components/jobs/save-job-button";
import { computeMatch, passesHardFilters } from "@/lib/matching";
import { formatSalary } from "@/lib/format";
import type { ResumeContent } from "@/lib/resume-types";

export default async function RecommendedJobsPage() {
  const supabase = await createClient();

  const { data: masterResume } = await supabase
    .from("resumes")
    .select("current_version_id")
    .eq("is_master", true)
    .eq("status", "active")
    .maybeSingle();

  if (!masterResume?.current_version_id) {
    return (
      <div>
        <PageHeader
          title="Recommended Jobs"
          description="Transparent, rule-based matches against your master resume — every score is explainable."
        />
        <EmptyState
          icon={FileText}
          title="Create a master resume first"
          description="Recommended jobs are ranked by comparing each job against your master resume. Set one up to see matches here."
          action={
            <Button asChild size="sm">
              <Link href="/resumes/new">Create master resume</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const { data: version } = await supabase
    .from("resume_versions")
    .select("content")
    .eq("id", masterResume.current_version_id)
    .maybeSingle();
  const resumeContent = (version?.content as ResumeContent) ?? null;

  const { data: activeProfiles } = await supabase
    .from("job_search_profiles")
    .select("*")
    .eq("is_active", true);
  const activeProfile = activeProfiles?.[0] ?? null;

  const { data: jobs } = await supabase.from("jobs").select("*").neq("status", "closed");

  if (!resumeContent || !jobs || jobs.length === 0) {
    return (
      <div>
        <PageHeader
          title="Recommended Jobs"
          description="Transparent, rule-based matches against your master resume — every score is explainable."
        />
        <EmptyState
          icon={Sparkles}
          title="No jobs to match yet"
          description="Add jobs manually or connect a job source, then come back here to see them ranked."
          action={
            <Button asChild size="sm">
              <Link href="/jobs">Go to Job Discovery</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const filtered = activeProfile ? jobs.filter((j) => passesHardFilters(j, activeProfile)) : jobs;
  const ranked = filtered
    .map((job) => ({ job, match: computeMatch(job, resumeContent, activeProfile) }))
    .sort((a, b) => b.match.total - a.match.total);

  const excludedCount = jobs.length - filtered.length;

  return (
    <div>
      <PageHeader
        title="Recommended Jobs"
        description="Transparent, rule-based matches against your master resume — every score is explainable, and gaps are never hidden."
      />

      {activeProfile && (
        <p className="mb-4 text-sm text-muted-foreground">
          Ranked against your active search profile &ldquo;{activeProfile.name}&rdquo;.
          {excludedCount > 0 &&
            ` ${excludedCount} job(s) excluded by hard filters (sponsorship, salary, experience, or employment type).`}
        </p>
      )}

      {ranked.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="No jobs pass your hard filters"
          description="Adjust your active search profile's hard filters, or add more jobs."
          action={
            <Button asChild size="sm" variant="outline">
              <Link href="/search-profiles">Edit search profiles</Link>
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {ranked.map(({ job, match }) => (
            <Card key={job.id}>
              <CardContent className="flex flex-col gap-3 pt-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Link href={`/jobs/${job.id}`} className="font-medium hover:underline">
                      {job.title}
                    </Link>
                    <Badge
                      variant={match.total >= 85 ? "success" : match.total >= 65 ? "secondary" : "outline"}
                    >
                      {match.total}/100
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {job.company_name}
                    {job.location ? ` · ${job.location}` : ""}
                  </p>
                  {match.matched.length > 0 && (
                    <p className="mt-1.5 truncate text-xs text-muted-foreground">
                      ✓ {match.matched.slice(0, 2).join(" · ")}
                    </p>
                  )}
                  {formatSalary(job.salary_min, job.salary_max, job.salary_currency) && (
                    <Badge variant="outline" className="mt-2">
                      {formatSalary(job.salary_min, job.salary_max, job.salary_currency)}
                    </Badge>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-2 self-end sm:self-auto">
                  <SaveJobButton jobId={job.id} isSaved={job.is_saved} />
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/jobs/${job.id}`}>View match</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
