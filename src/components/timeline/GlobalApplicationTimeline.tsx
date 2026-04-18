"use client";

import { useEffect, useState, useCallback } from "react";
import {
  ClockIcon,
  DocumentTextIcon,
  ChatBubbleLeftIcon,
  CalendarDaysIcon,
  BoltIcon,
  ArrowPathIcon,
  BuildingOfficeIcon,
  XMarkIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  ShareIcon,
  PrinterIcon,
  SparklesIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";

// ─── Types ────────────────────────────────────────────────────────────────────

type EntryType =
  | "STATUS_CHANGE"
  | "NOTE"
  | "COVER_LETTER"
  | "CV_UPDATE"
  | "ACTIVITY"
  | "CALENDAR_EVENT"
  | "MANUAL";

interface GlobalEntry {
  id: string;
  applicationId: string;
  type: EntryType;
  title: string;
  content?: string | null;
  status?: string | null;
  itBereich?: string | null;
  date: string;
  application: {
    id: string;
    companyName: string;
    position: string;
    status: string;
    itBereich?: string | null;
    appliedAt?: string | null;
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<EntryType, string> = {
  STATUS_CHANGE: "Statusänderung",
  NOTE: "Notiz",
  COVER_LETTER: "Anschreiben",
  CV_UPDATE: "Lebenslauf",
  ACTIVITY: "Aktivität",
  CALENDAR_EVENT: "Kalender",
  MANUAL: "Manuell",
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

function nodeColor(type: EntryType): string {
  switch (type) {
    case "STATUS_CHANGE":   return "bg-blue-500";
    case "NOTE":            return "bg-amber-500";
    case "COVER_LETTER":    return "bg-purple-500";
    case "CV_UPDATE":       return "bg-emerald-500";
    case "CALENDAR_EVENT":  return "bg-orange-500";
    case "ACTIVITY":        return "bg-rose-500";
    default:                return "bg-slate-400";
  }
}

function badgeColor(type: EntryType): string {
  switch (type) {
    case "STATUS_CHANGE":   return "bg-blue-100 text-blue-700 border-blue-200";
    case "NOTE":            return "bg-amber-100 text-amber-700 border-amber-200";
    case "COVER_LETTER":    return "bg-purple-100 text-purple-700 border-purple-200";
    case "CV_UPDATE":       return "bg-emerald-100 text-emerald-700 border-emerald-200";
    case "CALENDAR_EVENT":  return "bg-orange-100 text-orange-700 border-orange-200";
    case "ACTIVITY":        return "bg-rose-100 text-rose-700 border-rose-200";
    default:                return "bg-slate-100 text-slate-600 border-slate-200";
  }
}

function nodeIcon(type: EntryType) {
  const cls = "w-5 h-5 text-white";
  switch (type) {
    case "STATUS_CHANGE":   return <BoltIcon className={cls} />;
    case "NOTE":            return <ChatBubbleLeftIcon className={cls} />;
    case "COVER_LETTER":    return <DocumentTextIcon className={cls} />;
    case "CV_UPDATE":       return <DocumentTextIcon className={cls} />;
    case "CALENDAR_EVENT":  return <CalendarDaysIcon className={cls} />;
    default:                return <ClockIcon className={cls} />;
  }
}

function getCalWeek(d: Date): number {
  const tmp = new Date(d.getTime());
  tmp.setHours(0, 0, 0, 0);
  tmp.setDate(tmp.getDate() + 3 - ((tmp.getDay() + 6) % 7));
  const w1 = new Date(tmp.getFullYear(), 0, 4);
  return 1 + Math.round(((tmp.getTime() - w1.getTime()) / 86400000 - 3 + ((w1.getDay() + 6) % 7)) / 7);
}

function formatEntryDate(iso: string): string {
  const d = new Date(iso);
  const day = d.toLocaleDateString("de-DE", { weekday: "short" });
  const date = d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
  const kw = getCalWeek(d);
  return `${day}, ${date} – KW ${kw}`;
}

function monthKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(key: string): string {
  const [year, month] = key.split("-");
  const d = new Date(Number(year), Number(month) - 1, 1);
  return d.toLocaleDateString("de-DE", { month: "long", year: "numeric" });
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface TimelineStats {
  funnel: Record<string, number>;
  avgReactionDays: number | null;
  reactionDaysCount: number;
  staleApps: { applicationId: string; companyName: string; position: string; daysSince: number }[];
  heatmap: Record<string, number>;
  companyProgress: { applicationId: string; companyName: string; position: string; status: string; progress: number; entryCount: number }[];
  totalApps: number;
  totalEntries: number;
  pinnedCount: number;
}

type ViewTab = "zeitstrahl" | "funnel" | "heatmap" | "gantt" | "statistiken";

interface Props {
  onOpenApplication?: (applicationId: string) => void;
}

// ─── Funnel colors ────────────────────────────────────────────────────────────
const FUNNEL_ORDER = [
  "APPLIED", "REVIEWED", "INTERVIEW_SCHEDULED", "INTERVIEWED",
  "TASK_RECEIVED", "TASK_SUBMITTED", "OFFER_RECEIVED", "NEGOTIATION",
  "ACCEPTED", "REJECTED",
];
const FUNNEL_COLORS: Record<string, string> = {
  APPLIED: "bg-blue-500",
  REVIEWED: "bg-blue-400",
  INTERVIEW_SCHEDULED: "bg-indigo-500",
  INTERVIEWED: "bg-violet-500",
  TASK_RECEIVED: "bg-amber-500",
  TASK_SUBMITTED: "bg-amber-400",
  OFFER_RECEIVED: "bg-emerald-500",
  NEGOTIATION: "bg-teal-500",
  ACCEPTED: "bg-green-500",
  REJECTED: "bg-red-500",
};

export default function GlobalApplicationTimeline({ onOpenApplication }: Props) {
  const [entries, setEntries] = useState<GlobalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<EntryType | "">("");
  const [filterCompany, setFilterCompany] = useState("");
  const [collapsedMonths, setCollapsedMonths] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState<ViewTab>("zeitstrahl");
  const [stats, setStats] = useState<TimelineStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [shareLoading, setShareLoading] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  const loadEntries = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/timeline/all?limit=500");
      if (!res.ok) throw new Error("Fehler beim Laden");
      setEntries(await res.json());
    } catch {
      setError("Gesamtübersicht konnte nicht geladen werden.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await fetch("/api/timeline/stats");
      if (!res.ok) throw new Error();
      setStats(await res.json());
    } catch {
      setError("Statistiken konnten nicht geladen werden.");
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => { loadEntries(); }, [loadEntries]);

  useEffect(() => {
    if ((activeTab === "funnel" || activeTab === "heatmap" || activeTab === "gantt" || activeTab === "statistiken") && !stats) {
      loadStats();
    }
  }, [activeTab, stats, loadStats]);

  // ── KI-Zusammenfassung ──────────────────────────────────────────────────────
  async function loadAiSummary() {
    if (aiSummary || aiLoading) return;
    setAiLoading(true);
    try {
      const context = entries.slice(0, 50).map((e) =>
        `${new Date(e.date).toLocaleDateString("de-DE")}: ${e.application.companyName} — ${e.title} (${e.type})`
      ).join("\n");
      const res = await fetch("/api/ai/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicantText: `Analysiere diese Bewerbungsaktivitäten der letzten Monate und gib mir eine kurze, hilfreiche Zusammenfassung mit konkreten Verbesserungsvorschlägen (max. 200 Wörter):\n\n${context}`,
          position: "Bewerbungscoach-Analyse",
        }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setAiSummary(data.result ?? data.text ?? data.content ?? JSON.stringify(data));
    } catch {
      setAiSummary("KI-Analyse konnte nicht geladen werden.");
    } finally {
      setAiLoading(false);
    }
  }

  // ── CSV Export ──────────────────────────────────────────────────────────────
  function handleCsvExport() {
    const params = new URLSearchParams();
    if (filterCompany) params.set("company", filterCompany);
    if (filterType) params.set("type", filterType);
    window.location.href = `/api/timeline/export?${params.toString()}`;
  }

  // ── PDF Export ──────────────────────────────────────────────────────────────
  function handlePdfExport() {
    window.print();
  }

  // ── Share Link ──────────────────────────────────────────────────────────────
  async function handleShare() {
    setShareLoading(true);
    try {
      const res = await fetch("/api/timeline/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyFilter: filterCompany || null,
          typeFilter: filterType || null,
        }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      const url = `${window.location.origin}${data.url}`;
      setShareUrl(url);
      await navigator.clipboard.writeText(url);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 3000);
    } catch {
      setError("Share-Link konnte nicht erstellt werden.");
    } finally {
      setShareLoading(false);
    }
  }

  // ── Filtering ───────────────────────────────────────────────────────────────
  const filtered = entries.filter((e) => {
    if (filterType && e.type !== filterType) return false;
    if (filterCompany && !e.application.companyName.toLowerCase().includes(filterCompany.toLowerCase())) return false;
    return true;
  });

  const byMonth = filtered.reduce<Record<string, GlobalEntry[]>>((acc, e) => {
    const key = monthKey(e.date);
    if (!acc[key]) acc[key] = [];
    acc[key].push(e);
    return acc;
  }, {});
  const sortedMonths = Object.keys(byMonth).sort((a, b) => b.localeCompare(a));

  function toggleMonth(key: string) {
    setCollapsedMonths((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }

  const companies = Array.from(new Set(entries.map((e) => e.application.companyName))).sort();

  // ── Gantt data ──────────────────────────────────────────────────────────────
  const ganttApps = Object.values(
    entries.reduce<Record<string, { id: string; company: string; position: string; status: string; start: Date; end: Date; count: number }>>((acc, e) => {
      const appId = e.applicationId;
      const d = new Date(e.date);
      if (!acc[appId]) {
        acc[appId] = { id: appId, company: e.application.companyName, position: e.application.position, status: e.application.status, start: d, end: d, count: 1 };
      } else {
        if (d < acc[appId].start) acc[appId].start = d;
        if (d > acc[appId].end) acc[appId].end = d;
        acc[appId].count++;
      }
      return acc;
    }, {})
  ).sort((a, b) => a.start.getTime() - b.start.getTime()).slice(0, 30);

  const ganttMin = ganttApps.length ? ganttApps[0].start.getTime() : Date.now();
  const ganttMax = ganttApps.length ? Math.max(...ganttApps.map((a) => a.end.getTime())) : Date.now();
  const ganttRange = ganttMax - ganttMin || 1;

  // ── Heatmap ─────────────────────────────────────────────────────────────────
  // Direkt aus entries gebaut – kein Stats-API nötig, kein Timezone-Bug
  const heatmapData: Record<string, number> = {};
  for (const e of entries) {
    // Datum lokal interpretieren (nicht UTC) um Timezone-Verschiebung zu vermeiden
    const d = new Date(e.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    heatmapData[key] = (heatmapData[key] ?? 0) + 1;
  }
  const heatmapMax = Math.max(...Object.values(heatmapData), 1);

  function heatCell(count: number) {
    if (count === 0) return "bg-gray-100 dark:bg-gray-800";
    const r = count / heatmapMax;
    if (r < 0.25) return "bg-green-200 dark:bg-green-900";
    if (r < 0.5) return "bg-green-400 dark:bg-green-700";
    if (r < 0.75) return "bg-green-600 dark:bg-green-500";
    return "bg-green-800 dark:bg-green-300";
  }

  // Build 52×7 grid starting from today-364 days
  const heatGrid: { date: string; count: number }[][] = [];
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const startDay = new Date(today); startDay.setDate(startDay.getDate() - 364);
  // align to Sunday
  startDay.setDate(startDay.getDate() - startDay.getDay());
  for (let week = 0; week < 53; week++) {
    const col: { date: string; count: number }[] = [];
    for (let day = 0; day < 7; day++) {
      const d = new Date(startDay);
      d.setDate(d.getDate() + week * 7 + day);
      const key = d.toISOString().slice(0, 10);
      col.push({ date: key, count: heatmapData[key] ?? 0 });
    }
    heatGrid.push(col);
  }

  const TABS: { id: ViewTab; label: string }[] = [
    { id: "zeitstrahl", label: "Zeitstrahl" },
    { id: "funnel", label: "Status-Übersicht" },
    { id: "heatmap", label: "Aktivitätskalender" },
    { id: "gantt", label: "Zeitübersicht" },
    { id: "statistiken", label: "Auswertung" },
  ];

  return (
    <div className="flex flex-col gap-5 print:gap-3">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3 print:hidden">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Gesamter Bewerbungsverlauf</h2>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">
            {filtered.length} Ereignis{filtered.length !== 1 ? "se" : ""} · {companies.length} Unternehmen
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setShowFilters((v) => !v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border transition-colors ${showFilters ? "bg-indigo-50 border-indigo-300 text-indigo-700" : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-indigo-300"}`}>
            <FunnelIcon className="w-4 h-4" /> Filter
          </button>
          <button onClick={handleCsvExport} title="CSV Export"
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:border-emerald-400 hover:text-emerald-700 transition-colors">
            <ArrowDownTrayIcon className="w-4 h-4" /> CSV
          </button>
          <button onClick={handlePdfExport} title="PDF drucken"
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:border-orange-400 hover:text-orange-700 transition-colors">
            <PrinterIcon className="w-4 h-4" /> PDF
          </button>
          <button onClick={handleShare} disabled={shareLoading}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border transition-colors ${shareCopied ? "border-green-400 text-green-700 bg-green-50" : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:border-indigo-400 hover:text-indigo-700"}`}>
            <ShareIcon className="w-4 h-4" />
            {shareLoading ? "…" : shareCopied ? "Link kopiert!" : "Teilen"}
          </button>
          <button onClick={loadEntries} title="Aktualisieren"
            className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 hover:text-indigo-600 hover:border-indigo-300 transition-colors">
            <ArrowPathIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {shareUrl && (
        <div className="flex items-center gap-2 p-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-700 rounded-xl text-sm print:hidden">
          <span className="text-indigo-700 dark:text-indigo-300 font-medium">Share-Link:</span>
          <span className="text-indigo-600 dark:text-indigo-400 font-mono text-xs break-all flex-1">{shareUrl}</span>
          <button onClick={() => setShareUrl(null)} className="text-gray-400 hover:text-gray-600"><XMarkIcon className="w-4 h-4" /></button>
        </div>
      )}

      {/* Filter-Panel */}
      {showFilters && (
        <div className="flex flex-wrap gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 print:hidden">
          <div>
            <label htmlFor="gt-filter-type" className="block text-xs text-gray-500 mb-1">Ereignistyp</label>
            <select id="gt-filter-type" name="gt-filter-type" value={filterType}
              onChange={(e) => setFilterType(e.target.value as EntryType | "")}
              className="text-sm border border-gray-200 dark:border-gray-600 rounded-lg px-2 py-1.5 bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
              <option value="">Alle Typen</option>
              {(Object.keys(TYPE_LABELS) as EntryType[]).map((t) => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="gt-filter-company" className="block text-xs text-gray-500 mb-1">Unternehmen</label>
            <select id="gt-filter-company" name="gt-filter-company" value={filterCompany}
              onChange={(e) => setFilterCompany(e.target.value)}
              className="text-sm border border-gray-200 dark:border-gray-600 rounded-lg px-2 py-1.5 bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
              <option value="">Alle Unternehmen</option>
              {companies.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          {(filterType || filterCompany) && (
            <button onClick={() => { setFilterType(""); setFilterCompany(""); }}
              className="self-end flex items-center gap-1 text-xs text-gray-500 hover:text-red-600 px-2 py-1.5">
              <XMarkIcon className="w-3.5 h-3.5" /> Zurücksetzen
            </button>
          )}
        </div>
      )}

      {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm print:hidden">{error}</div>}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700 print:hidden">
        {TABS.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors border-b-2 ${activeTab === tab.id ? "border-indigo-500 text-indigo-700 dark:text-indigo-400" : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700"}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex justify-center py-16 print:hidden">
          <ArrowPathIcon className="w-8 h-8 animate-spin text-indigo-400" />
        </div>
      )}

      {/* ─── TAB: ZEITSTRAHL ─────────────────────────────────────────────────── */}
      {activeTab === "zeitstrahl" && !loading && (
        <>
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-gray-400 dark:text-slate-500">
              <ClockIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">Keine Ereignisse</p>
              <p className="text-sm mt-1">Bewerbungen anlegen, um den Verlauf zu befüllen.</p>
            </div>
          ) : (
            <div className="space-y-10">
              {sortedMonths.map((monthK) => {
                const monthEntries = byMonth[monthK];
                const isCollapsed = collapsedMonths.has(monthK);
                return (
                  <div key={monthK}>
                    <button onClick={() => toggleMonth(monthK)} className="w-full flex items-center gap-3 mb-4">
                      <div className="flex-1 h-px bg-gradient-to-r from-indigo-400 to-transparent dark:from-indigo-600" />
                      <span className="flex items-center gap-1.5 text-sm font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wide whitespace-nowrap">
                        {monthLabel(monthK)}
                        <span className="text-xs font-normal text-gray-400 dark:text-slate-500">({monthEntries.length})</span>
                        {isCollapsed ? <ChevronDownIcon className="w-4 h-4 opacity-60" /> : <ChevronUpIcon className="w-4 h-4 opacity-60" />}
                      </span>
                      <div className="flex-1 h-px bg-gradient-to-l from-indigo-400 to-transparent dark:from-indigo-600" />
                    </button>
                    {!isCollapsed && (
                      <div className="relative">
                        <div className="absolute left-[21px] top-[22px] bottom-[22px] w-0.5 bg-gradient-to-b from-indigo-400 via-indigo-200 to-gray-200 dark:from-indigo-500 dark:via-indigo-900 dark:to-gray-700" />
                        <div className="space-y-4">
                          {monthEntries.map((entry) => (
                            <div key={entry.id} className="relative flex items-start gap-4">
                              <div className={`relative z-10 flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center border-4 border-white dark:border-gray-900 shadow-md ${nodeColor(entry.type)}`}>
                                {nodeIcon(entry.type)}
                              </div>
                              <div className="flex-1 min-w-0 pt-1">
                                <p className="text-[11px] font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wide mb-1.5 leading-none">
                                  {formatEntryDate(entry.date)}
                                </p>
                                <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-3 shadow-sm hover:shadow-md transition-shadow">
                                  <div className="flex items-start justify-between gap-2 flex-wrap">
                                    <div className="flex items-center gap-2 flex-wrap min-w-0">
                                      <span className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-full border ${badgeColor(entry.type)}`}>{TYPE_LABELS[entry.type]}</span>
                                      <span className="font-semibold text-sm text-gray-900 dark:text-white leading-snug">{entry.title}</span>
                                    </div>
                                    <button type="button" onClick={() => onOpenApplication?.(entry.application.id)}
                                      className="flex-shrink-0 flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-slate-300 hover:bg-indigo-50 hover:text-indigo-700 border border-transparent hover:border-indigo-200 transition-colors"
                                      title={`${entry.application.position} @ ${entry.application.companyName}`}>
                                      <BuildingOfficeIcon className="w-3 h-3" />
                                      <span className="max-w-[140px] truncate">{entry.application.companyName}</span>
                                    </button>
                                  </div>
                                  <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
                                    {entry.application.position}
                                    {entry.application.appliedAt && (
                                      <> · Beworben am <span className="font-medium">{new Date(entry.application.appliedAt).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" })}</span></>
                                    )}
                                    {entry.status && <> · <span className="font-medium">{STATUS_LABELS[entry.status] ?? entry.status}</span></>}
                                  </p>
                                  {entry.content && (
                                    <p className="mt-1.5 text-xs text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap border-t border-gray-100 dark:border-gray-700 pt-1.5">
                                      {entry.content}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ─── TAB: FUNNEL ─────────────────────────────────────────────────────── */}
      {activeTab === "funnel" && (
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-gray-800 dark:text-white flex items-center gap-2">
              <ChartBarIcon className="w-5 h-5 text-indigo-500" /> Status-Übersicht
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Wie viele Bewerbungen befinden sich aktuell in welchem Status? Jede Bewerbung wird nur einmal gezählt.
            </p>
          </div>
          {loading ? (
            <div className="flex justify-center py-8"><ArrowPathIcon className="w-6 h-6 animate-spin text-indigo-400" /></div>
          ) : (() => {
            // Direkt aus entries gebaut – jede Bewerbung einmal, aktueller Status
            const seenApps = new Set<string>();
            const counts: Record<string, number> = {};
            for (const e of entries) {
              if (!seenApps.has(e.applicationId)) {
                seenApps.add(e.applicationId);
                const s = e.application.status;
                counts[s] = (counts[s] ?? 0) + 1;
              }
            }
            const sortedStatuses = FUNNEL_ORDER.filter((s) => counts[s] > 0);
            // Auch Status die nicht in FUNNEL_ORDER sind anzeigen
            for (const s of Object.keys(counts)) {
              if (!FUNNEL_ORDER.includes(s)) sortedStatuses.push(s);
            }
            const maxCount = Math.max(...Object.values(counts), 1);
            return sortedStatuses.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <ChartBarIcon className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p>Noch keine Bewerbungen vorhanden.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sortedStatuses.map((status) => {
                  const count = counts[status] ?? 0;
                  const width = Math.max(8, Math.round((count / maxCount) * 100));
                  return (
                    <div key={status} className="flex items-center gap-3">
                      <span className="text-xs text-gray-600 dark:text-gray-300 w-40 text-right flex-shrink-0 font-medium">
                        {STATUS_LABELS[status] ?? status}
                      </span>
                      <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full h-7 overflow-hidden">
                        <div
                          className={`h-full rounded-full flex items-center justify-end pr-3 transition-all ${FUNNEL_COLORS[status] ?? "bg-slate-400"}`}
                          style={{ width: `${width}%` }}
                        >
                          <span className="text-white text-xs font-bold">{count}</span>
                        </div>
                      </div>
                      <span className="text-xs text-gray-400 w-6 text-right flex-shrink-0">{count}</span>
                    </div>
                  );
                })}
                <p className="text-xs text-gray-400 dark:text-gray-500 pt-2">
                  Gesamt: {seenApps.size} Bewerbung{seenApps.size !== 1 ? "en" : ""}
                </p>
              </div>
            );
          })()}
        </div>
      )}

      {/* ─── TAB: HEATMAP ────────────────────────────────────────────────────── */}
      {activeTab === "heatmap" && (
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-gray-800 dark:text-white flex items-center gap-2">
              <CalendarDaysIcon className="w-5 h-5 text-green-500" /> Aktivitätskalender
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Jedes Kästchen entspricht einem Tag. Je dunkler, desto mehr Bewerbungsaktivitäten (Einträge, Statusänderungen, Notizen) fanden statt.
            </p>
          </div>
          {loading ? (
            <div className="flex justify-center py-8"><ArrowPathIcon className="w-6 h-6 animate-spin text-indigo-400" /></div>
          ) : entries.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <CalendarDaysIcon className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p>Noch keine Aktivitäten vorhanden.</p>
            </div>
          ) : (
            <div className="overflow-x-auto pb-2">
              <div className="flex gap-1" style={{ minWidth: "max-content" }}>
                {heatGrid.map((week, wi) => (
                  <div key={wi} className="flex flex-col gap-1">
                    {week.map((cell) => (
                      <div key={cell.date}
                        title={`${cell.date}: ${cell.count} Aktivität${cell.count !== 1 ? "en" : ""}`}
                        className={`w-3 h-3 rounded-sm ${heatCell(cell.count)} cursor-default`}
                      />
                    ))}
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-1.5 mt-3 text-xs text-gray-400">
                <span>Weniger</span>
                {["bg-gray-100 dark:bg-gray-800", "bg-green-200", "bg-green-400", "bg-green-600", "bg-green-800"].map((c, i) => (
                  <div key={i} className={`w-3 h-3 rounded-sm ${c}`} />
                ))}
                <span>Mehr</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── TAB: GANTT ──────────────────────────────────────────────────────── */}
      {activeTab === "gantt" && (
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-gray-800 dark:text-white flex items-center gap-2">
              <BoltIcon className="w-5 h-5 text-amber-500" /> Zeitübersicht
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Jede Zeile ist eine Bewerbung. Der Balken zeigt den Zeitraum vom ersten bis zum letzten Aktivitätseintrag. Farbe = aktueller Status.
            </p>
          </div>
          {loading ? (
            <div className="flex justify-center py-8"><ArrowPathIcon className="w-6 h-6 animate-spin text-indigo-400" /></div>
          ) : ganttApps.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">Keine Daten für Gantt-Ansicht.</p>
          ) : (
            <div className="overflow-x-auto">
              <div className="space-y-2 min-w-[500px]">
                {/* X-Achse Labels */}
                <div className="flex items-center gap-2 pl-44 mb-1">
                  <div className="flex-1 flex justify-between text-[10px] text-gray-400">
                    <span>{new Date(ganttMin).toLocaleDateString("de-DE", { month: "short", day: "numeric" })}</span>
                    <span>{new Date(ganttMax).toLocaleDateString("de-DE", { month: "short", day: "numeric" })}</span>
                  </div>
                </div>
                {ganttApps.map((app) => {
                  const leftPct = ((app.start.getTime() - ganttMin) / ganttRange) * 100;
                  const widthPct = Math.max(1, ((app.end.getTime() - app.start.getTime()) / ganttRange) * 100);
                  const statusColor = app.status === "ACCEPTED" ? "bg-green-500" : app.status === "REJECTED" ? "bg-red-400" : "bg-indigo-400";
                  return (
                    <div key={app.id} className="flex items-center gap-2">
                      <button onClick={() => onOpenApplication?.(app.id)}
                        className="w-44 text-xs text-right pr-2 text-gray-600 dark:text-gray-300 hover:text-indigo-600 truncate flex-shrink-0" title={`${app.company} – ${app.position}`}>
                        {app.company}
                      </button>
                      <div className="flex-1 relative h-5 bg-gray-100 dark:bg-gray-800 rounded">
                        <div className={`absolute top-0 h-full rounded ${statusColor} opacity-80 min-w-[4px]`}
                          style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                          title={`${app.start.toLocaleDateString("de-DE")} – ${app.end.toLocaleDateString("de-DE")} (${app.count} Einträge)`}
                        />
                      </div>
                      <span className="text-[10px] text-gray-400 w-8 flex-shrink-0">{app.count}×</span>
                    </div>
                  );
                })}
                <div className="flex items-center gap-3 mt-3 text-xs text-gray-400 pl-44">
                  <span className="flex items-center gap-1"><span className="w-3 h-2 bg-indigo-400 rounded inline-block" /> Aktiv</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-2 bg-green-500 rounded inline-block" /> Angenommen</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-2 bg-red-400 rounded inline-block" /> Abgelehnt</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── TAB: STATISTIKEN ────────────────────────────────────────────────── */}
      {activeTab === "statistiken" && (
        <div className="space-y-6">
          <div>
            <h3 className="font-semibold text-gray-800 dark:text-white flex items-center gap-2">
              <ChartBarIcon className="w-5 h-5 text-indigo-500" /> Auswertung
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Kennzahlen, Fortschritt je Bewerbung, Warnungen bei veralteten Bewerbungen, Erfolgsquoten und KI-Analyse.
            </p>
          </div>
          {statsLoading ? (
            <div className="flex justify-center py-8"><ArrowPathIcon className="w-6 h-6 animate-spin text-indigo-400" /></div>
          ) : !stats ? (
            <div className="text-center py-8">
              <button onClick={loadStats} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">
                Auswertung laden
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Kennzahlen */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: "Bewerbungen", value: stats.totalApps },
                  { label: "Einträge", value: stats.totalEntries },
                  { label: "Ø Reaktion", value: stats.avgReactionDays != null ? `${stats.avgReactionDays}T` : "–" },
                  { label: "Angepinnt", value: stats.pinnedCount },
                ].map((kpi) => (
                  <div key={kpi.label} className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-4 text-center shadow-sm">
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{kpi.value}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{kpi.label}</p>
                  </div>
                ))}
              </div>

              {/* Fortschrittsbalken pro Unternehmen */}
              <div>
                <h4 className="font-semibold text-gray-700 dark:text-gray-300 text-sm mb-3">Fortschritt pro Bewerbung</h4>
                <div className="space-y-2">
                  {stats.companyProgress.slice(0, 15).map((cp) => (
                    <div key={cp.applicationId} className="flex items-center gap-3">
                      <button onClick={() => onOpenApplication?.(cp.applicationId)}
                        className="w-36 text-xs text-right text-gray-600 dark:text-gray-300 hover:text-indigo-600 truncate flex-shrink-0" title={cp.position}>
                        {cp.companyName}
                      </button>
                      <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full h-3 overflow-hidden">
                        <div className="h-full bg-indigo-400 rounded-full transition-all" style={{ width: `${cp.progress}%` }} />
                      </div>
                      <span className="text-[10px] text-gray-400 w-8 flex-shrink-0 text-right">{cp.progress}%</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Stale Bewerbungen */}
              {stats.staleApps.length > 0 && (
                <div>
                  <h4 className="font-semibold text-amber-700 dark:text-amber-400 text-sm mb-3 flex items-center gap-2">
                    <ExclamationTriangleIcon className="w-4 h-4" /> Offene Bewerbungen ohne Update
                  </h4>
                  <div className="space-y-2">
                    {stats.staleApps.map((app) => (
                      <div key={app.applicationId} className="flex items-center justify-between gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
                        <div>
                          <button onClick={() => onOpenApplication?.(app.applicationId)}
                            className="font-semibold text-sm text-amber-900 dark:text-amber-200 hover:underline">{app.companyName}</button>
                          <p className="text-xs text-amber-700 dark:text-amber-400">{app.position}</p>
                        </div>
                        <span className="flex-shrink-0 px-2 py-0.5 bg-amber-600 text-white rounded-full text-xs font-bold">
                          +{app.daysSince}T
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Prognose */}
              {stats.funnel && (
                <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-700 rounded-xl">
                  <h4 className="font-semibold text-indigo-700 dark:text-indigo-300 text-sm mb-2">Prognose</h4>
                  {(() => {
                    const applied = stats.funnel["APPLIED"] ?? 0;
                    const interviewed = stats.funnel["INTERVIEWED"] ?? 0;
                    const accepted = stats.funnel["ACCEPTED"] ?? 0;
                    const interviewRate = applied > 0 ? Math.round((interviewed / applied) * 100) : 0;
                    const acceptRate = interviewed > 0 ? Math.round((accepted / interviewed) * 100) : 0;
                    return (
                      <div className="grid grid-cols-2 gap-4 text-center">
                        <div>
                          <p className="text-2xl font-bold text-indigo-700 dark:text-indigo-300">{interviewRate}%</p>
                          <p className="text-xs text-indigo-600 dark:text-indigo-400">Interview-Quote</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-indigo-700 dark:text-indigo-300">{acceptRate}%</p>
                          <p className="text-xs text-indigo-600 dark:text-indigo-400">Angebots-Quote</p>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* KI-Zusammenfassung */}
              <div className="p-4 bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-700 rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-violet-700 dark:text-violet-300 text-sm flex items-center gap-2">
                    <SparklesIcon className="w-4 h-4" /> KI-JobCoach Analyse
                  </h4>
                  {!aiSummary && (
                    <button onClick={loadAiSummary} disabled={aiLoading}
                      className="flex items-center gap-1.5 px-3 py-1 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-xs rounded-lg">
                      {aiLoading ? <ArrowPathIcon className="w-3 h-3 animate-spin" /> : <SparklesIcon className="w-3 h-3" />}
                      {aiLoading ? "Analysiere…" : "Analyse starten"}
                    </button>
                  )}
                </div>
                {aiSummary ? (
                  <p className="text-sm text-violet-800 dark:text-violet-200 leading-relaxed whitespace-pre-wrap">{aiSummary}</p>
                ) : !aiLoading ? (
                  <p className="text-xs text-violet-600 dark:text-violet-400">Klicke auf &ldquo;Analyse starten&rdquo;, um eine KI-Zusammenfassung und Verbesserungsvorschläge zu erhalten.</p>
                ) : null}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
