import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FileText, Sparkles } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { TailorStartForm } from "@/components/tailoring/tailor-start-form";
import { isAiConfigured } from "@/lib/ai";

export default async function TailorJobPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: job } = await supabase.from("jobs").select("id, title, company_name").eq("id", id).maybeSingle();
  if (!job) notFound();

  const { data: masterResume } = await supabase
    .from("resumes")
    .select("id")
    .eq("is_master", true)
    .eq("status", "active")
    .maybeSingle();

  return (
    <div className="mx-auto max-w-2xl">
      <Button variant="ghost" size="sm" className="mb-2" asChild>
        <Link href={`/jobs/${id}`}>
          <ArrowLeft /> Back to job
        </Link>
      </Button>
      <PageHeader title="Tailor Resume" description={`${job.title} at ${job.company_name}`} />

      {!isAiConfigured() ? (
        <EmptyState
          icon={Sparkles}
          badge="AI not configured"
          title="No AI provider is configured"
          description="Set ANTHROPIC_API_KEY (or OPENAI_API_KEY) in your environment to enable resume tailoring. Everything else in the app works without it."
        />
      ) : !masterResume ? (
        <EmptyState
          icon={FileText}
          title="Create a master resume first"
          description="Resume tailoring works from your master resume."
          action={
            <Button asChild size="sm">
              <Link href="/resumes/new">Create master resume</Link>
            </Button>
          }
        />
      ) : (
        <TailorStartForm jobId={id} />
      )}
    </div>
  );
}
