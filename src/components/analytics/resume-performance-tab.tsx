import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/empty-state";
import { FileText } from "lucide-react";

export type ResumePerformanceRow = {
  resumeId: string;
  title: string;
  isMaster: boolean;
  applications: number;
  responses: number;
};

export function ResumePerformanceTab({ rows }: { rows: ResumePerformanceRow[] }) {
  if (rows.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="No resume-linked applications yet"
        description="Once applications are tracked against specific resume versions, this compares their response rates."
      />
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Resume version performance</CardTitle>
        <p className="text-sm text-muted-foreground">
          Observed performance per resume — not a claim of causation.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {rows.map((r) => {
          const rate = r.applications > 0 ? Math.round((r.responses / r.applications) * 100) : 0;
          return (
            <div key={r.resumeId} className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">{r.title}</p>
                  {r.isMaster && <Badge variant="success">Master</Badge>}
                </div>
                <p className="text-xs text-muted-foreground">
                  {r.applications} application(s) · {r.responses} response(s)
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold">{rate}%</p>
                <p className="text-xs text-muted-foreground">response rate</p>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
