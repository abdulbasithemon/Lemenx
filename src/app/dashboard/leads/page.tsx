"use client";

import { useCallback, useEffect, useState } from "react";

interface Lead {
  id: number;
  customerName: string;
  phone: string;
  address: string | null;
  totalOrders: number;
  delivered: number;
  returned: number;
  category: string;
  status: string;
  agentNote: string | null;
}

interface StatusDef {
  id: number;
  label: string;
  color: string;
}

type Category = "elite_special" | "call_sheet";

const CATEGORY_LABEL: Record<Category, string> = {
  elite_special: "Elite Special",
  call_sheet: "Call Sheet",
};

export default function LeadsPage() {
  const [category, setCategory] = useState<Category>("elite_special");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [statuses, setStatuses] = useState<StatusDef[]>([]);
  const [mode, setMode] = useState<"window" | "admin">("window");
  const [progress, setProgress] = useState({ newTouches: 0, trigger: 8 });
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [noteDrafts, setNoteDrafts] = useState<Record<number, string>>({});
  const [message, setMessage] = useState("");

  const load = useCallback(
    async (cat: Category, p = 1, q = "") => {
      setLoading(true);
      try {
        const res = await fetch(`/api/leads?category=${cat}&page=${p}&search=${encodeURIComponent(q)}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setLeads(data.leads);
        setMode(data.mode);
        if (data.mode === "window") setProgress(data.progress);
        if (data.mode === "admin") setTotal(data.total);
        const drafts: Record<number, string> = {};
        for (const l of data.leads as Lead[]) drafts[l.id] = l.agentNote ?? "";
        setNoteDrafts(drafts);
      } catch (e) {
        setMessage(e instanceof Error ? e.message : "Failed to load leads");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetch("/api/statuses")
      .then((r) => r.json())
      .then((d) => setStatuses(d.statuses ?? []));
  }, []);

  useEffect(() => {
    load(category, page, search);
  }, [category, page, load]); // eslint-disable-line react-hooks/exhaustive-deps

  async function updateStatus(leadId: number, status: string) {
    const res = await fetch(`/api/leads/${leadId}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error || "Failed to update status");
      return;
    }
    // Reload the window — it may have rolled (hide 7 / load 8).
    await load(category, page, search);
  }

  async function saveNote(leadId: number) {
    await fetch(`/api/leads/${leadId}/note`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note: noteDrafts[leadId] ?? "" }),
    });
    setMessage("Note saved.");
    setTimeout(() => setMessage(""), 2000);
  }

  function statusColor(label: string): string {
    return statuses.find((s) => s.label === label)?.color ?? "#64748b";
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h1 className="text-2xl font-bold">Leads</h1>
        {mode === "window" && (
          <div className="text-sm text-slate-500">
            Touched{" "}
            <span className="font-semibold text-brand-700">
              {progress.newTouches}/{progress.trigger}
            </span>{" "}
            — at {progress.trigger} the first 7 hide and 8 fresh load below.
          </div>
        )}
      </div>

      {/* Menu tabs */}
      <div className="flex gap-2 mb-4">
        {(Object.keys(CATEGORY_LABEL) as Category[]).map((cat) => (
          <button
            key={cat}
            onClick={() => {
              setCategory(cat);
              setPage(1);
            }}
            className={`btn ${category === cat ? "bg-brand-600 text-white" : "bg-white border border-slate-300 text-slate-700"}`}
          >
            {CATEGORY_LABEL[cat]}
          </button>
        ))}
        {mode === "admin" && (
          <form
            className="ml-auto flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              setPage(1);
              load(category, 1, search);
            }}
          >
            <input
              className="input w-56"
              placeholder="Search name or phone…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button className="btn-secondary" type="submit">
              Search
            </button>
          </form>
        )}
      </div>

      {message && (
        <div className="mb-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm p-3">
          {message}
        </div>
      )}

      {loading ? (
        <div className="card p-10 text-center text-slate-400">Loading leads…</div>
      ) : leads.length === 0 ? (
        <div className="card p-10 text-center text-slate-500">
          No leads available in {CATEGORY_LABEL[category]} right now.
          {mode === "window" && " New leads appear when the Super Admin uploads more."}
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-200 bg-slate-50">
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Address</th>
                <th className="px-4 py-3 text-center">Total Orders</th>
                <th className="px-4 py-3 text-center">Delivered</th>
                <th className="px-4 py-3 text-center">Returned</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Note</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id} className="border-b border-slate-100 align-top">
                  <td className="px-4 py-3 font-medium">
                    {lead.customerName}
                    {lead.category !== category && (
                      <span className="badge bg-slate-100 text-slate-500 ml-2">
                        {CATEGORY_LABEL[lead.category as Category]}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">{lead.phone}</td>
                  <td className="px-4 py-3 max-w-[220px]">{lead.address}</td>
                  <td className="px-4 py-3 text-center">{lead.totalOrders}</td>
                  <td className="px-4 py-3 text-center text-green-700">{lead.delivered}</td>
                  <td className="px-4 py-3 text-center text-red-700">{lead.returned}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full inline-block shrink-0"
                        style={{ backgroundColor: lead.status === "fresh" ? "#3b82f6" : statusColor(lead.status) }}
                      />
                      <select
                        className="input !w-36"
                        value={lead.status}
                        onChange={(e) => updateStatus(lead.id, e.target.value)}
                      >
                        {lead.status === "fresh" && <option value="fresh">Fresh</option>}
                        {statuses.map((s) => (
                          <option key={s.id} value={s.label}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <input
                        className="input !w-40"
                        placeholder="Optional note…"
                        value={noteDrafts[lead.id] ?? ""}
                        onChange={(e) => setNoteDrafts({ ...noteDrafts, [lead.id]: e.target.value })}
                      />
                      <button className="btn-secondary" onClick={() => saveNote(lead.id)}>
                        💾
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {mode === "admin" && total > 50 && (
        <div className="flex items-center gap-3 mt-4">
          <button className="btn-secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            ← Prev
          </button>
          <span className="text-sm text-slate-500">
            Page {page} of {Math.ceil(total / 50)} ({total} leads)
          </span>
          <button
            className="btn-secondary"
            disabled={page >= Math.ceil(total / 50)}
            onClick={() => setPage(page + 1)}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
