"use client";

import * as React from "react";
import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { deleteSearchProfile, toggleSearchProfileActive } from "@/lib/actions/search-profiles";

export function ProfileRowActions({
  profileId,
  isActive,
}: {
  profileId: string;
  isActive: boolean;
}) {
  const [active, setActive] = React.useState(isActive);
  const [, startToggle] = React.useTransition();
  const [deleting, startDelete] = React.useTransition();
  const [confirmOpen, setConfirmOpen] = React.useState(false);

  return (
    <div className="flex items-center gap-2">
      <Switch
        checked={active}
        onCheckedChange={(checked) => {
          setActive(checked);
          startToggle(async () => {
            try {
              await toggleSearchProfileActive(profileId, checked);
            } catch {
              setActive(!checked);
              toast.error("Couldn't update profile.");
            }
          });
        }}
      />
      <Button variant="ghost" size="icon" asChild>
        <Link href={`/search-profiles/${profileId}/edit`}>
          <Pencil className="size-4" />
        </Link>
      </Button>
      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setConfirmOpen(true)}>
        <Trash2 className="size-4" />
      </Button>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Delete this search profile?"
        description="This permanently removes the saved search profile."
        confirmLabel="Delete"
        isPending={deleting}
        onConfirm={() =>
          startDelete(async () => {
            try {
              await deleteSearchProfile(profileId);
              toast.success("Search profile deleted");
            } catch {
              toast.error("Couldn't delete profile.");
            } finally {
              setConfirmOpen(false);
            }
          })
        }
      />
    </div>
  );
}
