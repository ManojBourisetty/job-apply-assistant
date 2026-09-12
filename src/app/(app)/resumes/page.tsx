import Link from "next/link";
import { FileText, History, Plus, Star } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ResumeRowActions } from "@/components/resumes/resume-row-actions";
import { formatDate } from "@/lib/format";

export default async function ResumesPage() {
  const supabase = await createClient();
  const { data: resumes } = await supabase
    .from("resumes")
    .select("id, title, is_master, status, created_at, updated_at, resume_versions(id)")
    .eq("status", "active")
    .order("is_master", { ascending: false })
    .order("updated_at", { ascending: false });

  return (
    <div>
      <PageHeader
        title="Master Resume"
        description="Maintain your master resume and any job-specific versions. All content here is yours — nothing is AI-generated unless you approve it."
        actions={
          <Button asChild>
            <Link href="/resumes/new">
              <Plus /> New resume
            </Link>
          </Button>
        }
      />

      {resumes && resumes.length > 0 ? (
        <div className="space-y-3">
          {resumes.map((resume) => (
            <Card key={resume.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6">
                <Link href={`/resumes/${resume.id}`} className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{resume.title}</p>
                    {resume.is_master && (
                      <Badge variant="success">
                        <Star className="size-3" /> Master
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {Array.isArray(resume.resume_versions) ? resume.resume_versions.length : 0}{" "}
                    version(s) · Updated {formatDate(resume.updated_at)}
                  </p>
                </Link>
                <Button variant="outline" size="sm" className="shrink-0" asChild>
                  <Link href={`/resumes/${resume.id}?tab=history`}>
                    <History /> Versions
                  </Link>
                </Button>
                <ResumeRowActions resumeId={resume.id} isMaster={resume.is_master} />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={FileText}
          title="No resumes yet"
          description="Create your master resume to start matching and tailoring against jobs."
          action={
            <Button asChild size="sm">
              <Link href="/resumes/new">Create your master resume</Link>
            </Button>
          }
        />
      )}
    </div>
  );
}
