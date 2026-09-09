import Link from "next/link";
import { Wand2 } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";

export default function ResumeTailoringPage() {
  return (
    <div>
      <PageHeader
        title="Resume Tailoring"
        description="AI-assisted wording and ordering suggestions, grounded strictly in your verified resume facts."
      />
      <EmptyState
        icon={Wand2}
        badge="Coming in Phase 4"
        title="AI tailoring isn't built yet"
        description="When it ships, you'll get side-by-side suggestions for each bullet, reordered by relevance to a specific job, in Conservative, Balanced, or Aggressive modes. The AI will never invent companies, titles, technologies, or metrics — every suggestion will be traceable back to your master resume, and you'll approve each change individually. For now, edit your resume directly."
        action={
          <Button asChild size="sm" variant="outline">
            <Link href="/resumes">Go to Master Resume</Link>
          </Button>
        }
      />
    </div>
  );
}
