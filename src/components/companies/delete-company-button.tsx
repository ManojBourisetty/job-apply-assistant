"use client";

import * as React from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { deleteCompany } from "@/lib/actions/companies";

export function DeleteCompanyButton({ companyId }: { companyId: string }) {
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
        title="Delete this company?"
        description="This removes the company record. Jobs already linked to it keep their own details."
        confirmLabel="Delete"
        isPending={pending}
        onConfirm={() =>
          startTransition(async () => {
            try {
              await deleteCompany(companyId);
              toast.success("Company deleted");
            } catch {
              toast.error("Couldn't delete company.");
            } finally {
              setOpen(false);
            }
          })
        }
      />
    </>
  );
}
