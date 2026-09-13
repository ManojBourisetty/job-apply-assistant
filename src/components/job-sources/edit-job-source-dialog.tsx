"use client";

import * as React from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { updateJobSource, type ActionState } from "@/lib/actions/job-sources";
import type { Tables } from "@/lib/supabase/database.types";

const initialState: ActionState = {};

export function EditJobSourceDialog({
  source,
  open,
  onOpenChange,
}: {
  source: Tables<"job_sources">;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const action = updateJobSource.bind(null, source.id);
  const [state, formAction, isPending] = useActionState(action, initialState);
  const isAdzuna = source.provider === "adzuna";
  const isWorkday = source.provider === "workday";

  const [prevState, setPrevState] = React.useState(state);
  if (prevState !== state) {
    setPrevState(state);
    if (state.success) {
      toast.success(state.success);
      onOpenChange(false);
      router.refresh();
    }
    if (state.error) toast.error(state.error);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit source</DialogTitle>
          <DialogDescription>
            Provider can&apos;t be changed here — remove this source and add a new one if you need a
            different provider.
          </DialogDescription>
        </DialogHeader>
        <form id="edit-job-source-form" action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Display name</Label>
            <Input id="edit-name" name="name" defaultValue={source.name} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-board_token">
              {isAdzuna ? "Country code" : isWorkday ? "Careers page URL" : "Board token"}
            </Label>
            <Input
              id="edit-board_token"
              name="board_token"
              defaultValue={source.board_token}
              required
            />
          </div>
          {isAdzuna && (
            <div className="space-y-2">
              <Label htmlFor="edit-search_titles">Job titles to search (comma-separated, optional)</Label>
              <Input
                id="edit-search_titles"
                name="search_titles"
                defaultValue={source.search_titles?.join(", ") ?? ""}
                placeholder="Site Reliability Engineer, DevOps Engineer"
              />
            </div>
          )}
        </form>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form="edit-job-source-form" disabled={isPending}>
            {isPending && <Loader2 className="animate-spin" />}
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
