"use client";

import { useState, useEffect, useCallback } from "react";
import {
  BellIcon,
  PlusIcon,
  CheckCircleIcon,
  TrashIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import { CheckCircleIcon as CheckCircleSolid } from "@heroicons/react/24/solid";

// ─── Typen ────────────────────────────────────────────────────────────────────

interface Reminder {
  id: string;
  title: string;
  description: string | null;
  dueAt: string;
  isDone: boolean;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  createdAt: string;
  application?: { companyName: string; position: string } | null;
  contact?: { firstName: string; lastName: string } | null;
}

const PRIORITY_STYLE: Record<Reminder["priority"], string> = {
  LOW: "bg-gray-100 text-gray-600",
  MEDIUM: "bg-blue-100 text-blue-700",
  HIGH: "bg-amber-100 text-amber-800",
  URGENT: "bg-red-100 text-red-700",
};

const PRIORITY_LABEL: Record<Reminder["priority"], string> = {
  LOW: "Niedrig",
  MEDIUM: "Mittel",
  HIGH: "Hoch",
  URGENT: "Dringend",
};

// ─── Haupt-Komponente ─────────────────────────────────────────────────────────

export default function RemindersManagement() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [pendingOnly, setPendingOnly] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    dueAt: "",
    priority: "MEDIUM" as Reminder["priority"],
  });

  // ─── Daten laden ────────────────────────────────────────────────────────────

  const fetchReminders = useCallback(async () => {
    setLoading(true);
    try {
      const url = pendingOnly ? "/api/reminders?pending=true" : "/api/reminders";
      const res = await fetch(url);
      if (!res.ok) throw new Error();
      const data = await res.json() as Reminder[];
      setReminders(Array.isArray(data) ? data : []);
    } catch {
      setError("Erinnerungen konnten nicht geladen werden.");
    } finally {
      setLoading(false);
    }
  }, [pendingOnly]);

  useEffect(() => { void fetchReminders(); }, [fetchReminders]);

  // ─── Erstellen ───────────────────────────────────────────────────────────────

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.dueAt) {
      setError("Titel und Fälligkeitsdatum sind erforderlich.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          description: form.description || null,
          dueAt: new Date(form.dueAt).toISOString(),
          priority: form.priority,
        }),
      });

      if (!res.ok) {
        const err = await res.json() as { error?: string };
        throw new Error(err.error ?? "Fehler");
      }

      setSuccess("Erinnerung erstellt.");
      setForm({ title: "", description: "", dueAt: "", priority: "MEDIUM" });
      setShowForm(false);
      await fetchReminders();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fehler beim Erstellen.");
    } finally {
      setLoading(false);
    }
  };

  // ─── Als erledigt markieren ──────────────────────────────────────────────────

  const toggleDone = async (r: Reminder) => {
    try {
      const res = await fetch(`/api/reminders?id=${r.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDone: !r.isDone }),
      });
      if (!res.ok) throw new Error();
      setReminders((prev) => prev.map((x) => x.id === r.id ? { ...x, isDone: !r.isDone } : x));
    } catch {
      setError("Status konnte nicht geändert werden.");
    }
  };

  // ─── Löschen ────────────────────────────────────────────────────────────────

  const deleteReminder = async (id: string) => {
    if (!confirm("Erinnerung wirklich löschen?")) return;
    try {
      const res = await fetch(`/api/reminders?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setReminders((prev) => prev.filter((r) => r.id !== id));
      setSuccess("Erinnerung gelöscht.");
    } catch {
      setError("Löschen fehlgeschlagen.");
    }
  };

  // ─── Hilfsfunktionen ────────────────────────────────────────────────────────

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleString("de-DE", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });

  const isOverdue = (iso: string, done: boolean) =>
    !done && new Date(iso) < new Date();

  const pending = reminders.filter((r) => !r.isDone).length;
  const overdue = reminders.filter((r) => isOverdue(r.dueAt, r.isDone)).length;

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BellIcon className="w-7 h-7 text-amber-500" />
            Erinnerungen
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Follow-ups und Fristen für Bewerbungen nicht verpassen
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input
              id="pending-only"
              name="pendingOnly"
              type="checkbox"
              checked={pendingOnly}
              onChange={(e) => setPendingOnly(e.target.checked)}
              className="rounded border-gray-300"
            />
            Nur ausstehende
          </label>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 transition-colors"
          >
            <PlusIcon className="w-4 h-4" />
            Neue Erinnerung
          </button>
        </div>
      </div>

      {/* Statistik-Karten */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Gesamt", value: reminders.length, color: "text-gray-900" },
          { label: "Ausstehend", value: pending, color: "text-blue-700" },
          { label: "Überfällig", value: overdue, color: overdue > 0 ? "text-red-600" : "text-gray-400" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm text-center">
            <p className={`text-2xl font-bold tabular-nums ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Nachrichten */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 flex justify-between">
          {error}
          <button onClick={() => setError(null)} className="ml-4">×</button>
        </div>
      )}
      {success && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 flex justify-between">
          {success}
          <button onClick={() => setSuccess(null)} className="ml-4">×</button>
        </div>
      )}

      {/* Formular */}
      {showForm && (
        <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-5 shadow-sm">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Neue Erinnerung</h2>
          <form onSubmit={(e) => void handleCreate(e)} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Titel *</label>
              <input
                id="reminder-title"
                name="title"
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="z.B. Follow-up bei Siemens senden"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fälligkeit *</label>
              <input
                id="reminder-due-at"
                name="dueAt"
                type="datetime-local"
                value={form.dueAt}
                onChange={(e) => setForm({ ...form, dueAt: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-amber-400"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priorität</label>
              <select
                id="reminder-priority"
                name="priority"
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value as Reminder["priority"] })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-amber-400"
              >
                <option value="LOW">Niedrig</option>
                <option value="MEDIUM">Mittel</option>
                <option value="HIGH">Hoch</option>
                <option value="URGENT">Dringend</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Beschreibung</label>
              <textarea
                id="reminder-description"
                name="description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2}
                placeholder="Details zur Erinnerung..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-amber-400"
              />
            </div>

            <div className="sm:col-span-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Abbrechen
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 rounded-lg bg-amber-500 text-white text-sm font-medium hover:bg-amber-600 disabled:opacity-50 transition-colors"
              >
                {loading ? "Speichern..." : "Erstellen"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Listen */}
      {loading && !showForm ? (
        <div className="text-center py-12 text-sm text-gray-400">Erinnerungen werden geladen...</div>
      ) : reminders.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-10 text-center">
          <BellIcon className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">
            {pendingOnly ? "Keine ausstehenden Erinnerungen." : "Noch keine Erinnerungen angelegt."}
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-3 text-sm text-amber-600 hover:underline"
          >
            Erste Erinnerung erstellen
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {reminders.map((r) => (
            <div
              key={r.id}
              className={`rounded-xl border bg-white shadow-sm px-4 py-3 flex items-center gap-3 transition-opacity
                ${r.isDone ? "opacity-60" : ""}
                ${isOverdue(r.dueAt, r.isDone) ? "border-red-200 bg-red-50/30" : "border-gray-100"}`}
            >
              {/* Check-Button */}
              <button
                onClick={() => void toggleDone(r)}
                className="shrink-0 text-gray-400 hover:text-emerald-600 transition-colors"
                title={r.isDone ? "Als offen markieren" : "Als erledigt markieren"}
              >
                {r.isDone ? (
                  <CheckCircleSolid className="w-6 h-6 text-emerald-500" />
                ) : (
                  <CheckCircleIcon className="w-6 h-6" />
                )}
              </button>

              {/* Inhalt */}
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${r.isDone ? "line-through text-gray-400" : "text-gray-900"}`}>
                  {r.title}
                </p>
                <div className="flex flex-wrap items-center gap-2 mt-0.5">
                  <span className={`flex items-center gap-1 text-xs ${isOverdue(r.dueAt, r.isDone) ? "text-red-600 font-medium" : "text-gray-500"}`}>
                    <ClockIcon className="w-3 h-3" />
                    {fmtDate(r.dueAt)}
                    {isOverdue(r.dueAt, r.isDone) && " (Überfällig)"}
                  </span>
                  {r.application && (
                    <>
                      <span className="text-gray-300">·</span>
                      <span className="text-xs text-indigo-600">
                        {r.application.position} @ {r.application.companyName}
                      </span>
                    </>
                  )}
                  {r.contact && (
                    <>
                      <span className="text-gray-300">·</span>
                      <span className="text-xs text-teal-600">
                        {r.contact.firstName} {r.contact.lastName}
                      </span>
                    </>
                  )}
                  {r.description && (
                    <span className="text-xs text-gray-400 truncate max-w-xs">{r.description}</span>
                  )}
                </div>
              </div>

              {/* Priorität + Löschen */}
              <div className="flex items-center gap-2 shrink-0">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${PRIORITY_STYLE[r.priority]}`}>
                  {PRIORITY_LABEL[r.priority]}
                </span>
                <button
                  onClick={() => void deleteReminder(r.id)}
                  className="text-gray-300 hover:text-red-500 transition-colors"
                  title="Löschen"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
