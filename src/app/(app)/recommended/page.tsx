import Link from "next/link";
import { Sparkles } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";

export default function RecommendedJobsPage() {
  return (
    <div>
      <PageHeader
        title="Recommended Jobs"
        description="AI-ranked matches against your master resume, with transparent scoring."
      />
      <EmptyState
        icon={Sparkles}
        badge="Coming in Phase 4"
        title="The matching engine isn't built yet"
        description="Once the AI job matching engine ships, every job you've added will get a transparent 0–100 compatibility score, broken down by technical fit, experience, seniority, location, sponsorship, compensation, and preferences — plus a clear explanation of why it matches and what gaps remain. For now, browse and filter jobs manually."
        action={
          <Button asChild size="sm" variant="outline">
            <Link href="/jobs">Browse job discovery</Link>
          </Button>
        }
      />
    </div>
  );
}
