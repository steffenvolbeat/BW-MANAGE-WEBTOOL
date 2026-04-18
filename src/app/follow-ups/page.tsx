"use client";
import { useState, useEffect, useCallback } from "react";

interface FollowUp {
  id: string;
  dueAt: string;
  type: string;
  subject: string;
  aiDraft: string | null;
  isDone: boolean;
  sentAt: string | null;
  contactId: string | null;
  applicationId: string | null;
  application?: { company?: string; position?: string } | null;
  contact?: { name?: string; company?: string } | null;
}

type GroupLabel = "overdue" | "today" | "upcoming" | "done";

const TYPE_ICONS: Record<string, string> = {
  EMAIL: "📧", PHONE: "📞", LINKEDIN: "💼", FOLLOW_UP: "🔁",
};

function groupFollowUps(items: FollowUp[]): Record<GroupLabel, FollowUp[]> {
  const now = new Date();
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  const groups: Record<GroupLabel, FollowUp[]> = { overdue: [], today: [], upcoming: [], done: [] };
  for (const f of items) {
    if (f.isDone) { groups.done.push(f); continue; }
    const due = new Date(f.dueAt);
    if (due < now) groups.overdue.push(f);
    else if (due <= todayEnd) groups.today.push(f);
    else groups.upcoming.push(f);
  }
  return groups;
}

const GROUP_STYLES: Record<GroupLabel, { label: string; bg: string; badge: string }> = {
  overdue: { label: "⚠️ Überfällig", bg: "border-l-4 border-red-400", badge: "bg-red-100 text-red-700" },
  today:   { label: "📅 Heute fällig", bg: "border-l-4 border-orange-400", badge: "bg-orange-100 text-orange-700" },
  upcoming:{ label: "🗓️ Demnächst", bg: "border-l-4 border-blue-400", badge: "bg-blue-100 text-blue-700" },
  done:    { label: "✅ Erledigt", bg: "border-l-4 border-green-400 opacity-60", badge: "bg-green-100 text-green-700" },
};

