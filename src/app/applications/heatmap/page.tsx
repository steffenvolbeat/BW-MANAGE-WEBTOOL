"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FireIcon,
  GlobeAltIcon,
  MapPinIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";

// D3-Graph nur client-seitig laden (kein SSR)
const NetworkGraph = dynamic(
  () => import("@/components/applications/NetworkGraph"),
  { ssr: false }
);

// ── Typen ────────────────────────────────────────────────────────────────────

interface CalendarDay {
  date: string;
  count: number;
}

interface StatusBreakdown {
  status: string;
  count: number;
}

interface LocationItem {
  location: string;
  country: string;
  count: number;
}

interface HeatmapData {
  calendarData: CalendarDay[];
  statusBreakdown: StatusBreakdown[];
  locations: LocationItem[];
  total: number;
  last365: number;
  maxStreak: number;
}

// ── Hilfsfunktionen ──────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  APPLIED: "Beworben",
  REVIEWED: "Geprüft",
  INTERVIEW_SCHEDULED: "Interview geplant",
  INTERVIEWED: "Interviewt",
  OFFER_RECEIVED: "Angebot erhalten",
  ACCEPTED: "Angenommen",
  REJECTED: "Abgelehnt",
  WITHDRAWN: "Zurückgezogen",
  OTHER: "Sonstiges",
};

const STATUS_COLORS: Record<string, string> = {
  APPLIED: "bg-blue-500",
  REVIEWED: "bg-violet-500",
  INTERVIEW_SCHEDULED: "bg-amber-400",
  INTERVIEWED: "bg-orange-500",
  OFFER_RECEIVED: "bg-emerald-500",
  ACCEPTED: "bg-green-600",
  REJECTED: "bg-red-500",
  WITHDRAWN: "bg-gray-400",
  OTHER: "bg-gray-300",
};

const MONTH_NAMES = [
  "Jan", "Feb", "Mär", "Apr", "Mai", "Jun",
  "Jul", "Aug", "Sep", "Okt", "Nov", "Dez",
];

const DAY_LABELS = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];

function intensityClass(count: number): string {
  if (count === 0) return "bg-gray-100 dark:bg-gray-800";
  if (count === 1) return "bg-green-200";
  if (count === 2) return "bg-green-300";
  if (count <= 4) return "bg-green-500";
  return "bg-green-700";
}

/** Generiert das Kalender-Grid für die letzten 53 Wochen. */
function buildCalendarGrid(calendarData: CalendarDay[]) {
  const dataMap = new Map<string, number>(
    calendarData.map(({ date, count }) => [date, count])
  );

  const today = new Date();
  // Startdatum: 52 Wochen zurück, auf Sonntag ausgerichtet
  const start = new Date(today);
  start.setDate(today.getDate() - (52 * 7 + today.getDay()));

  const weeks: Array<Array<{ date: string; count: number; month: number }>> = [];
  let currentWeek: typeof weeks[0] = [];

  for (let i = 0; i < 53 * 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const iso = d.toISOString().split("T")[0];

    currentWeek.push({
      date: iso,
      count: dataMap.get(iso) ?? 0,
      month: d.getMonth(),
    });

    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }
  if (currentWeek.length > 0) weeks.push(currentWeek);

  // Monats-Labels: welche Woche beginnt einen neuen Monat?
  const monthLabels: Record<number, string> = {};
  weeks.forEach((week, wi) => {
    const firstDay = week[0];
    if (wi === 0 || week.some((d) => d.date.endsWith("-01"))) {
      const m = firstDay.month;
      monthLabels[wi] = MONTH_NAMES[m];
    }
  });

  return { weeks, monthLabels };
}

