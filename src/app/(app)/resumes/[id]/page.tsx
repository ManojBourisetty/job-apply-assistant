import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ResumeEditor } from "@/components/resumes/resume-editor";
import { VersionHistory } from "@/components/resumes/version-history";
import { DownloadResumeButton } from "@/components/resumes/download-resume-button";
import { saveResumeVersion } from "@/lib/actions/resumes";
import { emptyResumeContent, type ResumeContent } from "@/lib/resume-types";
import { isAiConfigured } from "@/lib/ai";

export default async function ResumeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: resume } = await supabase
    .from("resumes")
    .select("id, title, is_master, current_version_id")
    .eq("id", id)
    .maybeSingle();

  if (!resume) notFound();

  const [{ data: currentVersion }, { data: versions }] = await Promise.all([
    resume.current_version_id
      ? supabase
          .from("resume_versions")
          .select("id, content, raw_text")
          .eq("id", resume.current_version_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from("resume_versions")
      .select("id, version_number, change_summary, created_by, created_at")
      .eq("resume_id", id)
      .order("version_number", { ascending: false }),
  ]);

  const content = (currentVersion?.content as ResumeContent) ?? emptyResumeContent();

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title={resume.title}
        description={resume.is_master ? "Your master resume." : "Resume version"}
        actions={
          <>
            {resume.is_master && <Badge variant="success">Master</Badge>}
            <DownloadResumeButton content={content} filename={resume.title} />
          </>
        }
      />

      <Tabs defaultValue="editor">
        <TabsList>
          <TabsTrigger value="editor">Editor</TabsTrigger>
          <TabsTrigger value="history">Version history ({versions?.length ?? 0})</TabsTrigger>
        </TabsList>
        <TabsContent value="editor" className="pt-4">
          <ResumeEditor
            action={saveResumeVersion.bind(null, id)}
            initialContent={content}
            initialRawText={currentVersion?.raw_text}
            aiConfigured={isAiConfigured()}
          />
        </TabsContent>
        <TabsContent value="history" className="pt-4">
          <VersionHistory
            resumeId={id}
            versions={versions ?? []}
            currentVersionId={resume.current_version_id}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
