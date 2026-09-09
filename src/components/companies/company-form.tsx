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
import { COMPANY_RELATIONSHIPS, SPONSORSHIP_STATUSES } from "@/lib/constants";
import { statusLabel } from "@/lib/format";
import type { ActionState } from "@/lib/actions/companies";
import type { Tables } from "@/lib/supabase/database.types";

export function CompanyForm({
  action,
  company,
  submitLabel = "Add company",
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  company?: Tables<"companies">;
  submitLabel?: string;
}) {
  const [state, formAction, isPending] = useActionState(action, {});

  return (
    <form action={formAction} className="space-y-6">
      <Card>
        <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="name">Company name *</Label>
            <Input id="name" name="name" defaultValue={company?.name} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input id="website" name="website" type="url" defaultValue={company?.website ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="careers_url">Careers page</Label>
            <Input id="careers_url" name="careers_url" type="url" defaultValue={company?.careers_url ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="industry">Industry</Label>
            <Input id="industry" name="industry" defaultValue={company?.industry ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="company_size">Company size</Label>
            <Input id="company_size" name="company_size" placeholder="e.g. 1000-5000" defaultValue={company?.company_size ?? ""} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="locations">Locations (comma-separated)</Label>
            <Input id="locations" name="locations" defaultValue={company?.locations?.join(", ")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="relationship">Relationship</Label>
            <Select name="relationship" defaultValue={company?.relationship ?? "none"}>
              <SelectTrigger id="relationship" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COMPANY_RELATIONSHIPS.map((r) => (
                  <SelectItem key={r} value={r}>
                    {statusLabel(r)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="sponsorship_status">Sponsorship status</Label>
            <Select name="sponsorship_status" defaultValue={company?.sponsorship_status ?? "unknown"}>
              <SelectTrigger id="sponsorship_status" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SPONSORSHIP_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {statusLabel(s)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="sponsorship_source">Sponsorship source</Label>
            <Input id="sponsorship_source" name="sponsorship_source" defaultValue={company?.sponsorship_source ?? ""} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="sponsorship_evidence">Sponsorship evidence</Label>
            <Textarea
              id="sponsorship_evidence"
              name="sponsorship_evidence"
              rows={2}
              defaultValue={company?.sponsorship_evidence ?? ""}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" name="notes" rows={4} defaultValue={company?.notes ?? ""} />
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
