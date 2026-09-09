import Link from "next/link";
import { Bookmark, Plus, Radar, Search as SearchIcon, ExternalLink } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { SaveJobButton } from "@/components/jobs/save-job-button";
import {
  SPONSORSHIP_STATUSES,
  WORK_ARRANGEMENTS,
} from "@/lib/constants";
import { formatSalary, sponsorshipBadgeVariant, statusLabel, timeAgo } from "@/lib/format";

const PAGE_SIZE = 20;

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : "";
  const saved = params.saved === "true";
  const sponsorship = typeof params.sponsorship === "string" ? params.sponsorship : "";
  const workArrangement = typeof params.work === "string" ? params.work : "";
  const sort = typeof params.sort === "string" ? params.sort : "recent";
  const page = Math.max(1, Number(params.page) || 1);
  const showClosed = params.showClosed === "true";
  const freshness = typeof params.freshness === "string" ? params.freshness : "";
  const now = new Date();

  const supabase = await createClient();

  let query = supabase.from("jobs").select("*", { count: "exact" });

  if (q) {
    query = query.or(`title.ilike.%${q}%,company_name.ilike.%${q}%`);
  }
  if (saved) {
    query = query.eq("is_saved", true);
  }
  if (sponsorship) {
    query = query.eq("sponsorship_status", sponsorship);
  }
  if (workArrangement) {
    query = query.eq("work_arrangement", workArrangement);
  }
  if (!showClosed) {
    query = query.neq("status", "closed");
  }
  if (freshness) {
    const hoursMap: Record<string, number> = { "24h": 24, "3d": 72, "7d": 168, "14d": 336, "30d": 720 };
    const hours = hoursMap[freshness];
    if (hours) {
      const since = new Date(now.getTime() - hours * 3600000).toISOString();
      query = query.gte("date_discovered", since);
    }
  }

  if (sort === "oldest") {
    query = query.order("date_discovered", { ascending: true });
  } else if (sort === "title") {
    query = query.order("title", { ascending: true });
  } else {
    query = query.order("date_discovered", { ascending: false });
  }

  const from = (page - 1) * PAGE_SIZE;
  const { data: jobs, count } = await query.range(from, from + PAGE_SIZE - 1);

  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

  function buildHref(overrides: Record<string, string | undefined>) {
    const next = new URLSearchParams();
    if (q) next.set("q", q);
    if (saved) next.set("saved", "true");
    if (sponsorship) next.set("sponsorship", sponsorship);
    if (workArrangement) next.set("work", workArrangement);
    if (sort !== "recent") next.set("sort", sort);
    if (showClosed) next.set("showClosed", "true");
    if (freshness) next.set("freshness", freshness);
    Object.entries(overrides).forEach(([k, v]) => {
      if (v === undefined) next.delete(k);
      else next.set(k, v);
    });
    const s = next.toString();
    return s ? `/jobs?${s}` : "/jobs";
  }

  return (
    <div>
      <PageHeader
        title={saved ? "Saved Jobs" : "Job Discovery"}
        description={
          saved
            ? "Jobs you've bookmarked for later review."
            : "Jobs discovered automatically from connected career pages, plus anything you've added manually."
        }
        actions={
          <>
            <Button variant="outline" asChild>
              <Link href="/jobs/sources">
                <Radar /> Job sources
              </Link>
            </Button>
            <Button asChild>
              <Link href="/jobs/new">
                <Plus /> Add a job
              </Link>
            </Button>
          </>
        }
      />

      <form className="mb-4 flex flex-wrap items-center gap-2" action="/jobs">
        {saved && <input type="hidden" name="saved" value="true" />}
        <div className="relative flex-1 min-w-[200px]">
          <SearchIcon className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input name="q" defaultValue={q} placeholder="Search title or company…" className="pl-8" />
        </div>
        <Select name="sponsorship" defaultValue={sponsorship || "any"}>
          <SelectTrigger className="w-[170px]">
            <SelectValue placeholder="Sponsorship" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any sponsorship</SelectItem>
            {SPONSORSHIP_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {statusLabel(s)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select name="work" defaultValue={workArrangement || "any"}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Work type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any work type</SelectItem>
            {WORK_ARRANGEMENTS.map((w) => (
              <SelectItem key={w} value={w}>
                {statusLabel(w)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select name="freshness" defaultValue={freshness || "any"}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Freshness" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any time</SelectItem>
            <SelectItem value="24h">Last 24 hours</SelectItem>
            <SelectItem value="3d">Last 3 days</SelectItem>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="14d">Last 14 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
          </SelectContent>
        </Select>
        <Select name="sort" defaultValue={sort}>
          <SelectTrigger className="w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Newest first</SelectItem>
            <SelectItem value="oldest">Oldest first</SelectItem>
            <SelectItem value="title">Title A–Z</SelectItem>
          </SelectContent>
        </Select>
        <label className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <input type="checkbox" name="showClosed" value="true" defaultChecked={showClosed} className="size-4" />
          Show closed
        </label>
        <Button type="submit" variant="secondary">
          Apply
        </Button>
      </form>

      {jobs && jobs.length > 0 ? (
        <div className="space-y-3">
          {jobs.map((job) => (
            <Card key={job.id}>
              <CardContent className="flex flex-col gap-3 pt-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 flex-1">
                  <Link href={`/jobs/${job.id}`} className="font-medium hover:underline">
                    {job.title}
                  </Link>
                  <p className="text-sm text-muted-foreground">
                    {job.company_name}
                    {job.location ? ` · ${job.location}` : ""}
                    {job.work_arrangement ? ` · ${statusLabel(job.work_arrangement)}` : ""}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {job.status === "closed" && <Badge variant="destructive">May have closed</Badge>}
                    <Badge variant={sponsorshipBadgeVariant(job.sponsorship_status)}>
                      Sponsorship: {statusLabel(job.sponsorship_status)}
                    </Badge>
                    {job.source !== "manual" && (
                      <Badge variant="outline">{statusLabel(job.source)}</Badge>
                    )}
                    {formatSalary(job.salary_min, job.salary_max, job.salary_currency) && (
                      <Badge variant="outline">
                        {formatSalary(job.salary_min, job.salary_max, job.salary_currency)}
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      Discovered {timeAgo(job.date_discovered)}
                    </span>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2 self-end sm:self-auto">
                  <SaveJobButton jobId={job.id} isSaved={job.is_saved} />
                  {job.job_url && (
                    <Button variant="ghost" size="icon" asChild>
                      <a href={job.job_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="size-4" />
                      </a>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <Button variant="outline" size="sm" disabled={page <= 1} asChild={page > 1}>
                {page > 1 ? (
                  <Link href={buildHref({ page: String(page - 1) })}>Previous</Link>
                ) : (
                  <span>Previous</span>
                )}
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <Button variant="outline" size="sm" disabled={page >= totalPages} asChild={page < totalPages}>
                {page < totalPages ? (
                  <Link href={buildHref({ page: String(page + 1) })}>Next</Link>
                ) : (
                  <span>Next</span>
                )}
              </Button>
            </div>
          )}
        </div>
      ) : (
        <EmptyState
          icon={saved ? Bookmark : SearchIcon}
          title={saved ? "No saved jobs" : "No jobs found"}
          description={
            saved
              ? "Save jobs from the discovery list to review them here."
              : "Add jobs manually, or adjust your filters."
          }
          action={
            <Button asChild size="sm">
              <Link href="/jobs/new">Add a job</Link>
            </Button>
          }
        />
      )}
    </div>
  );
}
