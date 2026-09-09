"use client";

import * as React from "react";
import { Bookmark, BookmarkCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { toggleSaveJob } from "@/lib/actions/jobs";

export function SaveJobButton({ jobId, isSaved }: { jobId: string; isSaved: boolean }) {
  const [pending, startTransition] = React.useTransition();
  const [saved, setSaved] = React.useState(isSaved);

  return (
    <Button
      variant={saved ? "secondary" : "outline"}
      size="sm"
      disabled={pending}
      onClick={() => {
        const next = !saved;
        setSaved(next);
        startTransition(async () => {
          try {
            await toggleSaveJob(jobId, next);
            toast.success(next ? "Job saved" : "Removed from saved jobs");
          } catch {
            setSaved(!next);
            toast.error("Couldn't update job.");
          }
        });
      }}
    >
      {pending ? (
        <Loader2 className="animate-spin" />
      ) : saved ? (
        <BookmarkCheck />
      ) : (
        <Bookmark />
      )}
      {saved ? "Saved" : "Save"}
    </Button>
  );
}
