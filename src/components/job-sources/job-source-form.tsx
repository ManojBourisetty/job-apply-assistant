"use client";

import * as React from "react";
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
  adzuna:
    "Enter a 2-letter country code (us, gb, ca, au, de, fr, in, nl, sg, za). Adzuna searches using the job titles from an active Job Search Profile, or your master resume's Target titles if you haven't set one up — add at least one first.",
};

export function JobSourceForm() {
  const [state, formAction, isPending] = useActionState(createJobSource, initialState);
  const [provider, setProvider] = React.useState("greenhouse");
  const [boardToken, setBoardToken] = React.useState("");
  const isAdzuna = provider === "adzuna";

  function handleProviderChange(value: string) {
    setProvider(value);
    // Helpful default, not forced — only fill it in if the field is still
    // empty, so we never clobber something the user already typed.
    if (value === "adzuna" && boardToken === "") {
      setBoardToken("us");
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form action={formAction} className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">Display name *</Label>
            <Input
              id="name"
              name="name"
              placeholder={isAdzuna ? "e.g. Adzuna – US" : "e.g. Airbnb"}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="provider">Provider *</Label>
            <Select name="provider" defaultValue="greenhouse" onValueChange={handleProviderChange}>
              <SelectTrigger id="provider" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="greenhouse">Greenhouse</SelectItem>
                <SelectItem value="lever">Lever</SelectItem>
                <SelectItem value="ashby">Ashby</SelectItem>
                <SelectItem value="adzuna">Adzuna (job title search)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="board_token">{isAdzuna ? "Country code *" : "Board token *"}</Label>
            <Input
              id="board_token"
              name="board_token"
              placeholder={isAdzuna ? "us" : "airbnb"}
              value={boardToken}
              onChange={(e) => setBoardToken(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">{PROVIDER_HINTS[provider]}</p>
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
