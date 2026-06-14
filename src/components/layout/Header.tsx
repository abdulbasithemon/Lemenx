"use client";

import { Bell, Search } from "lucide-react";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { Button } from "@/components/ui/button";
import { getInitials } from "@/lib/utils";

interface HeaderProps {
  userName?: string;
  userEmail?: string;
}

export function Header({ userName = "Admin", userEmail }: HeaderProps) {
  return (
    <header className="flex h-16 items-center gap-4 border-b border-border bg-card/80 px-6 backdrop-blur">
      {/* Search */}
      <div className="relative hidden flex-1 md:block">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          placeholder="Search transactions, notes, anything…"
          className="h-10 w-full max-w-md rounded-lg border border-input bg-background pl-9 pr-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      <div className="ml-auto flex items-center gap-2">
        <Button variant="ghost" size="icon" aria-label="Notifications">
          <Bell className="h-5 w-5" />
        </Button>
        <ThemeToggle />

        {/* User chip */}
        <div className="flex items-center gap-3 rounded-lg px-2 py-1">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
            {getInitials(userName)}
          </div>
          <div className="hidden text-left sm:block">
            <p className="text-sm font-medium leading-none">{userName}</p>
            {userEmail && (
              <p className="text-xs text-muted-foreground">{userEmail}</p>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
