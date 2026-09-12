import { NextResponse } from "next/server";

import { createAdminClient, isServiceRoleConfigured } from "@/lib/supabase/admin";
import { performSourceSync } from "@/lib/job-sync";

export const maxDuration = 300;

// Daily automated sync for every user's active job sources (Adzuna title
// searches and ATS boards alike) — triggered by Vercel Cron (see
// vercel.json). Runs with the service-role client since there's no signed-in
// user session in a cron invocation; every write still targets a specific
// source's own user_id, same as the user-triggered sync.
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isServiceRoleConfigured()) {
    return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY is not configured." }, { status: 500 });
  }

  const supabase = createAdminClient();
  const { data: sources, error } = await supabase
    .from("job_sources")
    .select("*")
    .eq("is_active", true);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let synced = 0;
  let failed = 0;
  let added = 0;
  let updated = 0;
  let closed = 0;

  for (const source of sources ?? []) {
    try {
      const result = await performSourceSync(supabase, source.user_id, source);
      if (result.error) {
        failed++;
      } else {
        synced++;
        added += result.added;
        updated += result.updated;
        closed += result.closed;
      }
    } catch {
      failed++;
    }
  }

  return NextResponse.json({
    total: sources?.length ?? 0,
    synced,
    failed,
    added,
    updated,
    closed,
  });
}
