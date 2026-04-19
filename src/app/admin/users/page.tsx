"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import {
  UserIcon,
  ShieldCheckIcon,
  ShieldExclamationIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  PlusIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

interface ManagedUser {
  id: string;
  email: string;
  name: string | null;
  role: "USER" | "ADMIN" | "MANAGER" | "VERMITTLER";
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
  createdAt: string;
  emailVerified: boolean;
}

export default function AdminUsersPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [fetching, setFetching] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  // Formular: neuer Benutzer
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<"USER" | "ADMIN" | "MANAGER" | "VERMITTLER">("MANAGER");
  const [creating, setCreating] = useState(false);

  function resetForm() {
    setNewName(""); setNewEmail(""); setNewPassword(""); setNewRole("MANAGER"); setShowForm(false);
  }

  async function createUser(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setMessage(null);
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName, email: newEmail, password: newPassword, role: newRole }),
    });
    const data = await res.json();
    if (res.ok) {
      setUsers((prev) => [data.user, ...prev]);
      setMessage({ text: `Benutzer "${data.user.name}" erfolgreich angelegt ✓`, ok: true });
      resetForm();
    } else {
      setMessage({ text: data.error ?? "Fehler beim Anlegen", ok: false });
    }
    setCreating(false);
    setTimeout(() => setMessage(null), 4000);
  }

  // Zugriff nur für Admins
  useEffect(() => {
    if (!loading && user?.role !== "ADMIN") {
      router.replace("/dashboard");
    }
  }, [user, loading, router]);

  // User laden
  useEffect(() => {
    if (!loading && user?.role === "ADMIN") {
      const controller = new AbortController();
      fetch("/api/admin/users", { signal: controller.signal })
        .then((r) => r.json())
        .then((data) => setUsers(data.users ?? []))
        .catch((err) => { if (err instanceof Error && err.name === "AbortError") return; })
        .finally(() => setFetching(false));
      return () => controller.abort();
    }
  }, [user, loading]);

  async function updateUser(userId: string, patch: { role?: "USER" | "ADMIN" | "MANAGER" | "VERMITTLER"; status?: "ACTIVE" | "INACTIVE" | "SUSPENDED" }) {
    setSaving(userId);
    setMessage(null);
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, ...patch }),
    });
    const data = await res.json();
    if (res.ok) {
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, ...data.user } : u)));
      setMessage({ text: "Gespeichert ✓", ok: true });
    } else {
      setMessage({ text: data.error ?? "Fehler beim Speichern", ok: false });
    }
    setSaving(null);
    setTimeout(() => setMessage(null), 3000);
  }

  if (loading || user?.role !== "ADMIN") {
    return (
      <div className="min-h-screen bg-(--surface) flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  const roleColors: Record<string, string> = {
    ADMIN:      "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300",
    USER:       "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
    MANAGER:    "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
    VERMITTLER: "bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300",
  };

  const statusColors: Record<string, string> = {
    ACTIVE: "text-green-600 dark:text-green-400",
    INACTIVE: "text-gray-400",
    SUSPENDED: "text-red-500",
  };

  return (
    <div className="min-h-screen bg-(--surface) text-foreground py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between gap-3 mb-8">
          <div className="flex items-center gap-3">
            <ShieldCheckIcon className="h-8 w-8 text-purple-500" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">Benutzerverwaltung</h1>
              <p className="text-(--muted)">Rollen und Status aller Benutzer verwalten</p>
            </div>
          </div>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors"
          >
            {showForm ? <XMarkIcon className="h-4 w-4" /> : <PlusIcon className="h-4 w-4" />}
            {showForm ? "Abbrechen" : "Neuer Benutzer"}
          </button>
        </div>

        {/* Formular: Neuer Benutzer */}
        {showForm && (
          <form onSubmit={createUser} className="mb-6 bg-(--card) border border-(--border) rounded-xl p-6 space-y-4">
            <h2 className="text-base font-semibold text-foreground">Neuen Benutzer anlegen</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-(--muted) mb-1">Name</label>
                <input
                  type="text" required value={newName} onChange={(e) => setNewName(e.target.value)}
                  placeholder="Max Mustermann" minLength={2} maxLength={100}
                  className="w-full px-3 py-2 rounded-lg bg-(--surface) border border-(--border) text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-(--muted) mb-1">E-Mail</label>
                <input
                  type="email" required value={newEmail} onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="name@beispiel.de"
                  className="w-full px-3 py-2 rounded-lg bg-(--surface) border border-(--border) text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-(--muted) mb-1">Passwort</label>
                <input
                  type="text" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mindestens 8 Zeichen" minLength={8} maxLength={128}
                  className="w-full px-3 py-2 rounded-lg bg-(--surface) border border-(--border) text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-(--muted) mb-1">Rolle</label>
                <select
                  value={newRole} onChange={(e) => setNewRole(e.target.value as typeof newRole)}
                  className="w-full px-3 py-2 rounded-lg bg-(--surface) border border-(--border) text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="MANAGER">MANAGER (DCI-Dozent)</option>
                  <option value="VERMITTLER">VERMITTLER (Agentur f. Arbeit)</option>
                  <option value="USER">USER (Bewerber)</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>
            </div>
            <div className="flex items-center gap-3 pt-1">
              <button
                type="submit" disabled={creating}
                className="flex items-center gap-2 px-5 py-2 rounded-lg bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white text-sm font-medium transition-colors"
              >
                {creating ? <ArrowPathIcon className="h-4 w-4 animate-spin" /> : <PlusIcon className="h-4 w-4" />}
                {creating ? "Wird angelegt…" : "Benutzer anlegen"}
              </button>
              <button type="button" onClick={resetForm} className="text-sm text-(--muted) hover:text-foreground transition-colors">
                Abbrechen
              </button>
            </div>
          </form>
        )}

        {/* Status-Meldung */}
        {message && (
          <div className={`mb-4 px-4 py-2 rounded-md text-sm font-medium ${message.ok ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"}`}>
            {message.text}
          </div>
        )}

        {/* Tabelle */}
        <div className="bg-(--card) border border-(--border) rounded-xl overflow-hidden shadow-sm">
          {fetching ? (
            <div className="flex items-center justify-center py-16">
              <ArrowPathIcon className="h-6 w-6 animate-spin text-(--muted)" />
              <span className="ml-2 text-(--muted)">Benutzer werden geladen…</span>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-(--surface) border-b border-(--border)">
                <tr>
                  <th className="text-left px-5 py-3 font-semibold text-(--muted)">Benutzer</th>
                  <th className="text-left px-5 py-3 font-semibold text-(--muted)">Rolle</th>
                  <th className="text-left px-5 py-3 font-semibold text-(--muted)">Status</th>
                  <th className="text-left px-5 py-3 font-semibold text-(--muted)">Registriert</th>
                  <th className="text-left px-5 py-3 font-semibold text-(--muted)">Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u, i) => {
                  const isSelf = u.id === user.id;
                  const isLoading = saving === u.id;
                  return (
                    <tr key={u.id} className={`border-b border-(--border) last:border-0 ${i % 2 === 0 ? "" : "bg-(--surface)/50"}`}>
                      {/* Benutzer */}
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                            {(u.name?.[0] ?? u.email[0]).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium text-foreground">{u.name ?? "—"}</div>
                            <div className="text-xs text-(--muted)">{u.email}</div>
                          </div>
                          {isSelf && (
                            <span className="ml-1 text-xs bg-gray-200 dark:bg-gray-700 text-(--muted) px-1.5 py-0.5 rounded">Ich</span>
                          )}
                          {u.emailVerified && (
                            <CheckCircleIcon className="h-4 w-4 text-green-500 shrink-0" title="E-Mail verifiziert" />
                          )}
                        </div>
                      </td>

                      {/* Rolle */}
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${roleColors[u.role] ?? ""}`}>
                          {u.role === "ADMIN" ? <ShieldCheckIcon className="h-3 w-3" /> : <UserIcon className="h-3 w-3" />}
                          {u.role}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-3">
                        <span className={`font-medium ${statusColors[u.status]}`}>
                          {u.status === "ACTIVE" ? "Aktiv" : u.status === "INACTIVE" ? "Inaktiv" : "Gesperrt"}
                        </span>
                      </td>

                      {/* Datum */}
                      <td className="px-5 py-3 text-(--muted)">
                        {new Date(u.createdAt).toLocaleDateString("de-DE")}
                      </td>

                      {/* Aktionen */}
                      <td className="px-5 py-3">
                        {isSelf ? (
                          <span className="text-xs text-(--muted) italic">Eigenes Konto</span>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {/* Rolle als Dropdown */}
                            <select
                              disabled={isLoading}
                              value={u.role}
                              onChange={(e) => updateUser(u.id, { role: e.target.value as "USER" | "ADMIN" | "MANAGER" | "VERMITTLER" })}
                              className="text-xs px-2 py-1.5 rounded-md border border-(--border) bg-(--card) text-foreground cursor-pointer disabled:opacity-50"
                            >
                              <option value="USER">USER</option>
                              <option value="ADMIN">ADMIN</option>
                              <option value="MANAGER">MANAGER (DCI)</option>
                              <option value="VERMITTLER">VERMITTLER (AfA)</option>
                            </select>

                            {/* Status sperren/entsperren */}
                            {u.status === "SUSPENDED" ? (
                              <button
                                disabled={isLoading}
                                onClick={() => updateUser(u.id, { status: "ACTIVE" })}
                                className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-md border border-green-400 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors disabled:opacity-50"
                              >
                                <CheckCircleIcon className="h-3.5 w-3.5" /> Entsperren
                              </button>
                            ) : (
                              <button
                                disabled={isLoading}
                                onClick={() => updateUser(u.id, { status: "SUSPENDED" })}
                                className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-md border border-red-400 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                              >
                                <XCircleIcon className="h-3.5 w-3.5" /> Sperren
                              </button>
                            )}

                            {isLoading && <ArrowPathIcon className="h-4 w-4 animate-spin text-(--muted)" />}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <p className="mt-4 text-xs text-(--muted)">
          {users.length} Benutzer · Änderungen werden sofort wirksam · Das eigene Konto kann nicht geändert werden
        </p>
      </div>
    </div>
  );
}
