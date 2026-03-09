"use client";

/**
 * ResumeParser – AI-gestützter Lebenslauf-Parser (Feature 6)
 * PDF hochladen → strukturierte Daten + Gap-Analyse gegen Stellenanzeigen
 */

import { useState, useRef, useCallback } from "react";
import {
  ArrowUpTrayIcon,
  DocumentMagnifyingGlassIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClipboardDocumentIcon,
  ArrowPathIcon,
  BriefcaseIcon,
  AcademicCapIcon,
  LanguageIcon,
  LinkIcon,
  StarIcon,
  ExclamationTriangleIcon,
  LightBulbIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";
import { SparklesIcon } from "@heroicons/react/24/solid";
import type { ParsedResume } from "@/app/api/ai/resume/parse/route";
import type { GapAnalysis } from "@/app/api/ai/resume/gap-analysis/route";

// ── Tabs ──────────────────────────────────────────────────────────────────────

type Tab = "overview" | "experience" | "education" | "gap";

// ── Score-Farbe ───────────────────────────────────────────────────────────────

function scoreColor(score: number) {
  if (score >= 80) return { text: "text-emerald-600", bg: "bg-emerald-500", label: "Sehr gut" };
  if (score >= 60) return { text: "text-blue-600", bg: "bg-blue-500", label: "Gut" };
  if (score >= 40) return { text: "text-amber-600", bg: "bg-amber-500", label: "Mittel" };
  return { text: "text-red-600", bg: "bg-red-500", label: "Lückenhaft" };
}

// ── Skill-Badge ───────────────────────────────────────────────────────────────

function SkillBadge({ label, color = "slate" }: { label: string; color?: string }) {
  const cls: Record<string, string> = {
    slate: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
    green: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
    red: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
    blue: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
    violet: "bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${cls[color] ?? cls.slate}`}>
      {label}
    </span>
  );
}

// ── Upload-Bereich ────────────────────────────────────────────────────────────

interface UploadZoneProps {
  onFile: (file: File) => void;
  loading: boolean;
}

function UploadZone({ onFile, loading }: UploadZoneProps) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) onFile(file);
    },
    [onFile]
  );

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => !loading && inputRef.current?.click()}
      className={`relative w-full rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-4 p-12
        ${dragging
          ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30 scale-[1.01]"
          : "border-slate-300 dark:border-slate-700 hover:border-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-800/40"
        }
        ${loading ? "pointer-events-none opacity-60" : ""}
      `}
    >
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,text/plain"
        className="sr-only"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }}
      />

      {loading ? (
        <>
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center">
              <DocumentMagnifyingGlassIcon className="w-8 h-8 text-indigo-600 dark:text-indigo-400 animate-pulse" />
            </div>
            <div className="absolute inset-0 rounded-2xl border-4 border-indigo-400/30 animate-ping" />
          </div>
          <div className="text-center">
            <p className="font-semibold text-slate-900 dark:text-white">KI analysiert Lebenslauf…</p>
            <p className="text-sm text-slate-500 mt-1">PDF wird extrahiert und strukturiert</p>
          </div>
        </>
      ) : (
        <>
          <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-indigo-100 to-violet-100 dark:from-indigo-900/40 dark:to-violet-900/40 flex items-center justify-center">
            <ArrowUpTrayIcon className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="text-center">
            <p className="font-semibold text-slate-900 dark:text-white text-lg">
              Lebenslauf (.pdf) hier ablegen
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              oder klicken zum Auswählen · max 5 MB
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-500" /> PDF-Parsing
            </span>
            <span className="flex items-center gap-1">
              <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-500" /> Skill-Extraktion
            </span>
            <span className="flex items-center gap-1">
              <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-500" /> Gap-Analyse
            </span>
          </div>
        </>
      )}
    </div>
  );
}

// ── Ergebnis-Karte ────────────────────────────────────────────────────────────

function Section({ title, icon: Icon, children }: { title: string; icon: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
      <div className="flex items-center gap-2 mb-4">
        <Icon className="w-4 h-4 text-indigo-500" />
        <h3 className="font-semibold text-slate-900 dark:text-white text-sm">{title}</h3>
      </div>
      {children}
    </div>
  );
}

// ── Hauptkomponente ───────────────────────────────────────────────────────────

