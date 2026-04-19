"use client";

import { useState, useEffect } from "react";
import {
  MagnifyingGlassIcon,
  BookmarkIcon,
  EyeIcon,
  XMarkIcon,
  ArrowTopRightOnSquareIcon,
  ClockIcon,
  ScaleIcon,
  CheckCircleIcon,
  PlusCircleIcon,
  CurrencyEuroIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import {
  BookmarkIcon as BookmarkSolidIcon,
  CheckCircleIcon as CheckCircleSolidIcon,
} from "@heroicons/react/24/solid";

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  portal: string;
  url: string;
  description: string;
  salary: string;
  type: string;
  postedDate: string;
  requirements: string[];
}

interface Portal {
  id: string;
  name: string;
  color: string;
  url: string;
  hasApi: boolean;
  searchUrl?: string;
}

interface SearchHistoryEntry {
  keyword: string;
  location: string;
  portal: string;
  timestamp: number;
}

interface ApplicationRef {
  id: string;
  companyName: string;
  position: string;
}

interface JobPortalIntegrationProps {
  className?: string;
}

// Utility: parse salary string to number
function parseSalary(s: string): number | null {
  if (!s) return null;
  const n = parseFloat(s.replace(/[^\d,.]/g, "").replace(",", "."));
  return isNaN(n) ? null : n;
}

// Utility: skill match score (0-100)
function calcMatchScore(requirements: string[], skills: string[]): number | null {
  if (!skills.length || !requirements.length) return null;
  const sl = skills.map((s) => s.toLowerCase().trim());
  const matched = requirements.filter((req) =>
    sl.some((skill) => req.toLowerCase().includes(skill) || skill.includes(req.toLowerCase().split(" ")[0]))
  ).length;
  return Math.round((matched / requirements.length) * 100);
}

