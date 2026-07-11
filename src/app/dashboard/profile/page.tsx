"use client";

import { useEffect, useState } from "react";

interface Me {
  name: string;
  email: string;
  role: string;
  dob: string;
  whatsappNumber: string | null;
}

export default function ProfilePage() {
  const [me, setMe] = useState<Me | null>(null);
  const [number, setNumber] = useState("");
  const [info, setInfo] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        setMe(d.user);
        setNumber(d.user?.whatsappNumber ?? "");
      });
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setInfo("");
    setError("");
    const res = await fetch("/api/profile/whatsapp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ whatsappNumber: number }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed to save");
      return;
    }
    setInfo("WhatsApp number updated. New notifications will go to this number.");
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold mb-4">My Profile</h1>
      {me && (
        <div className="card p-6 mb-6 space-y-2 text-sm">
          <div><span className="text-slate-500 w-32 inline-block">Name</span> <b>{me.name}</b></div>
          <div><span className="text-slate-500 w-32 inline-block">Email</span> {me.email}</div>
          <div><span className="text-slate-500 w-32 inline-block">Role</span> <span className="capitalize">{me.role.replace("_", " ")}</span></div>
          <div><span className="text-slate-500 w-32 inline-block">Date of Birth</span> {me.dob}</div>
        </div>
      )}
      <form onSubmit={save} className="card p-6 space-y-4">
        <div>
          <label className="label">Update WhatsApp Number</label>
          <input
            className="input"
            placeholder="+8801XXXXXXXXX"
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            required
          />
          <p className="text-xs text-slate-500 mt-1">
            Leave approval/decline notifications are sent to this number. Include the country code.
          </p>
        </div>
        {error && <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm p-3">{error}</div>}
        {info && <div className="rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm p-3">{info}</div>}
        <button className="btn-primary" type="submit">Save Number</button>
      </form>
    </div>
  );
}
