"use client";

import { useEffect, useState, useCallback } from "react";
import {
  ClockIcon as Clock,
  DocumentTextIcon as FileText,
  ChatBubbleLeftIcon as MessageSquare,
  CalendarDaysIcon as Calendar,
  BoltIcon as Activity,
  PencilSquareIcon as Edit3,
  TrashIcon as Trash2,
  PlusIcon as Plus,
  XMarkIcon as X,
  CheckIcon as Check,
  ArrowPathIcon as Loader2,
  ChevronDownIcon as ChevronDown,
  ChevronUpIcon as ChevronUp,
} from "@heroicons/react/24/outline";

// ─── Types ───────────────────────────────────────────────────────────────────

type TimelineEntryType =
  | "STATUS_CHANGE"
  | "NOTE"
  | "COVER_LETTER"
  | "CV_UPDATE"
  | "ACTIVITY"
  | "CALENDAR_EVENT"
  | "MANUAL";

interface TimelineEntry {
  id: string;
  applicationId: string;
  type: TimelineEntryType;
  title: string;
  content?: string | null;
  status?: string | null;
  itBereich?: string | null;
  week?: number | null;
  date: string;
  noteId?: string | null;
  coverId?: string | null;
  eventId?: string | null;
  activityId?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ApplicationTimelineProps {
  applicationId: string;
  applicationName: string;
  itBereich?: string;
  currentStatus?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<TimelineEntryType, string> = {
  STATUS_CHANGE: "Statusänderung",
  NOTE: "Notiz",
  COVER_LETTER: "Anschreiben",
  CV_UPDATE: "Lebenslauf",
  ACTIVITY: "Aktivität",
  CALENDAR_EVENT: "Kalendereintrag",
  MANUAL: "Manueller Eintrag",
};

const STATUS_LABELS: Record<string, string> = {
  APPLIED: "Beworben",
  REVIEWED: "Geprüft",
  INTERVIEW_SCHEDULED: "Interview geplant",
  INTERVIEWED: "Interview absolviert",
  OFFER_RECEIVED: "Angebot erhalten",
  ACCEPTED: "Angenommen",
  REJECTED: "Abgelehnt",
  WITHDRAWN: "Zurückgezogen",
  INITIATIVE: "Initiativbewerbung",
  OTHER: "Sonstiges",
  SAVED: "Gespeichert",
  TASK_RECEIVED: "Aufgabe erhalten",
  TASK_SUBMITTED: "Aufgabe eingereicht",
  GHOSTING: "Kein Feedback",
  NEGOTIATION: "Verhandlung",
};

function typeIcon(type: TimelineEntryType) {
  switch (type) {
    case "STATUS_CHANGE":
      return <Activity className="w-4 h-4" />;
    case "NOTE":
      return <MessageSquare className="w-4 h-4" />;
    case "COVER_LETTER":
      return <FileText className="w-4 h-4" />;
    case "CV_UPDATE":
      return <FileText className="w-4 h-4" />;
    case "CALENDAR_EVENT":
      return <Calendar className="w-4 h-4" />;
    default:
      return <Clock className="w-4 h-4" />;
  }
}

function typeColor(type: TimelineEntryType): string {
  switch (type) {
    case "STATUS_CHANGE":
      return "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800";
    case "NOTE":
      return "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800";
    case "COVER_LETTER":
      return "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800";
    case "CV_UPDATE":
      return "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800";
    case "CALENDAR_EVENT":
      return "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800";
    default:
      return "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700";
  }
}

function dotColor(type: TimelineEntryType): string {
  switch (type) {
    case "STATUS_CHANGE":
      return "bg-blue-500";
    case "NOTE":
      return "bg-yellow-500";
    case "COVER_LETTER":
      return "bg-purple-500";
    case "CV_UPDATE":
      return "bg-green-500";
    case "CALENDAR_EVENT":
      return "bg-orange-500";
    default:
      return "bg-gray-400";
  }
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const weekday = d.toLocaleDateString("de-DE", { weekday: "long" });
  const day = d.getDate().toString().padStart(2, "0");
  const month = (d.getMonth() + 1).toString().padStart(2, "0");
  const year = d.getFullYear();
  const calWeek = getCalWeek(d);
  return `${weekday}, ${day}.${month}.${year} – KW ${calWeek}`;
}

function getCalWeek(date: Date): number {
  const tmp = new Date(date.getTime());
  tmp.setHours(0, 0, 0, 0);
  tmp.setDate(tmp.getDate() + 3 - ((tmp.getDay() + 6) % 7));
  const week1 = new Date(tmp.getFullYear(), 0, 4);
  return (
    1 +
    Math.round(
      ((tmp.getTime() - week1.getTime()) / 86400000 -
        3 +
        ((week1.getDay() + 6) % 7)) /
        7
    )
  );
}

const ENTRY_TYPES: TimelineEntryType[] = [
  "MANUAL",
  "STATUS_CHANGE",
  "NOTE",
  "COVER_LETTER",
  "CV_UPDATE",
  "ACTIVITY",
  "CALENDAR_EVENT",
];

const APPLICATION_STATUSES = Object.keys(STATUS_LABELS);

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ApplicationTimeline({
  applicationId,
  applicationName,
  itBereich,
  currentStatus,
}: ApplicationTimelineProps) {
  const [entries, setEntries] = useState<TimelineEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Add form state
  const [addForm, setAddForm] = useState({
    type: "MANUAL" as TimelineEntryType,
    title: "",
    content: "",
    status: currentStatus ?? "",
    itBereich: itBereich ?? "",
    date: new Date().toISOString().slice(0, 16),
  });

  // Edit form state
  const [editForm, setEditForm] = useState({
    type: "MANUAL" as TimelineEntryType,
    title: "",
    content: "",
    status: "",
    itBereich: "",
    date: "",
  });

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/timeline?applicationId=${applicationId}`);
      if (!res.ok) throw new Error("Fehler beim Laden der Timeline");
      const data = await res.json();
      setEntries(data);
    } catch {
      setError("Timeline konnte nicht geladen werden.");
    } finally {
      setLoading(false);
    }
  }, [applicationId]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  async function handleAdd() {
    if (!addForm.title.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/timeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationId,
          type: addForm.type,
          title: addForm.title,
          content: addForm.content,
          status: addForm.status || undefined,
          itBereich: addForm.itBereich || undefined,
          date: addForm.date ? new Date(addForm.date).toISOString() : undefined,
        }),
      });
      if (!res.ok) throw new Error("Fehler beim Erstellen");
      setShowAdd(false);
      setAddForm({
        type: "MANUAL",
        title: "",
        content: "",
        status: currentStatus ?? "",
        itBereich: itBereich ?? "",
        date: new Date().toISOString().slice(0, 16),
      });
      await fetchEntries();
    } catch {
      setError("Eintrag konnte nicht gespeichert werden.");
    } finally {
      setSaving(false);
    }
  }

  function startEdit(entry: TimelineEntry) {
    setEditId(entry.id);
    setEditForm({
      type: entry.type,
      title: entry.title,
      content: entry.content ?? "",
      status: entry.status ?? "",
      itBereich: entry.itBereich ?? "",
      date: new Date(entry.date).toISOString().slice(0, 16),
    });
  }

  async function handleEdit() {
    if (!editId || !editForm.title.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/timeline/${editId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: editForm.type,
          title: editForm.title,
          content: editForm.content,
          status: editForm.status || undefined,
          itBereich: editForm.itBereich || undefined,
          date: editForm.date ? new Date(editForm.date).toISOString() : undefined,
        }),
      });
      if (!res.ok) throw new Error("Fehler beim Speichern");
      setEditId(null);
      await fetchEntries();
    } catch {
      setError("Eintrag konnte nicht aktualisiert werden.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Eintrag wirklich löschen?")) return;
    try {
      const res = await fetch(`/api/timeline/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Fehler beim Löschen");
      await fetchEntries();
    } catch {
      setError("Eintrag konnte nicht gelöscht werden.");
    }
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Timeline
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">{applicationName}</p>
        </div>
        <button
          onClick={() => setShowAdd((v) => !v)}
          className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Eintrag hinzufügen
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
          {error}
          <button onClick={() => setError(null)} className="ml-2 underline">
            Schließen
          </button>
        </div>
      )}

      {/* Add Form */}
      {showAdd && (
        <div className="p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl space-y-3">
          <h3 className="font-medium text-gray-900 dark:text-white text-sm">
            Neuer Timeline-Eintrag
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                Typ
              </label>
              <select
                value={addForm.type}
                onChange={(e) =>
                  setAddForm((f) => ({ ...f, type: e.target.value as TimelineEntryType }))
                }
                className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              >
                {ENTRY_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {TYPE_LABELS[t]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                Status (optional)
              </label>
              <select
                value={addForm.status}
                onChange={(e) => setAddForm((f) => ({ ...f, status: e.target.value }))}
                className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              >
                <option value="">– Kein Status –</option>
                {APPLICATION_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
              Titel *
            </label>
            <input
              type="text"
              value={addForm.title}
              onChange={(e) => setAddForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="z. B. Bewerbung abgesendet"
              className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
              Beschreibung (optional)
            </label>
            <textarea
              value={addForm.content}
              onChange={(e) => setAddForm((f) => ({ ...f, content: e.target.value }))}
              placeholder="Details, Notizen, Recherche..."
              rows={3}
              className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-900 text-gray-900 dark:text-white resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                IT-Bereich (optional)
              </label>
              <input
                type="text"
                value={addForm.itBereich}
                onChange={(e) => setAddForm((f) => ({ ...f, itBereich: e.target.value }))}
                placeholder="z. B. Frontend, Backend"
                className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                Datum
              </label>
              <input
                type="datetime-local"
                value={addForm.date}
                onChange={(e) => setAddForm((f) => ({ ...f, date: e.target.value }))}
                className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => setShowAdd(false)}
              className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Abbrechen
            </button>
            <button
              onClick={handleAdd}
              disabled={!addForm.title.trim() || saving}
              className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm rounded-lg transition-colors"
            >
              {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
              Speichern
            </button>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      )}

      {/* Empty */}
      {!loading && entries.length === 0 && (
        <div className="text-center py-10 text-gray-400 dark:text-gray-500">
          <Clock className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm">Noch keine Timeline-Einträge</p>
          <p className="text-xs mt-1">
            Klicke auf &ldquo;Eintrag hinzufügen&rdquo;, um zu beginnen.
          </p>
        </div>
      )}

      {/* Timeline entries */}
      {!loading && entries.length > 0 && (
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />

          <div className="space-y-1">
            {entries.map((entry) => {
              const isEditing = editId === entry.id;
              const isExpanded = expandedId === entry.id;

              return (
                <div key={entry.id} className="relative pl-10">
                  {/* Dot */}
                  <div
                    className={`absolute left-2.5 top-4 w-3 h-3 rounded-full border-2 border-white dark:border-gray-900 ${dotColor(entry.type)}`}
                  />

                  <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-3 shadow-sm">
                    {isEditing ? (
                      // ── Edit mode ──
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Typ</label>
                            <select
                              value={editForm.type}
                              onChange={(e) =>
                                setEditForm((f) => ({
                                  ...f,
                                  type: e.target.value as TimelineEntryType,
                                }))
                              }
                              className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                            >
                              {ENTRY_TYPES.map((t) => (
                                <option key={t} value={t}>
                                  {TYPE_LABELS[t]}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Status</label>
                            <select
                              value={editForm.status}
                              onChange={(e) =>
                                setEditForm((f) => ({ ...f, status: e.target.value }))
                              }
                              className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                            >
                              <option value="">– Kein Status –</option>
                              {APPLICATION_STATUSES.map((s) => (
                                <option key={s} value={s}>
                                  {STATUS_LABELS[s]}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <input
                          type="text"
                          value={editForm.title}
                          onChange={(e) =>
                            setEditForm((f) => ({ ...f, title: e.target.value }))
                          }
                          className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                        />
                        <textarea
                          value={editForm.content}
                          onChange={(e) =>
                            setEditForm((f) => ({ ...f, content: e.target.value }))
                          }
                          rows={3}
                          className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-900 text-gray-900 dark:text-white resize-none"
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={editForm.itBereich}
                            onChange={(e) =>
                              setEditForm((f) => ({ ...f, itBereich: e.target.value }))
                            }
                            placeholder="IT-Bereich"
                            className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                          />
                          <input
                            type="datetime-local"
                            value={editForm.date}
                            onChange={(e) =>
                              setEditForm((f) => ({ ...f, date: e.target.value }))
                            }
                            className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                          />
                        </div>
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => setEditId(null)}
                            className="p-1.5 text-gray-400 hover:text-gray-600 rounded"
                          >
                            <X className="w-4 h-4" />
                          </button>
                          <button
                            onClick={handleEdit}
                            disabled={!editForm.title.trim() || saving}
                            className="p-1.5 text-green-600 hover:text-green-700 disabled:opacity-50 rounded"
                          >
                            {saving ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Check className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    ) : (
                      // ── View mode ──
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2 min-w-0">
                            <span
                              className={`flex-shrink-0 flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${typeColor(entry.type)}`}
                            >
                              {typeIcon(entry.type)}
                              <span>{TYPE_LABELS[entry.type]}</span>
                            </span>
                            <span className="font-medium text-sm text-gray-900 dark:text-white truncate">
                              {entry.title}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            {(entry.content || entry.status || entry.itBereich) && (
                              <button
                                onClick={() =>
                                  setExpandedId(isExpanded ? null : entry.id)
                                }
                                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded"
                              >
                                {isExpanded ? (
                                  <ChevronUp className="w-3.5 h-3.5" />
                                ) : (
                                  <ChevronDown className="w-3.5 h-3.5" />
                                )}
                              </button>
                            )}
                            <button
                              onClick={() => startEdit(entry)}
                              className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(entry.id)}
                              className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 ml-0.5">
                          {formatDate(entry.date)}
                        </p>

                        {isExpanded && (
                          <div className="mt-2 space-y-1.5 border-t border-gray-100 dark:border-gray-700 pt-2">
                            {entry.status && (
                              <div className="flex items-center gap-2 text-xs">
                                <span className="text-gray-500 dark:text-gray-400 font-medium w-20">
                                  Status
                                </span>
                                <span className="text-gray-900 dark:text-white">
                                  {STATUS_LABELS[entry.status] ?? entry.status}
                                </span>
                              </div>
                            )}
                            {entry.itBereich && (
                              <div className="flex items-center gap-2 text-xs">
                                <span className="text-gray-500 dark:text-gray-400 font-medium w-20">
                                  IT-Bereich
                                </span>
                                <span className="text-gray-900 dark:text-white">
                                  {entry.itBereich}
                                </span>
                              </div>
                            )}
                            {entry.content && (
                              <div className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                                {entry.content}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
