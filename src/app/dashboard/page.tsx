"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Me {
  name: string;
  role: "super_admin" | "manager" | "agent";
}

export default function DashboardHome() {
  const [me, setMe] = useState<Me | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setMe(d.user))
      .catch(() => null);
  }, []);

  const cards =
    me?.role === "super_admin"
      ? [
          { href: "/dashboard/upload", title: "Upload Leads", text: "Import CSV/XLSX into Elite Special or Call Sheet." },
          { href: "/dashboard/users", title: "Manage Users", text: "Create Managers & Agents, pause, delete, reset passwords." },
          { href: "/dashboard/leads", title: "All Leads", text: "Browse the full lead database across both menus." },
          { href: "/dashboard/approvals", title: "Leave Approvals", text: "Approve or decline Agent and Manager leave." },
          { href: "/dashboard/reports", title: "Reports", text: "Date-wise performance with CSV export." },
          { href: "/dashboard/statuses", title: "Custom Statuses", text: "Create and manage lead status labels." },
        ]
      : me?.role === "manager"
        ? [
            { href: "/dashboard/leads", title: "My Leads", text: "Work your assigned batch across both menus." },
            { href: "/dashboard/users", title: "Manage Agents", text: "Create Agents, pause, delete, reset passwords." },
            { href: "/dashboard/approvals", title: "Leave Approvals", text: "Approve or decline Agent leave requests." },
            { href: "/dashboard/leave", title: "Apply Leave", text: "Request a day off (max 3 per month, no Fridays)." },
            { href: "/dashboard/reports", title: "Reports", text: "Date-wise performance of every user." },
          ]
        : [
            { href: "/dashboard/leads", title: "My Leads", text: "Work your assigned batch across both menus." },
            { href: "/dashboard/leave", title: "Apply Leave", text: "Request a day off (max 3 per month, no Fridays)." },
            { href: "/dashboard/profile", title: "My Profile", text: "Update your WhatsApp number for notifications." },
          ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Welcome{me ? `, ${me.name}` : ""} 👋</h1>
      <p className="text-slate-500 mb-6">Pick a module to get started.</p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <Link key={c.href} href={c.href} className="card p-5 hover:shadow-md transition">
            <div className="font-semibold text-brand-700">{c.title}</div>
            <div className="text-sm text-slate-500 mt-1">{c.text}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
