import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, ShieldCheck, Sparkles, ArrowLeft } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SaveJobButton } from "@/components/jobs/save-job-button";
import { JobActions } from "@/components/jobs/job-actions";
import { formatDate, formatSalary, sponsorshipBadgeVariant, statusLabel } from "@/lib/format";

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: job }, { data: application }] = await Promise.all([
    supabase.from("jobs").select("*").eq("id", id).maybeSingle(),
    supabase.from("applications").select("id").eq("job_id", id).maybeSingle(),
  ]);

  if (!job) notFound();

  return (
    <div className="mx-auto max-w-4xl">
      <Button variant="ghost" size="sm" className="mb-2" asChild>
        <Link href="/jobs">
          <ArrowLeft /> Back to jobs
        </Link>
      </Button>
      <PageHeader
        title={job.title}
        description={`${job.company_name}${job.location ? ` · ${job.location}` : ""}`}
        actions={<SaveJobButton jobId={job.id} isSaved={job.is_saved} />}
      />

      <div className="mb-6">
        <JobActions jobId={job.id} hasApplication={!!application} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Overview</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Employment type</p>
                <p className="font-medium">{statusLabel(job.employment_type)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Work arrangement</p>
                <p className="font-medium">
                  {job.work_arrangement ? statusLabel(job.work_arrangement) : "—"}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Salary</p>
                <p className="font-medium">
                  {formatSalary(job.salary_min, job.salary_max, job.salary_currency) ?? "Not listed"}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Posted</p>
                <p className="font-medium">{formatDate(job.posted_date)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Min. experience</p>
                <p className="font-medium">
                  {job.min_years_experience ? `${job.min_years_experience} years` : "Not listed"}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Source</p>
                <p className="font-medium">{statusLabel(job.source)}</p>
              </div>
              {job.technologies.length > 0 && (
                <div className="col-span-2">
                  <p className="mb-1.5 text-muted-foreground">Technologies</p>
                  <div className="flex flex-wrap gap-1.5">
                    {job.technologies.map((t) => (
                      <Badge key={t} variant="outline">
                        {t}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              <div className="col-span-2 flex flex-wrap gap-2 pt-2">
                {job.job_url && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={job.job_url} target="_blank" rel="noopener noreferrer">
                      View posting <ExternalLink />
                    </a>
                  </Button>
                )}
                {job.application_url && (
                  <Button size="sm" asChild>
                    <a href={job.application_url} target="_blank" rel="noopener noreferrer">
                      Official application <ExternalLink />
                    </a>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {(job.description || job.requirements || job.preferred_qualifications) && (
            <Card>
              <CardHeader>
                <CardTitle>Job description</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                {job.description && (
                  <div>
                    <p className="mb-1 font-medium">Description</p>
                    <p className="whitespace-pre-wrap text-muted-foreground">{job.description}</p>
                  </div>
                )}
                {job.requirements && (
                  <div>
                    <p className="mb-1 font-medium">Requirements</p>
                    <p className="whitespace-pre-wrap text-muted-foreground">{job.requirements}</p>
                  </div>
                )}
                {job.preferred_qualifications && (
                  <div>
                    <p className="mb-1 font-medium">Preferred qualifications</p>
                    <p className="whitespace-pre-wrap text-muted-foreground">
                      {job.preferred_qualifications}
                    </p>
                  </div>
                )}
                {job.education_requirement && (
                  <div>
                    <p className="mb-1 font-medium">Education</p>
                    <p className="text-muted-foreground">{job.education_requirement}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="size-4" /> Sponsorship analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <Badge variant={sponsorshipBadgeVariant(job.sponsorship_status)} className="text-sm">
                {statusLabel(job.sponsorship_status)}
              </Badge>
              {job.sponsorship_evidence && (
                <div>
                  <p className="text-muted-foreground">Evidence</p>
                  <p>{job.sponsorship_evidence}</p>
                </div>
              )}
              {job.sponsorship_source && (
                <div>
                  <p className="text-muted-foreground">Source</p>
                  <p>{job.sponsorship_source}</p>
                </div>
              )}
              {job.last_verified_at && (
                <div>
                  <p className="text-muted-foreground">Last verified</p>
                  <p>{formatDate(job.last_verified_at)}</p>
                </div>
              )}
              {!job.sponsorship_evidence && !job.sponsorship_source && (
                <p className="text-xs text-muted-foreground">
                  No evidence recorded yet. Edit this job to add sponsorship evidence when you find it.
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="border-dashed">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-muted-foreground">
                <Sparkles className="size-4" /> Match analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                AI-powered compatibility scoring against your master resume arrives in Phase 4, once
                the job matching engine is built.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
