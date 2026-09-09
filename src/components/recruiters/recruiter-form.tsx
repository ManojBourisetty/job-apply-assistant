"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { RECRUITER_STATUSES } from "@/lib/constants";
import { statusLabel } from "@/lib/format";
import type { ActionState } from "@/lib/actions/recruiters";
import type { Tables } from "@/lib/supabase/database.types";

export function RecruiterForm({
  action,
  recruiter,
  submitLabel = "Add recruiter",
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  recruiter?: Tables<"recruiters">;
  submitLabel?: string;
}) {
  const [state, formAction, isPending] = useActionState(action, {});

  return (
    <form action={formAction} className="space-y-6">
      <Card>
        <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input id="name" name="name" defaultValue={recruiter?.name} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="company_name">Company</Label>
            <Input id="company_name" name="company_name" defaultValue={recruiter?.company_name ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" defaultValue={recruiter?.email ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" name="phone" defaultValue={recruiter?.phone ?? ""} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="linkedin_url">LinkedIn</Label>
            <Input id="linkedin_url" name="linkedin_url" defaultValue={recruiter?.linkedin_url ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select name="status" defaultValue={recruiter?.status ?? "contacted"}>
              <SelectTrigger id="status" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RECRUITER_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {statusLabel(s)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="first_contact_date">First contact date</Label>
            <Input
              id="first_contact_date"
              name="first_contact_date"
              type="date"
              defaultValue={recruiter?.first_contact_date ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="last_contact_date">Last contact date</Label>
            <Input
              id="last_contact_date"
              name="last_contact_date"
              type="date"
              defaultValue={recruiter?.last_contact_date ?? ""}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" name="notes" rows={4} defaultValue={recruiter?.notes ?? ""} />
          </div>
        </CardContent>
      </Card>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="animate-spin" />}
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
