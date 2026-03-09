"use client";

import { useState, useEffect, useCallback } from "react";
import {
  BellAlertIcon,
  PlusIcon,
  TrashIcon,
  ArrowPathIcon,
  XCircleIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  FunnelIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import type { OutboxReminder, ReminderStatus, ReminderPriority } from "@/app/api/reminders/outbox/route";

// ─── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<ReminderStatus, { label: string; bg: string; text: string; icon: React.ElementType }> = {
  PENDING:   { label: "Ausstehend",   bg: "bg-blue-100 dark:bg-blue-900/40",   text: "text-blue-700 dark:text-blue-300",   icon: ClockIcon },
  DELIVERED: { label: "Zugestellt",   bg: "bg-green-100 dark:bg-green-900/40", text: "text-green-700 dark:text-green-300", icon: CheckCircleIcon },
  FAILED:    { label: "Fehlgeschlagen", bg: "bg-red-100 dark:bg-red-900/40",   text: "text-red-700 dark:text-red-300",     icon: XCircleIcon },
  RETRYING:  { label: "Wiederholung", bg: "bg-yellow-100 dark:bg-yellow-900/40", text: "text-yellow-700 dark:text-yellow-300", icon: ArrowPathIcon },
  CANCELLED: { label: "Abgebrochen",  bg: "bg-gray-100 dark:bg-slate-700",     text: "text-gray-500 dark:text-slate-400",  icon: XCircleIcon },
};

const PRIORITY_CONFIG: Record<ReminderPriority, { label: string; color: string }> = {
  LOW:    { label: "Niedrig", color: "text-gray-400" },
  MEDIUM: { label: "Mittel",  color: "text-blue-500" },
  HIGH:   { label: "Hoch",    color: "text-orange-500" },
  URGENT: { label: "Dringend", color: "text-red-600" },
};

interface Stats { total: number; pending: number; delivered: number; failed: number; retrying: number; }

