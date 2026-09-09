import Link from "next/link";
import { Building2, Plus } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { DeleteCompanyButton } from "@/components/companies/delete-company-button";
import { sponsorshipBadgeVariant, statusLabel } from "@/lib/format";

const RELATIONSHIP_VARIANT: Record<string, "success" | "secondary" | "destructive" | "outline"> = {
  target: "success",
  preferred: "secondary",
  sponsorship_priority: "secondary",
  avoid: "destructive",
  follow: "outline",
  none: "outline",
};

export default async function CompaniesPage() {
  const supabase = await createClient();
  const { data: companies } = await supabase
    .from("companies")
    .select("*, jobs(id)")
    .order("updated_at", { ascending: false });

  return (
    <div>
      <PageHeader
        title="Company Tracker"
        description="Track companies you're targeting, their sponsorship posture, and your history with them."
        actions={
          <Button asChild>
            <Link href="/companies/new">
              <Plus /> Add company
            </Link>
          </Button>
        }
      />

      {companies && companies.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {companies.map((company) => (
            <Card key={company.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <Link href={`/companies/${company.id}/edit`} className="font-medium hover:underline">
                      {company.name}
                    </Link>
                    <p className="text-xs text-muted-foreground">{company.industry || "—"}</p>
                  </div>
                  <DeleteCompanyButton companyId={company.id} />
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {company.relationship !== "none" && (
                    <Badge variant={RELATIONSHIP_VARIANT[company.relationship]}>
                      {statusLabel(company.relationship)}
                    </Badge>
                  )}
                  <Badge variant={sponsorshipBadgeVariant(company.sponsorship_status)}>
                    {statusLabel(company.sponsorship_status)}
                  </Badge>
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  {Array.isArray(company.jobs) ? company.jobs.length : 0} job(s) tracked
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Building2}
          title="No companies tracked yet"
          description="Add companies you're targeting to track sponsorship posture and your history with them."
          action={
            <Button asChild size="sm">
              <Link href="/companies/new">Add a company</Link>
            </Button>
          }
        />
      )}
    </div>
  );
}
