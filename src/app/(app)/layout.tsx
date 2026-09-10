import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { SidebarNav } from "@/components/app-shell/sidebar-nav";
import { Topbar } from "@/components/app-shell/topbar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [{ data: profile }, { data: notifications }] = await Promise.all([
    supabase.from("job_profiles").select("full_name, is_admin").eq("id", user.id).maybeSingle(),
    supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-64 shrink-0 border-r md:block">
        <div className="fixed h-screen w-64">
          <SidebarNav />
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          userEmail={user.email ?? ""}
          userName={profile?.full_name}
          isAdmin={profile?.is_admin ?? false}
          notifications={notifications ?? []}
        />
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
