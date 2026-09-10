import Link from "next/link";
import { Users, Briefcase, KanbanSquare, Sparkles, Radio, Bot } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function AdminOverviewPage() {
  const supabase = await createClient();

  const [
    { count: totalUsers },
    { count: totalJobs },
    { count: totalApplications },
    { count: totalAiGenerations },
    { count: activeJobSources },
    { data: recentSignups },
    { data: applications },
  ] = await Promise.all([
    supabase.from("job_profiles").select("*", { count: "exact", head: true }),
    supabase.from("jobs").select("*", { count: "exact", head: true }),
    supabase.from("applications").select("*", { count: "exact", head: true }),
    supabase.from("ai_generations").select("*", { count: "exact", head: true }),
    supabase
      .from("job_sources")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true),
    supabase
      .from("job_profiles")
      .select("id, email, username, full_name, created_at, is_admin")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase.from("applications").select("status"),
  ]);

  const statusCounts = new Map<string, number>();
  for (const app of applications ?? []) {
    statusCounts.set(app.status, (statusCounts.get(app.status) ?? 0) + 1);
  }

  const metrics = [
    { label: "Total users", value: totalUsers ?? 0, icon: Users },
    { label: "Jobs tracked", value: totalJobs ?? 0, icon: Briefcase },
    { label: "Applications", value: totalApplications ?? 0, icon: KanbanSquare },
    { label: "AI generations", value: totalAiGenerations ?? 0, icon: Sparkles },
    { label: "Active job sources", value: activeJobSources ?? 0, icon: Radio },
  ];

  return (
    <div>
      <PageHeader
        title="Admin Overview"
        description="Platform-wide metrics across every user."
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
        {metrics.map((m) => (
          <Card key={m.label}>
            <CardContent className="flex items-center gap-3 pt-6">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-secondary">
                <m.icon className="size-4" />
              </div>
              <div>
                <p className="text-2xl font-semibold leading-none">{m.value}</p>
                <p className="mt-1 text-xs text-muted-foreground">{m.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <KanbanSquare className="size-4" /> Applications by status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statusCounts.size === 0 ? (
              <p className="text-sm text-muted-foreground">No applications yet.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {Array.from(statusCounts.entries()).map(([status, count]) => (
                  <Badge key={status} variant="outline" className="gap-1.5">
                    {status.replace(/_/g, " ")}
                    <span className="font-semibold">{count}</span>
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Bot className="size-4" /> Recent signups
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {!recentSignups || recentSignups.length === 0 ? (
              <p className="text-sm text-muted-foreground">No signups yet.</p>
            ) : (
              recentSignups.map((u) => (
                <div key={u.id} className="flex items-center justify-between text-sm">
                  <Link href={`/admin/users/${u.id}`} className="hover:underline">
                    <span className="font-medium">{u.full_name || u.username || u.email}</span>
                    <span className="ml-2 text-xs text-muted-foreground">
                      {u.username ? `@${u.username}` : u.email}
                    </span>
                  </Link>
                  <div className="flex items-center gap-2">
                    {u.is_admin && (
                      <Badge variant="secondary" className="text-xs">
                        Admin
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {new Date(u.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
