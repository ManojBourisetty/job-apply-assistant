import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/empty-state";
import { TrendingUp } from "lucide-react";
import { statusLabel } from "@/lib/format";

export type MarketInsights = {
  totalJobs: number;
  topTechnologies: { name: string; count: number }[];
  topTitleWords: { name: string; count: number }[];
  workArrangement: Record<string, number>;
  sponsorship: Record<string, number>;
  topCompanies: { name: string; count: number }[];
  salary: { min: number; median: number; max: number; sampleSize: number } | null;
};

function formatUsd(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

export function MarketInsightsTab({ data }: { data: MarketInsights }) {
  if (data.totalJobs === 0) {
    return (
      <EmptyState
        icon={TrendingUp}
        title="No jobs to summarize yet"
        description="Once you've added or discovered jobs, this tab shows patterns across your own target market."
      />
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Your target market ({data.totalJobs} jobs)</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6 sm:grid-cols-2">
          <div>
            <p className="mb-2 text-sm font-medium">Most requested technologies</p>
            <div className="flex flex-wrap gap-1.5">
              {data.topTechnologies.map((t) => (
                <Badge key={t.name} variant="secondary">
                  {t.name} · {Math.round((t.count / data.totalJobs) * 100)}%
                </Badge>
              ))}
              {data.topTechnologies.length === 0 && (
                <p className="text-xs text-muted-foreground">No technologies recorded yet.</p>
              )}
            </div>
          </div>
          <div>
            <p className="mb-2 text-sm font-medium">Most common role keywords</p>
            <div className="flex flex-wrap gap-1.5">
              {data.topTitleWords.map((t) => (
                <Badge key={t.name} variant="outline">
                  {t.name} ({t.count})
                </Badge>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-sm font-medium">Work arrangement</p>
            <div className="space-y-1 text-sm">
              {Object.entries(data.workArrangement).map(([k, v]) => (
                <div key={k} className="flex justify-between">
                  <span className="text-muted-foreground">{statusLabel(k)}</span>
                  <span>{Math.round((v / data.totalJobs) * 100)}%</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-sm font-medium">Sponsorship availability</p>
            <div className="space-y-1 text-sm">
              {Object.entries(data.sponsorship).map(([k, v]) => (
                <div key={k} className="flex justify-between">
                  <span className="text-muted-foreground">{statusLabel(k)}</span>
                  <span>{Math.round((v / data.totalJobs) * 100)}%</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Most active companies</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.topCompanies.map((c) => (
              <div key={c.name} className="flex justify-between text-sm">
                <span>{c.name}</span>
                <span className="text-muted-foreground">{c.count} job(s)</span>
              </div>
            ))}
            {data.topCompanies.length === 0 && (
              <p className="text-xs text-muted-foreground">Not enough data yet.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Salary range</CardTitle>
          </CardHeader>
          <CardContent>
            {data.salary ? (
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Low</span>
                  <span>{formatUsd(data.salary.min)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Median</span>
                  <span>{formatUsd(data.salary.median)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">High</span>
                  <span>{formatUsd(data.salary.max)}</span>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Based on {data.salary.sampleSize} job(s) with salary listed.
                </p>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No jobs with salary data yet.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
