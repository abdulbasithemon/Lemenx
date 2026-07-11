"use client";

import { useCallback, useEffect, useState } from "react";

interface LeaveRow {
  id: number;
  leaveDate: string;
  reason: string;
  status: string;
  decisionNote: string | null;
  createdAt: string;
  user: { id: number; name: string; role: string; email: string };
  decidedBy: { name: string } | null;
}

export default function ApprovalsPage() {
  const [leaves, setLeaves] = useState<LeaveRow[]>([]);
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"pending" | "decided">("pending");

  const load = useCallback(async () => {
    const res = await fetch("/api/leave/pending");
    const data = await res.json();
    if (res.ok) setLeaves(data.leaves);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function decide(id: number, decision: "approved" | "declined") {
    setError("");
    const res = await fetch(`/api/leave/${id}/decide`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision, note: notes[id] || "" }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed to submit decision");
      return;
    }
    load();
  }

  const shown = leaves.filter((l) => (tab === "pending" ? l.status === "pending" : l.status !== "pending"));

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold mb-4">Leave Approvals</h1>

      <div className="flex gap-2 mb-4">
        {(["pending", "decided"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`btn capitalize ${tab === t ? "bg-brand-600 text-white" : "bg-white border border-slate-300 text-slate-700"}`}
          >
            {t}
            {t === "pending" && (
              <span className="ml-1 badge bg-white/20">{leaves.filter((l) => l.status === "pending").length}</span>
            )}
          </button>
        ))}
      </div>

      {error && <div className="mb-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm p-3">{error}</div>}

      <div className="space-y-3">
        {shown.map((l) => (
          <div key={l.id} className="card p-4">
            <div className="flex flex-wrap items-center gap-3">
              <div>
                <div className="font-semibold">
                  {l.user.name}{" "}
                  <span className="badge bg-slate-100 text-slate-500 capitalize">{l.user.role}</span>
                </div>
                <div className="text-xs text-slate-400">{l.user.email}</div>
              </div>
              <div className="font-medium text-brand-700 w-28">{l.leaveDate}</div>
              <div className="text-sm text-slate-600 flex-1 min-w-[200px]">{l.reason}</div>
              <span
                className={`badge capitalize ${
                  l.status === "approved"
                    ? "bg-green-100 text-green-700"
                    : l.status === "declined"
                      ? "bg-red-100 text-red-700"
                      : "bg-amber-100 text-amber-700"
                }`}
              >
                {l.status}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <input
                className="input !w-72"
                placeholder="Optional note for the applicant…"
                value={notes[l.id] ?? ""}
                onChange={(e) => setNotes({ ...notes, [l.id]: e.target.value })}
              />
              <button className="btn bg-green-600 text-white hover:bg-green-700" onClick={() => decide(l.id, "approved")}>
                Approve
              </button>
              <button className="btn-danger" onClick={() => decide(l.id, "declined")}>
                Decline
              </button>
              {l.status !== "pending" && (
                <span className="text-xs text-slate-400">
                  Decisions can be changed — the applicant is re-notified.
                  {l.decidedBy ? ` Last decided by ${l.decidedBy.name}.` : ""}
                </span>
              )}
            </div>
          </div>
        ))}
        {shown.length === 0 && (
          <div className="card px-4 py-10 text-center text-slate-400">
            No {tab} leave applications.
          </div>
        )}
      </div>
    </div>
  );
}
