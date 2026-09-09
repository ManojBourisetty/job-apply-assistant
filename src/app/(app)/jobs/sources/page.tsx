import Link from "next/link";
import { ArrowLeft, Radar } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { JobSourceForm } from "@/components/job-sources/job-source-form";
import { JobSourceRow } from "@/components/job-sources/job-source-row";
import { SyncAllButton } from "@/components/job-sources/sync-all-button";

export default async function JobSourcesPage() {
  const supabase = await createClient();
  const { data: sources } = await supabase
    .from("job_sources")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div>
      <Button variant="ghost" size="sm" className="mb-2" asChild>
        <Link href="/jobs">
          <ArrowLeft /> Back to jobs
        </Link>
      </Button>
      <PageHeader
        title="Job Sources"
        description="Connect official company career pages via their public Greenhouse, Lever, or Ashby job board. Sync pulls new postings, flags changes, and marks closed roles — no scraping, only each ATS's public API."
        actions={<SyncAllButton hasSources={(sources?.length ?? 0) > 0} />}
      />

      <div className="mb-6">
        <JobSourceForm />
      </div>

      {sources && sources.length > 0 ? (
        <div className="space-y-3">
          {sources.map((s) => (
            <JobSourceRow key={s.id} source={s} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Radar}
          title="No sources connected yet"
          description="Add a company's Greenhouse, Lever, or Ashby board above to start pulling in real postings."
        />
      )}
    </div>
  );
}
