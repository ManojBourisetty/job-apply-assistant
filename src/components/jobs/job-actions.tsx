"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, Send, Wand2, Mail } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { deleteJob, createApplicationFromJob } from "@/lib/actions/jobs";

export function JobActions({
  jobId,
  hasApplication,
}: {
  jobId: string;
  hasApplication: boolean;
}) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [deleting, startDelete] = React.useTransition();
  const [applying, startApply] = React.useTransition();

  return (
    <div className="flex flex-wrap items-center gap-2">
      {!hasApplication ? (
        <Button
          size="sm"
          disabled={applying}
          onClick={() =>
            startApply(async () => {
              try {
                await createApplicationFromJob(jobId);
              } catch {
                toast.error("Couldn't start tracking this application.");
              }
            })
          }
        >
          <Send /> Track application
        </Button>
      ) : (
        <Button size="sm" variant="secondary" asChild>
          <Link href="/applications">
            <Send /> View in tracker
          </Link>
        </Button>
      )}
      <Button size="sm" variant="outline" asChild>
        <Link href={`/jobs/${jobId}/tailor`}>
          <Wand2 /> Tailor resume
        </Link>
      </Button>
      <Button size="sm" variant="outline" asChild>
        <Link href={`/jobs/${jobId}/cover-letter`}>
          <Mail /> Cover letter
        </Link>
      </Button>
      <Button size="sm" variant="ghost" asChild>
        <Link href={`/jobs/${jobId}/edit`}>
          <Pencil /> Edit
        </Link>
      </Button>
      <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setConfirmOpen(true)}>
        <Trash2 /> Delete
      </Button>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Delete this job?"
        description="This removes the job and its historical record permanently. Any linked application will also be removed."
        confirmLabel="Delete job"
        isPending={deleting}
        onConfirm={() =>
          startDelete(async () => {
            try {
              await deleteJob(jobId);
              toast.success("Job deleted");
              router.push("/jobs");
            } catch {
              toast.error("Couldn't delete job.");
            } finally {
              setConfirmOpen(false);
            }
          })
        }
      />
    </div>
  );
}
