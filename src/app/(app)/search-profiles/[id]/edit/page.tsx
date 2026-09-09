import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { SearchProfileForm } from "@/components/search-profiles/search-profile-form";
import { updateSearchProfile } from "@/lib/actions/search-profiles";

export default async function EditSearchProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("job_search_profiles")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!profile) notFound();

  return (
    <div>
      <PageHeader title="Edit search profile" />
      <SearchProfileForm
        action={updateSearchProfile.bind(null, id)}
        profile={profile}
        submitLabel="Save changes"
      />
    </div>
  );
}
