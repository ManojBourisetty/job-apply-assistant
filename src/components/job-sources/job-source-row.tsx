"use client";

import * as React from "react";
import { RefreshCw, Trash2, Loader2, CheckCircle2, XCircle, CircleDashed } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { deleteJobSource, syncJobSource, toggleJobSourceActive } from "@/lib/actions/job-sources";
import { statusLabel, timeAgo } from "@/lib/format";
import type { Tables } from "@/lib/supabase/database.types";

const STATUS_ICON = {
  never: CircleDashed,
  success: CheckCircle2,
  error: XCircle,
};

export function JobSourceRow({ source }: { source: Tables<"job_sources"> }) {
  const [isActive, setIsActive] = React.useState(source.is_active);
  const [syncing, startSync] = React.useTransition();
  const [, startToggle] = React.useTransition();
  const [deleting, startDelete] = React.useTransition();
  const [confirmOpen, setConfirmOpen] = React.useState(false);

  const StatusIcon = STATUS_ICON[source.last_sync_status as keyof typeof STATUS_ICON] ?? CircleDashed;

  return (
    <div className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium">{source.name}</p>
          <Badge variant="outline">{statusLabel(source.provider)}</Badge>
        </div>
        <p className="truncate text-xs text-muted-foreground" title={source.board_token}>
          {source.provider === "adzuna" ? "Country" : source.provider === "workday" ? "URL" : "Token"}:{" "}
          {source.board_token}
        </p>
        <div className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
          <StatusIcon
            className={
              source.last_sync_status === "success"
                ? "size-3.5 text-success"
                : source.last_sync_status === "error"
                  ? "size-3.5 text-destructive"
                  : "size-3.5"
            }
          />
          {source.last_synced_at
            ? `Last synced ${timeAgo(source.last_synced_at)} · ${source.last_sync_job_count ?? 0} jobs`
            : "Never synced"}
          {source.last_sync_status === "error" && source.last_sync_error && (
            <span className="text-destructive">— {source.last_sync_error}</span>
          )}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2 self-end sm:self-auto">
        <Switch
          checked={isActive}
          onCheckedChange={(checked) => {
            setIsActive(checked);
            startToggle(async () => {
              try {
                await toggleJobSourceActive(source.id, checked);
              } catch {
                setIsActive(!checked);
                toast.error("Couldn't update source.");
              }
            });
          }}
        />
        <Button
          variant="outline"
          size="sm"
          disabled={syncing}
          onClick={() =>
            startSync(async () => {
              try {
                const result = await syncJobSource(source.id);
                if (result.error) {
                  toast.error(result.error);
                } else {
                  toast.success(
                    `${source.name}: ${result.added} new, ${result.updated} changed, ${result.closed} closed`
                  );
                }
              } catch {
                toast.error("Sync failed.");
              }
            })
          }
        >
          {syncing ? <Loader2 className="animate-spin" /> : <RefreshCw />}
          Sync now
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="text-destructive"
          onClick={() => setConfirmOpen(true)}
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Remove this source?"
        description="Jobs already discovered from this source stay in your job list — only future syncing stops."
        confirmLabel="Remove source"
        isPending={deleting}
        onConfirm={() =>
          startDelete(async () => {
            try {
              await deleteJobSource(source.id);
              toast.success("Source removed");
            } catch {
              toast.error("Couldn't remove source.");
            } finally {
              setConfirmOpen(false);
            }
          })
        }
      />
    </div>
  );
}
