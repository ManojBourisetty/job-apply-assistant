import Link from "next/link";
import { KanbanSquare } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { KanbanBoard, type KanbanApplication } from "@/components/applications/kanban-board";

export const dynamic = "force-dynamic";

export default async function ApplicationsPage() {
  const supabase = await createClient();
  const { data: applications } = await supabase
    .from("applications")
    .select(
      "id, status, follow_up_date, jobs(id, title, company_name, sponsorship_status, salary_min, salary_max)"
    )
    .order("updated_at", { ascending: false });

  const kanbanApps: KanbanApplication[] = (applications ?? []).map((a) => ({
    id: a.id,
    status: a.status as KanbanApplication["status"],
    follow_up_date: a.follow_up_date,
    job: Array.isArray(a.jobs) ? a.jobs[0] ?? null : a.jobs,
  }));

  return (
    <div>
      <PageHeader
        title="Application Tracker"
        description="Drag applications between stages as your search progresses."
      />
      {kanbanApps.length > 0 ? (
        <KanbanBoard initialApplications={kanbanApps} />
      ) : (
        <EmptyState
          icon={KanbanSquare}
          title="No applications yet"
          description="Track an application from a job's detail page, or save a job first."
          action={
            <Button asChild size="sm">
              <Link href="/jobs">Browse jobs</Link>
            </Button>
          }
        />
      )}
    </div>
  );
}
