"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import {
  XMarkIcon,
  MagnifyingGlassIcon,
  BriefcaseIcon,
  MapPinIcon,
  CurrencyEuroIcon,
  BuildingOffice2Icon,
  CheckCircleIcon,
  PlusCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  SparklesIcon,
  CpuChipIcon,
  StarIcon,
  GlobeAltIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  DocumentTextIcon,
  ArrowUpTrayIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { CheckCircleIcon as CheckCircleSolid, StarIcon as StarSolid } from "@heroicons/react/24/solid";
import type { JobMatch, ProfileAnalysis } from "@/app/api/agents/job-search/route";

// ── Typen ─────────────────────────────────────────────────────────────────────

interface Props {
  onClose: () => void;
  onApplicationCreated?: () => void;
}

type WorkType = "ANY" | "REMOTE" | "HYBRID" | "ONSITE";
type JobLevel = "ANY" | "JUNIOR" | "MID" | "SENIOR" | "LEAD";
type SortKey = "matchScore" | "salaryMax" | "postedDaysAgo";

const JOB_TYPE_OPTIONS = [
  "Backend", "Frontend", "Full-Stack", "DevOps", "Cloud",
  "Mobile", "Data", "ML/AI", "Platform", "Security",
];

const WORK_TYPE_LABELS: Record<WorkType, string> = {
  ANY: "Egal", REMOTE: "Remote", HYBRID: "Hybrid", ONSITE: "Vor Ort",
};

const LEVEL_LABELS: Record<JobLevel, string> = {
  ANY: "Alle Level", JUNIOR: "Junior", MID: "Mid-Level", SENIOR: "Senior", LEAD: "Lead / Principal",
};

const MATCH_COLOR = (score: number) =>
  score >= 85 ? "text-green-600" : score >= 70 ? "text-blue-600" : "text-orange-500";

const MATCH_BG = (score: number) =>
  score >= 85 ? "bg-green-500" : score >= 70 ? "bg-blue-500" : "bg-orange-400";

const WORK_BADGE: Record<string, string> = {
  REMOTE: "bg-teal-100 text-teal-700",
  HYBRID: "bg-blue-100 text-blue-700",
  ONSITE: "bg-gray-100 text-gray-700",
};

const WORK_LABEL: Record<string, string> = {
  REMOTE: "Remote", HYBRID: "Hybrid", ONSITE: "Vor Ort",
};

// ── Job-Karte ─────────────────────────────────────────────────────────────────

