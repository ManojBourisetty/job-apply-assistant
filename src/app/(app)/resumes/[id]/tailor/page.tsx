import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { SuggestionReview } from "@/components/tailoring/suggestion-review";

export default async function TailorReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: resume } = await supabase
    .from("resumes")
    .select("id, title, current_version_id")
    .eq("id", id)
    .maybeSingle();

  if (!resume || !resume.current_version_id) notFound();

  const { data: facts } = await supabase
    .from("resume_facts")
    .select("*")
    .eq("resume_version_id", resume.current_version_id)
    .eq("status", "ai_suggested_pending")
    .order("created_at", { ascending: true });

  return (
    <div className="mx-auto max-w-3xl">
      <Button variant="ghost" size="sm" className="mb-2" asChild>
        <Link href={`/resumes/${id}`}>
          <ArrowLeft /> Back to resume
        </Link>
      </Button>
      <PageHeader
        title="Review suggestions"
        description={`${resume.title} — approve or reject each AI suggestion individually.`}
      />
      <SuggestionReview resumeVersionId={resume.current_version_id} facts={facts ?? []} />
    </div>
  );
}
