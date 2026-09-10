"use client";

import { useActionState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { updateProfile, type ActionState } from "@/lib/actions/settings";
import type { Tables } from "@/lib/supabase/database.types";

export function ProfileForm({ profile }: { profile: Tables<"job_profiles"> | null }) {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(updateProfile, {});

  useEffect(() => {
    if (state.success) toast.success(state.success);
    if (state.error) toast.error(state.error);
  }, [state]);

  return (
    <form action={formAction} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="full_name">Full name</Label>
            <Input id="full_name" name="full_name" defaultValue={profile?.full_name ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" name="phone" defaultValue={profile?.phone ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input id="location" name="location" defaultValue={profile?.location ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="current_title">Current title</Label>
            <Input id="current_title" name="current_title" defaultValue={profile?.current_title ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="linkedin_url">LinkedIn</Label>
            <Input id="linkedin_url" name="linkedin_url" defaultValue={profile?.linkedin_url ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="github_url">GitHub</Label>
            <Input id="github_url" name="github_url" defaultValue={profile?.github_url ?? ""} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="portfolio_url">Portfolio</Label>
            <Input id="portfolio_url" name="portfolio_url" defaultValue={profile?.portfolio_url ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="years_experience">Years of experience</Label>
            <Input
              id="years_experience"
              name="years_experience"
              type="number"
              step="0.5"
              defaultValue={profile?.years_experience ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="target_titles">Target titles (comma-separated)</Label>
            <Input
              id="target_titles"
              name="target_titles"
              defaultValue={profile?.target_titles?.join(", ")}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="professional_summary">Professional summary</Label>
            <Textarea
              id="professional_summary"
              name="professional_summary"
              rows={3}
              defaultValue={profile?.professional_summary ?? ""}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <Label htmlFor="digest_enabled">Daily digest email</Label>
            <p className="text-xs text-muted-foreground">
              Sending requires an email integration — arriving in a later phase.
            </p>
          </div>
          <Switch id="digest_enabled" name="digest_enabled" defaultChecked={profile?.digest_enabled} />
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="animate-spin" />}
          Save settings
        </Button>
      </div>
    </form>
  );
}
