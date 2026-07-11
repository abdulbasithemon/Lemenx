"use client";

import { useEffect, useState } from "react";

interface ReportRow {
  userId: number;
  userName: string;
  role: string;
  totalTouched: number;
  byStatus: Record<string, number>;
  byCategory: Record<string, number>;
}

function monthStart(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}
function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function ReportsPage() {
  const [meRole, setMeRole] = useState("");
  const [from, setFrom] = useState(monthStart());
  const [to, setTo] = useState(today());
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [statusLabels, setStatusLabels] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setMeRole(d.user?.role ?? ""));
    fetch("/api/statuses")
      .then((r) => r.json())
      .then((d) => setStatusLabels((d.statuses ?? []).map((s: { label: string }) => s.label)));
  }, []);

  async function run(e?: React.FormEvent) {
    e?.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/reports?from=${from}&to=${to}`);
      const data = await res.json();
      if (res.ok) setRows(data.rows);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    run();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Reports</h1>

      <form onSubmit={run} className="card p-4 flex flex-wrap items-end gap-3 mb-6">
        <div>
          <label className="label">From</label>
          <input type="date" className="input" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div>
          <label className="label">To</label>
          <input type="date" className="input" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <button className="btn-primary" type="submit" disabled={loading}>
          {loading ? "Loading…" : "Run Report"}
        </button>
        {meRole === "super_admin" && (
          <>
            <a className="btn-secondary" href={`/api/reports/export?from=${from}&to=${to}`}>
              ⬇ Download CSV
            </a>
            <a className="btn-secondary" href="/api/reports/touched-leads">
              ⬇ Download All Touched Leads
            </a>
          </>
        )}
      </form>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500 border-b border-slate-200 bg-slate-50">
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3 text-center">Total Touched</th>
              {statusLabels.map((s) => (
                <th key={s} className="px-4 py-3 text-center">{s}</th>
              ))}
              <th className="px-4 py-3 text-center">Elite Special</th>
              <th className="px-4 py-3 text-center">Call Sheet</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.userId} className="border-b border-slate-100">
                <td className="px-4 py-3 font-medium">{r.userName}</td>
                <td className="px-4 py-3 capitalize">{r.role.replace("_", " ")}</td>
                <td className="px-4 py-3 text-center font-semibold">{r.totalTouched}</td>
                {statusLabels.map((s) => (
                  <td key={s} className="px-4 py-3 text-center">{r.byStatus[s] || 0}</td>
                ))}
                <td className="px-4 py-3 text-center">{r.byCategory["elite_special"] || 0}</td>
                <td className="px-4 py-3 text-center">{r.byCategory["call_sheet"] || 0}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5 + statusLabels.length} className="px-4 py-10 text-center text-slate-400">
                  No touched leads in this date range.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {meRole === "super_admin" && (
        <p className="text-xs text-slate-500 mt-3">
          Tip: download all touched leads, clean the list externally (remove Done ones), then re-upload
          it on the Upload page — those leads return to the Fresh pool with history preserved.
        </p>
      )}
    </div>
  );
}
