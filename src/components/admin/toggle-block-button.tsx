"use client";

import * as React from "react";
import { Ban, CircleCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { setUserBlockedStatus } from "@/lib/actions/admin";

export function ToggleBlockButton({
  userId,
  isBlocked,
  isSelf,
}: {
  userId: string;
  isBlocked: boolean;
  isSelf: boolean;
}) {
  const [blockOpen, setBlockOpen] = React.useState(false);
  const [unblockOpen, setUnblockOpen] = React.useState(false);
  const [reason, setReason] = React.useState("");
  const [pending, startTransition] = React.useTransition();

  if (isSelf) return null;

  if (isBlocked) {
    return (
      <>
        <Button variant="outline" size="sm" onClick={() => setUnblockOpen(true)}>
          <CircleCheck className="size-3.5" /> Unblock
        </Button>
        <ConfirmDialog
          open={unblockOpen}
          onOpenChange={setUnblockOpen}
          title="Unblock this user?"
          description="They will immediately regain access to their account and data."
          confirmLabel="Unblock"
          destructive={false}
          isPending={pending}
          onConfirm={() =>
            startTransition(async () => {
              try {
                await setUserBlockedStatus(userId, false);
                toast.success("User unblocked");
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Couldn't unblock user.");
              } finally {
                setUnblockOpen(false);
              }
            })
          }
        />
      </>
    );
  }

  return (
    <>
      <Button variant="destructive" size="sm" onClick={() => setBlockOpen(true)}>
        <Ban className="size-3.5" /> Block
      </Button>
      <Dialog open={blockOpen} onOpenChange={setBlockOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Block this user?</DialogTitle>
            <DialogDescription>
              They will immediately lose access to their account and all of their data — this is
              enforced at the database level, not just hidden in the app. You can unblock them at
              any time.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="block-reason">Reason (optional, visible to the user)</Label>
            <Textarea
              id="block-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Spam applications, abusive contact with recruiters, ToS violation"
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBlockOpen(false)} disabled={pending}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  try {
                    await setUserBlockedStatus(userId, true, reason);
                    toast.success("User blocked");
                    setReason("");
                  } catch (err) {
                    toast.error(err instanceof Error ? err.message : "Couldn't block user.");
                  } finally {
                    setBlockOpen(false);
                  }
                })
              }
            >
              {pending && <Loader2 className="animate-spin" />}
              Block user
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
