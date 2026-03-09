"use client";

import { useState, useEffect, useCallback } from "react";
import {
  BoltIcon,
  PlusIcon,
  TrashIcon,
  PencilSquareIcon,
  CheckCircleIcon,
  XCircleIcon,
  PlayIcon,
  PauseIcon,
  SparklesIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import type { AutomationRule, AutomationTrigger, AutomationAction } from "@/app/api/kanban/automations/route";

// ─── Labels ────────────────────────────────────────────────────────────────────

const TRIGGER_LABELS: Record<AutomationTrigger, string> = {
  CARD_MOVED: "Karte wird verschoben",
  CARD_CREATED: "Neue Karte erstellt",
  STATUS_CHANGED: "Bewerbungsstatus ändert sich",
  DUE_DATE_APPROACHING: "Fälligkeitsdatum nähert sich",
  CARD_ASSIGNED: "Karte wurde zugewiesen",
};

const ACTION_LABELS: Record<AutomationAction, string> = {
  CREATE_REMINDER: "Erinnerung erstellen",
  CREATE_EVENT: "Kalender-Termin erstellen",
  SEND_NOTIFICATION: "In-App-Benachrichtigung senden",
  MOVE_CARD: "Karte in andere Spalte verschieben",
  ADD_TAG: "Tag hinzufügen",
  CHANGE_PRIORITY: "Priorität ändern",
};

const TRIGGER_ICONS: Record<AutomationTrigger, string> = {
  CARD_MOVED: "📦",
  CARD_CREATED: "✨",
  STATUS_CHANGED: "🔄",
  DUE_DATE_APPROACHING: "⏰",
  CARD_ASSIGNED: "👤",
};

const ACTION_ICONS: Record<AutomationAction, string> = {
  CREATE_REMINDER: "🔔",
  CREATE_EVENT: "📅",
  SEND_NOTIFICATION: "📣",
  MOVE_CARD: "➡️",
  ADD_TAG: "🏷️",
  CHANGE_PRIORITY: "⬆️",
};

// ─── Quick-start templates ─────────────────────────────────────────────────────

const QUICK_TEMPLATES: Omit<AutomationRule, "id" | "userId" | "runCount" | "lastRunAt" | "createdAt">[] = [
  {
    name: "Interview-Termin automatisch erstellen",
    enabled: true,
    trigger: "STATUS_CHANGED",
    triggerConfig: { newStatus: "INTERVIEW" },
    action: "CREATE_EVENT",
    actionConfig: { title: "Vorstellungsgespräch vorbereiten", daysBefore: 2 },
  },
  {
    name: "Erinnerung bei Fälligkeit",
    enabled: true,
    trigger: "DUE_DATE_APPROACHING",
    triggerConfig: { daysBefore: 1 },
    action: "CREATE_REMINDER",
    actionConfig: { title: "Aufgabe wird morgen fällig!", priority: "HIGH" },
  },
  {
    name: "Benachrichtigung bei neuer Karte",
    enabled: true,
    trigger: "CARD_CREATED",
    triggerConfig: {},
    action: "SEND_NOTIFICATION",
    actionConfig: { message: "Neue Kanban-Karte wurde erstellt." },
  },
  {
    name: "Priorität beim Interview erhöhen",
    enabled: true,
    trigger: "STATUS_CHANGED",
    triggerConfig: { newStatus: "INTERVIEW" },
    action: "CHANGE_PRIORITY",
    actionConfig: { priority: "HIGH" },
  },
  {
    name: "In Review verschieben bei Angebot",
    enabled: false,
    trigger: "STATUS_CHANGED",
    triggerConfig: { newStatus: "OFFER" },
    action: "MOVE_CARD",
    actionConfig: { targetColumn: "Angebot erhalten" },
  },
];

// ─── Component ─────────────────────────────────────────────────────────────────

export default function KanbanAutomations() {
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingRule, setEditingRule] = useState<AutomationRule | null>(null);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form state
  const [formName, setFormName] = useState("");
  const [formTrigger, setFormTrigger] = useState<AutomationTrigger>("CARD_MOVED");
  const [formTriggerConfig, setFormTriggerConfig] = useState<Record<string, string>>({});
  const [formAction, setFormAction] = useState<AutomationAction>("CREATE_REMINDER");
  const [formActionConfig, setFormActionConfig] = useState<Record<string, string>>({});
  const [formEnabled, setFormEnabled] = useState(true);

  const notify = (type: "success" | "error", text: string) => {
    setNotification({ type, text });
    setTimeout(() => setNotification(null), 3500);
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/kanban/automations");
      if (!res.ok) throw new Error("Automationen konnten nicht geladen werden.");
      setRules(await res.json() as AutomationRule[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Fehler beim Laden.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const resetForm = () => {
    setFormName("");
    setFormTrigger("CARD_MOVED");
    setFormTriggerConfig({});
    setFormAction("CREATE_REMINDER");
    setFormActionConfig({});
    setFormEnabled(true);
    setEditingRule(null);
  };

  const openCreate = () => {
    resetForm();
    setShowForm(true);
  };

  const openEdit = (rule: AutomationRule) => {
    setEditingRule(rule);
    setFormName(rule.name);
    setFormTrigger(rule.trigger);
    setFormTriggerConfig(Object.fromEntries(Object.entries(rule.triggerConfig).map(([k, v]) => [k, String(v)])));
    setFormAction(rule.action);
    setFormActionConfig(Object.fromEntries(Object.entries(rule.actionConfig).map(([k, v]) => [k, String(v)])));
    setFormEnabled(rule.enabled);
    setShowForm(true);
  };

  const applyTemplate = (t: typeof QUICK_TEMPLATES[number]) => {
    setEditingRule(null);
    setFormName(t.name);
    setFormTrigger(t.trigger);
    setFormTriggerConfig(Object.fromEntries(Object.entries(t.triggerConfig).map(([k, v]) => [k, String(v)])));
    setFormAction(t.action);
    setFormActionConfig(Object.fromEntries(Object.entries(t.actionConfig).map(([k, v]) => [k, String(v)])));
    setFormEnabled(t.enabled);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!formName.trim()) { notify("error", "Name ist Pflichtfeld."); return; }
    setSaving(true);
    try {
      const payload = {
        name: formName,
        enabled: formEnabled,
        trigger: formTrigger,
        triggerConfig: formTriggerConfig,
        action: formAction,
        actionConfig: formActionConfig,
      };

      const res = editingRule
        ? await fetch(`/api/kanban/automations?id=${editingRule.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
        : await fetch("/api/kanban/automations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });

      if (!res.ok) throw new Error("Speichern fehlgeschlagen.");
      notify("success", editingRule ? "Automation aktualisiert." : "Automation erstellt.");
      setShowForm(false);
      resetForm();
      await load();
    } catch (e) {
      notify("error", e instanceof Error ? e.message : "Fehler.");
    } finally {
      setSaving(false);
    }
  };

  const toggleEnabled = async (rule: AutomationRule) => {
    try {
      await fetch(`/api/kanban/automations?id=${rule.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !rule.enabled }),
      });
      await load();
    } catch { /* silent */ }
  };

  const deleteRule = async (id: string) => {
    if (!confirm("Automation wirklich löschen?")) return;
    await fetch(`/api/kanban/automations?id=${id}`, { method: "DELETE" });
    notify("success", "Automation gelöscht.");
    await load();
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-lg text-white text-sm font-medium transition-all ${notification.type === "success" ? "bg-green-600" : "bg-red-600"}`}>
          {notification.type === "success" ? <CheckCircleIcon className="h-5 w-5" /> : <ExclamationTriangleIcon className="h-5 w-5" />}
          {notification.text}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-100 dark:bg-orange-900/40 rounded-xl">
            <BoltIcon className="h-7 w-7 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Kanban-Automationen</h1>
            <p className="text-sm text-gray-500 dark:text-slate-400">
              Regeln automatisieren Ihren Bewerbungsprozess • {rules.length} aktive Regeln
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => void load()} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700 transition">
            <ArrowPathIcon className="h-4 w-4" /> Aktualisieren
          </button>
          <button onClick={openCreate} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-orange-600 text-white text-sm font-medium hover:bg-orange-700 transition">
            <PlusIcon className="h-4 w-4" /> Neue Automation
          </button>
        </div>
      </div>

      {/* Quick Templates */}
      {rules.length === 0 && !loading && (
        <div className="mb-8 bg-linear-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-2xl border border-orange-200 dark:border-orange-800 p-6">
          <div className="flex items-center gap-2 mb-4">
            <SparklesIcon className="h-5 w-5 text-orange-500" />
            <h3 className="text-sm font-bold text-orange-900 dark:text-orange-300">
              Schnellstart: Beliebte Automations-Vorlagen
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {QUICK_TEMPLATES.map((t) => (
              <button
                key={t.name}
                onClick={() => applyTemplate(t)}
                className="text-left p-4 bg-white dark:bg-slate-800 rounded-xl border border-orange-200 dark:border-orange-800 hover:border-orange-400 hover:shadow-md transition"
              >
                <div className="flex items-start gap-2 mb-2">
                  <span className="text-lg">{TRIGGER_ICONS[t.trigger]}</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white leading-tight">{t.name}</span>
                </div>
                <p className="text-xs text-gray-500 dark:text-slate-400">
                  {TRIGGER_LABELS[t.trigger]} → {ACTION_LABELS[t.action]}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Rules List */}
      {loading && (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-600" />
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-300 text-sm mb-4">
          {error}
        </div>
      )}

      {!loading && !error && rules.length > 0 && (
        <div className="space-y-4">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className={`bg-white dark:bg-slate-800 rounded-xl border transition ${rule.enabled ? "border-gray-200 dark:border-slate-700" : "border-dashed border-gray-300 dark:border-slate-600 opacity-60"}`}
            >
              <div className="p-5">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    {/* Enabled indicator */}
                    <button
                      onClick={() => void toggleEnabled(rule)}
                      className={`mt-0.5 shrink-0 rounded-full p-1 transition ${rule.enabled ? "text-green-500 hover:text-green-700" : "text-gray-300 dark:text-slate-600 hover:text-gray-500"}`}
                      title={rule.enabled ? "Deaktivieren" : "Aktivieren"}
                    >
                      {rule.enabled ? <PlayIcon className="h-5 w-5" /> : <PauseIcon className="h-5 w-5" />}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{rule.name}</h3>
                        {rule.enabled ? (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 font-medium">Aktiv</span>
                        ) : (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400 font-medium">Pausiert</span>
                        )}
                      </div>

                      {/* Flow: trigger → action */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                          <span>{TRIGGER_ICONS[rule.trigger]}</span>
                          <span className="text-xs font-medium text-blue-700 dark:text-blue-300">{TRIGGER_LABELS[rule.trigger]}</span>
                        </div>
                        <span className="text-gray-400 dark:text-slate-500 text-xs">→</span>
                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-orange-50 dark:bg-orange-900/30 rounded-lg">
                          <span>{ACTION_ICONS[rule.action]}</span>
                          <span className="text-xs font-medium text-orange-700 dark:text-orange-300">{ACTION_LABELS[rule.action]}</span>
                        </div>
                      </div>

                      {/* Meta */}
                      <div className="mt-2 flex items-center gap-4 text-xs text-gray-400 dark:text-slate-500">
                        <span>Ausgeführt: {rule.runCount}×</span>
                        {rule.lastRunAt && <span>Zuletzt: {new Date(rule.lastRunAt).toLocaleString("de-DE")}</span>}
                        <span>Erstellt: {new Date(rule.createdAt).toLocaleDateString("de-DE")}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => openEdit(rule)}
                      className="p-2 rounded-lg border border-gray-200 dark:border-slate-600 text-gray-500 dark:text-slate-400 hover:text-blue-600 hover:border-blue-300 transition"
                      title="Bearbeiten"
                    >
                      <PencilSquareIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => void deleteRule(rule.id)}
                      className="p-2 rounded-lg border border-gray-200 dark:border-slate-600 text-gray-500 dark:text-slate-400 hover:text-red-600 hover:border-red-300 transition"
                      title="Löschen"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg p-6 border border-gray-200 dark:border-slate-700 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <BoltIcon className="h-5 w-5 text-orange-500" />
                {editingRule ? "Automation bearbeiten" : "Neue Automation"}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 text-2xl font-bold">×</button>
            </div>

            <div className="space-y-5">
              {/* Name */}
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">Name *</label>
                <input type="text" value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="z.B. Interview-Termin automatisch erstellen" className={inputCls} />
              </div>

              {/* Trigger */}
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">Auslöser (Trigger)</label>
                <select value={formTrigger} onChange={(e) => { setFormTrigger(e.target.value as AutomationTrigger); setFormTriggerConfig({}); }} className={inputCls}>
                  {(Object.entries(TRIGGER_LABELS) as [AutomationTrigger, string][]).map(([k, v]) => (
                    <option key={k} value={k}>{TRIGGER_ICONS[k]} {v}</option>
                  ))}
                </select>
              </div>

              {/* Trigger Config */}
              {formTrigger === "STATUS_CHANGED" && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">Neuer Status</label>
                  <select value={formTriggerConfig.newStatus ?? ""} onChange={(e) => setFormTriggerConfig({ newStatus: e.target.value })} className={inputCls}>
                    <option value="">— wählen —</option>
                    {["APPLIED", "SCREENING", "INTERVIEW", "OFFER", "REJECTED", "ACCEPTED"].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              )}
              {formTrigger === "CARD_MOVED" && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">Ziel-Spalte</label>
                  <input type="text" value={formTriggerConfig.columnName ?? ""} onChange={(e) => setFormTriggerConfig({ columnName: e.target.value })} placeholder="z.B. Interview" className={inputCls} />
                </div>
              )}
              {formTrigger === "DUE_DATE_APPROACHING" && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">Tage vorher</label>
                  <input type="number" min={1} max={30} value={formTriggerConfig.daysBefore ?? "1"} onChange={(e) => setFormTriggerConfig({ daysBefore: e.target.value })} className={inputCls} />
                </div>
              )}

              {/* Action */}
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">Aktion</label>
                <select value={formAction} onChange={(e) => { setFormAction(e.target.value as AutomationAction); setFormActionConfig({}); }} className={inputCls}>
                  {(Object.entries(ACTION_LABELS) as [AutomationAction, string][]).map(([k, v]) => (
                    <option key={k} value={k}>{ACTION_ICONS[k]} {v}</option>
                  ))}
                </select>
              </div>

              {/* Action Config */}
              {(formAction === "CREATE_REMINDER" || formAction === "CREATE_EVENT") && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">Titel</label>
                    <input type="text" value={formActionConfig.title ?? ""} onChange={(e) => setFormActionConfig({ ...formActionConfig, title: e.target.value })} placeholder="z.B. Vorbereitung Gespräch" className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">Tage vorher anlegen</label>
                    <input type="number" min={0} max={30} value={formActionConfig.daysBefore ?? "1"} onChange={(e) => setFormActionConfig({ ...formActionConfig, daysBefore: e.target.value })} className={inputCls} />
                  </div>
                </div>
              )}
              {formAction === "SEND_NOTIFICATION" && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">Nachricht</label>
                  <input type="text" value={formActionConfig.message ?? ""} onChange={(e) => setFormActionConfig({ message: e.target.value })} placeholder="Deine Nachricht…" className={inputCls} />
                </div>
              )}
              {formAction === "MOVE_CARD" && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">Ziel-Spalte</label>
                  <input type="text" value={formActionConfig.targetColumn ?? ""} onChange={(e) => setFormActionConfig({ targetColumn: e.target.value })} placeholder="Spaltenname" className={inputCls} />
                </div>
              )}
              {formAction === "CHANGE_PRIORITY" && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">Neue Priorität</label>
                  <select value={formActionConfig.priority ?? "MEDIUM"} onChange={(e) => setFormActionConfig({ priority: e.target.value })} className={inputCls}>
                    <option value="LOW">Niedrig</option>
                    <option value="MEDIUM">Mittel</option>
                    <option value="HIGH">Hoch</option>
                    <option value="URGENT">Dringend</option>
                  </select>
                </div>
              )}
              {formAction === "ADD_TAG" && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">Tag</label>
                  <input type="text" value={formActionConfig.tag ?? ""} onChange={(e) => setFormActionConfig({ tag: e.target.value })} placeholder="z.B. Priorität" className={inputCls} />
                </div>
              )}

              {/* Enabled */}
              <div className="flex items-center gap-3">
                <input type="checkbox" id="form-enabled" checked={formEnabled} onChange={(e) => setFormEnabled(e.target.checked)} className="w-4 h-4 text-orange-600 border-gray-300 rounded" />
                <label htmlFor="form-enabled" className="text-sm text-gray-700 dark:text-slate-300">Automation sofort aktivieren</label>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-xl border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-200 text-sm font-medium hover:bg-gray-50 dark:hover:bg-slate-800 transition">
                Abbrechen
              </button>
              <button onClick={() => void handleSave()} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-orange-600 text-white text-sm font-medium hover:bg-orange-700 disabled:opacity-50 transition flex items-center justify-center gap-2">
                {saving ? <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> : null}
                {editingRule ? "Aktualisieren" : "Erstellen"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const inputCls = "w-full border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition";
