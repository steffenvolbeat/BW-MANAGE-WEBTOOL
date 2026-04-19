"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import {
  EyeIcon,
  TrashIcon,
  PlusIcon,
  ArrowPathIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";

interface UserOption {
  id: string;
  name: string | null;
  email: string;
  role: string;
}

interface Grant {
  id: string;
  granteeId: string;
  targetId: string;
  createdAt: string;
  grantee: { id: string; name: string | null; email: string; role: string };
  target: { id: string; name: string | null; email: string; role: string };
}

export default function ViewAccessPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [grants, setGrants] = useState<Grant[]>([]);
  const [allUsers, setAllUsers] = useState<UserOption[]>([]);
  const [fetching, setFetching] = useState(true);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  // Formular-State
  const [selectedGrantee, setSelectedGrantee] = useState("");
  const [selectedTarget, setSelectedTarget] = useState("");

  // Zugriff nur für Admins
  useEffect(() => {
    if (!loading && user?.role !== "ADMIN") {
      router.replace("/dashboard");
    }
  }, [user, loading, router]);

  // Grants + User laden
  useEffect(() => {
    if (!loading && user?.role === "ADMIN") {
      const c1 = new AbortController();
      const c2 = new AbortController();
      Promise.all([
        fetch("/api/admin/view-access", { signal: c1.signal }).then((r) => r.json()),
        fetch("/api/admin/users", { signal: c2.signal }).then((r) => r.json()),
      ])
        .then(([gData, uData]) => {
          setGrants(gData.grants ?? []);
          setAllUsers(uData.users ?? []);
        })
        .catch((err) => { if (err instanceof Error && err.name !== "AbortError") console.error(err); })
        .finally(() => setFetching(false));
      return () => { c1.abort(); c2.abort(); };
    }
  }, [user, loading]);

  function showMsg(text: string, ok: boolean) {
    setMessage({ text, ok });
    setTimeout(() => setMessage(null), 4000);
  }

  async function addGrant() {
    if (!selectedGrantee || !selectedTarget) return;
    setSaving(true);
    const res = await fetch("/api/admin/view-access", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ granteeId: selectedGrantee, targetId: selectedTarget }),
    });
    const data = await res.json();
    if (res.ok) {
      setGrants((prev) => [data.grant, ...prev]);
      setSelectedGrantee("");
      setSelectedTarget("");
      showMsg("Lesezugriff vergeben ✓", true);
    } else {
      showMsg(data.error ?? "Fehler beim Vergeben", false);
    }
    setSaving(false);
  }

  async function removeGrant(granteeId: string, targetId: string) {
    setRemoving(`${granteeId}-${targetId}`);
    const res = await fetch(
      `/api/admin/view-access?granteeId=${encodeURIComponent(granteeId)}&targetId=${encodeURIComponent(targetId)}`,
      { method: "DELETE" }
    );
    if (res.ok) {
      setGrants((prev) => prev.filter((g) => !(g.granteeId === granteeId && g.targetId === targetId)));
      showMsg("Zugriff entzogen ✓", true);
    } else {
      const data = await res.json();
      showMsg(data.error ?? "Fehler", false);
    }
    setRemoving(null);
  }

  // Nur MANAGER und VERMITTLER können beobachten
  const observers = allUsers.filter((u) => ["MANAGER", "VERMITTLER"].includes(u.role));
  // Nur USER können beobachtet werden
  const targets = allUsers.filter((u) => u.role === "USER");

  if (loading || user?.role !== "ADMIN") {
    return (
      <div className="min-h-screen bg-(--surface) flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-(--surface) text-foreground py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex items-center gap-3">
          <EyeIcon className="h-8 w-8 text-amber-500" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">Lesezugriff verwalten</h1>
            <p className="text-(--muted)">
              Bestimme, welche MANAGER / VERMITTLER-Accounts welche Bewerber einsehen dürfen.
            </p>
          </div>
        </div>

        {/* Meldung */}
        {message && (
          <div className={`px-4 py-2 rounded-md text-sm font-medium ${message.ok ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"}`}>
            {message.text}
          </div>
        )}

        {/* Neuen Grant vergeben */}
        <div className="bg-(--card) border border-(--border) rounded-xl p-6 shadow-sm">
          <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
            <PlusIcon className="h-5 w-5 text-blue-500" />
            Neuen Lesezugriff vergeben
          </h2>
          <div className="grid sm:grid-cols-3 gap-3 items-end">
            <div>
              <label className="block text-xs text-(--muted) mb-1">Observer (MANAGER / VERMITTLER)</label>
              <select
                value={selectedGrantee}
                onChange={(e) => setSelectedGrantee(e.target.value)}
                className="w-full text-sm px-3 py-2 rounded-md border border-(--border) bg-(--surface) text-foreground"
              >
                <option value="">— Wählen —</option>
                {observers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name ?? u.email} ({u.role})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-(--muted) mb-1">Bewerber (USER)</label>
              <select
                value={selectedTarget}
                onChange={(e) => setSelectedTarget(e.target.value)}
                className="w-full text-sm px-3 py-2 rounded-md border border-(--border) bg-(--surface) text-foreground"
              >
                <option value="">— Wählen —</option>
                {targets.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name ?? u.email}
                  </option>
                ))}
              </select>
            </div>
            <button
              disabled={!selectedGrantee || !selectedTarget || saving}
              onClick={addGrant}
              className="flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? <ArrowPathIcon className="h-4 w-4 animate-spin" /> : <PlusIcon className="h-4 w-4" />}
              Zugriff vergeben
            </button>
          </div>
        </div>

        {/* Grants-Tabelle */}
        <div className="bg-(--card) border border-(--border) rounded-xl overflow-hidden shadow-sm">
          <div className="px-5 py-3 border-b border-(--border) flex items-center gap-2">
            <ShieldCheckIcon className="h-5 w-5 text-amber-500" />
            <span className="font-semibold">Aktive Lesezugriffe ({grants.length})</span>
          </div>
          {fetching ? (
            <div className="flex items-center justify-center py-12">
              <ArrowPathIcon className="h-6 w-6 animate-spin text-(--muted)" />
              <span className="ml-2 text-(--muted)">Wird geladen…</span>
            </div>
          ) : grants.length === 0 ? (
            <div className="text-center py-12 text-(--muted)">
              Keine Lesezugriffe konfiguriert.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-(--surface) border-b border-(--border)">
                <tr>
                  <th className="text-left px-5 py-3 font-semibold text-(--muted)">Observer</th>
                  <th className="text-left px-5 py-3 font-semibold text-(--muted)">Bewerber</th>
                  <th className="text-left px-5 py-3 font-semibold text-(--muted)">Vergeben am</th>
                  <th className="text-left px-5 py-3 font-semibold text-(--muted)">Aktion</th>
                </tr>
              </thead>
              <tbody>
                {grants.map((g, i) => {
                  const key = `${g.granteeId}-${g.targetId}`;
                  return (
                    <tr key={g.id} className={`border-b border-(--border) last:border-0 ${i % 2 === 0 ? "" : "bg-(--surface)/50"}`}>
                      <td className="px-5 py-3">
                        <div className="font-medium">{g.grantee.name ?? g.grantee.email}</div>
                        <div className="text-xs text-(--muted)">{g.grantee.role} · {g.grantee.email}</div>
                      </td>
                      <td className="px-5 py-3">
                        <div className="font-medium">{g.target.name ?? g.target.email}</div>
                        <div className="text-xs text-(--muted)">{g.target.email}</div>
                      </td>
                      <td className="px-5 py-3 text-(--muted)">
                        {new Date(g.createdAt).toLocaleDateString("de-DE")}
                      </td>
                      <td className="px-5 py-3">
                        <button
                          disabled={removing === key}
                          onClick={() => removeGrant(g.granteeId, g.targetId)}
                          className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-md border border-red-400 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                        >
                          {removing === key
                            ? <ArrowPathIcon className="h-3.5 w-3.5 animate-spin" />
                            : <TrashIcon className="h-3.5 w-3.5" />
                          }
                          Entziehen
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <p className="text-xs text-(--muted)">
          Hinweis: MANAGER und VERMITTLER haben ausschließlich Lesezugriff. Sie können keine Daten anlegen, bearbeiten oder löschen.
        </p>
      </div>
    </div>
  );
}
