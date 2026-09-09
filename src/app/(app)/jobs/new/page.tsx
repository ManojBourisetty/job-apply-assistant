import { PageHeader } from "@/components/page-header";
import { JobForm } from "@/components/jobs/job-form";
import { createJob } from "@/lib/actions/jobs";

export default function NewJobPage() {
  return (
    <div>
      <PageHeader
        title="Add a job"
        description="Manually add a job you found on a company careers page or job board."
      />
      <JobForm action={createJob} submitLabel="Add job" />
    </div>
  );
}
