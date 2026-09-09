"use client";

import * as React from "react";
import { useActionState } from "react";
import { CalendarClock, Loader2, Plus, Trash2, Video } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { createInterview, deleteInterview, updateInterviewResult, type ActionState } from "@/lib/actions/interviews";
import { formatDate, statusLabel } from "@/lib/format";
import type { Tables } from "@/lib/supabase/database.types";

const STAGES = [
  "recruiter_screen",
  "technical_interview",
  "hiring_manager_interview",
  "final_interview",
];

const RESULT_VARIANT: Record<string, "success" | "destructive" | "secondary" | "outline"> = {
  passed: "success",
  failed: "destructive",
  cancelled: "outline",
  pending: "secondary",
};

function AddInterviewForm({ applicationId, onDone }: { applicationId: string; onDone: () => void }) {
  const boundAction = createInterview.bind(null, applicationId);
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(boundAction, {});

  React.useEffect(() => {
    if (state.success) {
      toast.success(state.success);
      onDone();
    }
  }, [state, onDone]);

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="stage">Stage</Label>
          <Select name="stage" defaultValue="technical_interview">
            <SelectTrigger id="stage" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STAGES.map((s) => (
                <SelectItem key={s} value={s}>
                  {statusLabel(s)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="scheduled_at">Date &amp; time</Label>
          <Input id="scheduled_at" name="scheduled_at" type="datetime-local" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="interviewer_name">Interviewer</Label>
          <Input id="interviewer_name" name="interviewer_name" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="meeting_url">Meeting URL</Label>
          <Input id="meeting_url" name="meeting_url" type="url" />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="topics">Topics (comma-separated)</Label>
          <Input id="topics" name="topics" placeholder="System design, Kubernetes, Behavioral" />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="preparation_notes">Preparation notes</Label>
          <Textarea id="preparation_notes" name="preparation_notes" rows={3} />
        </div>
      </div>
      <input type="hidden" name="result" value="pending" />
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" disabled={isPending}>
        {isPending && <Loader2 className="animate-spin" />}
        Add interview
      </Button>
    </form>
  );
}

export function InterviewSection({
  applicationId,
  interviews,
}: {
  applicationId: string;
  interviews: Tables<"interviews">[];
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <div className="space-y-3">
      {interviews.length === 0 ? (
        <p className="text-sm text-muted-foreground">No interviews scheduled yet.</p>
      ) : (
        interviews.map((interview) => (
          <div key={interview.id} className="rounded-lg border p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarClock className="size-4 text-muted-foreground" />
                <span className="font-medium">{statusLabel(interview.stage)}</span>
                <Select
                  value={interview.result}
                  onValueChange={(v) =>
                    updateInterviewResult(
                      interview.id,
                      applicationId,
                      v as "pending" | "passed" | "failed" | "cancelled"
                    )
                  }
                >
                  <SelectTrigger size="sm" className="h-6 w-auto border-none px-1.5 shadow-none">
                    <Badge variant={RESULT_VARIANT[interview.result]}>{statusLabel(interview.result)}</Badge>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="passed">Passed</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive"
                onClick={() =>
                  deleteInterview(interview.id, applicationId).catch(() =>
                    toast.error("Couldn't remove interview.")
                  )
                }
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
            <div className="mt-1.5 space-y-0.5 text-sm text-muted-foreground">
              {interview.scheduled_at && <p>{formatDate(interview.scheduled_at)}</p>}
              {interview.interviewer_name && <p>Interviewer: {interview.interviewer_name}</p>}
              {interview.meeting_url && (
                <a
                  href={interview.meeting_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-foreground hover:underline"
                >
                  <Video className="size-3.5" /> Join meeting
                </a>
              )}
              {interview.topics.length > 0 && <p>Topics: {interview.topics.join(", ")}</p>}
            </div>
          </div>
        ))
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Plus /> Add interview
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add interview</DialogTitle>
          </DialogHeader>
          <AddInterviewForm applicationId={applicationId} onDone={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
