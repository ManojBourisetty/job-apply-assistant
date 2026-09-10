"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { Menu, LogOut, User as UserIcon, ShieldCheck } from "lucide-react";

import { signOut } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { SidebarNav } from "./sidebar-nav";
import { ThemeToggle } from "./theme-toggle";
import { NotificationsBell } from "./notifications-bell";
import { navItems } from "./nav-items";
import type { Tables } from "@/lib/supabase/database.types";

function initials(nameOrEmail: string) {
  const trimmed = nameOrEmail.trim();
  if (!trimmed) return "U";
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function Topbar({
  userEmail,
  userName,
  isAdmin,
  notifications,
}: {
  userEmail: string;
  userName?: string | null;
  isAdmin?: boolean;
  notifications: Tables<"notifications">[];
}) {
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);
  const displayName = userName || userEmail;
  const pathname = usePathname();
  const activeItem = navItems.find((item) => {
    const basePath = item.href.split("?")[0];
    return pathname === basePath || pathname.startsWith(`${basePath}/`);
  });
  const title = activeItem?.title ?? "JobPilot";

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur supports-backdrop-filter:bg-background/60">
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={() => setMobileNavOpen(true)}
        aria-label="Open navigation"
      >
        <Menu className="size-5" />
      </Button>
      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SidebarNav onNavigate={() => setMobileNavOpen(false)} />
        </SheetContent>
      </Sheet>
      <h1 className="flex-1 truncate text-sm font-semibold md:text-base">{title}</h1>
      <NotificationsBell notifications={notifications} />
      <ThemeToggle />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="rounded-full">
            <Avatar className="size-8">
              <AvatarFallback className="text-xs">{initials(displayName)}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="truncate">{userEmail}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <a href="/settings">
              <UserIcon /> Settings
            </a>
          </DropdownMenuItem>
          {isAdmin && (
            <DropdownMenuItem asChild>
              <a href="/admin">
                <ShieldCheck /> Admin Portal
              </a>
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <form action={signOut} className="w-full">
            <DropdownMenuItem asChild variant="destructive">
              <button type="submit" className="w-full text-left">
                <LogOut /> Sign out
              </button>
            </DropdownMenuItem>
          </form>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
