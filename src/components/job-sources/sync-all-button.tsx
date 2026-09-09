"use client";

import * as React from "react";
import { RefreshCw, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { syncAllActiveSources } from "@/lib/actions/job-sources";

export function SyncAllButton({ hasSources }: { hasSources: boolean }) {
  const [pending, startTransition] = React.useTransition();

  return (
    <Button
      variant="outline"
      disabled={!hasSources || pending}
      onClick={() =>
        startTransition(async () => {
          try {
            const result = await syncAllActiveSources();
            toast.success(
              `Synced ${result.sources} source(s): ${result.added} new, ${result.updated} changed, ${result.closed} closed`
            );
          } catch {
            toast.error("Sync failed.");
          }
        })
      }
    >
      {pending ? <Loader2 className="animate-spin" /> : <RefreshCw />}
      Sync all sources
    </Button>
  );
}
