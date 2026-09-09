"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { createJobSource, type ActionState } from "@/lib/actions/job-sources";

const initialState: ActionState = {};

const PROVIDER_HINTS: Record<string, string> = {
  greenhouse: "The board token is the slug in boards.greenhouse.io/<token>",
  lever: "The board token is the slug in jobs.lever.co/<token>",
  ashby: "The board token is the slug in jobs.ashbyhq.com/<token>",
};

export function JobSourceForm() {
  const [state, formAction, isPending] = useActionState(createJobSource, initialState);

  return (
    <Card>
      <CardContent className="pt-6">
        <form action={formAction} className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">Display name *</Label>
            <Input id="name" name="name" placeholder="e.g. Airbnb" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="provider">Provider *</Label>
            <Select name="provider" defaultValue="greenhouse">
              <SelectTrigger id="provider" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="greenhouse">Greenhouse</SelectItem>
                <SelectItem value="lever">Lever</SelectItem>
                <SelectItem value="ashby">Ashby</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="board_token">Board token *</Label>
            <Input id="board_token" name="board_token" placeholder="airbnb" required />
            <p className="text-xs text-muted-foreground">
              {PROVIDER_HINTS.greenhouse} · {PROVIDER_HINTS.lever} · {PROVIDER_HINTS.ashby}
            </p>
          </div>
          {state.error && <p className="text-sm text-destructive sm:col-span-2">{state.error}</p>}
          <div className="sm:col-span-2">
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="animate-spin" />}
              Add source
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
