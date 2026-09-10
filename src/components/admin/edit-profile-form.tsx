"use client";

import { useActionState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { updateUserProfileAsAdmin, type ActionState } from "@/lib/actions/admin";
import type { Tables } from "@/lib/supabase/database.types";

export function AdminEditProfileForm({ profile }: { profile: Tables<"job_profiles"> }) {
  const updateForThisUser = updateUserProfileAsAdmin.bind(null, profile.id);
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    updateForThisUser,
    {}
  );

  useEffect(() => {
    if (state.success) toast.success(state.success);
    if (state.error) toast.error(state.error);
  }, [state]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Edit profile details</CardTitle>
        <p className="text-xs text-muted-foreground">
          Login email and password can&apos;t be changed here — only the user can update those.
        </p>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="full_name">Full name</Label>
            <Input id="full_name" name="full_name" defaultValue={profile.full_name ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input id="username" name="username" defaultValue={profile.username ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" name="phone" defaultValue={profile.phone ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input id="location" name="location" defaultValue={profile.location ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="current_title">Current title</Label>
            <Input id="current_title" name="current_title" defaultValue={profile.current_title ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="years_experience">Years of experience</Label>
            <Input
              id="years_experience"
              name="years_experience"
              type="number"
              step="0.5"
              defaultValue={profile.years_experience ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="linkedin_url">LinkedIn</Label>
            <Input id="linkedin_url" name="linkedin_url" defaultValue={profile.linkedin_url ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="github_url">GitHub</Label>
            <Input id="github_url" name="github_url" defaultValue={profile.github_url ?? ""} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="portfolio_url">Portfolio</Label>
            <Input id="portfolio_url" name="portfolio_url" defaultValue={profile.portfolio_url ?? ""} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="target_titles">Target titles (comma-separated)</Label>
            <Input id="target_titles" name="target_titles" defaultValue={profile.target_titles?.join(", ")} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="professional_summary">Professional summary</Label>
            <Textarea
              id="professional_summary"
              name="professional_summary"
              rows={4}
              defaultValue={profile.professional_summary ?? ""}
            />
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="animate-spin" />}
              Save changes
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
