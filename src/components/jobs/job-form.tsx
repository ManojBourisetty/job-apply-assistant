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
import {
  EMPLOYMENT_TYPES,
  JOB_SOURCES,
  SPONSORSHIP_STATUSES,
  WORK_ARRANGEMENTS,
} from "@/lib/constants";
import { statusLabel } from "@/lib/format";
import type { ActionState } from "@/lib/actions/jobs";
import type { Tables } from "@/lib/supabase/database.types";

export function JobForm({
  action,
  job,
  submitLabel = "Add job",
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  job?: Tables<"jobs">;
  submitLabel?: string;
}) {
  const [state, formAction, isPending] = useActionState(action, {});

  return (
    <form action={formAction} className="space-y-6">
      <Card>
        <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="title">Job title *</Label>
            <Input id="title" name="title" defaultValue={job?.title} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="company_name">Company *</Label>
            <Input id="company_name" name="company_name" defaultValue={job?.company_name} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="job_url">Job posting URL</Label>
            <Input id="job_url" name="job_url" type="url" defaultValue={job?.job_url ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="application_url">Official application URL</Label>
            <Input
              id="application_url"
              name="application_url"
              type="url"
              defaultValue={job?.application_url ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input id="location" name="location" defaultValue={job?.location ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="work_arrangement">Work arrangement</Label>
            <Select name="work_arrangement" defaultValue={job?.work_arrangement ?? undefined}>
              <SelectTrigger id="work_arrangement" className="w-full">
                <SelectValue placeholder="Select arrangement" />
              </SelectTrigger>
              <SelectContent>
                {WORK_ARRANGEMENTS.map((w) => (
                  <SelectItem key={w} value={w}>
                    {statusLabel(w)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="employment_type">Employment type</Label>
            <Select name="employment_type" defaultValue={job?.employment_type ?? "full_time"}>
              <SelectTrigger id="employment_type" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EMPLOYMENT_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {statusLabel(t)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="source">Source</Label>
            <Select name="source" defaultValue={job?.source ?? "manual"}>
              <SelectTrigger id="source" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {JOB_SOURCES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {statusLabel(s)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="posted_date">Posted date</Label>
            <Input id="posted_date" name="posted_date" type="date" defaultValue={job?.posted_date ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="salary_min">Minimum salary</Label>
            <Input id="salary_min" name="salary_min" type="number" defaultValue={job?.salary_min ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="salary_max">Maximum salary</Label>
            <Input id="salary_max" name="salary_max" type="number" defaultValue={job?.salary_max ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="salary_currency">Currency</Label>
            <Input
              id="salary_currency"
              name="salary_currency"
              defaultValue={job?.salary_currency ?? "USD"}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="min_years_experience">Min. years experience</Label>
            <Input
              id="min_years_experience"
              name="min_years_experience"
              type="number"
              step="0.5"
              defaultValue={job?.min_years_experience ?? ""}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="education_requirement">Education requirement</Label>
            <Input
              id="education_requirement"
              name="education_requirement"
              defaultValue={job?.education_requirement ?? ""}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="technologies">Technologies (comma-separated)</Label>
            <Input
              id="technologies"
              name="technologies"
              defaultValue={job?.technologies?.join(", ") ?? ""}
              placeholder="AWS, Kubernetes, Terraform"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="grid gap-4 pt-6">
          <div className="space-y-2">
            <Label htmlFor="description">Job description</Label>
            <Textarea id="description" name="description" rows={6} defaultValue={job?.description ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="requirements">Requirements</Label>
            <Textarea id="requirements" name="requirements" rows={4} defaultValue={job?.requirements ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="preferred_qualifications">Preferred qualifications</Label>
            <Textarea
              id="preferred_qualifications"
              name="preferred_qualifications"
              rows={4}
              defaultValue={job?.preferred_qualifications ?? ""}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="sponsorship_status">Sponsorship status</Label>
            <Select name="sponsorship_status" defaultValue={job?.sponsorship_status ?? "unknown"}>
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
            <p className="text-xs text-muted-foreground">
              Only mark Confirmed if the posting or company explicitly states it.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="sponsorship_source">Sponsorship source</Label>
            <Input
              id="sponsorship_source"
              name="sponsorship_source"
              placeholder="e.g. job posting, company FAQ, H1B database"
              defaultValue={job?.sponsorship_source ?? ""}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="sponsorship_evidence">Sponsorship evidence</Label>
            <Textarea
              id="sponsorship_evidence"
              name="sponsorship_evidence"
              rows={2}
              placeholder="Quote or note the exact evidence for this classification."
              defaultValue={job?.sponsorship_evidence ?? ""}
            />
          </div>
        </CardContent>
      </Card>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="animate-spin" />}
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
