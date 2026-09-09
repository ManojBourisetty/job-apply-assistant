"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Wand2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { startResumeTailoring } from "@/lib/actions/tailoring";

const MODES = [
  { value: "conservative", label: "Conservative", description: "Only minor wording changes." },
  { value: "balanced", label: "Balanced", description: "Rewrite bullets and align terminology." },
  {
    value: "aggressive",
    label: "Aggressive",
    description: "Optimize heavily for ATS keyword alignment, still zero fabrication.",
  },
] as const;

export function TailorStartForm({ jobId }: { jobId: string }) {
  const router = useRouter();
  const [mode, setMode] = React.useState<"conservative" | "balanced" | "aggressive">("balanced");
  const [pending, startTransition] = React.useTransition();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tailor this resume</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <RadioGroup value={mode} onValueChange={(v) => setMode(v as typeof mode)}>
          {MODES.map((m) => (
            <label key={m.value} className="flex items-start gap-3 rounded-lg border p-3">
              <RadioGroupItem value={m.value} className="mt-0.5" />
              <div>
                <p className="text-sm font-medium">{m.label}</p>
                <p className="text-xs text-muted-foreground">{m.description}</p>
              </div>
            </label>
          ))}
        </RadioGroup>

        <Button
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const result = await startResumeTailoring(jobId, mode);
              if ("error" in result) {
                toast.error(result.error);
                return;
              }
              toast.success("Suggestions generated — nothing is applied until you approve it.");
              router.push(`/resumes/${result.resumeId}/tailor`);
            })
          }
        >
          {pending ? <Loader2 className="animate-spin" /> : <Wand2 />}
          Generate suggestions
        </Button>
        <p className="text-xs text-muted-foreground">
          The AI only rewords or reorders bullets already in your master resume — it never invents
          companies, titles, technologies, or metrics. You approve every change individually.
        </p>
      </CardContent>
    </Card>
  );
}