export default function JobPortalIntegration({
  className = "",
}: JobPortalIntegrationProps) {
  const portals: Portal[] = [
    { id: "all", name: "Alle Portale", color: "bg-gray-700", url: "#", hasApi: true },
    { id: "stepstone", name: "StepStone", color: "bg-red-500", url: "https://www.stepstone.de/", hasApi: true },
    { id: "xing", name: "Xing Jobs", color: "bg-green-600", url: "https://www.xing.com/jobs", hasApi: true },
    { id: "linkedin", name: "LinkedIn", color: "bg-blue-600", url: "https://www.linkedin.com/jobs/", hasApi: true },
    { id: "indeed", name: "Indeed", color: "bg-blue-800", url: "https://de.indeed.com/", hasApi: true },
    {
      id: "germantechjobs",
      name: "GermanTechJobs",
      color: "bg-violet-600",
      url: "https://germantechjobs.de/",
      hasApi: false,
      searchUrl: "https://germantechjobs.de/jobs?search={keyword}&location={location}",
    },
    {
      id: "getinit",
      name: "Get in IT",
      color: "bg-orange-500",
      url: "https://www.get-in-it.de/",
      hasApi: false,
      searchUrl: "https://www.get-in-it.de/jobs?q={keyword}&city={location}",
    },
  ];

  // Core state
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPortal, setSelectedPortal] = useState("stepstone");
  const [keyword, setKeyword] = useState("");
  const [location, setLocation] = useState("");
  const [savedJobs, setSavedJobs] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  // Search History
  const [searchHistory, setSearchHistory] = useState<SearchHistoryEntry[]>([]);

  // Already applied sync
  const [existingApplications, setExistingApplications] = useState<ApplicationRef[]>([]);

  // 1-Klick Application
  const [creatingApplicationFor, setCreatingApplicationFor] = useState<string | null>(null);
  const [applicationSuccess, setApplicationSuccess] = useState<Set<string>>(new Set());

  // Compare mode
  const [compareList, setCompareList] = useState<Job[]>([]);
  const [showCompareModal, setShowCompareModal] = useState(false);

  // Skill Match
  const [userSkills, setUserSkills] = useState<string[]>([]);
  const [skillsInput, setSkillsInput] = useState("");
  const [showSkillsPanel, setShowSkillsPanel] = useState(false);

  // Load from localStorage + fetch existing applications
  useEffect(() => {
    const history = localStorage.getItem("job-search-history");
    if (history) setSearchHistory(JSON.parse(history));
    const skills = localStorage.getItem("user-skills");
    if (skills) {
      const parsed = JSON.parse(skills) as string[];
      setUserSkills(parsed);
      setSkillsInput(parsed.join(", "));
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/applications", { signal: controller.signal })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.applications)) {
          setExistingApplications(
            data.applications.map((a: { id: string; companyName: string; position: string }) => ({
              id: a.id,
              companyName: a.companyName,
              position: a.position,
            }))
          );
        }
      })
      .catch((err) => { if (err instanceof Error && err.name === "AbortError") return; });
    return () => controller.abort();
  }, []);

  const addToHistory = (k: string, l: string, p: string) => {
    const entry: SearchHistoryEntry = { keyword: k, location: l, portal: p, timestamp: Date.now() };
    const updated = [entry, ...searchHistory.filter((h) => h.keyword !== k || h.location !== l)].slice(0, 5);
    setSearchHistory(updated);
    localStorage.setItem("job-search-history", JSON.stringify(updated));
  };

  const saveSkills = () => {
    const skills = skillsInput.split(",").map((s) => s.trim()).filter(Boolean);
    setUserSkills(skills);
    localStorage.setItem("user-skills", JSON.stringify(skills));
    setShowSkillsPanel(false);
  };

  const findExistingApplication = (job: Job): ApplicationRef | undefined =>
    existingApplications.find(
      (a) =>
        a.companyName.toLowerCase().includes(job.company?.toLowerCase() ?? "") ||
        (job.company?.toLowerCase() ?? "").includes(a.companyName.toLowerCase())
    );

  const searchSinglePortal = async (portalId: string): Promise<Job[]> => {
    const params = new URLSearchParams({
      portal: portalId,
      keyword: keyword.trim(),
      location: location.trim(),
      limit: "20",
    });
    const response = await fetch(`/api/job-portals?${params}`);
    const data = await response.json();
    if (!response.ok || !data.success) throw new Error(data?.error ?? "API Error");
    return (
      Array.isArray(data.jobs)
        ? data.jobs
        : Array.isArray(data.raw?.jobs)
        ? data.raw.jobs
        : Array.isArray(data.raw?.results)
        ? data.raw.results
        : []
    ) as Job[];
  };

  const searchJobs = async () => {
    if (!keyword.trim()) return;
    setLoading(true);
    setError(null);
    setJobs([]);

    const portal = portals.find((p) => p.id === selectedPortal);

    // Portals without API: open search URL directly in new tab
    if (portal && !portal.hasApi && portal.searchUrl) {
      const url = portal.searchUrl
        .replace("{keyword}", encodeURIComponent(keyword.trim()))
        .replace("{location}", encodeURIComponent(location.trim()));
      window.open(url, "_blank", "noopener,noreferrer");
      setLoading(false);
      return;
    }

    try {
      addToHistory(keyword, location, selectedPortal);

      if (selectedPortal === "all") {
        const apiPortals = portals.filter((p) => p.hasApi && p.id !== "all");
        const results = await Promise.allSettled(apiPortals.map((p) => searchSinglePortal(p.id)));
        const merged: Job[] = [];
        const seenKeys = new Set<string>();
        results.forEach((r) => {
          if (r.status === "fulfilled") {
            r.value.forEach((job) => {
              const key = `${(job.company ?? "").toLowerCase()}-${(job.title ?? "").toLowerCase()}`;
              if (!seenKeys.has(key)) {
                seenKeys.add(key);
                merged.push(job);
              }
            });
          }
        });
        if (!merged.length) setError("Keine Jobs von den API-Portalen erhalten.");
        setJobs(merged);
      } else {
        const results = await searchSinglePortal(selectedPortal);
        if (!results.length) setError("Keine Jobs von der API erhalten (API-Token prüfen).");
        setJobs(results);
      }
    } catch (err) {
      setError((err as Error).message ?? "Fehler bei der Jobsuche.");
    } finally {
      setLoading(false);
    }
  };

  const saveJob = async (job: Job) => {
    try {
      const response = await fetch("/api/job-portals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId: job.id, portal: job.portal, action: "save" }),
      });
      if (response.ok) setSavedJobs((prev) => new Set([...prev, job.id]));
    } catch {}
  };

  const createApplication = async (job: Job) => {
    setCreatingApplicationFor(job.id);
    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: job.company ?? "",
          position: job.title ?? "",
          location: job.location || "Remote",
          country: "Deutschland",
          status: "APPLIED",
          jobType: "FULLTIME",
          priority: "MEDIUM",
          salary: job.salary ?? "",
          jobUrl: job.url ?? "",
          requirements: (job.requirements ?? []).join(", "),
        }),
      });
      if (res.ok) {
        setApplicationSuccess((prev) => new Set([...prev, job.id]));
        const data = await res.json();
        if (data.application) {
          setExistingApplications((prev) => [
            ...prev,
            { id: data.application.id, companyName: data.application.companyName, position: data.application.position },
          ]);
        }
      }
    } catch {}
    setCreatingApplicationFor(null);
  };

  const toggleCompare = (job: Job) => {
    setCompareList((prev) => {
      if (prev.find((j) => j.id === job.id)) return prev.filter((j) => j.id !== job.id);
      if (prev.length >= 3) return prev;
      return [...prev, job];
    });
  };

  // Salary insights from current results
  const salaryInsights = (() => {
    const nums = jobs.map((j) => parseSalary(j.salary)).filter((n): n is number => n !== null);
    if (nums.length < 2) return null;
    const sorted = [...nums].sort((a, b) => a - b);
    return {
      min: sorted[0],
      max: sorted[sorted.length - 1],
      avg: Math.round(nums.reduce((a, b) => a + b, 0) / nums.length),
    };
  })();

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const diffDays = Math.floor((Date.now() - date.getTime()) / 86400000);
    if (diffDays === 0) return "Heute";
    if (diffDays === 1) return "Gestern";
    if (diffDays < 7) return `vor ${diffDays} Tagen`;
    return date.toLocaleDateString("de-DE");
  };

  const selectedPortalObj = portals.find((p) => p.id === selectedPortal);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Job-Portal Integration</h1>
          <p className="mt-2 text-gray-600">
            Durchsuchen Sie verschiedene Job-Portale nach neuen Möglichkeiten
          </p>
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </div>
        <button
          onClick={() => setShowSkillsPanel(!showSkillsPanel)}
          className="flex items-center gap-2 px-3 py-2 text-sm bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-md border border-purple-200 transition-colors"
          title="Meine Skills für Skill-Match einstellen"
        >
          <SparklesIcon className="w-4 h-4" />
          {userSkills.length > 0 ? `${userSkills.length} Skills aktiv` : "Skills einstellen"}
        </button>
      </div>

      {/* Skills Panel */}
      {showSkillsPanel && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <h3 className="font-medium text-purple-800 mb-1 flex items-center gap-2">
            <SparklesIcon className="w-4 h-4" /> Meine Skills (für Skill-Match-Score)
          </h3>
          <p className="text-xs text-purple-600 mb-3">
            Komma-getrennt, z.B.: React, TypeScript, Node.js, AWS
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={skillsInput}
              onChange={(e) => setSkillsInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && saveSkills()}
              placeholder="React, TypeScript, Python, ..."
              className="flex-1 px-3 py-2 border border-purple-300 rounded-md text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
            />
            <button
              onClick={saveSkills}
              className="px-4 py-2 bg-purple-600 text-white rounded-md text-sm hover:bg-purple-700 transition-colors"
            >
              Speichern
            </button>
          </div>
          {userSkills.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {userSkills.map((s, i) => (
                <span key={i} className="px-2 py-0.5 bg-purple-200 text-purple-800 text-xs rounded-full">
                  {s}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Search Form */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="space-y-4">
          {/* Portal Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Job Portal</label>
            <div className="flex flex-wrap gap-2">
              {portals.map((portal) => (
                <div
                  key={portal.id}
                  className={`flex rounded-md overflow-hidden border ${
                    selectedPortal === portal.id ? "border-transparent ring-2 ring-offset-1 ring-blue-400" : "border-gray-300"
                  }`}
                >
                  <button
                    onClick={() => setSelectedPortal(portal.id)}
                    className={`px-4 py-2 text-sm font-medium transition-colors ${
                      selectedPortal === portal.id
                        ? `${portal.color} text-white`
                        : "bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {portal.name}
                    {!portal.hasApi && (
                      <span className="ml-1 text-xs opacity-70">↗</span>
                    )}
                  </button>
                  {portal.id !== "all" && (
                    <a
                      href={portal.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={`${portal.name} direkt öffnen`}
                      className={`flex items-center px-2 border-l transition-colors ${
                        selectedPortal === portal.id
                          ? `${portal.color} text-white border-white/30 hover:brightness-110`
                          : "bg-white text-gray-400 border-gray-300 hover:text-blue-600 hover:bg-gray-50"
                      }`}
                    >
                      <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              ))}
            </div>
            {selectedPortalObj && !selectedPortalObj.hasApi && (
              <p className="mt-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-md">
                ⚡ Dieses Portal hat keine direkte API — &quot;Suchen&quot; öffnet das Portal mit deinen Begriffen in einem neuen Tab.
              </p>
            )}
          </div>

          {/* Search History */}
          {searchHistory.length > 0 && (
            <div>
              <div className="flex items-center gap-1 text-xs font-medium text-gray-500 mb-1.5">
                <ClockIcon className="w-3.5 h-3.5" />
                <span>Letzte Suchen</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {searchHistory.map((h, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setKeyword(h.keyword);
                      setLocation(h.location);
                      setSelectedPortal(h.portal);
                    }}
                    className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs rounded-full transition-colors"
                  >
                    {h.keyword}
                    {h.location ? ` • ${h.location}` : ""}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Search Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Suchbegriff *
              </label>
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="z.B. Frontend Developer"
                className="w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                onKeyDown={(e) => e.key === "Enter" && searchJobs()}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ort</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="z.B. Berlin"
                className="w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                onKeyDown={(e) => e.key === "Enter" && searchJobs()}
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={searchJobs}
                disabled={!keyword.trim() || loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md font-medium flex items-center justify-center transition-colors"
              >
                <MagnifyingGlassIcon className="h-5 w-5 mr-2" />
                {loading
                  ? "Suche..."
                  : selectedPortal === "all"
                  ? "Alle durchsuchen"
                  : "Suchen"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Gehalts-Radar */}
      {salaryInsights && (
        <div className="bg-green-50 border border-green-200 rounded-lg px-5 py-4">
          <h3 className="text-sm font-medium text-green-800 flex items-center gap-2 mb-3">
            <CurrencyEuroIcon className="w-4 h-4" />
            Gehalts-Radar für &quot;{keyword}&quot;
          </h3>
          <div className="flex items-center gap-5 text-sm flex-wrap">
            <div className="text-center">
              <div className="text-xs text-green-600">Minimum</div>
              <div className="font-bold text-green-800 text-lg">
                {salaryInsights.min.toLocaleString("de-DE")} €
              </div>
            </div>
            <div className="flex-1 min-w-[120px] relative">
              <div className="h-3 bg-green-200 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-green-300 to-green-600 rounded-full opacity-70" />
              </div>
              <div
                className="absolute top-0 h-3 w-1 bg-green-800 rounded-full"
                style={{
                  left: `${Math.max(
                    0,
                    ((salaryInsights.avg - salaryInsights.min) /
                      Math.max(salaryInsights.max - salaryInsights.min, 1)) *
                      100
                  )}%`,
                }}
              />
            </div>
            <div className="text-center">
              <div className="text-xs text-green-600">Ø Durchschnitt</div>
              <div className="font-bold text-green-800 text-lg">
                {salaryInsights.avg.toLocaleString("de-DE")} €
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-green-600">Maximum</div>
              <div className="font-bold text-green-800 text-lg">
                {salaryInsights.max.toLocaleString("de-DE")} €
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Compare Bar */}
      {compareList.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg px-5 py-3 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <ScaleIcon className="w-5 h-5 text-blue-600 shrink-0" />
            <span className="text-sm text-blue-700 font-medium">
              {compareList.length} Job{compareList.length > 1 ? "s" : ""} zum Vergleich
            </span>
            {compareList.map((j) => (
              <span
                key={j.id}
                className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full"
              >
                {j.company}
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowCompareModal(true)}
              disabled={compareList.length < 2}
              className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              Vergleichen
            </button>
            <button
              onClick={() => setCompareList([])}
              className="px-3 py-1.5 text-blue-600 hover:bg-blue-100 text-sm rounded-md transition-colors"
            >
              Leeren
            </button>
          </div>
        </div>
      )}

      {/* Results */}
      {jobs.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between flex-wrap gap-2">
            <h2 className="text-lg font-semibold text-gray-900">{jobs.length} Jobs gefunden</h2>
            <span className="text-xs text-gray-400">Bis zu 3 Jobs zum Vergleich auswählen</span>
          </div>

          <div className="divide-y divide-gray-200">
            {jobs.map((job) => {
              const existingApp = findExistingApplication(job);
              const matchScore = calcMatchScore(job.requirements ?? [], userSkills);
              const inCompare = compareList.some((j) => j.id === job.id);
              const alreadyCreated = applicationSuccess.has(job.id);

              return (
                <div
                  key={job.id}
                  className={`p-6 transition-colors ${
                    inCompare ? "bg-blue-50" : "hover:bg-gray-50"
                  }`}
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center flex-wrap gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{job.title}</h3>
                        <span
                          className={`px-2 py-0.5 text-xs font-medium rounded-full text-white ${
                            portals.find((p) => p.id === (job.portal ?? "").toLowerCase())
                              ?.color ?? "bg-gray-500"
                          }`}
                        >
                          {job.portal}
                        </span>
                        {existingApp && (
                          <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-700 flex items-center gap-1">
                            <CheckCircleIcon className="w-3 h-3" /> Bereits beworben
                          </span>
                        )}
                        {matchScore !== null && (
                          <span
                            className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                              matchScore >= 70
                                ? "bg-emerald-100 text-emerald-700"
                                : matchScore >= 40
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-red-100 text-red-600"
                            }`}
                          >
                            ✦ {matchScore}% Match
                          </span>
                        )}
                      </div>

                      <div className="text-gray-600 mb-2">
                        <span className="font-medium">{job.company}</span>
                        {job.location ? ` • ${job.location}` : ""}
                      </div>

                      <p className="text-gray-700 mb-3 line-clamp-2">{job.description}</p>

                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                        {job.salary && <span>{job.salary}</span>}
                        {job.type && <span>{job.type}</span>}
                        {job.postedDate && <span>{formatDate(job.postedDate)}</span>}
                      </div>

                      {(job.requirements?.length ?? 0) > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {job.requirements.slice(0, 6).map((req, i) => (
                            <span
                              key={i}
                              className={`px-2 py-0.5 text-xs rounded-md ${
                                userSkills.some((s) =>
                                  req.toLowerCase().includes(s.toLowerCase())
                                )
                                  ? "bg-emerald-100 text-emerald-700 font-medium"
                                  : "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {req}
                            </span>
                          ))}
                          {job.requirements.length > 6 && (
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-400 text-xs rounded-md">
                              +{job.requirements.length - 6} mehr
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-col gap-1.5 shrink-0">
                      {/* Compare toggle */}
                      <button
                        onClick={() => toggleCompare(job)}
                        className={`p-2 rounded-md transition-colors ${
                          inCompare
                            ? "text-blue-600 bg-blue-100"
                            : "text-gray-400 hover:text-blue-600 hover:bg-gray-100"
                        }`}
                        title={inCompare ? "Aus Vergleich entfernen" : "Zum Vergleich hinzufügen"}
                      >
                        <ScaleIcon className="h-5 w-5" />
                      </button>

                      {/* Save Job */}
                      <button
                        onClick={() => saveJob(job)}
                        className={`p-2 rounded-md transition-colors ${
                          savedJobs.has(job.id)
                            ? "text-yellow-600 bg-yellow-50"
                            : "text-gray-400 hover:text-yellow-600 hover:bg-gray-100"
                        }`}
                        title="Job speichern"
                      >
                        {savedJobs.has(job.id) ? (
                          <BookmarkSolidIcon className="h-5 w-5" />
                        ) : (
                          <BookmarkIcon className="h-5 w-5" />
                        )}
                      </button>

                      {/* External link */}
                      <a
                        href={job.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
                        title="Job anzeigen"
                      >
                        <EyeIcon className="h-5 w-5" />
                      </a>

                      {/* 1-Klick Bewerbung */}
                      {!existingApp && !alreadyCreated && (
                        <button
                          onClick={() => createApplication(job)}
                          disabled={creatingApplicationFor === job.id}
                          className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-md transition-colors disabled:opacity-40"
                          title="Bewerbung direkt anlegen"
                        >
                          <PlusCircleIcon className="h-5 w-5" />
                        </button>
                      )}
                      {alreadyCreated && (
                        <span className="p-2 text-green-600" title="Bewerbung wurde angelegt!">
                          <CheckCircleSolidIcon className="h-5 w-5" />
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && jobs.length === 0 && keyword && selectedPortalObj?.hasApi && (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <MagnifyingGlassIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Keine Jobs gefunden</h3>
          <p className="text-gray-500">
            Versuchen Sie andere Suchbegriffe oder erweitern Sie Ihren Suchbereich.
          </p>
        </div>
      )}

      {/* Compare Modal */}
      {showCompareModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl my-8">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <ScaleIcon className="w-6 h-6 text-blue-600" /> Job-Vergleich
              </h2>
              <button
                onClick={() => setShowCompareModal(false)}
                className="p-2 hover:bg-gray-100 rounded-md transition-colors"
              >
                <XMarkIcon className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="text-left text-gray-400 font-medium pb-4 pr-4 w-28">
                      Kriterium
                    </th>
                    {compareList.map((job) => (
                      <th key={job.id} className="text-left pb-4 px-4 min-w-[180px]">
                        <div className="font-bold text-gray-900">{job.title}</div>
                        <div className="text-gray-500 font-normal text-xs mt-0.5">
                          {job.company}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(
                    [
                      { label: "Ort", key: "location" },
                      { label: "Gehalt", key: "salary" },
                      { label: "Typ", key: "type" },
                      { label: "Portal", key: "portal" },
                      { label: "Gepostet", key: "postedDate" },
                    ] as { label: string; key: keyof Job }[]
                  ).map(({ label, key }) => (
                    <tr key={label}>
                      <td className="py-3 pr-4 text-gray-400 font-medium">{label}</td>
                      {compareList.map((job) => (
                        <td key={job.id} className="py-3 px-4 text-gray-900">
                          {key === "postedDate"
                            ? formatDate(job[key] as string)
                            : (job[key] as string) || "—"}
                        </td>
                      ))}
                    </tr>
                  ))}
                  <tr>
                    <td className="py-3 pr-4 text-gray-400 font-medium">Skill-Match</td>
                    {compareList.map((job) => {
                      const score = calcMatchScore(job.requirements ?? [], userSkills);
                      return (
                        <td key={job.id} className="py-3 px-4">
                          {score !== null ? (
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    score >= 70
                                      ? "bg-emerald-500"
                                      : score >= 40
                                      ? "bg-yellow-400"
                                      : "bg-red-400"
                                  }`}
                                  style={{ width: `${score}%` }}
                                />
                              </div>
                              <span className="font-semibold text-xs">{score}%</span>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-xs">Skills einstellen →</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                  <tr>
                    <td className="py-3 pr-4 text-gray-400 font-medium align-top">Skills</td>
                    {compareList.map((job) => (
                      <td key={job.id} className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {(job.requirements ?? []).slice(0, 8).map((r, i) => (
                            <span
                              key={i}
                              className={`px-1.5 py-0.5 text-xs rounded ${
                                userSkills.some((s) =>
                                  r.toLowerCase().includes(s.toLowerCase())
                                )
                                  ? "bg-emerald-100 text-emerald-700 font-medium"
                                  : "bg-gray-100 text-gray-600"
                              }`}
                            >
                              {r}
                            </span>
                          ))}
                        </div>
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-4 pr-4" />
                    {compareList.map((job) => (
                      <td key={job.id} className="py-4 px-4">
                        <div className="flex gap-2 flex-wrap">
                          <a
                            href={job.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 transition-colors flex items-center gap-1"
                          >
                            <EyeIcon className="w-3.5 h-3.5" /> Öffnen
                          </a>
                          {!applicationSuccess.has(job.id) && !findExistingApplication(job) && (
                            <button
                              onClick={() => {
                                createApplication(job);
                                setShowCompareModal(false);
                              }}
                              className="px-3 py-1.5 bg-green-600 text-white text-xs rounded-md hover:bg-green-700 transition-colors flex items-center gap-1"
                            >
                              <PlusCircleIcon className="w-3.5 h-3.5" /> Bewerben
                            </button>
                          )}
                        </div>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