// ── StatCard ─────────────────────────────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
}) {
  return (
    <div className="bg-(--card) border border-(--border) rounded-xl p-5 flex items-start gap-4">
      <div
        className={`p-2.5 rounded-lg ${color} text-white shrink-0`}
      >
        {icon}
      </div>
      <div>
        <p className="text-(--muted) text-sm">{label}</p>
        <p className="text-2xl font-bold mt-0.5">{value}</p>
        {sub && <p className="text-(--muted) text-xs mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ── Heatmap-Tab ───────────────────────────────────────────────────────────────

function HeatmapTab({ data }: { data: HeatmapData }) {
  const { weeks, monthLabels } = buildCalendarGrid(data.calendarData);
  const total = data.statusBreakdown.reduce((s, b) => s + b.count, 0);

  const [hoveredDay, setHoveredDay] = useState<{
    date: string;
    count: number;
    x: number;
    y: number;
  } | null>(null);

  return (
    <div className="space-y-8">
      {/* Kalender-Heatmap */}
      <div className="bg-(--card) border border-(--border) rounded-xl p-6">
        <h2 className="font-semibold text-base mb-1">Bewerbungs-Aktivität</h2>
        <p className="text-(--muted) text-sm mb-5">
          Letzte 12 Monate – jedes Kästchen = 1 Tag
        </p>

        <div className="overflow-x-auto pb-2">
          <div style={{ display: "flex", gap: "2px", alignItems: "flex-start" }}>
            {/* Wochentag-Labels links */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "2px",
                paddingTop: "18px",
                marginRight: "4px",
              }}
            >
              {DAY_LABELS.map((d, i) => (
                <div
                  key={d}
                  style={{ height: "12px", fontSize: "9px", lineHeight: "12px" }}
                  className={`text-(--muted) ${i % 2 === 1 ? "visible" : "invisible"}`}
                >
                  {d}
                </div>
              ))}
            </div>

            {/* Wochen-Spalten */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 0,
              }}
            >
              {/* Monatsbeschriftung */}
              <div style={{ display: "flex", gap: "2px", height: "16px", marginBottom: "2px" }}>
                {weeks.map((_, wi) => (
                  <div
                    key={wi}
                    style={{ width: "12px", fontSize: "9px", lineHeight: "16px" }}
                    className="text-(--muted) select-none"
                  >
                    {monthLabels[wi] ?? ""}
                  </div>
                ))}
              </div>

              {/* Tages-Grid: transponiert (Zeile = Wochentag, Spalte = Woche) */}
              {Array.from({ length: 7 }, (_, dayIndex) => (
                <div key={dayIndex} style={{ display: "flex", gap: "2px", marginBottom: "2px" }}>
                  {weeks.map((week, wi) => {
                    const day = week[dayIndex];
                    if (!day) return <div key={wi} style={{ width: "12px", height: "12px" }} />;
                    return (
                      <div
                        key={wi}
                        style={{ width: "12px", height: "12px" }}
                        className={`rounded-sm cursor-pointer transition-transform hover:scale-125 ${intensityClass(day.count)}`}
                        onMouseEnter={(e) => {
                          const rect = (e.target as HTMLElement).getBoundingClientRect();
                          setHoveredDay({ date: day.date, count: day.count, x: rect.left, y: rect.top });
                        }}
                        onMouseLeave={() => setHoveredDay(null)}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Intensitäts-Legende */}
        <div className="flex items-center gap-1.5 mt-4">
          <span className="text-xs text-(--muted)">Weniger</span>
          {[0, 1, 2, 3, 5].map((n) => (
            <div
              key={n}
              className={`w-3 h-3 rounded-sm ${intensityClass(n)}`}
            />
          ))}
          <span className="text-xs text-(--muted)">Mehr</span>
        </div>

        {/* Tooltip */}
        {hoveredDay && (
          <div
            className="fixed z-50 bg-(--card) border border-(--border) shadow-lg rounded-lg px-3 py-1.5 text-xs pointer-events-none"
            style={{ left: hoveredDay.x + 16, top: hoveredDay.y - 40 }}
          >
            <span className="font-medium">{hoveredDay.count} Bewerbung{hoveredDay.count !== 1 ? "en" : ""}</span>
            <span className="text-(--muted) ml-1">am {hoveredDay.date}</span>
          </div>
        )}
      </div>

      {/* Status-Breakdown */}
      {total > 0 && (
        <div className="bg-(--card) border border-(--border) rounded-xl p-6">
          <h2 className="font-semibold text-base mb-4">Status-Verteilung</h2>
          <div className="space-y-3">
            {data.statusBreakdown.map(({ status, count }) => {
              const pct = Math.round((count / total) * 100);
              return (
                <div key={status}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{STATUS_LABELS[status] ?? status}</span>
                    <span className="font-medium text-(--muted)">
                      {count} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${STATUS_COLORS[status] ?? "bg-gray-400"}`}
                      style={{ width: `${pct}%` }}
                    />
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

// ── Standorte-Tab ─────────────────────────────────────────────────────────────

function LocationsTab({ locations }: { locations: LocationItem[] }) {
  if (locations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-(--muted)">
        <MapPinIcon className="h-12 w-12" />
        <p>Keine Standortdaten vorhanden.</p>
      </div>
    );
  }

  const max = Math.max(...locations.map((l) => l.count));

  return (
    <div className="bg-(--card) border border-(--border) rounded-xl overflow-hidden">
      <div className="px-6 py-4 border-b border-(--border)">
        <h2 className="font-semibold">Top-Bewerbungsstandorte</h2>
        <p className="text-(--muted) text-sm mt-0.5">
          Alle Orte nach Anzahl der Bewerbungen
        </p>
      </div>
      <div className="divide-y divide-(--border)">
        {locations.map((loc, i) => {
          const pct = Math.round((loc.count / max) * 100);
          return (
            <div key={i} className="px-6 py-4 flex items-center gap-4">
              <span className="text-xl w-7 shrink-0 text-center">
                {getCountryFlag(loc.country)}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-2 mb-1.5">
                  <div>
                    <span className="font-medium text-sm">{loc.location}</span>
                    <span className="text-(--muted) text-xs ml-2">{loc.country}</span>
                  </div>
                  <span className="text-(--muted) text-sm shrink-0">
                    {loc.count} Bewerbung{loc.count !== 1 ? "en" : ""}
                  </span>
                </div>
                <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all duration-700"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Einfache Land→Flagge Konvertierung */
function getCountryFlag(country: string): string {
  const map: Record<string, string> = {
    Deutschland: "🇩🇪",
    Germany: "🇩🇪",
    DE: "🇩🇪",
    Österreich: "🇦🇹",
    Austria: "🇦🇹",
    AT: "🇦🇹",
    Schweiz: "🇨🇭",
    Switzerland: "🇨🇭",
    CH: "🇨🇭",
    USA: "🇺🇸",
    "United States": "🇺🇸",
    US: "🇺🇸",
    "United Kingdom": "🇬🇧",
    UK: "🇬🇧",
    GB: "🇬🇧",
    Frankreich: "🇫🇷",
    France: "🇫🇷",
    FR: "🇫🇷",
    Niederlande: "🇳🇱",
    Netherlands: "🇳🇱",
    NL: "🇳🇱",
    Remote: "🌐",
    Fernarbeit: "🌐",
    Worldwide: "🌐",
  };
  return map[country] ?? "🌍";
}

// ── Haupt-Seite ───────────────────────────────────────────────────────────────

type Tab = "heatmap" | "locations" | "network";

export default function HeatmapPage() {
  const [data, setData] = useState<HeatmapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("heatmap");

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/applications/heatmap", { signal: controller.signal })
      .then((r) => r.json())
      .then((d: HeatmapData) => setData(d))
      .catch((e) => { if (e instanceof Error && e.name === "AbortError") return; setError(String(e)); })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, []);

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    {
      id: "heatmap",
      label: "Aktivitäts-Heatmap",
      icon: <FireIcon className="h-4 w-4" />,
    },
    {
      id: "locations",
      label: "Standorte",
      icon: <MapPinIcon className="h-4 w-4" />,
    },
    {
      id: "network",
      label: "Netzwerk-Graph",
      icon: <GlobeAltIcon className="h-4 w-4" />,
    },
  ];

  return (
    <div className="min-h-screen bg-background p-6 max-w-7xl mx-auto">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-(--muted) text-sm mb-1">
            <Link href="/applications" className="hover:text-foreground transition-colors">
              Bewerbungen
            </Link>
            <span>/</span>
            <span>Heatmap & Netzwerk</span>
          </div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            🌍 Heatmap & Netzwerk-Graph
          </h1>
          <p className="text-(--muted) mt-1">
            Visualisiere deine Bewerbungsaktivität und Kontaktnetzwerk
          </p>
        </div>
        <Link
          href="/applications"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-(--surface) border border-(--border) text-sm hover:bg-(--hover) transition-colors"
        >
          <ChartBarIcon className="h-4 w-4" />
          Alle Bewerbungen
        </Link>
      </div>

      {/* ── Stats ──────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-24 bg-(--card) border border-(--border) rounded-xl animate-pulse"
            />
          ))}
        </div>
      ) : error ? (
        <div className="mb-8 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm">
          ⚠️ Fehler beim Laden: {error}
        </div>
      ) : data ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={<ChartBarIcon className="h-5 w-5" />}
            label="Bewerbungen gesamt"
            value={data.total}
            color="bg-blue-500"
          />
          <StatCard
            icon={<FireIcon className="h-5 w-5" />}
            label="Letzte 12 Monate"
            value={data.last365}
            sub={`Ø ${(data.last365 / 12).toFixed(1)} / Monat`}
            color="bg-orange-500"
          />
          <StatCard
            icon={<span className="text-base">🔥</span>}
            label="Längster Streak"
            value={`${data.maxStreak} Tage`}
            sub="Tage in Folge"
            color="bg-red-500"
          />
          <StatCard
            icon={<MapPinIcon className="h-5 w-5" />}
            label="Standorte"
            value={data.locations.length}
            sub="verschiedene Orte"
            color="bg-emerald-500"
          />
        </div>
      ) : null}

      {/* ── Tab-Navigation ─────────────────────────────────────────────── */}
      <div className="flex gap-1 p-1 bg-(--surface) rounded-xl border border-(--border) mb-6 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? "bg-(--card) text-foreground shadow-sm border border-(--border)"
                : "text-(--muted) hover:text-foreground"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Tab-Inhalte ────────────────────────────────────────────────── */}
      {loading && (
        <div className="flex items-center justify-center py-24">
          <div className="h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!loading && data && (
        <>
          {activeTab === "heatmap" && <HeatmapTab data={data} />}
          {activeTab === "locations" && (
            <LocationsTab locations={data.locations} />
          )}
          {activeTab === "network" && (
            <div>
              <p className="text-(--muted) text-sm mb-4">
                Knoten ziehen, Scrollen zum Zoomen, Hover für Details.
                Zeigt maximal 80 Bewerbungen und 60 Kontakte.
              </p>
              <NetworkGraph />
            </div>
          )}
        </>
      )}
    </div>
  );
}
