import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { JobForm } from "@/components/jobs/job-form";
import { updateJob } from "@/lib/actions/jobs";

export default async function EditJobPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: job } = await supabase.from("jobs").select("*").eq("id", id).maybeSingle();

  if (!job) notFound();

  return (
    <div>
      <PageHeader title="Edit job" description={`${job.title} at ${job.company_name}`} />
      <JobForm action={updateJob.bind(null, id)} job={job} submitLabel="Save changes" />
    </div>
  );
}
