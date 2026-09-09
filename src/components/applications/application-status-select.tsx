"use client";

import * as React from "react";
import { toast } from "sonner";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { APPLICATION_STATUS_GROUPS, type ApplicationStatus } from "@/lib/constants";
import { updateApplicationStatus } from "@/lib/actions/applications";

export function ApplicationStatusSelect({
  applicationId,
  status,
}: {
  applicationId: string;
  status: ApplicationStatus;
}) {
  const [value, setValue] = React.useState(status);
  const [, startTransition] = React.useTransition();

  return (
    <Select
      value={value}
      onValueChange={(next) => {
        const prev = value;
        setValue(next as ApplicationStatus);
        startTransition(async () => {
          try {
            await updateApplicationStatus(applicationId, next as ApplicationStatus);
          } catch {
            setValue(prev);
            toast.error("Couldn't update status.");
          }
        });
      }}
    >
      <SelectTrigger className="w-[220px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {APPLICATION_STATUS_GROUPS.map((g) => (
          <SelectItem key={g.id} value={g.id}>
            {g.title}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
