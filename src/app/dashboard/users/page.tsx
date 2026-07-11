"use client";

import { useCallback, useEffect, useState } from "react";

interface UserRow {
  id: number;
  name: string;
  email: string;
  dob: string;
  role: string;
  status: string;
  whatsappNumber: string | null;
}

export default function UsersPage() {
  const [meRole, setMeRole] = useState<string>("");
  const [users, setUsers] = useState<UserRow[]>([]);
  const [form, setForm] = useState({
    name: "",
    email: "",
    dob: "",
    password: "",
    confirm: "",
    role: "agent",
    whatsappNumber: "",
  });
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [resetResult, setResetResult] = useState<{ name: string; password: string } | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/users");
    if (res.ok) {
      const data = await res.json();
      setUsers(data.users);
    }
  }, []);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setMeRole(d.user?.role ?? ""));
    load();
  }, [load]);

  async function createUser(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setInfo("");
    if (form.password !== form.confirm) {
      setError("Passwords do not match.");
      return;
    }
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, role: meRole === "manager" ? "agent" : form.role }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed to create user");
      return;
    }
    setInfo(`User "${data.user.name}" created.`);
    setForm({ name: "", email: "", dob: "", password: "", confirm: "", role: "agent", whatsappNumber: "" });
    load();
  }

  async function act(user: UserRow, action: "pause" | "unpause") {
    await fetch(`/api/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    load();
  }

  async function remove(user: UserRow) {
    if (!confirm(`Delete ${user.name}? Their untouched leads return to the pool.`)) return;
    await fetch(`/api/users/${user.id}`, { method: "DELETE" });
    load();
  }

  async function resetPassword(user: UserRow) {
    if (!confirm(`Reset password for ${user.name}? The new password is shown once.`)) return;
    const res = await fetch(`/api/users/${user.id}/reset-password`, { method: "POST" });
    const data = await res.json();
    if (res.ok) setResetResult({ name: user.name, password: data.newPassword });
    else setError(data.error || "Reset failed");
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">
        {meRole === "manager" ? "Manage Agents" : "Manage Users"}
      </h1>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Create form */}
        <form onSubmit={createUser} className="card p-5 space-y-3 h-fit">
          <div className="font-semibold">Create {meRole === "manager" ? "Agent" : "User"}</div>
          <div>
            <label className="label">Full Name</label>
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div>
            <label className="label">Email</label>
            <input type="email" className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div>
            <label className="label">Date of Birth</label>
            <input type="date" className="input" value={form.dob} onChange={(e) => setForm({ ...form, dob: e.target.value })} required />
          </div>
          <div>
            <label className="label">Password</label>
            <input type="password" className="input" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={6} />
          </div>
          <div>
            <label className="label">Confirm Password</label>
            <input type="password" className="input" value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} required />
          </div>
          {meRole === "super_admin" && (
            <div>
              <label className="label">Role</label>
              <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                <option value="agent">Agent</option>
                <option value="manager">Manager</option>
              </select>
            </div>
          )}
          <div>
            <label className="label">WhatsApp Number (optional)</label>
            <input className="input" placeholder="+8801XXXXXXXXX" value={form.whatsappNumber} onChange={(e) => setForm({ ...form, whatsappNumber: e.target.value })} />
          </div>
          {error && <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm p-3">{error}</div>}
          {info && <div className="rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm p-3">{info}</div>}
          <button className="btn-primary w-full" type="submit">Create User</button>
        </form>

        {/* User list */}
        <div className="lg:col-span-2">
          {resetResult && (
            <div className="mb-4 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 text-sm p-4 flex items-start justify-between gap-4">
              <div>
                New password for <b>{resetResult.name}</b>:{" "}
                <code className="bg-white px-2 py-0.5 rounded border border-blue-200 font-mono">{resetResult.password}</code>
                <div className="text-xs mt-1">Copy it now — it is shown only once. Share it with the user manually.</div>
              </div>
              <button className="btn-secondary" onClick={() => setResetResult(null)}>✕</button>
            </div>
          )}
          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-200 bg-slate-50">
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-slate-100">
                    <td className="px-4 py-3 font-medium">{u.name}</td>
                    <td className="px-4 py-3">{u.email}</td>
                    <td className="px-4 py-3 capitalize">{u.role.replace("_", " ")}</td>
                    <td className="px-4 py-3">
                      <span className={`badge ${u.status === "active" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        {u.status === "active" ? (
                          <button className="btn-secondary !py-1" onClick={() => act(u, "pause")}>Pause</button>
                        ) : (
                          <button className="btn-secondary !py-1" onClick={() => act(u, "unpause")}>Unpause</button>
                        )}
                        <button className="btn-secondary !py-1" onClick={() => resetPassword(u)}>Reset PW</button>
                        <button className="btn-danger !py-1" onClick={() => remove(u)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-400">No users yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
