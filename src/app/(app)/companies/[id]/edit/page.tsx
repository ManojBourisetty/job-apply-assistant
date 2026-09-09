import { notFound } from "next/navigation";
import { History } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { CompanyForm } from "@/components/companies/company-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { updateCompany } from "@/lib/actions/companies";
import { formatDate, sponsorshipBadgeVariant, statusLabel } from "@/lib/format";

export default async function EditCompanyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: company }, { data: history }] = await Promise.all([
    supabase.from("companies").select("*").eq("id", id).maybeSingle(),
    supabase
      .from("company_sponsorship_history")
      .select("from_status, to_status, changed_at")
      .eq("company_id", id)
      .order("changed_at", { ascending: false }),
  ]);

  if (!company) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Edit company" description={company.name} />
      <div className="space-y-6">
        <CompanyForm action={updateCompany.bind(null, id)} company={company} submitLabel="Save changes" />

        {history && history.length > 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="size-4" /> Sponsorship history
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {history.map((h, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <span>
                    {h.from_status ? (
                      <>
                        {statusLabel(h.from_status)} →{" "}
                        <Badge variant={sponsorshipBadgeVariant(h.to_status)}>
                          {statusLabel(h.to_status)}
                        </Badge>
                      </>
                    ) : (
                      <Badge variant={sponsorshipBadgeVariant(h.to_status)}>
                        {statusLabel(h.to_status)}
                      </Badge>
                    )}
                  </span>
                  <span className="text-xs text-muted-foreground">{formatDate(h.changed_at)}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
