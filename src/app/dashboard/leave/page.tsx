"use client";

import { useCallback, useEffect, useState } from "react";

interface Leave {
  id: number;
  leaveDate: string;
  reason: string;
  status: string;
  decisionNote: string | null;
  decidedBy: { name: string } | null;
  createdAt: string;
}

function isFriday(dateStr: string): boolean {
  return new Date(dateStr + "T00:00:00Z").getUTCDay() === 5;
}

export default function LeavePage() {
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [date, setDate] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/leave");
    const data = await res.json();
    if (res.ok) setLeaves(data.leaves);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function onDateChange(value: string) {
    setError("");
    if (value && isFriday(value)) {
      setError("Fridays cannot be selected for leave. Please pick another day.");
      setDate("");
      return;
    }
    setDate(value);
  }

  async function apply(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setInfo("");
    const res = await fetch("/api/leave", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leaveDate: date, reason }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed to apply");
      return;
    }
    setInfo("Leave application submitted. You will be notified once it is decided.");
    setDate("");
    setReason("");
    load();
  }

  const badge = (status: string) =>
    status === "approved"
      ? "bg-green-100 text-green-700"
      : status === "declined"
        ? "bg-red-100 text-red-700"
        : "bg-amber-100 text-amber-700";

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold mb-4">Apply for Leave</h1>

      <form onSubmit={apply} className="card p-6 space-y-4 mb-6">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Leave Date (one day per application)</label>
            <input
              type="date"
              className="input"
              value={date}
              min={today}
              onChange={(e) => onDateChange(e.target.value)}
              required
            />
            <p className="text-xs text-slate-500 mt-1">
              Fridays are not selectable. Maximum 3 leave days per calendar month.
            </p>
          </div>
          <div>
            <label className="label">Reason / Note (required)</label>
            <textarea
              className="input min-h-[80px]"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why do you need this day off?"
              required
            />
          </div>
        </div>
        {error && <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm p-3">{error}</div>}
        {info && <div className="rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm p-3">{info}</div>}
        <button className="btn-primary" type="submit">Submit Application</button>
      </form>

      <h2 className="font-semibold mb-2">My Applications</h2>
      <div className="card divide-y divide-slate-100">
        {leaves.map((l) => (
          <div key={l.id} className="px-4 py-3 flex flex-wrap items-center gap-3">
            <div className="font-medium w-28">{l.leaveDate}</div>
            <span className={`badge ${badge(l.status)} capitalize`}>{l.status}</span>
            <div className="text-sm text-slate-600 flex-1 min-w-[200px]">{l.reason}</div>
            {l.decidedBy && (
              <div className="text-xs text-slate-400">
                by {l.decidedBy.name}
                {l.decisionNote ? ` — "${l.decisionNote}"` : ""}
              </div>
            )}
          </div>
        ))}
        {leaves.length === 0 && (
          <div className="px-4 py-8 text-center text-slate-400">No leave applications yet.</div>
        )}
      </div>
    </div>
  );
}
