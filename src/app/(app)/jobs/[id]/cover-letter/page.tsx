import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Sparkles } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { CoverLetterPanel } from "@/components/tailoring/cover-letter-panel";
import { isAiConfigured } from "@/lib/ai";

export default async function CoverLetterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: job } = await supabase.from("jobs").select("id, title, company_name").eq("id", id).maybeSingle();
  if (!job) notFound();

  const { data: latestLetter } = await supabase
    .from("cover_letters")
    .select("*")
    .eq("job_id", id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (
    <div className="mx-auto max-w-2xl">
      <Button variant="ghost" size="sm" className="mb-2" asChild>
        <Link href={`/jobs/${id}`}>
          <ArrowLeft /> Back to job
        </Link>
      </Button>
      <PageHeader title="Cover Letter" description={`${job.title} at ${job.company_name}`} />

      {!isAiConfigured() ? (
        <EmptyState
          icon={Sparkles}
          badge="AI not configured"
          title="No AI provider is configured"
          description="Set ANTHROPIC_API_KEY (or OPENAI_API_KEY) in your environment to generate cover letter drafts. You can still write one directly."
        />
      ) : (
        <CoverLetterPanel jobId={id} initialLetter={latestLetter ?? null} />
      )}
    </div>
  );
}
