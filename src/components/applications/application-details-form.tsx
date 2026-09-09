"use client";

import { useFormStatus } from "react-dom";
import { Loader2, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateApplicationDetails } from "@/lib/actions/applications";
import type { Tables } from "@/lib/supabase/database.types";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? <Loader2 className="animate-spin" /> : <Save />}
      Save details
    </Button>
  );
}

export function ApplicationDetailsForm({ application }: { application: Tables<"applications"> }) {
  return (
    <form action={updateApplicationDetails.bind(null, application.id)} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="date_applied">Date applied</Label>
          <Input
            id="date_applied"
            name="date_applied"
            type="date"
            defaultValue={application.date_applied ?? ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="follow_up_date">Follow-up date</Label>
          <Input
            id="follow_up_date"
            name="follow_up_date"
            type="date"
            defaultValue={application.follow_up_date ?? ""}
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="salary_discussed">Salary discussed</Label>
          <Input
            id="salary_discussed"
            name="salary_discussed"
            defaultValue={application.salary_discussed ?? ""}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" name="notes" rows={4} defaultValue={application.notes ?? ""} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="interview_feedback">Interview feedback</Label>
        <Textarea
          id="interview_feedback"
          name="interview_feedback"
          rows={3}
          defaultValue={application.interview_feedback ?? ""}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="rejection_reason">Rejection reason</Label>
        <Textarea
          id="rejection_reason"
          name="rejection_reason"
          rows={2}
          defaultValue={application.rejection_reason ?? ""}
        />
      </div>
      <SubmitButton />
    </form>
  );
}
