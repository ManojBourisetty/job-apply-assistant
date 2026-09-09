import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ApplicationStatusSelect } from "@/components/applications/application-status-select";
import { ApplicationChecklist } from "@/components/applications/application-checklist";
import { ApplicationDetailsForm } from "@/components/applications/application-details-form";
import { DeleteApplicationButton } from "@/components/applications/delete-application-button";
import { InterviewSection } from "@/components/applications/interview-section";
import { formatDate, sponsorshipBadgeVariant, statusLabel } from "@/lib/format";
import type { ApplicationStatus } from "@/lib/constants";

export default async function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: application } = await supabase
    .from("applications")
    .select("*, jobs(*)")
    .eq("id", id)
    .maybeSingle();

  if (!application) notFound();

  const job = Array.isArray(application.jobs) ? application.jobs[0] : application.jobs;

  const [{ data: history }, { data: interviews }] = await Promise.all([
    supabase
      .from("application_status_history")
      .select("from_status, to_status, changed_at")
      .eq("application_id", id)
      .order("changed_at", { ascending: false }),
    supabase
      .from("interviews")
      .select("*")
      .eq("application_id", id)
      .order("scheduled_at", { ascending: true, nullsFirst: false }),
  ]);

  return (
    <div className="mx-auto max-w-4xl">
      <Button variant="ghost" size="sm" className="mb-2" asChild>
        <Link href="/applications">
          <ArrowLeft /> Back to tracker
        </Link>
      </Button>
      <PageHeader
        title={job?.title ?? "Application"}
        description={job?.company_name}
        actions={<ApplicationStatusSelect applicationId={application.id} status={application.status as ApplicationStatus} />}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Application checklist</CardTitle>
            </CardHeader>
            <CardContent>
              <ApplicationChecklist
                applicationId={application.id}
                checklist={(application.checklist as Record<string, boolean>) ?? {}}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent>
              <ApplicationDetailsForm application={application} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Interviews</CardTitle>
            </CardHeader>
            <CardContent>
              <InterviewSection applicationId={application.id} interviews={interviews ?? []} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Status history</CardTitle>
            </CardHeader>
            <CardContent>
              {history && history.length > 0 ? (
                <div className="space-y-2 text-sm">
                  {history.map((h, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <span>
                        {h.from_status ? `${statusLabel(h.from_status)} → ` : "Created as "}
                        <strong>{statusLabel(h.to_status)}</strong>
                      </span>
                      <span className="text-xs text-muted-foreground">{formatDate(h.changed_at)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No history yet.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {job && (
            <Card>
              <CardHeader>
                <CardTitle>Job</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="font-medium">{job.title}</p>
                <p className="text-muted-foreground">{job.company_name}</p>
                {job.location && <p className="text-muted-foreground">{job.location}</p>}
                <Badge variant={sponsorshipBadgeVariant(job.sponsorship_status)}>
                  {statusLabel(job.sponsorship_status)}
                </Badge>
                <div className="pt-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/jobs/${job.id}`}>
                      View job <ExternalLink className="size-3.5" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
          <DeleteApplicationButton applicationId={application.id} />
        </div>
      </div>
    </div>
  );
}
