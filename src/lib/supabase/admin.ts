import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import type { Database } from "./database.types";

// SERVICE ROLE — bypasses Row Level Security entirely. Never import this
// module from a "use client" component or expose its client to the browser.
// Every caller MUST verify the current session is an admin (via the normal
// RLS-scoped client) before using anything returned from here.

export function isServiceRoleConfigured() {
  return !!process.env.SUPABASE_SERVICE_ROLE_KEY;
}

export function createAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured.");
  }

  return createSupabaseClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
