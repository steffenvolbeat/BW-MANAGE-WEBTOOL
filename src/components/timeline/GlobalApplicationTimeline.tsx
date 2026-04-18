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

interface Props {
  onOpenApplication?: (applicationId: string) => void;
}

export default function GlobalApplicationTimeline({ onOpenApplication }: Props) {
  const [entries, setEntries] = useState<GlobalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<EntryType | "">("");
  const [filterCompany, setFilterCompany] = useState("");
  const [collapsedMonths, setCollapsedMonths] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);

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

  useEffect(() => { loadEntries(); }, [loadEntries]);

  // Filter
  const filtered = entries.filter((e) => {
    if (filterType && e.type !== filterType) return false;
    if (filterCompany && !e.application.companyName.toLowerCase().includes(filterCompany.toLowerCase())) return false;
    return true;
  });

  // Gruppierung nach Monat
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

  // Einmalige Firmennamen für Filter
  const companies = Array.from(new Set(entries.map((e) => e.application.companyName))).sort();

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Gesamter Bewerbungsverlauf
          </h2>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">
            {filtered.length} Ereignis{filtered.length !== 1 ? "se" : ""} aus {companies.length} Unternehmen
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters((v) => !v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border transition-colors ${showFilters ? "bg-indigo-50 border-indigo-300 text-indigo-700" : "bg-white border-gray-200 text-gray-600 hover:border-indigo-300"}`}
          >
            <FunnelIcon className="w-4 h-4" />
            Filter
          </button>
          <button
            onClick={loadEntries}
            title="Aktualisieren"
            className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:text-indigo-600 hover:border-indigo-300 transition-colors"
          >
            <ArrowPathIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter-Panel */}
      {showFilters && (
        <div className="flex flex-wrap gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div>
            <label htmlFor="gt-filter-type" className="block text-xs text-gray-500 mb-1">Ereignistyp</label>
            <select
              id="gt-filter-type"
              name="gt-filter-type"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as EntryType | "")}
              className="text-sm border border-gray-200 dark:border-gray-600 rounded-lg px-2 py-1.5 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            >
              <option value="">Alle Typen</option>
              {(Object.keys(TYPE_LABELS) as EntryType[]).map((t) => (
                <option key={t} value={t}>{TYPE_LABELS[t]}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="gt-filter-company" className="block text-xs text-gray-500 mb-1">Unternehmen</label>
            <select
              id="gt-filter-company"
              name="gt-filter-company"
              value={filterCompany}
              onChange={(e) => setFilterCompany(e.target.value)}
              className="text-sm border border-gray-200 dark:border-gray-600 rounded-lg px-2 py-1.5 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            >
              <option value="">Alle Unternehmen</option>
              {companies.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          {(filterType || filterCompany) && (
            <button
              onClick={() => { setFilterType(""); setFilterCompany(""); }}
              className="self-end flex items-center gap-1 text-xs text-gray-500 hover:text-red-600 px-2 py-1.5"
            >
              <XMarkIcon className="w-3.5 h-3.5" /> Filter zurücksetzen
            </button>
          )}
        </div>
      )}

      {/* Fehler */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-16">
          <ArrowPathIcon className="w-8 h-8 animate-spin text-indigo-400" />
        </div>
      )}

      {/* Leer */}
      {!loading && filtered.length === 0 && (
        <div className="text-center py-16 text-gray-400 dark:text-slate-500">
          <ClockIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Keine Ereignisse vorhanden</p>
          <p className="text-sm mt-1">Bewerbungen anlegen oder Status ändern, um den Verlauf zu befüllen.</p>
        </div>
      )}

      {/* Zeitstrahl – nach Monat gruppiert */}
      {!loading && filtered.length > 0 && (
        <div className="space-y-10">
          {sortedMonths.map((monthK) => {
            const monthEntries = byMonth[monthK];
            const isCollapsed = collapsedMonths.has(monthK);

            return (
              <div key={monthK}>
                {/* Monats-Trennlinie */}
                <button
                  onClick={() => toggleMonth(monthK)}
                  className="w-full flex items-center gap-3 mb-4 group"
                >
                  <div className="flex-1 h-px bg-gradient-to-r from-indigo-400 to-transparent dark:from-indigo-600" />
                  <span className="flex items-center gap-1.5 text-sm font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wide whitespace-nowrap">
                    {monthLabel(monthK)}
                    <span className="text-xs font-normal text-gray-400 dark:text-slate-500">
                      ({monthEntries.length} Ereignis{monthEntries.length !== 1 ? "se" : ""})
                    </span>
                    {isCollapsed
                      ? <ChevronDownIcon className="w-4 h-4 opacity-60" />
                      : <ChevronUpIcon className="w-4 h-4 opacity-60" />}
                  </span>
                  <div className="flex-1 h-px bg-gradient-to-l from-indigo-400 to-transparent dark:from-indigo-600" />
                </button>

                {!isCollapsed && (
                  <div className="relative">
                    {/* Zeitstrahl-Achse */}
                    <div className="absolute left-[21px] top-[22px] bottom-[22px] w-0.5 bg-gradient-to-b from-indigo-400 via-indigo-200 to-gray-200 dark:from-indigo-500 dark:via-indigo-900 dark:to-gray-700" />

                    <div className="space-y-4">
                      {monthEntries.map((entry) => (
                        <div key={entry.id} className="relative flex items-start gap-4">
                          {/* Node */}
                          <div className={`relative z-10 flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center border-4 border-white dark:border-gray-900 shadow-md ${nodeColor(entry.type)}`}>
                            {nodeIcon(entry.type)}
                          </div>

                          {/* Karte */}
                          <div className="flex-1 min-w-0 pt-1">
                            <p className="text-[11px] font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wide mb-1.5 leading-none">
                              {formatEntryDate(entry.date)}
                            </p>
                            <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-3 shadow-sm hover:shadow-md transition-shadow">
                              <div className="flex items-start justify-between gap-2 flex-wrap">
                                <div className="flex items-center gap-2 flex-wrap min-w-0">
                                  <span className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-full border ${badgeColor(entry.type)}`}>
                                    {TYPE_LABELS[entry.type]}
                                  </span>
                                  <span className="font-semibold text-sm text-gray-900 dark:text-white leading-snug">
                                    {entry.title}
                                  </span>
                                </div>
                                {/* Firmen-Tag – klickbar wenn Callback vorhanden */}
                                <button
                                  type="button"
                                  onClick={() => onOpenApplication?.(entry.application.id)}
                                  className="flex-shrink-0 flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-slate-300 hover:bg-indigo-50 hover:text-indigo-700 dark:hover:bg-indigo-900/30 dark:hover:text-indigo-400 border border-transparent hover:border-indigo-200 transition-colors"
                                  title={`${entry.application.position} @ ${entry.application.companyName}`}
                                >
                                  <BuildingOfficeIcon className="w-3 h-3" />
                                  <span className="max-w-[140px] truncate">{entry.application.companyName}</span>
                                </button>
                              </div>

                              {/* Position + Status */}
                              <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
                                {entry.application.position}
                                {entry.status && (
                                  <> · <span className="font-medium">{STATUS_LABELS[entry.status] ?? entry.status}</span></>
                                )}
                              </p>

                              {/* Inhalt */}
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
    </div>
  );
}
