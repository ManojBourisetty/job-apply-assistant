import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { CompanyForm } from "@/components/companies/company-form";
import { updateCompany } from "@/lib/actions/companies";

export default async function EditCompanyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: company } = await supabase.from("companies").select("*").eq("id", id).maybeSingle();

  if (!company) notFound();

  return (
    <div>
      <PageHeader title="Edit company" description={company.name} />
      <CompanyForm action={updateCompany.bind(null, id)} company={company} submitLabel="Save changes" />
    </div>
  );
}