export default function OutboxReminders() {
  const [reminders, setReminders] = useState<OutboxReminder[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, pending: 0, delivered: 0, failed: 0, retrying: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ReminderStatus | "ALL">("ALL");
  const [showForm, setShowForm] = useState(false);
  const [formTitle, setFormTitle] = useState("");
  const [formBody, setFormBody] = useState("");
  const [formDueAt, setFormDueAt] = useState("");
  const [formPriority, setFormPriority] = useState<ReminderPriority>("MEDIUM");
  const [formTags, setFormTags] = useState("");
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const notify = (type: "success" | "error", text: string) => {
    setNotification({ type, text });
    setTimeout(() => setNotification(null), 3500);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const url = filter === "ALL" ? "/api/reminders/outbox" : `/api/reminders/outbox?status=${filter}`;
      const res = await fetch(url);
      const data = await res.json() as { reminders: OutboxReminder[]; stats: Stats };
      setReminders(data.reminders);
      setStats(data.stats);
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { void load(); }, [load]);

  const handleCreate = async () => {
    if (!formTitle.trim() || !formDueAt) { notify("error", "Titel und Fälligkeit sind Pflichtfelder."); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/reminders/outbox", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formTitle,
          body: formBody,
          dueAt: formDueAt,
          priority: formPriority,
          tags: formTags.split(",").map(t => t.trim()).filter(Boolean),
        }),
      });
      if (!res.ok) throw new Error("Fehler");
      notify("success", "Erinnerung erstellt.");
      setShowForm(false);
      setFormTitle(""); setFormBody(""); setFormDueAt(""); setFormPriority("MEDIUM"); setFormTags("");
      await load();
    } catch { notify("error", "Erstellen fehlgeschlagen."); } finally { setSaving(false); }
  };

  const handleAction = async (id: string, action: "retry" | "cancel") => {
    await fetch(`/api/reminders/outbox?id=${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    notify("success", action === "retry" ? "Wiederholungsversuch gestartet." : "Erinnerung abgebrochen.");
    await load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Erinnerung endgültig löschen?")) return;
    await fetch(`/api/reminders/outbox?id=${id}`, { method: "DELETE" });
    notify("success", "Erinnerung gelöscht.");
    await load();
  };

  const defaultDueAt = new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 16);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-lg text-white text-sm font-medium ${notification.type === "success" ? "bg-green-600" : "bg-red-600"}`}>
          {notification.type === "success" ? <CheckCircleIcon className="h-5 w-5" /> : <ExclamationTriangleIcon className="h-5 w-5" />}
          {notification.text}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-violet-100 dark:bg-violet-900/40 rounded-xl">
            <BellAlertIcon className="h-7 w-7 text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Outbox-Erinnerungen</h1>
            <p className="text-sm text-gray-500 dark:text-slate-400">Garantierte Zustellung mit Retry-Mechanismus</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => void load()} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700 transition">
            <ArrowPathIcon className="h-4 w-4" /> Aktualisieren
          </button>
          <button onClick={() => { setFormDueAt(defaultDueAt); setShowForm(true); }} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 transition">
            <PlusIcon className="h-4 w-4" /> Neue Erinnerung
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-8">
        {[
          { key: "total",     label: "Gesamt",         value: stats.total,     color: "border-gray-200 dark:border-slate-700" },
          { key: "pending",   label: "Ausstehend",     value: stats.pending,   color: "border-blue-200 dark:border-blue-800" },
          { key: "delivered", label: "Zugestellt",     value: stats.delivered, color: "border-green-200 dark:border-green-800" },
          { key: "retrying",  label: "Wiederholung",   value: stats.retrying,  color: "border-yellow-200 dark:border-yellow-800" },
          { key: "failed",    label: "Fehlgeschlagen", value: stats.failed,    color: "border-red-200 dark:border-red-800" },
        ].map((stat) => (
          <div key={stat.key} className={`bg-white dark:bg-slate-800 rounded-xl border ${stat.color} p-4 text-center`}>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        <FunnelIcon className="h-4 w-4 text-gray-400" />
        {(["ALL", "PENDING", "RETRYING", "DELIVERED", "FAILED", "CANCELLED"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${filter === s ? "bg-violet-600 text-white" : "bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700"}`}
          >
            {s === "ALL" ? "Alle" : STATUS_CONFIG[s as ReminderStatus].label}
          </button>
        ))}
      </div>

      {/* List */}
      {loading && <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-violet-600" /></div>}

      {!loading && reminders.length === 0 && (
        <div className="text-center py-16 text-gray-500 dark:text-slate-400">
          <BellAlertIcon className="h-12 w-12 mx-auto mb-3 opacity-40" />
          <p className="text-sm">Keine Erinnerungen gefunden.</p>
          <button onClick={() => { setFormDueAt(defaultDueAt); setShowForm(true); }} className="mt-3 text-sm text-violet-600 dark:text-violet-400 hover:underline">Erste Erinnerung erstellen</button>
        </div>
      )}

      {!loading && reminders.length > 0 && (
        <div className="space-y-3">
          {reminders.map((r) => {
            const sc = STATUS_CONFIG[r.status];
            const StatusIcon = sc.icon as React.ComponentType<{ className?: string }>;
            const pc = PRIORITY_CONFIG[r.priority];
            const overdue = r.status === "PENDING" && new Date(r.dueAt) < new Date();
            return (
              <div key={r.id} className={`bg-white dark:bg-slate-800 rounded-xl border transition ${overdue ? "border-red-300 dark:border-red-700" : "border-gray-200 dark:border-slate-700"} p-5`}>
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <StatusIcon className={`h-5 w-5 shrink-0 mt-0.5 ${sc.text}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">{r.title}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sc.bg} ${sc.text}`}>{sc.label}</span>
                        <span className={`text-xs font-bold ${pc.color}`}>{pc.label}</span>
                        {overdue && <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 font-medium animate-pulse">Überfällig!</span>}
                      </div>
                      {r.body && <p className="text-xs text-gray-500 dark:text-slate-400 mb-1 line-clamp-2">{r.body}</p>}
                      <div className="flex items-center gap-4 text-xs text-gray-400 dark:text-slate-500 flex-wrap">
                        <span>Fällig: {new Date(r.dueAt).toLocaleString("de-DE")}</span>
                        <span>Versuche: {r.retryCount}/{r.maxRetries}</span>
                        {r.deliveredAt && <span>Zugestellt: {new Date(r.deliveredAt).toLocaleString("de-DE")}</span>}
                        {r.failureReason && <span className="text-red-500 dark:text-red-400">{r.failureReason}</span>}
                      </div>
                      {r.tags.length > 0 && (
                        <div className="flex gap-1 mt-1.5 flex-wrap">
                          {r.tags.map((tag) => (
                            <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400">{tag}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {(r.status === "FAILED" || r.status === "RETRYING") && r.retryCount < r.maxRetries && (
                      <button onClick={() => void handleAction(r.id, "retry")} className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-yellow-300 dark:border-yellow-700 text-yellow-700 dark:text-yellow-300 text-xs font-medium hover:bg-yellow-50 dark:hover:bg-yellow-900/20 transition">
                        <ArrowPathIcon className="h-3.5 w-3.5" /> Wiederholen
                      </button>
                    )}
                    {r.status === "PENDING" && (
                      <button onClick={() => void handleAction(r.id, "cancel")} className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-600 text-gray-500 dark:text-slate-400 text-xs font-medium hover:bg-gray-50 dark:hover:bg-slate-700 transition">
                        <XCircleIcon className="h-3.5 w-3.5" /> Abbrechen
                      </button>
                    )}
                    <button onClick={() => void handleDelete(r.id)} className="p-1.5 rounded-lg border border-gray-200 dark:border-slate-600 text-gray-400 hover:text-red-600 hover:border-red-300 transition">
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* New Reminder Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md p-6 border border-gray-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <BellAlertIcon className="h-5 w-5 text-violet-500" /> Neue Erinnerung
              </h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 text-2xl font-bold">×</button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">Titel *</label>
                <input type="text" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="z.B. Bewerbung nachfassen" className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">Nachricht</label>
                <textarea value={formBody} onChange={(e) => setFormBody(e.target.value)} rows={3} placeholder="Optionale Details…" className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">Fällig am *</label>
                  <input type="datetime-local" value={formDueAt} onChange={(e) => setFormDueAt(e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">Priorität</label>
                  <select value={formPriority} onChange={(e) => setFormPriority(e.target.value as ReminderPriority)} className={inputCls}>
                    <option value="LOW">Niedrig</option>
                    <option value="MEDIUM">Mittel</option>
                    <option value="HIGH">Hoch</option>
                    <option value="URGENT">Dringend</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">Tags (kommagetrennt)</label>
                <input type="text" value={formTags} onChange={(e) => setFormTags(e.target.value)} placeholder="z.B. follow-up, Interview" className={inputCls} />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-xl border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-200 text-sm font-medium hover:bg-gray-50 dark:hover:bg-slate-800 transition">
                Abbrechen
              </button>
              <button onClick={() => void handleCreate()} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 disabled:opacity-50 transition flex items-center justify-center gap-2">
                {saving && <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />}
                Erinnerung speichern
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const inputCls = "w-full border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition";
