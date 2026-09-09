import { CheckCircle2, AlertTriangle } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { MATCH_WEIGHTS, type MatchBreakdown } from "@/lib/matching";

const ROWS: { key: keyof typeof MATCH_WEIGHTS; label: string }[] = [
  { key: "technical", label: "Technical" },
  { key: "experience", label: "Experience" },
  { key: "seniority", label: "Seniority" },
  { key: "location", label: "Location / Remote" },
  { key: "sponsorship", label: "Sponsorship" },
  { key: "compensation", label: "Compensation" },
  { key: "preferences", label: "Preferences" },
];

function scoreColor(total: number) {
  if (total >= 85) return "text-success";
  if (total >= 65) return "text-warning";
  return "text-muted-foreground";
}

export function MatchScoreCard({ match }: { match: MatchBreakdown }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-baseline justify-between">
          <span>Match score</span>
          <span className={`text-2xl font-bold ${scoreColor(match.total)}`}>{match.total}/100</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          {ROWS.map((row) => {
            const max = MATCH_WEIGHTS[row.key];
            const value = match[row.key];
            return (
              <div key={row.key}>
                <div className="mb-0.5 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{row.label}</span>
                  <span className="font-medium">
                    {value}/{max}
                  </span>
                </div>
                <Progress value={(value / max) * 100} className="h-1.5" />
              </div>
            );
          })}
        </div>

        {match.matched.length > 0 && (
          <div>
            <p className="mb-1.5 text-xs font-medium uppercase text-muted-foreground">
              Why this job matches
            </p>
            <ul className="space-y-1 text-sm">
              {match.matched.map((m, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-success" />
                  <span>{m}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {match.gaps.length > 0 && (
          <div>
            <p className="mb-1.5 text-xs font-medium uppercase text-muted-foreground">
              Potential gaps
            </p>
            <ul className="space-y-1 text-sm">
              {match.gaps.map((g, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-warning" />
                  <span>{g}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <p className="text-[11px] text-muted-foreground">
          Computed by comparing this job&apos;s stored fields against your master resume and active
          search profile — a transparent rule-based score, not an AI guess.
        </p>
      </CardContent>
    </Card>
  );
}
