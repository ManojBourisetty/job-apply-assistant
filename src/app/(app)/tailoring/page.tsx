import Link from "next/link";
import { Wand2 } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { isAiConfigured } from "@/lib/ai";
import { formatDate } from "@/lib/format";

export default async function ResumeTailoringHubPage() {
  const supabase = await createClient();

  const { data: tailoredResumes } = await supabase
    .from("resumes")
    .select("id, title, updated_at, current_version_id, source_job_id, jobs(title, company_name)")
    .not("source_job_id", "is", null)
    .eq("status", "active")
    .order("updated_at", { ascending: false });

  const versionIds = (tailoredResumes ?? [])
    .map((r) => r.current_version_id)
    .filter((id): id is string => !!id);

  const { data: pendingFacts } = versionIds.length
    ? await supabase
        .from("resume_facts")
        .select("resume_version_id")
        .eq("status", "ai_suggested_pending")
        .in("resume_version_id", versionIds)
    : { data: [] };

  const pendingCountByVersion = new Map<string, number>();
  (pendingFacts ?? []).forEach((f) => {
    pendingCountByVersion.set(f.resume_version_id, (pendingCountByVersion.get(f.resume_version_id) ?? 0) + 1);
  });

  return (
    <div>
      <PageHeader
        title="Resume Tailoring"
        description="Job-specific resume versions, AI-suggested and approved by you — grounded strictly in your master resume."
      />

      {!isAiConfigured() && (
        <Card className="mb-6 border-dashed">
          <CardContent className="pt-6 text-sm text-muted-foreground">
            No AI provider is configured, so new suggestions can&apos;t be generated right now. Set{" "}
            <code>ANTHROPIC_API_KEY</code> (or <code>OPENAI_API_KEY</code>) to enable it. Existing
            tailored resumes below still work normally.
          </CardContent>
        </Card>
      )}

      {tailoredResumes && tailoredResumes.length > 0 ? (
        <div className="space-y-3">
          {tailoredResumes.map((r) => {
            const job = Array.isArray(r.jobs) ? r.jobs[0] : r.jobs;
            const pending = r.current_version_id ? (pendingCountByVersion.get(r.current_version_id) ?? 0) : 0;
            return (
              <Card key={r.id}>
                <CardContent className="flex items-center justify-between gap-4 pt-6">
                  <div className="min-w-0">
                    <Link href={`/resumes/${r.id}`} className="font-medium hover:underline">
                      {r.title}
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      {job ? `${job.title} at ${job.company_name}` : "Job removed"} · Updated{" "}
                      {formatDate(r.updated_at)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {pending > 0 && (
                      <Badge variant="secondary">{pending} suggestion(s) pending</Badge>
                    )}
                    {pending > 0 ? (
                      <Button size="sm" asChild>
                        <Link href={`/resumes/${r.id}/tailor`}>Review</Link>
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/resumes/${r.id}`}>Open</Link>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={Wand2}
          title="No tailored resumes yet"
          description="Open any job and click “Tailor resume” to generate a job-specific version — the AI only rewords or reorders what's already in your master resume."
          action={
            <Button asChild size="sm" variant="outline">
              <Link href="/jobs">Browse jobs</Link>
            </Button>
          }
        />
      )}
    </div>
  );
}
