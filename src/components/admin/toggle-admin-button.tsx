"use client";

import * as React from "react";
import { ShieldCheck, ShieldOff } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { setUserAdminStatus } from "@/lib/actions/admin";

export function ToggleAdminButton({
  userId,
  isAdmin,
  isSelf,
}: {
  userId: string;
  isAdmin: boolean;
  isSelf: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const [pending, startTransition] = React.useTransition();

  if (isSelf) {
    return (
      <span className="text-xs text-muted-foreground" title="You can't change your own admin status.">
        You
      </span>
    );
  }

  return (
    <>
      <Button
        variant={isAdmin ? "outline" : "secondary"}
        size="sm"
        onClick={() => setOpen(true)}
      >
        {isAdmin ? <ShieldOff className="size-3.5" /> : <ShieldCheck className="size-3.5" />}
        {isAdmin ? "Remove admin" : "Make admin"}
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={isAdmin ? "Remove admin access?" : "Grant admin access?"}
        description={
          isAdmin
            ? "This user will lose full platform visibility and management access."
            : "This user will gain full read access across every user's data and the ability to manage other admins."
        }
        confirmLabel={isAdmin ? "Remove admin" : "Make admin"}
        destructive={isAdmin}
        isPending={pending}
        onConfirm={() =>
          startTransition(async () => {
            try {
              await setUserAdminStatus(userId, !isAdmin);
              toast.success(isAdmin ? "Admin access removed" : "Admin access granted");
            } catch (err) {
              toast.error(err instanceof Error ? err.message : "Couldn't update admin status.");
            } finally {
              setOpen(false);
            }
          })
        }
      />
    </>
  );
}
