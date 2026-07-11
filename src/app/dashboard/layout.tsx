"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

interface Me {
  id: number;
  name: string;
  email: string;
  role: "super_admin" | "manager" | "agent";
  whatsappNumber: string | null;
}

interface Notice {
  id: number;
  message: string;
  isRead: boolean;
  createdAt: string;
}

const NAV: { href: string; label: string; roles: string[] }[] = [
  { href: "/dashboard", label: "Overview", roles: ["super_admin", "manager", "agent"] },
  { href: "/dashboard/leads", label: "Leads", roles: ["super_admin", "manager", "agent"] },
  { href: "/dashboard/upload", label: "Upload Leads", roles: ["super_admin"] },
  { href: "/dashboard/statuses", label: "Statuses", roles: ["super_admin"] },
  { href: "/dashboard/users", label: "Manage Users", roles: ["super_admin", "manager"] },
  { href: "/dashboard/leave", label: "Apply Leave", roles: ["manager", "agent"] },
  { href: "/dashboard/approvals", label: "Leave Approvals", roles: ["super_admin", "manager"] },
  { href: "/dashboard/reports", label: "Reports", roles: ["super_admin", "manager"] },
  { href: "/dashboard/profile", label: "My Profile", roles: ["super_admin", "manager", "agent"] },
];

const ROLE_LABEL: Record<string, string> = {
  super_admin: "Super Admin",
  manager: "Manager",
  agent: "Agent",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [unread, setUnread] = useState(0);
  const [bellOpen, setBellOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);

  const loadNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) return;
      const data = await res.json();
      setNotices(data.notifications);
      setUnread(data.unread);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setMe(d.user))
      .catch(() => router.push("/login"));
    loadNotifications();
    const t = setInterval(loadNotifications, 30000);
    return () => clearInterval(t);
  }, [loadNotifications, router]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) setBellOpen(false);
    }
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  async function openBell() {
    const next = !bellOpen;
    setBellOpen(next);
    if (next && unread > 0) {
      await fetch("/api/notifications", { method: "POST" });
      setUnread(0);
    }
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const nav = NAV.filter((item) => !me || item.roles.includes(me.role));

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-60 bg-slate-900 text-slate-200 flex flex-col transform transition-transform lg:translate-x-0 ${
          menuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="px-5 py-5 border-b border-slate-800">
          <div className="text-xl font-bold text-white">Lemenx Office</div>
          {me && (
            <div className="mt-1 text-xs text-slate-400">
              {me.name} · {ROLE_LABEL[me.role]}
            </div>
          )}
        </div>
        <nav className="flex-1 py-4 space-y-1 px-3 overflow-y-auto">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMenuOpen(false)}
              className={`block rounded-lg px-3 py-2 text-sm ${
                pathname === item.href
                  ? "bg-brand-600 text-white"
                  : "hover:bg-slate-800 text-slate-300"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t border-slate-800">
          <button onClick={logout} className="w-full btn bg-slate-800 text-slate-200 hover:bg-slate-700">
            Sign out
          </button>
        </div>
      </aside>
      {menuOpen && (
        <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={() => setMenuOpen(false)} />
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-20">
          <button className="lg:hidden btn-secondary" onClick={() => setMenuOpen(true)}>
            ☰
          </button>
          <div className="text-sm text-slate-500 hidden lg:block">
            {new Date().toLocaleDateString("en-GB", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </div>
          <div className="relative" ref={bellRef}>
            <button onClick={openBell} className="relative btn-secondary" aria-label="Notifications">
              🔔
              {unread > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-red-600 text-white text-[10px] rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                  {unread}
                </span>
              )}
            </button>
            {bellOpen && (
              <div className="absolute right-0 mt-2 w-80 card p-2 max-h-96 overflow-y-auto z-50">
                <div className="text-sm font-semibold px-2 py-1">Notifications</div>
                {notices.length === 0 && (
                  <div className="text-sm text-slate-400 px-2 py-4 text-center">No notifications yet.</div>
                )}
                {notices.map((n) => (
                  <div key={n.id} className="px-2 py-2 border-t border-slate-100 text-sm">
                    <div className={n.isRead ? "text-slate-600" : "text-slate-900 font-medium"}>
                      {n.message}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      {new Date(n.createdAt).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </header>
        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
