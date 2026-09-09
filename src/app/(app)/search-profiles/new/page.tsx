import { PageHeader } from "@/components/page-header";
import { SearchProfileForm } from "@/components/search-profiles/search-profile-form";
import { createSearchProfile } from "@/lib/actions/search-profiles";

export default function NewSearchProfilePage() {
  return (
    <div>
      <PageHeader title="New search profile" />
      <SearchProfileForm action={createSearchProfile} submitLabel="Create profile" />
    </div>
  );
}
