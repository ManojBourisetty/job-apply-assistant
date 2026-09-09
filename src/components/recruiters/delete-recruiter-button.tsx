"use client";

import * as React from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { deleteRecruiter } from "@/lib/actions/recruiters";

export function DeleteRecruiterButton({ recruiterId }: { recruiterId: string }) {
  const [open, setOpen] = React.useState(false);
  const [pending, startTransition] = React.useTransition();

  return (
    <>
      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setOpen(true)}>
        <Trash2 className="size-4" />
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Delete this recruiter?"
        description="This removes the recruiter contact permanently."
        confirmLabel="Delete"
        isPending={pending}
        onConfirm={() =>
          startTransition(async () => {
            try {
              await deleteRecruiter(recruiterId);
              toast.success("Recruiter deleted");
            } catch {
              toast.error("Couldn't delete recruiter.");
            } finally {
              setOpen(false);
            }
          })
        }
      />
    </>
  );
}
