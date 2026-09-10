import Link from "next/link";
import { Plus, Sliders } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ProfileRowActions } from "@/components/search-profiles/profile-row-actions";
import { statusLabel } from "@/lib/format";

export default async function SearchProfilesPage() {
  const supabase = await createClient();
  const { data: profiles } = await supabase
    .from("job_search_profiles")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div>
      <PageHeader
        title="Job Search Profiles"
        description="Save different search configurations so you don't rebuild filters every time. Your active profile ranks jobs on the Recommended Jobs page and filters automated discovery."
        actions={
          <Button asChild>
            <Link href="/search-profiles/new">
              <Plus /> New profile
            </Link>
          </Button>
        }
      />

      {profiles && profiles.length > 0 ? (
        <div className="space-y-3">
          {profiles.map((p) => (
            <Card key={p.id}>
              <CardContent className="flex items-center justify-between gap-4 pt-6">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{p.name}</p>
                    {!p.is_active && <Badge variant="outline">Inactive</Badge>}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {p.titles.length > 0 ? p.titles.join(", ") : "Any title"} ·{" "}
                    {statusLabel(p.remote_preference)} · Sponsorship: {statusLabel(p.sponsorship_requirement)}
                  </p>
                  {p.technologies.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {p.technologies.slice(0, 6).map((t) => (
                        <Badge key={t} variant="secondary" className="text-[10px]">
                          {t}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                <ProfileRowActions profileId={p.id} isActive={p.is_active} />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Sliders}
          title="No search profiles yet"
          description="Create profiles like “Senior SRE — Remote” or “AWS DevOps — Texas” to organize how you search."
          action={
            <Button asChild size="sm">
              <Link href="/search-profiles/new">Create a profile</Link>
            </Button>
          }
        />
      )}
    </div>
  );
}
