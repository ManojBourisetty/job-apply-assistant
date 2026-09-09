import { PageHeader } from "@/components/page-header";
import { CompanyForm } from "@/components/companies/company-form";
import { createCompany } from "@/lib/actions/companies";

export default function NewCompanyPage() {
  return (
    <div>
      <PageHeader title="Add company" />
      <CompanyForm action={createCompany} submitLabel="Add company" />
    </div>
  );
}
