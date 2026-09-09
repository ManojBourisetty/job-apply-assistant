"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EMPLOYMENT_TYPES } from "@/lib/constants";
import { statusLabel } from "@/lib/format";
import type { ActionState } from "@/lib/actions/search-profiles";
import type { Tables } from "@/lib/supabase/database.types";

export function SearchProfileForm({
  action,
  profile,
  submitLabel = "Create profile",
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  profile?: Tables<"job_search_profiles">;
  submitLabel?: string;
}) {
  const [state, formAction, isPending] = useActionState(action, {});

  return (
    <form action={formAction} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Basics</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="name">Profile name *</Label>
            <Input id="name" name="name" defaultValue={profile?.name} required placeholder="e.g. Senior SRE — Remote" />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="titles">Target titles (comma-separated)</Label>
            <Input id="titles" name="titles" defaultValue={profile?.titles?.join(", ")} placeholder="SRE, Senior SRE, Platform Engineer" />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="keywords">Keywords (comma-separated)</Label>
            <Input id="keywords" name="keywords" defaultValue={profile?.keywords?.join(", ")} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="technologies">Technologies (comma-separated)</Label>
            <Input
              id="technologies"
              name="technologies"
              defaultValue={profile?.technologies?.join(", ")}
              placeholder="AWS, Kubernetes, Terraform"
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="locations">Locations (comma-separated)</Label>
            <Input id="locations" name="locations" defaultValue={profile?.locations?.join(", ")} placeholder="Remote US, Texas" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="remote_preference">Remote preference</Label>
            <Select name="remote_preference" defaultValue={profile?.remote_preference ?? "any"}>
              <SelectTrigger id="remote_preference" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="remote">Remote</SelectItem>
                <SelectItem value="hybrid">Hybrid</SelectItem>
                <SelectItem value="onsite">On-site</SelectItem>
                <SelectItem value="any">Any</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2 pt-6">
            <Checkbox id="is_active" name="is_active" defaultChecked={profile?.is_active ?? true} />
            <Label htmlFor="is_active" className="font-normal">Active — include in daily discovery</Label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Hard filters</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="min_salary">Minimum salary</Label>
            <Input id="min_salary" name="min_salary" type="number" defaultValue={profile?.min_salary ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="max_salary">Maximum salary</Label>
            <Input id="max_salary" name="max_salary" type="number" defaultValue={profile?.max_salary ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="min_years_experience">Minimum years experience</Label>
            <Input
              id="min_years_experience"
              name="min_years_experience"
              type="number"
              step="0.5"
              defaultValue={profile?.min_years_experience ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="max_years_experience">Maximum years experience</Label>
            <Input
              id="max_years_experience"
              name="max_years_experience"
              type="number"
              step="0.5"
              defaultValue={profile?.max_years_experience ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sponsorship_requirement">Sponsorship requirement</Label>
            <Select
              name="sponsorship_requirement"
              defaultValue={profile?.sponsorship_requirement ?? "not_required"}
            >
              <SelectTrigger id="sponsorship_requirement" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="required">Required</SelectItem>
                <SelectItem value="preferred">Preferred</SelectItem>
                <SelectItem value="not_required">Not required</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Employment types</Label>
            <div className="flex flex-wrap gap-4 pt-1">
              {EMPLOYMENT_TYPES.map((type) => (
                <label key={type} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    name={`employment_${type}`}
                    defaultChecked={profile?.employment_types?.includes(type) ?? type === "full_time"}
                  />
                  {statusLabel(type)}
                </label>
              ))}
            </div>
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
