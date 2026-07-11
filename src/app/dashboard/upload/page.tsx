"use client";

import { useState } from "react";

export default function UploadPage() {
  const [category, setCategory] = useState("elite_special");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ created: number; reactivated: number; skipped: number } | null>(null);
  const [error, setError] = useState("");

  async function upload(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setBusy(true);
    setError("");
    setResult(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("category", category);
      const res = await fetch("/api/leads/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Upload failed");
        return;
      }
      setResult(data);
    } catch {
      setError("Upload failed — network error.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-4">Upload Leads</h1>
      <form onSubmit={upload} className="card p-6 space-y-4">
        <div>
          <label className="label">1. Select Category</label>
          <div className="flex gap-2">
            {[
              { value: "elite_special", label: "Elite Special" },
              { value: "call_sheet", label: "Call Sheet" },
            ].map((c) => (
              <button
                type="button"
                key={c.value}
                onClick={() => setCategory(c.value)}
                className={`btn ${category === c.value ? "bg-brand-600 text-white" : "bg-white border border-slate-300 text-slate-700"}`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="label">2. Choose CSV or XLSX file</label>
          <input
            type="file"
            accept=".csv,.xlsx,.xls"
            className="input"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            required
          />
          <p className="text-xs text-slate-500 mt-2">
            Expected columns: <code>Customer Name</code>, <code>Phone Number</code>, <code>Address</code>,{" "}
            <code>OG Report</code> (e.g. &quot;Total order - 2, Delivered - 2, Returned - 0&quot;). The OG
            Report is parsed into Total Orders / Delivered / Returned automatically. Re-uploading
            previously touched leads resets them to Fresh with history preserved.
          </p>
        </div>
        {error && <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm p-3">{error}</div>}
        {result && (
          <div className="rounded-lg bg-green-50 border border-green-200 text-green-800 text-sm p-3">
            Upload complete — {result.created} new lead(s) created, {result.reactivated} touched lead(s)
            reset to Fresh, {result.skipped} row(s) skipped (duplicates/empty).
          </div>
        )}
        <button className="btn-primary" disabled={busy || !file} type="submit">
          {busy ? "Uploading…" : "Upload Leads"}
        </button>
      </form>
    </div>
  );
}