function JobCard({
  job,
  addedIds,
  onAdd,
}: {
  job: JobMatch;
  addedIds: Set<string>;
  onAdd: (job: JobMatch) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [adding, setAdding] = useState(false);
  const added = addedIds.has(job.id);

  const handleAdd = async () => {
    if (added || adding) return;
    setAdding(true);
    await onAdd(job);
    setAdding(false);
  };

  return (
    <div
      className={`bg-white rounded-xl border-2 transition-all shadow-sm hover:shadow-md ${
        job.isHighPriority ? "border-green-200 hover:border-green-300" : "border-gray-200 hover:border-blue-200"
      }`}
    >
      {/* Card Header */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {/* Match-Score + Badges */}
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <div className={`flex items-center gap-1 font-bold text-sm ${MATCH_COLOR(job.matchScore)}`}>
                {job.matchScore >= 85 ? (
                  <StarSolid className="w-4 h-4" />
                ) : (
                  <StarIcon className="w-4 h-4" />
                )}
                {job.matchScore}% Match
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${WORK_BADGE[job.workType] ?? "bg-gray-100 text-gray-700"}`}>
                {WORK_LABEL[job.workType] ?? job.workType}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 font-medium">
                {job.jobType}
              </span>
              {job.isHighPriority && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-semibold flex items-center gap-1">
                  <SparklesIcon className="w-3 h-3" /> Top-Match
                </span>
              )}
            </div>

            {/* Titel */}
            <h3 className="font-bold text-gray-900 text-base leading-tight">{job.position}</h3>

            {/* Firma */}
            <div className="flex items-center gap-2 mt-1">
              <BuildingOffice2Icon className="w-4 h-4 text-gray-400 shrink-0" />
              <span className="text-sm text-gray-700 font-medium">{job.company}</span>
              <span className="text-xs text-gray-400">· {job.companySize}</span>
            </div>

            {/* Ort + Gehalt */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <MapPinIcon className="w-3.5 h-3.5" />
                {job.location}
                {job.country !== "Deutschland" && (
                  <span className="ml-1 text-xs text-blue-600 font-medium">({job.country})</span>
                )}
              </span>
              <span className="flex items-center gap-1">
                <CurrencyEuroIcon className="w-3.5 h-3.5" />
                {job.salaryMin.toLocaleString("de")} – {job.salaryMax.toLocaleString("de")} {job.currency}/Jahr
              </span>
              <span className="text-xs text-gray-400">
                vor {job.postedDaysAgo} {job.postedDaysAgo === 1 ? "Tag" : "Tagen"}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-1.5 shrink-0">
            <button
              onClick={handleAdd}
              disabled={added || adding}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                added
                  ? "bg-green-100 text-green-700 border border-green-300 cursor-default"
                  : adding
                  ? "bg-blue-50 text-blue-400 border border-blue-200 cursor-wait"
                  : "bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
              }`}
            >
              {added ? (
                <>
                  <CheckCircleSolid className="w-3.5 h-3.5" />
                  Angelegt
                </>
              ) : adding ? (
                <>
                  <ArrowPathIcon className="w-3.5 h-3.5 animate-spin" />
                  Anlegen...
                </>
              ) : (
                <>
                  <PlusCircleIcon className="w-3.5 h-3.5" />
                  Bewerben
                </>
              )}
            </button>
          </div>
        </div>

        {/* Match-Score Bar */}
        <div className="mt-3">
          <div className="w-full bg-gray-100 rounded-full h-1.5">
            <div
              className={`h-1.5 rounded-full transition-all ${MATCH_BG(job.matchScore)}`}
              style={{ width: `${job.matchScore}%` }}
            />
          </div>
        </div>

        {/* Skills */}
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {job.matchedSkills.slice(0, 5).map((skill) => (
            <span
              key={skill}
              className="inline-flex items-center gap-0.5 text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200 font-medium"
            >
              <CheckCircleIcon className="w-3 h-3" />
              {skill}
            </span>
          ))}
          {job.missingSkills.slice(0, 3).map((skill) => (
            <span
              key={skill}
              className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 border border-gray-200"
            >
              {skill}
            </span>
          ))}
          {job.missingSkills.length > 3 && (
            <span className="text-xs text-gray-400">+{job.missingSkills.length - 3} mehr</span>
          )}
        </div>

        {/* Expand Button */}
        <button
          onClick={() => setExpanded((e) => !e)}
          className="mt-2.5 flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          {expanded ? <ChevronUpIcon className="w-3.5 h-3.5" /> : <ChevronDownIcon className="w-3.5 h-3.5" />}
          {expanded ? "Weniger" : "Details anzeigen"}
        </button>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="px-4 pb-4 pt-0 border-t border-gray-100 mt-2 space-y-3">
          {/* Match-Gründe */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Warum passend</p>
            <ul className="space-y-1">
              {job.matchReasons.map((r, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-gray-700">
                  <CheckCircleSolid className="w-3.5 h-3.5 text-green-500 shrink-0" />
                  {r}
                </li>
              ))}
            </ul>
          </div>

          {/* Stellenbeschreibung */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Stelle</p>
            <p className="text-sm text-gray-700 leading-relaxed">{job.jobDescription}</p>
          </div>

          {/* Benefits */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Benefits</p>
            <div className="flex flex-wrap gap-1.5">
              {job.benefits.map((b) => (
                <span key={b} className="text-xs px-2 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-100">
                  {b}
                </span>
              ))}
            </div>
          </div>

          {/* Unternehmen */}
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Über {job.company}</p>
            <p className="text-xs text-gray-600">{job.companyDescription}</p>
          </div>

          {/* Deadline */}
          {job.applicationDeadline && (
            <div className="flex items-center gap-2 text-xs text-orange-600 bg-orange-50 rounded-lg px-3 py-2">
              <ExclamationTriangleIcon className="w-3.5 h-3.5 shrink-0" />
              Bewerbungsfrist: {new Date(job.applicationDeadline).toLocaleDateString("de-DE")}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Haupt-Komponente ──────────────────────────────────────────────────────────

export default function JobSearchAgent({ onClose, onApplicationCreated }: Props) {
  // Settings
  const [location, setLocation] = useState("");
  const [workType, setWorkType] = useState<WorkType>("ANY");
  const [salaryMin, setSalaryMin] = useState(60000);
  const [salaryMax, setSalaryMax] = useState(120000);
  const [jobLevel, setJobLevel] = useState<JobLevel>("ANY");
  const [selectedJobTypes, setSelectedJobTypes] = useState<string[]>([]);
  const [techStackInput, setTechStackInput] = useState("");
  const [techStack, setTechStack] = useState<string[]>([]);
  const [searchCountries, setSearchCountries] = useState<string[]>(["Deutschland"]);

  // State
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jobs, setJobs] = useState<JobMatch[]>([]);
  const [profileAnalysis, setProfileAnalysis] = useState<ProfileAnalysis | null>(null);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [sortKey, setSortKey] = useState<SortKey>("matchScore");
  const [lastSearched, setLastSearched] = useState<Date | null>(null);

  // Dokumente
  const [documents, setDocuments] = useState<{ id: string; name: string; type: string; fileType: string }[]>([]);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/documents")
      .then((r) => r.json())
      .then((d) => setDocuments(Array.isArray(d) ? d : (d.documents ?? [])))
      .catch(() => {});
  }, []);

  const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingDoc(true);
    setUploadError(null);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase();
      const form = new FormData();
      form.append("file", file);
      form.append("name", file.name);
      // Typ automatisch erkennen
      const type =
        ext === "pdf" && file.name.toLowerCase().includes("lebenslauf") ? "CV"
        : ext === "pdf" && file.name.toLowerCase().includes("anschreiben") ? "COVER_LETTER"
        : file.name.toLowerCase().includes("zeugnis") || file.name.toLowerCase().includes("zertifikat") || file.name.toLowerCase().includes("certificate") ? "CERTIFICATE"
        : "OTHER";
      form.append("type", type);
      const res = await fetch("/api/documents", { method: "POST", body: form });
      if (!res.ok) throw new Error(await res.text());
      const newDoc = await res.json();
      setDocuments((prev) => [newDoc, ...prev]);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload fehlgeschlagen");
    } finally {
      setUploadingDoc(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDocDelete = async (id: string) => {
    await fetch(`/api/documents/${id}`, { method: "DELETE" }).catch(() => {});
    setDocuments((prev) => prev.filter((d) => d.id !== id));
  };

  // Tech-Stack Tag hinzufügen
  const addTechTag = () => {
    const tag = techStackInput.trim();
    if (tag && !techStack.includes(tag)) {
      setTechStack((prev) => [...prev, tag]);
    }
    setTechStackInput("");
  };

  const toggleCountry = (country: string) => {
    setSearchCountries((prev) =>
      prev.includes(country) ? prev.filter((c) => c !== country) : [...prev, country]
    );
  };

  // Suche starten
  const startSearch = useCallback(async () => {
    setSearching(true);
    setError(null);
    try {
      const res = await fetch("/api/agents/job-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location,
          workType,
          salaryMin,
          salaryMax,
          techStack,
          jobLevel,
          jobTypes: selectedJobTypes,
          countries: searchCountries,
        }),
      });
      if (!res.ok) throw new Error(`Fehler ${res.status}`);
      const data = await res.json();
      setJobs(data.jobs ?? []);
      setProfileAnalysis(data.profileAnalysis ?? null);
      setLastSearched(new Date());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unbekannter Fehler");
    } finally {
      setSearching(false);
    }
  }, [location, workType, salaryMin, salaryMax, techStack, jobLevel, selectedJobTypes, searchCountries]);

  // Bewerbung anlegen
  const handleAddApplication = useCallback(async (job: JobMatch) => {
    try {
      const isInland = job.country === "Deutschland";
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: job.company,
          position: job.position,
          location: job.location,
          country: job.country,
          isInland,
          status: "WISHLIST",
          notes: `KI-Suche: ${job.matchScore}% Match · ${job.jobType} · Gehalt: ${job.salaryMin.toLocaleString("de")}–${job.salaryMax.toLocaleString("de")} ${job.currency}/Jahr\nGefundene Skills: ${job.matchedSkills.join(", ")}`,
          salary: `${job.salaryMin}–${job.salaryMax}`,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setAddedIds((prev) => new Set([...prev, job.id]));
      onApplicationCreated?.();
    } catch (e) {
      alert(`Fehler beim Anlegen: ${e instanceof Error ? e.message : "Unbekannt"}`);
    }
  }, [onApplicationCreated]);

  // Sortierung
  const sortedJobs = [...jobs].sort((a, b) => {
    if (sortKey === "matchScore") return b.matchScore - a.matchScore;
    if (sortKey === "salaryMax") return b.salaryMax - a.salaryMax;
    if (sortKey === "postedDaysAgo") return a.postedDaysAgo - b.postedDaysAgo;
    return 0;
  });

  const highMatches = jobs.filter((j) => j.matchScore >= 85).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-2 sm:p-4">
      <div className="bg-gray-50 rounded-2xl shadow-2xl w-full max-w-7xl h-[96vh] flex flex-col overflow-hidden">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="bg-gradient-to-r from-violet-700 via-blue-700 to-indigo-700 px-4 sm:px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <CpuChipIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                🤖 KI Job-Suche Agent
              </h2>
              <p className="text-xs text-white/70">
                Personalisierte Stellensuche · IT & Tech · DACH-Raum
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {lastSearched && (
              <span className="text-xs text-white/50 hidden sm:block">
                Zuletzt: {lastSearched.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })} Uhr
              </span>
            )}
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* ── Body ───────────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-hidden flex flex-col lg:flex-row min-h-0">

          {/* ── Linke Spalte: Einstellungen ────────────────────────────── */}
          <div className="w-full lg:w-80 xl:w-96 shrink-0 overflow-y-auto border-b lg:border-b-0 lg:border-r border-gray-200 bg-white p-4 space-y-5">

            {/* ── Meine Unterlagen ──────────────────────────────────────── */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-blue-800 text-sm flex items-center gap-2">
                  <DocumentTextIcon className="w-4 h-4" />
                  Meine Unterlagen
                </h3>
                <Link
                  href="/documents"
                  target="_blank"
                  className="text-xs text-blue-600 hover:underline font-medium"
                >
                  Alle verwalten →
                </Link>
              </div>

              {/* Hochgeladene Dokumente */}
              {documents.length === 0 ? (
                <p className="text-xs text-blue-600 mb-3">
                  Noch keine Dokumente hochgeladen. Der Agent nutzt deine Unterlagen für bessere Treffer.
                </p>
              ) : (
                <ul className="space-y-1.5 mb-3">
                  {documents.map((doc) => (
                    <li key={doc.id} className="flex items-center gap-2 text-xs bg-white border border-blue-100 rounded-lg px-2 py-1.5">
                      <span className={`shrink-0 px-1.5 py-0.5 rounded text-white font-bold text-[10px] ${
                        doc.type === "CV" ? "bg-blue-600"
                        : doc.type === "COVER_LETTER" ? "bg-indigo-500"
                        : doc.type === "CERTIFICATE" ? "bg-green-600"
                        : doc.type === "PORTFOLIO" ? "bg-purple-600"
                        : "bg-gray-400"
                      }`}>
                        {doc.type === "CV" ? "CV"
                         : doc.type === "COVER_LETTER" ? "ABS"
                         : doc.type === "CERTIFICATE" ? "ZERT"
                         : doc.type === "PORTFOLIO" ? "PORT"
                         : "DOK"}
                      </span>
                      <span className="flex-1 truncate text-gray-700">{doc.name}</span>
                      <button
                        onClick={() => handleDocDelete(doc.id)}
                        className="text-red-400 hover:text-red-600 shrink-0"
                        title="Löschen"
                      >
                        <TrashIcon className="w-3.5 h-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {/* Upload */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                className="hidden"
                onChange={handleDocUpload}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingDoc}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-60"
              >
                <ArrowUpTrayIcon className="w-3.5 h-3.5" />
                {uploadingDoc ? "Wird hochgeladen…" : "Lebenslauf / Zertifikat hochladen"}
              </button>
              {uploadError && (
                <p className="text-xs text-red-600 mt-1.5">{uploadError}</p>
              )}
              <p className="text-[10px] text-blue-500 mt-2">
                PDF, DOC, DOCX, Bild · Der Agent analysiert deine Unterlagen automatisch bei der nächsten Suche.
              </p>
            </div>

            {/* Profil-Analyse */}
            {profileAnalysis && (
              <div className="bg-violet-50 border border-violet-200 rounded-xl p-4">
                <h3 className="font-semibold text-violet-800 text-sm flex items-center gap-2 mb-3">
                  <SparklesIcon className="w-4 h-4" />
                  Profil-Analyse
                </h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-500 text-xs">Level erkannt:</span>
                    <p className="font-medium text-gray-800">{profileAnalysis.experienceLevel}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 text-xs">Erkannte Skills:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {profileAnalysis.detectedSkills.slice(0, 8).map((s) => (
                        <span key={s} className="text-xs px-1.5 py-0.5 bg-violet-100 text-violet-700 rounded font-medium">{s}</span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500 text-xs">Stärken:</span>
                    <ul className="mt-1 space-y-0.5">
                      {profileAnalysis.strongAreas.map((a) => (
                        <li key={a} className="text-xs text-gray-700 flex items-center gap-1">
                          <CheckCircleSolid className="w-3 h-3 text-green-500 shrink-0" />{a}
                        </li>
                      ))}
                    </ul>
                  </div>
                  {profileAnalysis.suggestions.length > 0 && (
                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-2">
                      <p className="text-xs font-semibold text-blue-700 mb-1 flex items-center gap-1">
                        <InformationCircleIcon className="w-3.5 h-3.5" /> Empfehlungen
                      </p>
                      {profileAnalysis.suggestions.slice(0, 2).map((s, i) => (
                        <p key={i} className="text-xs text-blue-600">· {s}</p>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-gray-400">
                    {profileAnalysis.documentCount} Dok. · {profileAnalysis.applicationCount} Bewerbungen analysiert
                  </p>
                </div>
              </div>
            )}

            {/* Sucheinstellungen */}
            <div>
              <h3 className="font-semibold text-gray-800 text-sm mb-3 flex items-center gap-2">
                <MagnifyingGlassIcon className="w-4 h-4 text-blue-500" />
                Sucheinstellungen
              </h3>

              <div className="space-y-4">
                {/* Standort */}
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1.5">
                    Standort / Region
                  </label>
                  <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                    <MapPinIcon className="w-4 h-4 text-gray-400 shrink-0" />
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="z.B. München, Berlin, Remote..."
                      className="flex-1 bg-transparent text-sm outline-none text-gray-800 placeholder-gray-400"
                    />
                  </div>
                </div>

                {/* Länder */}
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1.5">
                    Länder
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {["Deutschland", "Österreich", "Schweiz"].map((country) => (
                      <button
                        key={country}
                        onClick={() => toggleCountry(country)}
                        className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border font-medium transition-all ${
                          searchCountries.includes(country)
                            ? "bg-blue-600 text-white border-blue-600"
                            : "bg-white text-gray-600 border-gray-200 hover:border-blue-300"
                        }`}
                      >
                        <GlobeAltIcon className="w-3 h-3" />
                        {country}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Arbeitsmodell */}
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1.5">
                    Arbeitsmodell
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {(Object.keys(WORK_TYPE_LABELS) as WorkType[]).map((wt) => (
                      <button
                        key={wt}
                        onClick={() => setWorkType(wt)}
                        className={`text-xs py-2 px-2 rounded-lg border font-medium transition-all ${
                          workType === wt
                            ? "bg-blue-600 text-white border-blue-600"
                            : "bg-white text-gray-600 border-gray-200 hover:border-blue-300"
                        }`}
                      >
                        {WORK_TYPE_LABELS[wt]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Gehalt */}
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1.5">
                    Gehaltsrahmen (€/Jahr)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-xs text-gray-400 mb-1 block">Minimum</span>
                      <input
                        type="number"
                        value={salaryMin}
                        onChange={(e) => setSalaryMin(Number(e.target.value))}
                        step={5000}
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400"
                      />
                    </div>
                    <div>
                      <span className="text-xs text-gray-400 mb-1 block">Maximum</span>
                      <input
                        type="number"
                        value={salaryMax}
                        onChange={(e) => setSalaryMax(Number(e.target.value))}
                        step={5000}
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400"
                      />
                    </div>
                  </div>
                </div>

                {/* Level */}
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1.5">
                    Erfahrungslevel
                  </label>
                  <select
                    value={jobLevel}
                    onChange={(e) => setJobLevel(e.target.value as JobLevel)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400"
                  >
                    {(Object.entries(LEVEL_LABELS) as [JobLevel, string][]).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>

                {/* Job-Typen */}
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1.5">
                    Bereiche (mehrere möglich)
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {JOB_TYPE_OPTIONS.map((jt) => (
                      <button
                        key={jt}
                        onClick={() =>
                          setSelectedJobTypes((prev) =>
                            prev.includes(jt) ? prev.filter((x) => x !== jt) : [...prev, jt]
                          )
                        }
                        className={`text-xs px-2.5 py-1 rounded-full border font-medium transition-all ${
                          selectedJobTypes.includes(jt)
                            ? "bg-violet-600 text-white border-violet-600"
                            : "bg-white text-gray-600 border-gray-200 hover:border-violet-300"
                        }`}
                      >
                        {jt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tech-Stack */}
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1.5">
                    Mein Tech-Stack
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={techStackInput}
                      onChange={(e) => setTechStackInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTechTag(); } }}
                      placeholder="z.B. React, Node.js..."
                      className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400"
                    />
                    <button
                      onClick={addTechTag}
                      className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-semibold"
                    >
                      +
                    </button>
                  </div>
                  {techStack.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {techStack.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full"
                        >
                          {tag}
                          <button
                            onClick={() => setTechStack((prev) => prev.filter((t) => t !== tag))}
                            className="text-blue-400 hover:text-blue-700 leading-none"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Start-Button */}
            <button
              onClick={startSearch}
              disabled={searching}
              className="w-full py-3 bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md disabled:opacity-60 disabled:cursor-wait"
            >
              {searching ? (
                <>
                  <ArrowPathIcon className="w-5 h-5 animate-spin" />
                  Agent sucht im Internet...
                </>
              ) : (
                <>
                  <MagnifyingGlassIcon className="w-5 h-5" />
                  {jobs.length > 0 ? "Erneut suchen" : "🚀 Agent starten"}
                </>
              )}
            </button>

            {error && (
              <div className="flex items-start gap-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
                <ExclamationTriangleIcon className="w-4 h-4 shrink-0 mt-0.5" />
                {error}
              </div>
            )}

            {/* Hinweis */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
              <p className="text-xs text-blue-700 leading-relaxed">
                <strong>💡 So funktioniert es:</strong> Der KI-Agent analysiert dein Profil, deine hochgeladenen Dokumente (Lebenslauf, Zertifikate) und deine bisherigen Bewerbungen — und findet darauf basierend passende Stellen im DACH-Raum. Mit einem Klick auf „Bewerben" wird die Stelle direkt als Bewerbung in deiner Liste angelegt.
              </p>
            </div>
          </div>

          {/* ── Rechte Spalte: Ergebnisse ──────────────────────────────── */}
          <div className="flex-1 overflow-y-auto p-4">

            {/* Ergebnis-Header */}
            {jobs.length > 0 && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-3 flex-wrap">
                  <h3 className="font-bold text-gray-900 text-base">
                    {jobs.length} Stellen gefunden
                  </h3>
                  {highMatches > 0 && (
                    <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full font-medium flex items-center gap-1">
                      <StarSolid className="w-3 h-3" />
                      {highMatches} Top-Match{highMatches !== 1 ? "es" : ""}
                    </span>
                  )}
                  {addedIds.size > 0 && (
                    <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">
                      {addedIds.size} angelegt
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">Sortieren:</span>
                  <select
                    value={sortKey}
                    onChange={(e) => setSortKey(e.target.value as SortKey)}
                    className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white outline-none"
                  >
                    <option value="matchScore">Match-Score</option>
                    <option value="salaryMax">Gehalt (hoch)</option>
                    <option value="postedDaysAgo">Neueste zuerst</option>
                  </select>
                </div>
              </div>
            )}

            {/* Ergebnis-Liste */}
            {jobs.length === 0 && !searching && (
              <div className="h-full flex flex-col items-center justify-center text-center py-16 px-8">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-100 to-blue-100 flex items-center justify-center mb-6">
                  <CpuChipIcon className="w-10 h-10 text-violet-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Agent bereit</h3>
                <p className="text-gray-500 text-sm max-w-md leading-relaxed">
                  Konfiguriere deine Suchpräferenzen links und starte den KI-Agenten. Er analysiert dein Profil und sucht im gesamten DACH-Raum nach passenden IT-Stellen für dich.
                </p>
                <div className="mt-6 grid grid-cols-3 gap-4 text-center w-full max-w-sm">
                  {[
                    { icon: "🎯", label: "Profil-Analyse", sub: "Skills & Erfahrung" },
                    { icon: "🌐", label: "Internet-Suche", sub: "DACH-Unternehmen" },
                    { icon: "📊", label: "Match-Score", sub: "Passgenaue Vorschläge" },
                  ].map((item) => (
                    <div key={item.label} className="bg-white rounded-xl border border-gray-100 p-3">
                      <p className="text-2xl mb-1">{item.icon}</p>
                      <p className="text-xs font-semibold text-gray-700">{item.label}</p>
                      <p className="text-xs text-gray-400">{item.sub}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {searching && (
              <div className="h-full flex flex-col items-center justify-center text-center py-16">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center mb-4 animate-pulse">
                  <MagnifyingGlassIcon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Agent sucht...</h3>
                <div className="space-y-1 text-sm text-gray-500">
                  <p>🔍 Analysiere dein Benutzerprofil...</p>
                  <p>📄 Lese hochgeladene Dokumente...</p>
                  <p>🌐 Durchsuche IT-Stellenmärkte im DACH-Raum...</p>
                  <p>🎯 Berechne Match-Scores...</p>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {sortedJobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  addedIds={addedIds}
                  onAdd={handleAddApplication}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
