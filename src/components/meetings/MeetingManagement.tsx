"use client";

import { useState, useEffect, useCallback } from "react";
import {
  VideoCameraIcon,
  PlusIcon,
  CalendarIcon,
  ClockIcon,
  LinkIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";

// ─── Typen ────────────────────────────────────────────────────────────────────

interface Meeting {
  id: string;
  title: string;
  platform: string;
  meetingUrl: string | null;
  scheduledAt: string;
  duration: number | null;
  description: string | null;
  notes: string | null;
  status: "SCHEDULED" | "ONGOING" | "COMPLETED" | "CANCELLED" | "RESCHEDULED";
  createdAt: string;
  application?: { companyName: string; position: string } | null;
  contact?: { firstName: string; lastName: string } | null;
}

interface Platform {
  id: string;
  name: string;
  configured: boolean;
  apiConnected: boolean;
  isLocal: boolean;
}

const PLATFORM_LABELS: Record<string, string> = {
  ZOOM: "Zoom",
  TEAMS: "Microsoft Teams",
  MEET: "Google Meet",
  LOOM: "Loom",
  PHONE: "Telefon",
  ONSITE: "Vor Ort",
  LOCAL: "Lokaler Kalender",
  OTHER: "Sonstiges",
};

const STATUS_STYLE: Record<Meeting["status"], string> = {
  SCHEDULED: "bg-blue-100 text-blue-800",
  ONGOING: "bg-emerald-100 text-emerald-800",
  COMPLETED: "bg-gray-100 text-gray-600",
  CANCELLED: "bg-red-100 text-red-700",
  RESCHEDULED: "bg-amber-100 text-amber-800",
};

const STATUS_LABEL: Record<Meeting["status"], string> = {
  SCHEDULED: "Geplant",
  ONGOING: "Läuft",
  COMPLETED: "Abgeschlossen",
  CANCELLED: "Abgesagt",
  RESCHEDULED: "Verschoben",
};

// ─── Haupt-Komponente ─────────────────────────────────────────────────────────

export default function MeetingManagement() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterUpcoming, setFilterUpcoming] = useState(false);

  const [form, setForm] = useState({
    title: "",
    platform: "LOCAL",
    meetingUrl: "",
    scheduledAt: "",
    duration: 60,
    description: "",
    notes: "",
  });

  // ─── Daten laden ────────────────────────────────────────────────────────────

  const fetchMeetings = useCallback(async () => {
    try {
      const url = filterUpcoming ? "/api/meetings?upcoming=true" : "/api/meetings";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Ladefehler");
      const data = await res.json() as Meeting[];
      setMeetings(Array.isArray(data) ? data : []);
    } catch {
      setError("Meetings konnten nicht geladen werden.");
    }
  }, [filterUpcoming]);

  const fetchPlatforms = useCallback(async () => {
    try {
      const res = await fetch("/api/meetings?action=platforms");
      if (!res.ok) return;
      const data = await res.json() as { success: boolean; platforms: Platform[] };
      if (data.success) setPlatforms(data.platforms);
    } catch {
      // Plattform-Status ist optional
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchMeetings(), fetchPlatforms()]).finally(() => setLoading(false));
  }, [fetchMeetings, fetchPlatforms]);

  // ─── Formular-Reset ──────────────────────────────────────────────────────────

  const resetForm = () => {
    setForm({
      title: "",
      platform: "LOCAL",
      meetingUrl: "",
      scheduledAt: "",
      duration: 60,
      description: "",
      notes: "",
    });
    setEditingId(null);
    setShowForm(false);
  };

  const openEdit = (m: Meeting) => {
    setForm({
      title: m.title,
      platform: m.platform,
      meetingUrl: m.meetingUrl ?? "",
      scheduledAt: m.scheduledAt.slice(0, 16), // datetime-local format
      duration: m.duration ?? 60,
      description: m.description ?? "",
      notes: m.notes ?? "",
    });
    setEditingId(m.id);
    setShowForm(true);
  };

  // ─── Erstellen / Bearbeiten ─────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.scheduledAt) {
      setError("Titel und Startzeit sind erforderlich.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const body = {
        title: form.title,
        platform: form.platform,
        meetingUrl: form.meetingUrl || null,
        scheduledAt: new Date(form.scheduledAt).toISOString(),
        duration: form.duration || null,
        description: form.description || null,
        notes: form.notes || null,
      };

      const res = editingId
        ? await fetch(`/api/meetings?id=${editingId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          })
        : await fetch("/api/meetings", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });

      if (!res.ok) {
        const err = await res.json() as { error?: string };
        throw new Error(err.error ?? "Fehler beim Speichern");
      }

      setSuccess(editingId ? "Meeting aktualisiert." : "Meeting erstellt.");
      resetForm();
      await fetchMeetings();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fehler beim Speichern.");
    } finally {
      setLoading(false);
    }
  };

  // ─── Status-Änderung ─────────────────────────────────────────────────────────

  const updateStatus = async (id: string, status: Meeting["status"]) => {
    try {
      const res = await fetch(`/api/meetings?id=${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      await fetchMeetings();
      setSuccess("Status aktualisiert.");
    } catch {
      setError("Status konnte nicht geändert werden.");
    }
  };

  // ─── Löschen ────────────────────────────────────────────────────────────────

  const deleteMeeting = async (id: string) => {
    if (!confirm("Meeting wirklich löschen?")) return;
    try {
      const res = await fetch(`/api/meetings?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setMeetings((prev) => prev.filter((m) => m.id !== id));
      setSuccess("Meeting gelöscht.");
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

  const isUpcoming = (iso: string) => new Date(iso) > new Date();

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <VideoCameraIcon className="w-7 h-7 text-blue-600" />
            Meeting-Management
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Video-Calls und Termine für Bewerbungsgespräche verwalten
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input
              id="filter-upcoming"
              name="filterUpcoming"
              type="checkbox"
              checked={filterUpcoming}
              onChange={(e) => setFilterUpcoming(e.target.checked)}
              className="rounded border-gray-300"
            />
            Nur kommende
          </label>
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <PlusIcon className="w-4 h-4" />
            Neues Meeting
          </button>
        </div>
      </div>

      {/* Nachrichten */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 flex justify-between">
          {error}
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700 ml-4">×</button>
        </div>
      )}
      {success && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 flex justify-between">
          {success}
          <button onClick={() => setSuccess(null)} className="text-emerald-500 hover:text-emerald-700 ml-4">×</button>
        </div>
      )}

      {/* Plattform-Status */}
      {platforms.length > 0 && (
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Verfügbare Plattformen</h2>
          <div className="flex flex-wrap gap-2">
            {platforms.map((p) => (
              <span
                key={p.id}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border
                  ${p.apiConnected
                    ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                    : p.isLocal
                    ? "bg-blue-50 border-blue-200 text-blue-700"
                    : "bg-gray-50 border-gray-200 text-gray-500"}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${p.apiConnected ? "bg-emerald-500" : p.isLocal ? "bg-blue-500" : "bg-gray-400"}`} />
                {p.name}
                {p.apiConnected && " ✓"}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Formular */}
      {showForm && (
        <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-5 shadow-sm">
          <h2 className="text-base font-semibold text-gray-800 mb-4">
            {editingId ? "Meeting bearbeiten" : "Neues Meeting erstellen"}
          </h2>
          <form onSubmit={(e) => void handleSubmit(e)} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Titel *</label>
              <input
                id="meeting-title"
                name="title"
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="z.B. Vorstellungsgespräch Zalando"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Plattform</label>
              <select
                id="meeting-platform"
                name="platform"
                value={form.platform}
                onChange={(e) => setForm({ ...form, platform: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
              >
                {Object.entries(PLATFORM_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Meeting-URL</label>
              <input
                id="meeting-url"
                name="meetingUrl"
                type="url"
                value={form.meetingUrl}
                onChange={(e) => setForm({ ...form, meetingUrl: e.target.value })}
                placeholder="https://zoom.us/j/..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Startzeit *</label>
              <input
                id="meeting-scheduled-at"
                name="scheduledAt"
                type="datetime-local"
                value={form.scheduledAt}
                onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dauer (Minuten)</label>
              <input
                id="meeting-duration"
                name="duration"
                type="number"
                value={form.duration}
                onChange={(e) => setForm({ ...form, duration: Number(e.target.value) })}
                min={5}
                max={480}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Beschreibung</label>
              <textarea
                id="meeting-description"
                name="description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2}
                placeholder="Agendapunkte, Ansprechpartner..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Notizen</label>
              <textarea
                id="meeting-notes"
                name="notes"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={2}
                placeholder="Eigene Vorbereitung, Fragen..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="sm:col-span-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Abbrechen
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {loading ? "Speichern..." : editingId ? "Aktualisieren" : "Erstellen"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Meeting-Liste */}
      {loading && !showForm ? (
        <div className="text-center py-12 text-sm text-gray-400">Meetings werden geladen...</div>
      ) : meetings.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-10 text-center">
          <CalendarIcon className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">
            {filterUpcoming ? "Keine kommenden Meetings." : "Noch keine Meetings angelegt."}
          </p>
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            className="mt-3 text-sm text-blue-600 hover:underline"
          >
            Erstes Meeting erstellen
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {meetings.map((m) => (
            <div
              key={m.id}
              className={`rounded-xl border bg-white shadow-sm hover:shadow-md transition-shadow p-4
                ${isUpcoming(m.scheduledAt) ? "border-blue-100" : "border-gray-100"}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 p-2 rounded-lg ${isUpcoming(m.scheduledAt) ? "bg-blue-50" : "bg-gray-50"}`}>
                    <VideoCameraIcon className={`w-5 h-5 ${isUpcoming(m.scheduledAt) ? "text-blue-600" : "text-gray-400"}`} />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{m.title}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500">
                        {PLATFORM_LABELS[m.platform] ?? m.platform}
                      </span>
                      <span className="text-gray-300">·</span>
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <CalendarIcon className="w-3 h-3" />
                        {fmtDate(m.scheduledAt)}
                      </span>
                      {m.duration && (
                        <>
                          <span className="text-gray-300">·</span>
                          <span className="flex items-center gap-1 text-xs text-gray-500">
                            <ClockIcon className="w-3 h-3" />
                            {m.duration} Min.
                          </span>
                        </>
                      )}
                    </div>
                    {m.application && (
                      <p className="text-xs text-indigo-600 mt-0.5">
                        {m.application.position} @ {m.application.companyName}
                      </p>
                    )}
                    {m.contact && (
                      <p className="text-xs text-teal-600 mt-0.5">
                        {m.contact.firstName} {m.contact.lastName}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_STYLE[m.status]}`}>
                    {STATUS_LABEL[m.status]}
                  </span>
                </div>
              </div>

              {/* Aktionsleiste */}
              <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-gray-50">
                {m.meetingUrl && (
                  <a
                    href={m.meetingUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 transition-colors"
                  >
                    <LinkIcon className="w-3.5 h-3.5" />
                    Meeting beitreten
                  </a>
                )}
                {m.status === "SCHEDULED" && (
                  <button
                    onClick={() => void updateStatus(m.id, "COMPLETED")}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-500" />
                    Abgeschlossen
                  </button>
                )}
                {m.status === "SCHEDULED" && (
                  <button
                    onClick={() => void updateStatus(m.id, "CANCELLED")}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    <XCircleIcon className="w-3.5 h-3.5 text-red-500" />
                    Absagen
                  </button>
                )}
                <button
                  onClick={() => openEdit(m)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Bearbeiten
                </button>
                <button
                  onClick={() => void deleteMeeting(m.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-100 text-xs text-red-600 hover:bg-red-50 transition-colors ml-auto"
                >
                  <TrashIcon className="w-3.5 h-3.5" />
                  Löschen
                </button>
              </div>

              {/* Beschreibung / Notizen */}
              {(m.description || m.notes) && (
                <div className="mt-3 pt-2 border-t border-gray-50 space-y-1">
                  {m.description && (
                    <p className="text-xs text-gray-500">
                      <span className="font-medium text-gray-600">Beschreibung: </span>{m.description}
                    </p>
                  )}
                  {m.notes && (
                    <p className="text-xs text-gray-500">
                      <span className="font-medium text-gray-600">Notizen: </span>{m.notes}
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
