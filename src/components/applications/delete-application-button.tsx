"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { deleteApplication } from "@/lib/actions/applications";

export function DeleteApplicationButton({ applicationId }: { applicationId: string }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [pending, startTransition] = React.useTransition();

  return (
    <>
      <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setOpen(true)}>
        <Trash2 /> Remove from tracker
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Remove this application?"
        description="This removes the application and its status history from your tracker. The job itself stays in your job list."
        confirmLabel="Remove"
        isPending={pending}
        onConfirm={() =>
          startTransition(async () => {
            try {
              await deleteApplication(applicationId);
              toast.success("Application removed");
              router.push("/applications");
            } catch {
              toast.error("Couldn't remove application.");
            } finally {
              setOpen(false);
            }
          })
        }
      />
    </>
  );
}
