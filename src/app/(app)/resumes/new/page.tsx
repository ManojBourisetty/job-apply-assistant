"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { createResume, type ActionState } from "@/lib/actions/resumes";

const initialState: ActionState = {};

export default function NewResumePage() {
  const [state, formAction, isPending] = useActionState(createResume, initialState);

  return (
    <div className="mx-auto max-w-md">
      <PageHeader title="New resume" description="Give it a name. You'll fill in the details next." />
      <Card>
        <CardContent className="pt-6">
          <form action={formAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Resume name</Label>
              <Input
                id="title"
                name="title"
                placeholder="e.g. Master Resume"
                required
                autoFocus
              />
            </div>
            {state.error && <p className="text-sm text-destructive">{state.error}</p>}
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending && <Loader2 className="animate-spin" />}
              Create resume
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
