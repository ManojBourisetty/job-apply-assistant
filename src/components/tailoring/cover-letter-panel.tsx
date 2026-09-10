"use client";

import * as React from "react";
import { Loader2, Sparkles, Save, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
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
  generateCoverLetter,
  updateCoverLetterContent,
  approveCoverLetter,
} from "@/lib/actions/cover-letters";
import type { Tables } from "@/lib/supabase/database.types";

const TONES = [
  { value: "formal", label: "Formal" },
  { value: "conversational", label: "Conversational" },
  { value: "short", label: "Short" },
  { value: "detailed", label: "Detailed" },
] as const;

export function CoverLetterPanel({
  jobId,
  initialLetter,
}: {
  jobId: string;
  initialLetter: Tables<"cover_letters"> | null;
}) {
  const [tone, setTone] = React.useState<(typeof TONES)[number]["value"]>(initialLetter?.tone as never ?? "formal");
  const [letterId, setLetterId] = React.useState(initialLetter?.id ?? null);
  const [content, setContent] = React.useState(initialLetter?.content ?? "");
  const [approved, setApproved] = React.useState(initialLetter?.approved ?? false);
  const [generating, startGenerate] = React.useTransition();
  const [saving, startSave] = React.useTransition();

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <div className="flex flex-wrap items-center gap-2">
          <Select value={tone} onValueChange={(v) => setTone(v as typeof tone)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TONES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            disabled={generating}
            onClick={() =>
              startGenerate(async () => {
                const result = await generateCoverLetter(jobId, tone);
                if ("error" in result) {
                  toast.error(result.error);
                  return;
                }
                setLetterId(result.id);
                setContent(result.content);
                setApproved(false);
                toast.success("Draft generated — review before using it.");
              })
            }
          >
            {generating ? <Loader2 className="animate-spin" /> : <Sparkles />}
            Generate draft
          </Button>
        </div>

        <Textarea
          rows={16}
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            setApproved(false);
          }}
          placeholder="Generate a draft, or write your own cover letter here."
        />

        {letterId && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={saving}
              onClick={() =>
                startSave(async () => {
                  try {
                    await updateCoverLetterContent(letterId, content);
                    toast.success("Saved");
                  } catch {
                    toast.error("Couldn't save.");
                  }
                })
              }
            >
              {saving ? <Loader2 className="animate-spin" /> : <Save />}
              Save edits
            </Button>
            <Button
              variant={approved ? "secondary" : "default"}
              size="sm"
              disabled={approved}
              onClick={async () => {
                try {
                  await approveCoverLetter(letterId);
                  setApproved(true);
                  toast.success("Marked as approved");
                } catch {
                  toast.error("Couldn't approve.");
                }
              }}
            >
              <CheckCircle2 /> {approved ? "Approved" : "Approve"}
            </Button>
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          Drafts only reference companies, roles, and achievements already in your resume — nothing
          is invented. Always read before sending.
        </p>
      </CardContent>
    </Card>
  );
}
