"use client";

import * as React from "react";
import Link from "next/link";
import { Bell, CheckCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { markAllNotificationsRead, markNotificationRead } from "@/lib/actions/notification-actions";
import { timeAgo } from "@/lib/format";
import type { Tables } from "@/lib/supabase/database.types";

export function NotificationsBell({ notifications }: { notifications: Tables<"notifications">[] }) {
  const [items, setItems] = React.useState(notifications);
  const [prevNotifications, setPrevNotifications] = React.useState(notifications);
  const [, startTransition] = React.useTransition();
  const unreadCount = items.filter((n) => !n.read_at).length;

  if (notifications !== prevNotifications) {
    setPrevNotifications(notifications);
    setItems(notifications);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="size-4" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-4 min-w-4 justify-center rounded-full p-0 text-[10px]"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          Notifications
          {unreadCount > 0 && (
            <button
              className="flex items-center gap-1 text-xs font-normal text-muted-foreground hover:text-foreground"
              onClick={() => {
                setItems((prev) => prev.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })));
                startTransition(() => markAllNotificationsRead());
              }}
            >
              <CheckCheck className="size-3.5" /> Mark all read
            </button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {items.length === 0 ? (
          <p className="px-2 py-4 text-center text-sm text-muted-foreground">You&apos;re all caught up.</p>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            {items.map((n) => (
              <DropdownMenuItem key={n.id} asChild className={n.read_at ? "opacity-60" : ""}>
                <Link
                  href={n.link ?? "#"}
                  onClick={() => {
                    if (!n.read_at) {
                      setItems((prev) =>
                        prev.map((x) => (x.id === n.id ? { ...x, read_at: new Date().toISOString() } : x))
                      );
                      startTransition(() => markNotificationRead(n.id));
                    }
                  }}
                  className="flex flex-col items-start gap-0.5 whitespace-normal"
                >
                  <span className="text-sm font-medium">{n.title}</span>
                  {n.body && <span className="text-xs text-muted-foreground">{n.body}</span>}
                  <span className="text-[10px] text-muted-foreground">{timeAgo(n.created_at)}</span>
                </Link>
              </DropdownMenuItem>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
