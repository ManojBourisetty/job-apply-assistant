import Link from "next/link";
import {
  Briefcase,
  Sparkles,
  ShieldCheck,
  Send,
  Bell,
  CalendarClock,
  ArrowRight,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { sponsorshipBadgeVariant, statusLabel } from "@/lib/format";

export const dynamic = "force-dynamic";

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const followupWindow = new Date(todayStart.getTime() + 3 * 86400000).toISOString().slice(0, 10);

  const [
    { count: jobsToday },
    { count: strongSponsorship },
    { count: totalApplications },
    { data: followupsDue },
    { data: recentJobs },
    { data: recentApplications },
  ] = await Promise.all([
    supabase
      .from("jobs")
      .select("id", { count: "exact", head: true })
      .gte("date_discovered", todayStart.toISOString()),
    supabase
      .from("jobs")
      .select("id", { count: "exact", head: true })
      .in("sponsorship_status", ["confirmed", "likely"]),
    supabase.from("applications").select("id", { count: "exact", head: true }),
    supabase
      .from("followups")
      .select("id, due_date, note, application_id, applications(job_id, jobs(title, company_name))")
      .eq("completed", false)
      .lte("due_date", followupWindow)
      .order("due_date", { ascending: true })
      .limit(5),
    supabase
      .from("jobs")
      .select("id, title, company_name, location, sponsorship_status, work_arrangement, created_at")
      .order("created_at", { ascending: false })
      .limit(6),
    supabase
      .from("applications")
      .select("id, status, updated_at, jobs(title, company_name)")
      .order("updated_at", { ascending: false })
      .limit(5),
  ]);

  const stats = [
    { label: "Jobs discovered today", value: jobsToday ?? 0, icon: Briefcase },
    { label: "Sponsorship matches", value: strongSponsorship ?? 0, icon: ShieldCheck },
    { label: "Total applications", value: totalApplications ?? 0, icon: Send },
    { label: "Follow-ups due (3d)", value: followupsDue?.length ?? 0, icon: Bell },
  ];

  return (
    <div>
      <PageHeader
        title={`${greeting()}${user?.email ? "" : ""}`}
        description={`Your job search for ${new Date().toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
        })}`}
        actions={
          <Button asChild>
            <Link href="/jobs/new">
              <Briefcase /> Add a job
            </Link>
          </Button>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex items-center justify-between pt-6">
              <div>
                <p className="text-2xl font-semibold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
              <stat.icon className="size-8 text-muted-foreground/40" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Recently discovered jobs</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/jobs">
                View all <ArrowRight />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentJobs && recentJobs.length > 0 ? (
              <div className="divide-y">
                {recentJobs.map((job) => (
                  <Link
                    key={job.id}
                    href={`/jobs/${job.id}`}
                    className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0 hover:bg-accent/50 -mx-2 px-2 rounded-md"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{job.title}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {job.company_name} {job.location ? `· ${job.location}` : ""}
                      </p>
                    </div>
                    <Badge variant={sponsorshipBadgeVariant(job.sponsorship_status)}>
                      {statusLabel(job.sponsorship_status)}
                    </Badge>
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Sparkles}
                title="No jobs yet"
                description="Add jobs manually today. Automated discovery from career pages and ATS feeds arrives in Phase 2."
                action={
                  <Button asChild size="sm">
                    <Link href="/jobs/new">Add your first job</Link>
                  </Button>
                }
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Needs attention</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {followupsDue && followupsDue.length > 0 ? (
              followupsDue.map((f) => {
                const app = Array.isArray(f.applications) ? f.applications[0] : f.applications;
                const job = app && Array.isArray(app.jobs) ? app.jobs[0] : app?.jobs;
                return (
                  <div key={f.id} className="flex items-start gap-2 text-sm">
                    <CalendarClock className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0">
                      <p className="truncate font-medium">
                        Follow up — {job?.company_name ?? "Application"}
                      </p>
                      <p className="text-xs text-muted-foreground">Due {f.due_date}</p>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-muted-foreground">No follow-ups due soon.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Recent application activity</CardTitle>
        </CardHeader>
        <CardContent>
          {recentApplications && recentApplications.length > 0 ? (
            <div className="divide-y">
              {recentApplications.map((a) => {
                const job = Array.isArray(a.jobs) ? a.jobs[0] : a.jobs;
                return (
                  <div key={a.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                    <div>
                      <p className="text-sm font-medium">{job?.title}</p>
                      <p className="text-xs text-muted-foreground">{job?.company_name}</p>
                    </div>
                    <Badge variant="outline">{statusLabel(a.status)}</Badge>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon={Send}
              title="No applications tracked yet"
              description="Save a job and move it through your pipeline in the Application Tracker."
              action={
                <Button asChild size="sm" variant="outline">
                  <Link href="/applications">Go to tracker</Link>
                </Button>
              }
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