export default function ResumeParser() {
  const [parsed, setParsed] = useState<ParsedResume | null>(null);
  const [gap, setGap] = useState<GapAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [gapLoading, setGapLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("overview");
  const [jobDesc, setJobDesc] = useState("");
  const [lang, setLang] = useState<"de" | "en">("de");
  const [copied, setCopied] = useState(false);
  const [fileName, setFileName] = useState("");

  // ── PDF hochladen & parsen ───────────────────────────────────────────────

  const handleFile = async (file: File) => {
    setLoading(true);
    setError(null);
    setParsed(null);
    setGap(null);
    setFileName(file.name);

    const fd = new FormData();
    fd.append("pdf", file);
    fd.append("lang", lang);

    try {
      const resp = await fetch("/api/ai/resume/parse", { method: "POST", body: fd });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error ?? "Fehler beim Parsen");
      setParsed(data.parsed);
      setTab("overview");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unbekannter Fehler");
    } finally {
      setLoading(false);
    }
  };

  // ── Gap-Analyse ──────────────────────────────────────────────────────────

  const runGapAnalysis = async () => {
    if (!parsed || !jobDesc.trim()) return;
    setGapLoading(true);
    setGap(null);

    try {
      const resp = await fetch("/api/ai/resume/gap-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeText: parsed.rawText ?? parsed.skills.join(", "),
          jobDescription: jobDesc,
          lang,
        }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error);
      setGap(data.analysis);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gap-Analyse fehlgeschlagen");
    } finally {
      setGapLoading(false);
    }
  };

  // ── JSON exportieren ─────────────────────────────────────────────────────

  const handleCopy = () => {
    if (!parsed) return;
    navigator.clipboard.writeText(JSON.stringify(parsed, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!parsed) return;
    const blob = new Blob([JSON.stringify(parsed, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `resume-parsed-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const TABS: { id: Tab; label: string }[] = [
    { id: "overview", label: "Übersicht" },
    { id: "experience", label: "Erfahrung" },
    { id: "education", label: "Bildung" },
    { id: "gap", label: "Gap-Analyse" },
  ];

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header-Aktionsleiste */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value as "de" | "en")}
            className="text-sm border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="de">🇩🇪 Deutsch</option>
            <option value="en">🇬🇧 English</option>
          </select>
          {fileName && (
            <span className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg">
              📄 {fileName}
            </span>
          )}
        </div>
        {parsed && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <ClipboardDocumentIcon className="w-3.5 h-3.5" />
              {copied ? "Kopiert!" : "JSON kopieren"}
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              ⬇ JSON herunterladen
            </button>
            <button
              onClick={() => { setParsed(null); setGap(null); setError(null); setFileName(""); }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
            >
              <ArrowPathIcon className="w-3.5 h-3.5" />
              Neuer Upload
            </button>
          </div>
        )}
      </div>

      {/* Upload-Bereich */}
      {!parsed && (
        <UploadZone onFile={handleFile} loading={loading} />
      )}

      {/* Fehler */}
      {error && (
        <div className="flex items-start gap-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl p-4">
          <XCircleIcon className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-red-800 dark:text-red-300 text-sm">Fehler beim Parsen</p>
            <p className="text-sm text-red-600 dark:text-red-400 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Ergebnisse */}
      {parsed && (
        <div className="space-y-4">
          {/* Profil-Header */}
          <div className="bg-linear-to-r from-indigo-600 to-violet-600 rounded-2xl p-6 text-white">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h2 className="text-2xl font-bold">{parsed.name || "Name nicht erkannt"}</h2>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-indigo-100 text-sm">
                  {parsed.email && <span>✉ {parsed.email}</span>}
                  {parsed.phone && <span>📞 {parsed.phone}</span>}
                  {parsed.location && <span>📍 {parsed.location}</span>}
                </div>
                {parsed.summary && (
                  <p className="mt-3 text-sm text-indigo-100 max-w-2xl leading-relaxed">{parsed.summary}</p>
                )}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {parsed.skills.length > 0 && (
                  <span className="bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 text-xs font-medium">
                    {parsed.skills.length} Skills erkannt
                  </span>
                )}
                {parsed.experience.length > 0 && (
                  <span className="bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 text-xs font-medium">
                    {parsed.experience.length} Positionen
                  </span>
                )}
                {parsed.education.length > 0 && (
                  <span className="bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 text-xs font-medium">
                    {parsed.education.length} Abschlüsse
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Tab-Navigation */}
          <div className="flex gap-1 bg-slate-100 dark:bg-slate-800/50 rounded-xl p-1">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex-1 py-2 px-3 text-sm font-medium rounded-lg transition-all ${
                  tab === t.id
                    ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                {t.label}
                {t.id === "gap" && gap && (
                  <span className={`ml-1.5 text-xs font-bold ${scoreColor(gap.score).text}`}>
                    {gap.score}%
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* ── TAB: Übersicht ──────────────────────────────────────────── */}
          {tab === "overview" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Skills */}
              {parsed.skills.length > 0 && (
                <Section title="Skills & Technologien" icon={StarIcon}>
                  <div className="flex flex-wrap gap-2">
                    {parsed.skills.map((s) => (
                      <SkillBadge key={s} label={s} color="slate" />
                    ))}
                  </div>
                </Section>
              )}

              {/* Sprachen */}
              {parsed.languages.length > 0 && (
                <Section title="Sprachen" icon={LanguageIcon}>
                  <div className="space-y-2">
                    {parsed.languages.map((l) => (
                      <div key={l.language} className="flex items-center justify-between text-sm">
                        <span className="text-slate-900 dark:text-white font-medium">{l.language}</span>
                        <span className="text-slate-500 dark:text-slate-400 text-xs bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full">
                          {l.level}
                        </span>
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {/* Zertifizierungen */}
              {parsed.certifications.length > 0 && (
                <Section title="Zertifizierungen" icon={AcademicCapIcon}>
                  <ul className="space-y-1.5">
                    {parsed.certifications.map((c) => (
                      <li key={c} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                        <CheckCircleIcon className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        {c}
                      </li>
                    ))}
                  </ul>
                </Section>
              )}

              {/* Links */}
              {parsed.links.length > 0 && (
                <Section title="Links & Profile" icon={LinkIcon}>
                  <div className="space-y-2">
                    {parsed.links.map((l) => (
                      <a
                        key={l.url}
                        href={l.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
                      >
                        <LinkIcon className="w-3.5 h-3.5 shrink-0" />
                        <span className="font-medium">{l.type}</span>
                        <span className="text-slate-400 truncate text-xs">{l.url}</span>
                      </a>
                    ))}
                  </div>
                </Section>
              )}
            </div>
          )}

          {/* ── TAB: Erfahrung ─────────────────────────────────────────── */}
          {tab === "experience" && (
            <div className="space-y-3">
              {parsed.experience.length === 0 ? (
                <div className="text-center py-12 text-slate-400">Keine Berufserfahrung erkannt</div>
              ) : (
                parsed.experience.map((exp, i) => (
                  <div key={i} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center shrink-0">
                          <BriefcaseIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-slate-900 dark:text-white">{exp.position || "Position"}</h4>
                          <p className="text-sm text-indigo-600 dark:text-indigo-400 font-medium">{exp.company}</p>
                          {exp.description && (
                            <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">{exp.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs text-slate-400 dark:text-slate-500 font-mono">
                          {exp.startDate} {exp.startDate && "–"} {exp.endDate || "heute"}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ── TAB: Bildung ───────────────────────────────────────────── */}
          {tab === "education" && (
            <div className="space-y-3">
              {parsed.education.length === 0 ? (
                <div className="text-center py-12 text-slate-400">Keine Ausbildung erkannt</div>
              ) : (
                parsed.education.map((edu, i) => (
                  <div key={i} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center shrink-0">
                        <AcademicCapIcon className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between flex-wrap gap-2">
                          <div>
                            <h4 className="font-semibold text-slate-900 dark:text-white">{edu.degree} {edu.field && `– ${edu.field}`}</h4>
                            <p className="text-sm text-violet-600 dark:text-violet-400 font-medium">{edu.institution}</p>
                          </div>
                          <p className="text-xs text-slate-400 font-mono shrink-0">
                            {edu.startDate} {edu.startDate && "–"} {edu.endDate || "heute"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ── TAB: Gap-Analyse ───────────────────────────────────────── */}
          {tab === "gap" && (
            <div className="space-y-4">
              {/* Stellenanzeige Eingabe */}
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
                <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
                  Stellenanzeige eingeben
                </label>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                  Füge die Jobbeschreibung ein – die KI vergleicht Qualifikationen und findet Lücken.
                </p>
                <textarea
                  rows={8}
                  value={jobDesc}
                  onChange={(e) => setJobDesc(e.target.value)}
                  placeholder="Jobbeschreibung, Anforderungen, Aufgaben hier einfügen…"
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm text-slate-900 dark:text-white placeholder-slate-400 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
                <button
                  onClick={runGapAnalysis}
                  disabled={!jobDesc.trim() || gapLoading}
                  className="mt-3 flex items-center gap-2 px-4 py-2 bg-linear-to-r from-indigo-600 to-violet-600 text-white text-sm font-medium rounded-lg hover:from-indigo-700 hover:to-violet-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm shadow-indigo-500/20"
                >
                  <SparklesIcon className="w-4 h-4" />
                  {gapLoading ? "Analysiere…" : "Gap-Analyse starten"}
                </button>
              </div>

              {/* Gap-Ergebnisse */}
              {gap && (
                <div className="space-y-4">
                  {/* Score */}
                  <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-semibold text-slate-900 dark:text-white text-sm">Übereinstimmung</span>
                      <span className={`text-2xl font-bold ${scoreColor(gap.score).text}`}>{gap.score}%</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5">
                      <div
                        className={`h-2.5 rounded-full transition-all duration-700 ${scoreColor(gap.score).bg}`}
                        style={{ width: `${gap.score}%` }}
                      />
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-medium">
                      {scoreColor(gap.score).label} – {gap.summary}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Matching Skills */}
                    {gap.matchingSkills.length > 0 && (
                      <div className="bg-white dark:bg-slate-800 rounded-xl border border-emerald-200 dark:border-emerald-800/50 p-4">
                        <div className="flex items-center gap-1.5 mb-3">
                          <CheckCircleIcon className="w-4 h-4 text-emerald-500" />
                          <span className="text-sm font-semibold text-slate-900 dark:text-white">Vorhanden</span>
                          <span className="ml-auto text-xs bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded-full font-medium">
                            {gap.matchingSkills.length}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {gap.matchingSkills.map((s) => <SkillBadge key={s} label={s} color="green" />)}
                        </div>
                      </div>
                    )}

                    {/* Missing Skills */}
                    {gap.missingSkills.length > 0 && (
                      <div className="bg-white dark:bg-slate-800 rounded-xl border border-red-200 dark:border-red-800/50 p-4">
                        <div className="flex items-center gap-1.5 mb-3">
                          <ExclamationTriangleIcon className="w-4 h-4 text-red-500" />
                          <span className="text-sm font-semibold text-slate-900 dark:text-white">Fehlend</span>
                          <span className="ml-auto text-xs bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 px-1.5 py-0.5 rounded-full font-medium">
                            {gap.missingSkills.length}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {gap.missingSkills.map((s) => <SkillBadge key={s} label={s} color="red" />)}
                        </div>
                      </div>
                    )}

                    {/* Bonus Skills */}
                    {gap.bonusSkills.length > 0 && (
                      <div className="bg-white dark:bg-slate-800 rounded-xl border border-blue-200 dark:border-blue-800/50 p-4">
                        <div className="flex items-center gap-1.5 mb-3">
                          <StarIcon className="w-4 h-4 text-blue-500" />
                          <span className="text-sm font-semibold text-slate-900 dark:text-white">Bonus-Skills</span>
                          <span className="ml-auto text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded-full font-medium">
                            {gap.bonusSkills.length}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {gap.bonusSkills.map((s) => <SkillBadge key={s} label={s} color="blue" />)}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Keywords der Stelle */}
                  {gap.keywordsJob.length > 0 && (
                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
                      <div className="flex items-center gap-1.5 mb-3">
                        <ChartBarIcon className="w-4 h-4 text-violet-500" />
                        <span className="text-sm font-semibold text-slate-900 dark:text-white">Top-Keywords der Stelle</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {gap.keywordsJob.map((k) => <SkillBadge key={k} label={k} color="violet" />)}
                      </div>
                    </div>
                  )}

                  {/* Empfehlungen */}
                  {gap.recommendations.length > 0 && (
                    <div className="bg-linear-to-br from-indigo-50 to-violet-50 dark:from-indigo-950/30 dark:to-violet-950/30 rounded-xl border border-indigo-200 dark:border-indigo-800/50 p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <LightBulbIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        <span className="text-sm font-semibold text-slate-900 dark:text-white">Empfehlungen der KI</span>
                      </div>
                      <ol className="space-y-2">
                        {gap.recommendations.map((r, i) => (
                          <li key={i} className="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-300">
                            <span className="shrink-0 w-5 h-5 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center font-bold">
                              {i + 1}
                            </span>
                            {r}
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
