"use client";

import { useCallback, useEffect, useState } from "react";

interface StatusDef {
  id: number;
  label: string;
  color: string;
  isDefault: boolean;
}

export default function StatusesPage() {
  const [statuses, setStatuses] = useState<StatusDef[]>([]);
  const [label, setLabel] = useState("");
  const [color, setColor] = useState("#64748b");
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<StatusDef | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/statuses");
    const data = await res.json();
    if (res.ok) setStatuses(data.statuses);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/statuses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label, color }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed");
      return;
    }
    setLabel("");
    load();
  }

  async function saveEdit() {
    if (!editing) return;
    await fetch(`/api/statuses/${editing.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: editing.label, color: editing.color }),
    });
    setEditing(null);
    load();
  }

  async function remove(s: StatusDef) {
    if (!confirm(`Delete status "${s.label}"?`)) return;
    await fetch(`/api/statuses/${s.id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-4">Custom Statuses</h1>
      <form onSubmit={create} className="card p-5 flex flex-wrap items-end gap-3 mb-6">
        <div className="flex-1 min-w-[180px]">
          <label className="label">New status label</label>
          <input className="input" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Call Back Later" required />
        </div>
        <div>
          <label className="label">Color</label>
          <input type="color" className="input !p-1 h-[38px] w-16" value={color} onChange={(e) => setColor(e.target.value)} />
        </div>
        <button className="btn-primary" type="submit">Add Status</button>
        {error && <div className="w-full rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm p-3">{error}</div>}
      </form>

      <div className="card divide-y divide-slate-100">
        {statuses.map((s) => (
          <div key={s.id} className="flex items-center gap-3 px-4 py-3">
            {editing?.id === s.id ? (
              <>
                <input type="color" className="w-10 h-8 rounded" value={editing.color} onChange={(e) => setEditing({ ...editing, color: e.target.value })} />
                <input className="input !w-56" value={editing.label} onChange={(e) => setEditing({ ...editing, label: e.target.value })} />
                <button className="btn-primary !py-1" onClick={saveEdit}>Save</button>
                <button className="btn-secondary !py-1" onClick={() => setEditing(null)}>Cancel</button>
              </>
            ) : (
              <>
                <span className="w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                <span className="font-medium flex-1">
                  {s.label}
                  {s.isDefault && <span className="badge bg-slate-100 text-slate-500 ml-2">default</span>}
                </span>
                <button className="btn-secondary !py-1" onClick={() => setEditing(s)}>Edit</button>
                <button className="btn-danger !py-1" onClick={() => remove(s)}>Delete</button>
              </>
            )}
          </div>
        ))}
        {statuses.length === 0 && <div className="px-4 py-8 text-center text-slate-400">No statuses.</div>}
      </div>
      <p className="text-xs text-slate-500 mt-3">
        Every uploaded lead starts as <b>Fresh</b> (untouched) until an agent changes its status.
      </p>
    </div>
  );
}