export default function FollowUpsPage() {
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [loading, setLoading] = useState(true);
  const [drafting, setDrafting] = useState<string | null>(null);

  // Create form state
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ type: "EMAIL", subject: "", dueAt: "", generateDraft: false });
  const [creating, setCreating] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/follow-ups")
      .then((r) => r.json())
      .then((d) => { setFollowUps(d.followUps ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- load() ruft setState via useCallback auf (valides async-Pattern)
  useEffect(() => { load(); }, [load]);

  const markDone = async (id: string) => {
    await fetch(`/api/follow-ups/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isDone: true }),
    });
    setFollowUps((prev) => prev.map((f) => f.id === id ? { ...f, isDone: true, sentAt: new Date().toISOString() } : f));
  };

  const deleteItem = async (id: string) => {
    await fetch(`/api/follow-ups/${id}`, { method: "DELETE" });
    setFollowUps((prev) => prev.filter((f) => f.id !== id));
  };

  const generateDraft = async (id: string) => {
    setDrafting(id);
    const f = followUps.find((f) => f.id === id);
    if (!f) { setDrafting(null); return; }
    const res = await fetch("/api/follow-ups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: f.type, subject: f.subject, dueAt: f.dueAt,
        generateDraft: true,
        applicationId: f.applicationId,
        contactId: f.contactId,
      }),
    });
    const data = await res.json();
    if (data.draft) {
      await fetch(`/api/follow-ups/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aiDraft: data.draft }),
      });
      setFollowUps((prev) => prev.map((fu) => fu.id === id ? { ...fu, aiDraft: data.draft } : fu));
    }
    setDrafting(null);
  };

  const create = async () => {
    setCreating(true);
    const res = await fetch("/api/follow-ups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (data.followUp) {
      setFollowUps((prev) => [data.followUp, ...prev]);
      setShowCreate(false);
      setForm({ type: "EMAIL", subject: "", dueAt: "", generateDraft: false });
    }
    setCreating(false);
  };

  const groups = groupFollowUps(followUps);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("de-DE", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

  return (
    <div className="min-h-screen bg-(--surface) text-foreground p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">⏰ Smart Follow-up Timeline</h1>
          <p className="text-(--muted) mt-1">
            KI-generierte Nachfass-Entwürfe für Bewerbungen und Kontakte
          </p>
        </div>
        <button
          onClick={() => setShowCreate((s) => !s)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
        >
          + Neu erstellen
        </button>
      </div>

      {/* Erstellungsformular */}
      {showCreate && (
        <div className="bg-(--card) border border-(--border) rounded-xl p-6 mb-6">
          <h2 className="text-base font-semibold mb-4">Neues Follow-up</h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-sm text-(--muted) block mb-1">Typ</label>
              <select
                className="w-full border border-(--border) rounded-lg px-3 py-2 bg-(--surface) text-sm"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
              >
                {["EMAIL", "PHONE", "LINKEDIN", "FOLLOW_UP"].map((t) => (
                  <option key={t} value={t}>{TYPE_ICONS[t]} {t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm text-(--muted) block mb-1">Fälligkeitsdatum</label>
              <input
                type="datetime-local"
                className="w-full border border-(--border) rounded-lg px-3 py-2 bg-(--surface) text-sm"
                value={form.dueAt}
                onChange={(e) => setForm({ ...form, dueAt: e.target.value })}
              />
            </div>
          </div>
          <div className="mb-4">
            <label className="text-sm text-(--muted) block mb-1">Betreff / Kontext</label>
            <input
              type="text"
              className="w-full border border-(--border) rounded-lg px-3 py-2 bg-(--surface) text-sm"
              placeholder="z.B. Nachfassen nach Bewerbung bei Google..."
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
            />
          </div>
          <label className="flex items-center gap-2 text-sm mb-4 cursor-pointer">
            <input
              type="checkbox"
              checked={form.generateDraft}
              onChange={(e) => setForm({ ...form, generateDraft: e.target.checked })}
            />
            KI-Entwurf automatisch generieren
          </label>
          <div className="flex gap-3">
            <button
              onClick={create}
              disabled={creating || !form.subject || !form.dueAt}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-50"
            >
              {creating ? "Erstelle..." : "✓ Erstellen"}
            </button>
            <button
              onClick={() => setShowCreate(false)}
              className="px-4 py-2 border border-(--border) rounded-lg text-sm hover:bg-(--surface)"
            >
              Abbrechen
            </button>
          </div>
        </div>
      )}

      {loading && (
        <div className="text-center text-(--muted) py-16">Lade Follow-ups...</div>
      )}

      {!loading && followUps.length === 0 && (
        <div className="text-center text-(--muted) py-16">
          <p className="text-4xl mb-4">📬</p>
          <p>Noch keine Follow-ups. Erstelle dein erstes!</p>
        </div>
      )}

      {/* Timeline */}
      {(["overdue", "today", "upcoming", "done"] as const).map((group) => {
        const items = groups[group];
        if (items.length === 0) return null;
        const style = GROUP_STYLES[group];

        return (
          <div key={group} className="mb-8">
            <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
              {style.label}
              <span className={`text-xs px-2 py-0.5 rounded-full ${style.badge}`}>{items.length}</span>
            </h2>
            <div className="space-y-3">
              {items.map((f) => (
                <div key={f.id} className={`bg-(--card) rounded-xl p-4 ${style.bg}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span>{TYPE_ICONS[f.type] ?? "📌"}</span>
                        <span className="font-medium text-sm">{f.subject}</span>
                      </div>
                      <p className="text-xs text-(--muted)">
                        Fällig: {formatDate(f.dueAt)}
                        {f.application && ` · ${f.application.company ?? ""} – ${f.application.position ?? ""}`}
                        {f.contact && ` · ${f.contact.name ?? ""}`}
                        {f.sentAt && ` · Erledigt: ${formatDate(f.sentAt)}`}
                      </p>

                      {/* KI-Entwurf */}
                      {f.aiDraft && (
                        <div className="mt-3 bg-(--surface) border border-(--border) rounded-lg p-3">
                          <p className="text-xs font-semibold text-(--muted) mb-1">🤖 KI-Entwurf</p>
                          <p className="text-xs whitespace-pre-wrap">{f.aiDraft}</p>
                        </div>
                      )}
                    </div>

                    {/* Aktionen */}
                    {!f.isDone && (
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {!f.aiDraft && (
                          <button
                            onClick={() => generateDraft(f.id)}
                            disabled={drafting === f.id}
                            className="text-xs px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 disabled:opacity-50"
                          >
                            {drafting === f.id ? "..." : "✨ KI-Entwurf"}
                          </button>
                        )}
                        <button
                          onClick={() => markDone(f.id)}
                          className="text-xs px-3 py-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
                        >
                          ✓ Erledigt
                        </button>
                        <button
                          onClick={() => deleteItem(f.id)}
                          className="text-xs px-3 py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                        >
                          🗑
                        </button>
                      </div>
                    )}
                    {f.isDone && (
                      <button
                        onClick={() => deleteItem(f.id)}
                        className="text-xs px-3 py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                      >
                        🗑
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
