import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("job_profiles")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!profile) {
    notFound();
  }

  const [
    { data: resumes },
    { data: applications },
    { count: jobsCount },
    { count: aiGenerationsCount },
  ] = await Promise.all([
    supabase
      .from("resumes")
      .select("id, title, is_master, status, updated_at")
      .eq("user_id", id)
      .order("updated_at", { ascending: false }),
    supabase
      .from("applications")
      .select("id, status, date_applied, updated_at, jobs(title, company_name)")
      .eq("user_id", id)
      .order("updated_at", { ascending: false })
      .limit(20),
    supabase.from("jobs").select("*", { count: "exact", head: true }).eq("user_id", id),
    supabase
      .from("ai_generations")
      .select("*", { count: "exact", head: true })
      .eq("user_id", id),
  ]);

  return (
    <div>
      <Link
        href="/admin/users"
        className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" /> Back to users
      </Link>

      <PageHeader
        title={profile.full_name || profile.email || "User"}
        description={profile.username ? `@${profile.username} · ${profile.email}` : profile.email ?? undefined}
        actions={profile.is_admin ? <Badge variant="secondary">Admin</Badge> : undefined}
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-2xl font-semibold">{jobsCount ?? 0}</p>
            <p className="mt-1 text-xs text-muted-foreground">Jobs tracked</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-2xl font-semibold">{applications?.length ?? 0}</p>
            <p className="mt-1 text-xs text-muted-foreground">Applications (recent)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-2xl font-semibold">{resumes?.length ?? 0}</p>
            <p className="mt-1 text-xs text-muted-foreground">Resumes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-2xl font-semibold">{aiGenerationsCount ?? 0}</p>
            <p className="mt-1 text-xs text-muted-foreground">AI generations</p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Resumes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {!resumes || resumes.length === 0 ? (
              <p className="text-sm text-muted-foreground">No resumes.</p>
            ) : (
              resumes.map((r) => (
                <div key={r.id} className="flex items-center justify-between text-sm">
                  <span>
                    {r.title} {r.is_master && <Badge variant="outline" className="ml-1 text-xs">Master</Badge>}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(r.updated_at).toLocaleDateString()}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent applications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {!applications || applications.length === 0 ? (
              <p className="text-sm text-muted-foreground">No applications.</p>
            ) : (
              applications.map((a) => (
                <div key={a.id} className="flex items-center justify-between text-sm">
                  <span className="truncate">
                    {a.jobs?.title ?? "Unknown role"}
                    {a.jobs?.company_name && (
                      <span className="text-muted-foreground"> · {a.jobs.company_name}</span>
                    )}
                  </span>
                  <Badge variant="outline" className="shrink-0 text-xs">
                    {a.status.replace(/_/g, " ")}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6">
        <Button asChild variant="outline" size="sm">
          <Link href="/admin/users">Done</Link>
        </Button>
      </div>
    </div>
  );
}
