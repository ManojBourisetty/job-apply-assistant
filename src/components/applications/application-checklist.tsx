"use client";

import * as React from "react";
import { toast } from "sonner";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { updateApplicationChecklistItem } from "@/lib/actions/applications";

const ITEMS: { key: string; label: string }[] = [
  { key: "resume_reviewed", label: "Resume reviewed" },
  { key: "resume_tailored", label: "Resume tailored" },
  { key: "sponsorship_checked", label: "Sponsorship checked" },
  { key: "salary_reviewed", label: "Salary reviewed" },
  { key: "location_reviewed", label: "Location reviewed" },
  { key: "application_submitted", label: "Application submitted" },
];

export function ApplicationChecklist({
  applicationId,
  checklist,
}: {
  applicationId: string;
  checklist: Record<string, boolean>;
}) {
  const [state, setState] = React.useState(checklist);

  return (
    <div className="space-y-2">
      {ITEMS.map((item) => (
        <label key={item.key} className="flex items-center gap-2">
          <Checkbox
            checked={!!state[item.key]}
            onCheckedChange={(checked) => {
              const value = checked === true;
              setState((s) => ({ ...s, [item.key]: value }));
              updateApplicationChecklistItem(applicationId, item.key, value).catch(() => {
                setState((s) => ({ ...s, [item.key]: !value }));
                toast.error("Couldn't update checklist.");
              });
            }}
          />
          <Label className="font-normal">{item.label}</Label>
        </label>
      ))}
    </div>
  );
}
