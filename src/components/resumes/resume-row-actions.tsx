"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Star, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { setMasterResume, deleteResume } from "@/lib/actions/resumes";

export function ResumeRowActions({
  resumeId,
  isMaster,
}: {
  resumeId: string;
  isMaster: boolean;
}) {
  const router = useRouter();
  const [settingMaster, startSetMaster] = React.useTransition();
  const [deleting, startDelete] = React.useTransition();
  const [confirmOpen, setConfirmOpen] = React.useState(false);

  return (
    <div className="flex items-center gap-1">
      {!isMaster && (
        <Button
          variant="ghost"
          size="sm"
          disabled={settingMaster}
          onClick={() =>
            startSetMaster(async () => {
              try {
                await setMasterResume(resumeId);
                toast.success("Master resume updated");
              } catch {
                toast.error("Couldn't update master resume.");
              }
            })
          }
        >
          {settingMaster ? <Loader2 className="animate-spin" /> : <Star />}
          Set as master
        </Button>
      )}
      <Button
        variant="ghost"
        size="icon"
        className="text-destructive"
        onClick={() => setConfirmOpen(true)}
      >
        <Trash2 className="size-4" />
      </Button>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Delete this resume?"
        description="This permanently deletes the resume and all of its versions."
        confirmLabel="Delete resume"
        isPending={deleting}
        onConfirm={() =>
          startDelete(async () => {
            try {
              await deleteResume(resumeId);
              toast.success("Resume deleted");
              router.refresh();
            } catch {
              toast.error("Couldn't delete resume.");
            } finally {
              setConfirmOpen(false);
            }
          })
        }
      />
    </div>
  );
}
