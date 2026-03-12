"use client";
import { useState, useEffect } from "react";

interface ApplicationStats {
  total: number;
  interviews: number;
  offers: number;
  rejections: number;
  pending: number;
}

interface TimelineEvent {
  date: string;
  type: string;
  company: string;
  position: string;
  status: string;
}

interface TwinProfile {
  level: string;
  archetype: string;
  strengths: string[];
  growthAreas: string[];
  careerTrajectory: string;
  nextSteps: string[];
  topCompanies: string[];
  topSkills: string[];
  marketPosition: string;
  salaryRange: string;
}

const STATUS_COLORS: Record<string, string> = {
  OFFERED: "bg-green-500",
  INTERVIEW: "bg-blue-500",
  APPLIED: "bg-gray-400",
  REJECTED: "bg-red-400",
  CANCELLED: "bg-orange-400",
};

const STATUS_LABELS: Record<string, string> = {
  OFFERED: "Angebot", INTERVIEW: "Interview", APPLIED: "Beworben",
  REJECTED: "Abgelehnt", CANCELLED: "Zurückgezogen",
};

export default function CareerTwinPage() {
  const [stats, setStats] = useState<ApplicationStats | null>(null);
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [twin, setTwin] = useState<TwinProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [aiUnavailable, setAiUnavailable] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/career/twin")
      .then(async (r) => {
        if (!r.ok) {
          const d = await r.json().catch(() => ({}));
          setLoadError(d.error ?? `Fehler ${r.status}`);
          return;
        }
        const d = await r.json();
        setStats(d.stats ?? null);
        setEvents(d.timeline ?? []);
        setTwin(d.twin ?? null);
      })
      .catch((e) => setLoadError(e.message ?? "Netzwerkfehler"))
      .finally(() => setLoading(false));
  }, []);

  const generateTwin = async () => {
    setAnalyzing(true);
    setAiError(null);
    try {
      const res = await fetch("/api/career/twin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ regenerate: true }),
      });
      const d = await res.json();
      if (res.status === 503) {
        setAiUnavailable(true);
        setAiError(d.error ?? "KI-Analyse nicht verfügbar");
      } else if (!res.ok) {
        setAiError(d.error ?? `Fehler ${res.status}`);
      } else if (d.twin) {
        setTwin(d.twin);
        setAiUnavailable(false);
      } else if (d.error) {
        setAiError(d.error);
      }
    } catch (e: any) {
      setAiError(e.message ?? "Netzwerkfehler");
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-(--surface)">
        <div className="text-center">
          <div className="text-5xl mb-4 animate-pulse">🧬</div>
          <p className="text-(--muted)">Lade deinen digitalen Karriere-Zwilling...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-(--surface) text-foreground p-6 max-w-5xl mx-auto">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">🧬 Digital Career Twin</h1>
          <p className="text-(--muted) mt-2">
            Dein KI-generiertes digitales Karriere-Alter-Ego — 
            basierend auf deiner echten Bewerbungshistorie.
          </p>
        </div>
        <button
          onClick={generateTwin}
          disabled={analyzing || aiUnavailable}
          title={aiUnavailable ? "ANTHROPIC_API_KEY nicht konfiguriert" : undefined}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium disabled:opacity-50 flex-shrink-0"
        >
          {analyzing ? "🧠 Analysiere..." : "🔄 Twin regenerieren"}
        </button>
      </div>

      {/* Ladefehler */}
      {loadError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          ⚠️ Fehler beim Laden: {loadError}
        </div>
      )}

      {/* KI nicht verfügbar */}
      {aiUnavailable && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <p className="text-sm font-semibold text-amber-800">🔑 KI-Analyse nicht verfügbar</p>
          <p className="text-sm text-amber-700 mt-1">
            Der <code className="font-mono bg-amber-100 px-1 rounded">ANTHROPIC_API_KEY</code> ist
            nicht in den Vercel-Umgebungsvariablen konfiguriert. Bitte trage ihn unter
            <strong> Vercel → Project → Settings → Environment Variables</strong> ein und deploye erneut.
          </p>
        </div>
      )}

      {/* Anderer KI-Fehler */}
      {aiError && !aiUnavailable && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          ⚠️ {aiError}
        </div>
      )}

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-5 gap-3 mb-8">
          {[
            { label: "Bewerbungen", val: stats.total, color: "text-blue-600" },
            { label: "Interviews", val: stats.interviews, color: "text-purple-600" },
            { label: "Angebote", val: stats.offers, color: "text-green-600" },
            { label: "Absagen", val: stats.rejections, color: "text-red-500" },
            { label: "Offen", val: stats.pending, color: "text-orange-500" },
          ].map(({ label, val, color }) => (
            <div key={label} className="bg-(--card) border border-(--border) rounded-xl p-4 text-center">
              <p className={`text-2xl font-bold ${color}`}>{val}</p>
              <p className="text-xs text-(--muted) mt-1">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Twin Profile */}
      {twin ? (
        <div className="space-y-6">
          {/* Hero Card */}
          <div className="bg-gradient-to-br from-purple-700 via-blue-700 to-cyan-700 text-white rounded-2xl p-8">
            <div className="flex items-start gap-6">
              <div className="text-6xl">🤖</div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-purple-200 text-sm font-medium">{twin.level}</span>
                  <span className="bg-white/20 px-2 py-0.5 rounded-full text-sm">{twin.archetype}</span>
                </div>
                <h2 className="text-2xl font-bold mb-2">Dein digitaler Zwilling</h2>
                <p className="text-blue-100 text-sm">{twin.careerTrajectory}</p>
              </div>
              <div className="text-right">
                <p className="text-purple-200 text-xs mb-1">Marktposition</p>
                <p className="text-lg font-bold">{twin.marketPosition}</p>
                <p className="text-purple-200 text-xs mt-2 mb-1">Gehaltsrange</p>
                <p className="text-lg font-bold">{twin.salaryRange}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {/* Stärken */}
            <div className="bg-(--card) border border-(--border) rounded-xl p-6">
              <h3 className="font-semibold mb-3 text-green-700 dark:text-green-400">💪 Stärken</h3>
              <ul className="space-y-2">
                {twin.strengths.map((s, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <span className="text-green-500">✓</span> {s}
                  </li>
                ))}
              </ul>
            </div>

            {/* Wachstumsbereiche */}
            <div className="bg-(--card) border border-(--border) rounded-xl p-6">
              <h3 className="font-semibold mb-3 text-orange-600 dark:text-orange-400">📈 Wachstumsbereiche</h3>
              <ul className="space-y-2">
                {twin.growthAreas.map((g, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <span className="text-orange-400">→</span> {g}
                  </li>
                ))}
              </ul>
            </div>

            {/* Top-Skills */}
            <div className="bg-(--card) border border-(--border) rounded-xl p-6">
              <h3 className="font-semibold mb-3">🛠️ Top-Skills deines Zwillings</h3>
              <div className="flex flex-wrap gap-2">
                {twin.topSkills.map((s, i) => (
                  <span key={i} className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs">
                    {s}
                  </span>
                ))}
              </div>
            </div>

            {/* Top-Firmen */}
            <div className="bg-(--card) border border-(--border) rounded-xl p-6">
              <h3 className="font-semibold mb-3">🏢 Ideal-Unternehmen</h3>
              <div className="flex flex-wrap gap-2">
                {twin.topCompanies.map((c, i) => (
                  <span key={i} className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-xs">
                    {c}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Nächste Schritte */}
          <div className="bg-(--card) border border-(--border) rounded-xl p-6">
            <h3 className="font-semibold mb-3">🚀 Nächste Schritte für deinen Zwilling</h3>
            <div className="grid grid-cols-2 gap-3">
              {twin.nextSteps.map((step, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-(--surface) rounded-lg border border-(--border)">
                  <span className="text-blue-500 font-bold text-sm">{i + 1}</span>
                  <span className="text-sm">{step}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-(--card) border border-(--border) rounded-xl p-8 text-center text-(--muted)">
          <p className="text-4xl mb-4">🧬</p>
          <p className="mb-4">
            {stats && stats.total > 0
              ? "Klicke auf 'Twin regenerieren', um deinen KI-Karriere-Zwilling zu erstellen."
              : "Füge Bewerbungen hinzu, damit die KI deinen Karriere-Zwilling aufbauen kann."}
          </p>
          {stats && stats.total > 0 && (
            <button
              onClick={generateTwin}
              disabled={analyzing}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
            >
              {analyzing ? "Analysiere..." : "🧬 Twin erstellen"}
            </button>
          )}
        </div>
      )}

      {/* Timeline */}
      {events.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">📅 Karriere-Timeline</h2>
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-(--border)" />
            <div className="space-y-4 pl-10">
              {events.slice(0, 20).map((ev, i) => (
                <div key={i} className="relative">
                  <div
                    className={`absolute -left-6 top-2 w-3 h-3 rounded-full ${STATUS_COLORS[ev.status] ?? "bg-gray-400"}`}
                  />
                  <div className="bg-(--card) border border-(--border) rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{ev.company}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full text-white ${STATUS_COLORS[ev.status] ?? "bg-gray-400"}`}>
                        {STATUS_LABELS[ev.status] ?? ev.status}
                      </span>
                    </div>
                    <p className="text-xs text-(--muted)">{ev.position}</p>
                    <p className="text-xs text-(--muted) mt-1">
                      {new Date(ev.date).toLocaleDateString("de-DE")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
