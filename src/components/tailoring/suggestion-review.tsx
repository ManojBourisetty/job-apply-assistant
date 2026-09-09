"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, X, Loader2, CheckCheck } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { approveResumeFact, rejectResumeFact, approveAllResumeFacts } from "@/lib/actions/tailoring";
import type { Tables } from "@/lib/supabase/database.types";

export function SuggestionReview({
  resumeVersionId,
  facts,
}: {
  resumeVersionId: string;
  facts: Tables<"resume_facts">[];
}) {
  const router = useRouter();
  const [pendingIds, setPendingIds] = React.useState<Set<string>>(new Set());
  const [approvingAll, startApproveAll] = React.useTransition();

  function withPending(id: string, fn: () => Promise<void>) {
    setPendingIds((prev) => new Set(prev).add(id));
    fn()
      .then(() => router.refresh())
      .catch(() => toast.error("Couldn't update this suggestion."))
      .finally(() =>
        setPendingIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        })
      );
  }

  if (facts.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          No pending suggestions. All caught up — edit the resume directly for anything else.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          size="sm"
          variant="outline"
          disabled={approvingAll}
          onClick={() =>
            startApproveAll(async () => {
              try {
                await approveAllResumeFacts(resumeVersionId);
                toast.success("All suggestions approved");
                router.refresh();
              } catch {
                toast.error("Couldn't approve all suggestions.");
              }
            })
          }
        >
          {approvingAll ? <Loader2 className="animate-spin" /> : <CheckCheck />}
          Approve all
        </Button>
      </div>

      {facts.map((fact) => {
        const isPending = pendingIds.has(fact.id);
        return (
          <Card key={fact.id}>
            <CardContent className="space-y-3 pt-6">
              <p className="text-xs font-medium uppercase text-muted-foreground">
                {fact.section === "professional_summary" ? "Professional summary" : "Experience bullet"}
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="mb-1 text-xs font-medium text-muted-foreground">Original</p>
                  <p className="rounded-md bg-muted/50 p-2 text-sm">{fact.original_text || "—"}</p>
                </div>
                <div>
                  <p className="mb-1 text-xs font-medium text-muted-foreground">Suggested</p>
                  <p className="rounded-md bg-success/10 p-2 text-sm">{fact.suggested_text}</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                <span className="font-medium">Reason: </span>
                {fact.reasoning}
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  disabled={isPending}
                  onClick={() => withPending(fact.id, () => approveResumeFact(fact.id))}
                >
                  {isPending ? <Loader2 className="animate-spin" /> : <Check />}
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isPending}
                  onClick={() => withPending(fact.id, () => rejectResumeFact(fact.id))}
                >
                  <X /> Reject
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
