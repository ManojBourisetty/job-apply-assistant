"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { History, RotateCcw, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { restoreResumeVersion, deleteResumeVersion } from "@/lib/actions/resumes";
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
  const [isRestorePending, startRestoreTransition] = React.useTransition();
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [isDeletePending, startDeleteTransition] = React.useTransition();
  const [confirmTarget, setConfirmTarget] = React.useState<Version | null>(null);

  const onlyOneVersion = versions.length <= 1;

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
          <div className="flex shrink-0 items-center gap-2">
            {v.id !== currentVersionId && (
              <Button
                variant="outline"
                size="sm"
                disabled={isRestorePending && restoringId === v.id}
                onClick={() => {
                  setRestoringId(v.id);
                  startRestoreTransition(async () => {
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
                {isRestorePending && restoringId === v.id ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <RotateCcw />
                )}
                Restore
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="text-destructive"
              disabled={onlyOneVersion || (isDeletePending && deletingId === v.id)}
              title={onlyOneVersion ? "Every resume needs at least one version" : "Delete version"}
              onClick={() => setConfirmTarget(v)}
            >
              {isDeletePending && deletingId === v.id ? (
                <Loader2 className="animate-spin" />
              ) : (
                <Trash2 className="size-4" />
              )}
            </Button>
          </div>
        </div>
      ))}

      <ConfirmDialog
        open={confirmTarget !== null}
        onOpenChange={(open) => !open && setConfirmTarget(null)}
        title={`Delete version ${confirmTarget?.version_number}?`}
        description={
          confirmTarget?.id === currentVersionId
            ? "This is your current version — deleting it restores the most recent remaining version automatically. This can't be undone."
            : "This version's content will be permanently deleted. This can't be undone."
        }
        confirmLabel="Delete version"
        isPending={isDeletePending}
        onConfirm={() => {
          if (!confirmTarget) return;
          const target = confirmTarget;
          setDeletingId(target.id);
          startDeleteTransition(async () => {
            try {
              await deleteResumeVersion(resumeId, target.id);
              toast.success(`Deleted version ${target.version_number}`);
              setConfirmTarget(null);
              router.refresh();
            } catch (err) {
              toast.error(err instanceof Error ? err.message : "Couldn't delete version.");
            }
          });
        }}
      />
    </div>
  );
}
