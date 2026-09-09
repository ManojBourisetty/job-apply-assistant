import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { RecruiterForm } from "@/components/recruiters/recruiter-form";
import { updateRecruiter } from "@/lib/actions/recruiters";

export default async function EditRecruiterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: recruiter } = await supabase.from("recruiters").select("*").eq("id", id).maybeSingle();

  if (!recruiter) notFound();

  return (
    <div>
      <PageHeader title="Edit recruiter" description={recruiter.name} />
      <RecruiterForm
        action={updateRecruiter.bind(null, id)}
        recruiter={recruiter}
        submitLabel="Save changes"
      />
    </div>
  );
}
