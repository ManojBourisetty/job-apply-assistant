import Link from "next/link";
import { ShieldCheck } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SPONSORSHIP_STATUSES } from "@/lib/constants";
import { sponsorshipBadgeVariant, statusLabel } from "@/lib/format";

const DESCRIPTIONS: Record<string, string> = {
  confirmed: "Explicitly stated by the employer or an authoritative source.",
  likely: "Strong evidence exists, but this specific role hasn't confirmed it.",
  unknown: "No reliable information available yet.",
  unlikely: "Reliable information suggests sponsorship is generally unavailable.",
  not_eligible: "The posting explicitly states sponsorship is unavailable.",
};

export default async function SponsorshipPage() {
  const supabase = await createClient();

  const [{ data: companies }, { data: jobs }] = await Promise.all([
    supabase
      .from("companies")
      .select("id, name, sponsorship_status, sponsorship_evidence, sponsorship_source")
      .order("name"),
    supabase
      .from("jobs")
      .select("id, title, company_name, sponsorship_status, sponsorship_evidence, sponsorship_source")
      .neq("sponsorship_status", "unknown")
      .order("date_discovered", { ascending: false }),
  ]);

  const hasData = (companies && companies.length > 0) || (jobs && jobs.length > 0);

  return (
    <div>
      <PageHeader
        title="Sponsorship Intelligence"
        description="A classification-based view of visa sponsorship, built from what you and your job postings record — never inferred from company size or reputation."
      />

      {!hasData ? (
        <EmptyState
          icon={ShieldCheck}
          title="No sponsorship data yet"
          description="Add sponsorship evidence on jobs and companies as you research them. Automated evidence-gathering arrives in a later phase."
          action={
            <Link href="/companies" className="text-sm font-medium underline underline-offset-4">
              Go to Company Tracker
            </Link>
          }
        />
      ) : (
        <div className="space-y-6">
          {SPONSORSHIP_STATUSES.filter((s) => s !== "unknown").map((status) => {
            const companyMatches = (companies ?? []).filter((c) => c.sponsorship_status === status);
            const jobMatches = (jobs ?? []).filter((j) => j.sponsorship_status === status);
            if (companyMatches.length === 0 && jobMatches.length === 0) return null;

            return (
              <Card key={status}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Badge variant={sponsorshipBadgeVariant(status)}>{statusLabel(status)}</Badge>
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">{DESCRIPTIONS[status]}</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {companyMatches.length > 0 && (
                    <div>
                      <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">
                        Companies
                      </p>
                      <div className="space-y-2">
                        {companyMatches.map((c) => (
                          <Link
                            key={c.id}
                            href={`/companies/${c.id}/edit`}
                            className="block rounded-md border p-3 text-sm hover:bg-accent/50"
                          >
                            <p className="font-medium">{c.name}</p>
                            {c.sponsorship_evidence && (
                              <p className="text-xs text-muted-foreground">{c.sponsorship_evidence}</p>
                            )}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                  {jobMatches.length > 0 && (
                    <div>
                      <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">Jobs</p>
                      <div className="space-y-2">
                        {jobMatches.map((j) => (
                          <Link
                            key={j.id}
                            href={`/jobs/${j.id}`}
                            className="block rounded-md border p-3 text-sm hover:bg-accent/50"
                          >
                            <p className="font-medium">{j.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {j.company_name}
                              {j.sponsorship_evidence ? ` — ${j.sponsorship_evidence}` : ""}
                            </p>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
