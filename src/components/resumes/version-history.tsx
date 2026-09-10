"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { History, RotateCcw, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { restoreResumeVersion } from "@/lib/actions/resumes";
import { formatDate } from "@/lib/format";

type Version = {
  id: string;
  version_number: number;
  change_summary: string | null;
  created_by: string;
  created_at: string;
};

export function VersionHistory({
  resumeId,
  versions,
  currentVersionId,
}: {
  resumeId: string;
  versions: Version[];
  currentVersionId: string | null;
}) {
  const router = useRouter();
  const [restoringId, setRestoringId] = React.useState<string | null>(null);
  const [isPending, startTransition] = React.useTransition();

  return (
    <div className="divide-y rounded-lg border">
      {versions.map((v) => (
        <div key={v.id} className="flex flex-wrap items-center justify-between gap-4 p-4">
          <div className="flex min-w-0 items-center gap-3">
            <History className="size-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0">
              <p className="text-sm font-medium">
                Version {v.version_number}
                {v.id === currentVersionId && (
                  <Badge variant="secondary" className="ml-2">
                    Current
                  </Badge>
                )}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {v.change_summary || "No summary"} · {formatDate(v.created_at)} ·{" "}
                {v.created_by === "ai" ? "AI-suggested" : "You"}
              </p>
            </div>
          </div>
          {v.id !== currentVersionId && (
            <Button
              variant="outline"
              size="sm"
              disabled={isPending && restoringId === v.id}
              onClick={() => {
                setRestoringId(v.id);
                startTransition(async () => {
                  try {
                    await restoreResumeVersion(resumeId, v.id);
                    toast.success(`Restored version ${v.version_number}`);
                    router.refresh();
                  } catch {
                    toast.error("Couldn't restore version.");
                  }
                });
              }}
            >
              {isPending && restoringId === v.id ? (
                <Loader2 className="animate-spin" />
              ) : (
                <RotateCcw />
              )}
              Restore
            </Button>
          )}
        </div>
      ))}
    </div>
  );
}
