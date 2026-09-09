import { PageHeader } from "@/components/page-header";
import { RecruiterForm } from "@/components/recruiters/recruiter-form";
import { createRecruiter } from "@/lib/actions/recruiters";

export default function NewRecruiterPage() {
  return (
    <div>
      <PageHeader title="Add recruiter" />
      <RecruiterForm action={createRecruiter} submitLabel="Add recruiter" />
    </div>
  );
}
