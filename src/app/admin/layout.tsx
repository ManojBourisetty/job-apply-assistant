import Link from "next/link";
import { redirect } from "next/navigation";
import { LayoutDashboard, Users, ArrowLeft } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

const ADMIN_NAV = [
  { title: "Overview", href: "/admin", icon: LayoutDashboard },
  { title: "Users", href: "/admin/users", icon: Users },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("job_profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.is_admin) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-64 shrink-0 border-r md:block">
        <div className="fixed flex h-screen w-64 flex-col">
          <div className="flex h-14 items-center gap-2 border-b px-4">
            <div className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Users className="size-4" />
            </div>
            <span className="font-semibold">Admin Portal</span>
          </div>
          <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-3">
            {ADMIN_NAV.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <Icon className="size-4 shrink-0" />
                  {item.title}
                </Link>
              );
            })}
          </nav>
          <div className="border-t p-2">
            <Link
              href="/dashboard"
              className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <ArrowLeft className="size-4 shrink-0" />
              Back to app
            </Link>
          </div>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur supports-backdrop-filter:bg-background/60 md:hidden">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground"
          >
            <ArrowLeft className="size-4 shrink-0" />
            App
          </Link>
          <span className="font-semibold">Admin Portal</span>
          <nav className="ml-auto flex gap-3 text-sm">
            {ADMIN_NAV.map((item) => (
              <Link key={item.href} href={item.href} className="text-muted-foreground">
                {item.title}
              </Link>
            ))}
          </nav>
        </header>
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
