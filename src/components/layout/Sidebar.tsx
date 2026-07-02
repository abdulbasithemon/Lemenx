"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { NAV_GROUPS } from "@/constants/navigation";
import { NotesTree } from "@/components/notes/NotesTree";
import { cn } from "@/lib/utils";

interface SidebarProps {
  workspaceName?: string;
}

export function Sidebar({ workspaceName = "Workspace" }: SidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/dashboard"
      ? pathname === href
      : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <aside className="flex h-full w-64 flex-col border-r border-border bg-card">
      {/* Workspace brand */}
      <div className="flex h-16 items-center px-6">
        <Link
          href="/dashboard"
          className="text-xl font-bold tracking-tight text-primary"
        >
          {workspaceName}
        </Link>
      </div>

      {/* Scrollable nav */}
      <nav className="scrollbar-thin flex-1 space-y-6 overflow-y-auto px-3 py-4">
        {NAV_GROUPS.map((group, i) => (
          <div key={group.heading ?? i}>
            {/* Notes tree lives between Debts and Workspace */}
            {group.heading === "Workspace" && (
              <div className="mb-6">
                <NotesTree />
              </div>
            )}
            {group.heading && (
              <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {group.heading}
              </p>
            )}
            <ul className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                        active
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      )}
                    >
                      <Icon className="h-[18px] w-[18px] shrink-0" />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Logout */}
      <div className="border-t border-border p-3">
        <Link
          href="/api/auth/signout"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          <LogOut className="h-[18px] w-[18px] shrink-0" />
          Logout
        </Link>
      </div>
    </aside>
  );
}
