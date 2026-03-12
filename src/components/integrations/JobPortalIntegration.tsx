"use client";

import { useState, useEffect } from "react";
import {
  MagnifyingGlassIcon,
  BookmarkIcon,
  EyeIcon,
  XMarkIcon,
  ArrowTopRightOnSquareIcon,
} from "@heroicons/react/24/outline";
import { BookmarkIcon as BookmarkSolidIcon } from "@heroicons/react/24/solid";

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

interface JobPortalIntegrationProps {
  className?: string;
}

export default function JobPortalIntegration({
  className = "",
}: JobPortalIntegrationProps) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPortal, setSelectedPortal] = useState("stepstone");
  const [keyword, setKeyword] = useState("");
  const [location, setLocation] = useState("");
  const [savedJobs, setSavedJobs] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const portals = [
    { id: "stepstone", name: "StepStone", color: "bg-red-500", url: "https://www.stepstone.de/" },
    { id: "xing", name: "Xing Jobs", color: "bg-green-600", url: "https://www.xing.com/jobs" },
    { id: "linkedin", name: "LinkedIn", color: "bg-blue-600", url: "https://www.linkedin.com/jobs/" },
    { id: "indeed", name: "Indeed", color: "bg-blue-800", url: "https://de.indeed.com/" },
    { id: "germantechjobs", name: "GermanTechJobs", color: "bg-violet-600", url: "https://germantechjobs.de/" },
    { id: "getinit", name: "Get in IT", color: "bg-orange-500", url: "https://www.get-in-it.de/" },
  ];

  const searchJobs = async () => {
    if (!keyword.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        portal: selectedPortal,
        keyword: keyword.trim(),
        location: location.trim(),
        limit: "20",
      });

      const response = await fetch(`/api/job-portals?${params}`);
      const data = await response.json();

      if (response.ok && data.success) {
        // Expect data.raw.jobs style responses differ per portal; fall back to top-level list if provided
        const extracted = Array.isArray(data.jobs)
          ? data.jobs
          : Array.isArray(data.raw?.jobs)
          ? data.raw.jobs
          : Array.isArray(data.raw?.results)
          ? data.raw.results
          : [];

        if (!extracted.length) {
          setError("Keine Jobs von der API erhalten (prüfe API-Response-Format).");
          setJobs([]);
        } else {
          setJobs(extracted as Job[]);
        }
      } else {
        const message = data?.error || "API-Fehler bei der Jobsuche";
        setError(message);
        setJobs([]);
      }
    } catch (error) {
      console.error("Error fetching jobs:", error);
      setError("Netzwerk- oder API-Fehler bei der Jobsuche.");
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  const saveJob = async (job: Job) => {
    try {
      const response = await fetch("/api/job-portals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId: job.id,
          portal: job.portal,
          action: "save",
        }),
      });

      if (response.ok) {
        setSavedJobs((prev) => new Set([...prev, job.id]));
      } else {
        const data = await response.json().catch(() => null);
        setError(data?.error || "Job konnte nicht gespeichert werden.");
      }
    } catch (error) {
      console.error("Error saving job:", error);
      setError("Netzwerk- oder API-Fehler beim Speichern des Jobs.");
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Heute";
    if (diffDays === 1) return "Gestern";
    if (diffDays < 7) return `vor ${diffDays} Tagen`;
    return date.toLocaleDateString("de-DE");
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Job-Portal Integration
        </h1>
        <p className="mt-2 text-gray-600">
          Durchsuchen Sie verschiedene Job-Portale nach neuen Möglichkeiten
        </p>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>

      {/* Search Form */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="space-y-4">
          {/* Portal Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Job Portal
            </label>
            <div className="flex flex-wrap gap-2">
              {portals.map((portal) => (
                <div key={portal.id} className="flex rounded-md overflow-hidden border border-gray-300">
                  <button
                    onClick={() => setSelectedPortal(portal.id)}
                    className={`px-4 py-2 text-sm font-medium transition-colors ${
                      selectedPortal === portal.id
                        ? `${portal.color} text-white border-transparent`
                        : "bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {portal.name}
                  </button>
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
                </div>
              ))}
            </div>
          </div>

          {/* Search Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Suchbegriff *
              </label>
              <input
                id="job-search-keyword"
                name="keyword"
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="z.B. Frontend Developer"
                className="w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                onKeyPress={(e) => e.key === "Enter" && searchJobs()}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ort
              </label>
              <input
                id="job-search-location"
                name="location"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="z.B. Berlin"
                className="w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                onKeyPress={(e) => e.key === "Enter" && searchJobs()}
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={searchJobs}
                disabled={!keyword.trim() || loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md font-medium flex items-center justify-center"
              >
                <MagnifyingGlassIcon className="h-5 w-5 mr-2" />
                {loading ? "Suche..." : "Suchen"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      {jobs.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              {jobs.length} Jobs gefunden
            </h2>
          </div>

          <div className="divide-y divide-gray-200">
            {jobs.map((job) => (
              <div
                key={job.id}
                className="p-6 hover:bg-gray-50 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {job.title}
                      </h3>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full text-white ${
                          portals.find((p) => p.id === job.portal.toLowerCase())
                            ?.color || "bg-gray-500"
                        }`}
                      >
                        {job.portal}
                      </span>
                    </div>

                    <div className="text-gray-600 mb-2">
                      <span className="font-medium">{job.company}</span> •{" "}
                      {job.location}
                    </div>

                    <p className="text-gray-700 mb-3 line-clamp-2">
                      {job.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                      <span>{job.salary}</span>
                      <span>{job.type}</span>
                      <span>{formatDate(job.postedDate)}</span>
                    </div>

                    {job.requirements.length > 0 && (
                      <div className="mt-3">
                        <div className="flex flex-wrap gap-2">
                          {job.requirements.slice(0, 5).map((req, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md"
                            >
                              {req}
                            </span>
                          ))}
                          {job.requirements.length > 5 && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded-md">
                              +{job.requirements.length - 5} mehr
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col space-y-2 ml-4">
                    <button
                      onClick={() => saveJob(job)}
                      className={`p-2 rounded-md transition-colors ${
                        savedJobs.has(job.id)
                          ? "text-yellow-600 hover:bg-yellow-50"
                          : "text-gray-400 hover:text-yellow-600 hover:bg-gray-50"
                      }`}
                      title="Job speichern"
                    >
                      {savedJobs.has(job.id) ? (
                        <BookmarkSolidIcon className="h-5 w-5" />
                      ) : (
                        <BookmarkIcon className="h-5 w-5" />
                      )}
                    </button>

                    <a
                      href={job.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
                      title="Job anzeigen"
                    >
                      <EyeIcon className="h-5 w-5" />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && jobs.length === 0 && keyword && (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <MagnifyingGlassIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Keine Jobs gefunden
          </h3>
          <p className="text-gray-500">
            Versuchen Sie andere Suchbegriffe oder erweitern Sie Ihren
            Suchbereich.
          </p>
        </div>
      )}
    </div>
  );
}
