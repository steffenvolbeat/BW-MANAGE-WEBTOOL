"use client";
import { useAppUser } from "@/hooks/useAppUser";

import { useEffect, useRef, useState, type ChangeEvent, Fragment } from "react";
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  PlusIcon,
  EyeIcon,
  TrashIcon,
  GlobeEuropeAfricaIcon,
  HomeIcon,
  CalendarDaysIcon,
  ClockIcon,
  PencilSquareIcon,
  ArrowPathIcon,
  XMarkIcon,
  CloudArrowUpIcon,
} from "@heroicons/react/24/outline";
interface Application {
  id: string;
  companyName: string;
  position: string;
  location: string;
  country: string;
  isInland: boolean;
  status: string;
  priority: string;
  jobType: string;
  salary?: string;
  appliedAt: string;
  responseAt?: string;
  jobUrl?: string;
  companyUrl?: string;
  notesText?: string; // Beschreibung
  requirements?: string;
}

type UploadDocType = "CV" | "COVER_LETTER" | "CERTIFICATE" | "REFERENCE" | "OTHER";
type DocumentPreview = {
  id: string;
  name: string;
  type: UploadDocType | string;
  storageType?: string | null;
  uploadedAt?: string;
  filePath?: string | null;
  fileType?: string | null;
  fileName?: string | null;
};


export default function ApplicationsOverview() {
  const { id: userId } = useAppUser();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Application> & { jobUrl?: string; salary?: string; priority?: string; status?: string }>({});
  const [showEdit, setShowEdit] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [detailApp, setDetailApp] = useState<Application | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [coachInput, setCoachInput] = useState("");
  const [coachMode, setCoachMode] = useState<"local" | "anthropic">("local");
  const [coachLoading, setCoachLoading] = useState(false);
  const [coachResult, setCoachResult] = useState<null | {
    feedback: string;
    missingKeywords?: string[];
    usedMode: string;
  }>(null);
  const [coachError, setCoachError] = useState<string | null>(null);
  const [dupLoading, setDupLoading] = useState(false);
  const [dupPairs, setDupPairs] = useState<
    { a: string; b: string; score: number; reasons: string[] }[]
  >([]);
  const [dupError, setDupError] = useState<string | null>(null);
  const [uploadForApp, setUploadForApp] = useState<Application | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadDocType, setUploadDocType] = useState<UploadDocType>("CV");
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [previewDocs, setPreviewDocs] = useState<DocumentPreview[]>([]);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [rowDocsExpanded, setRowDocsExpanded] = useState<string | null>(null);
  const [rowDocs, setRowDocs] = useState<Record<string, DocumentPreview[]>>({});
  const [rowDocsLoading, setRowDocsLoading] = useState<string | null>(null);
  const [rowDocsError, setRowDocsError] = useState<string | null>(null);

  const statusConfig = {
    APPLIED: {
      label: "Beworben",
      color: "bg-blue-100 text-blue-800",
      icon: ClockIcon,
    },
    REVIEWED: {
      label: "Geprüft",
      color: "bg-purple-100 text-purple-800",
      icon: EyeIcon,
    },
    INTERVIEW_SCHEDULED: {
      label: "Interview geplant",
      color: "bg-yellow-100 text-yellow-800",
      icon: CalendarDaysIcon,
    },
    INTERVIEWED: {
      label: "Interview geführt",
      color: "bg-indigo-100 text-indigo-800",
      icon: CalendarDaysIcon,
    },
    OFFER_RECEIVED: {
      label: "Angebot erhalten",
      color: "bg-green-100 text-green-800",
      icon: CalendarDaysIcon,
    },
    ACCEPTED: {
      label: "Angenommen",
      color: "bg-emerald-100 text-emerald-800",
      icon: CalendarDaysIcon,
    },
    REJECTED: {
      label: "Abgelehnt",
      color: "bg-red-100 text-red-800",
      icon: CalendarDaysIcon,
    },
    WITHDRAWN: {
      label: "Zurückgezogen",
      color: "bg-gray-100 text-gray-800",
      icon: CalendarDaysIcon,
    },
    OTHER: {
      label: "Sonstiges",
      color: "bg-slate-100 text-slate-800",
      icon: CalendarDaysIcon,
    },
  };

  const priorityConfig = {
    LOW: { label: "Niedrig", color: "bg-gray-100 text-gray-700" },
    MEDIUM: { label: "Mittel", color: "bg-yellow-100 text-yellow-800" },
    HIGH: { label: "Hoch", color: "bg-orange-100 text-orange-800" },
    URGENT: { label: "Dringend", color: "bg-red-100 text-red-800" },
  };

  const jobTypeConfig = {
    FULLTIME: "Vollzeit",
    PARTTIME: "Teilzeit",
    CONTRACT: "Vertrag",
    FREELANCE: "Freiberuflich",
    INTERNSHIP: "Praktikum",
  };

  const filteredApplications = applications.filter((app) => {
    const matchesSearch =
      app.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.location.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter =
      selectedFilter === "all" ||
      (selectedFilter === "inland" && app.isInland) ||
      (selectedFilter === "international" && !app.isInland);

    const matchesStatus =
      selectedStatus === "all" || app.status === selectedStatus;

    return matchesSearch && matchesFilter && matchesStatus;
  });

  const loadApplications = async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/applications?userId=${userId}`);
      if (!res.ok) throw new Error(`Fetch failed (${res.status})`);
      const data = (await res.json()) as Application[];
      const normalized = data.map((app) =>
        app.status === "PLANNED"
          ? { ...app, status: "INTERVIEW_SCHEDULED" }
          : app
      );
      setApplications(normalized);
    } catch (err) {
      console.error("Applications fetch failed", err);
      setError("Bewerbungen konnten nicht geladen werden.");
      showToast("Bewerbungen konnten nicht geladen werden.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const statusFlow = [
    "APPLIED",
    "REVIEWED",
    "INTERVIEW_SCHEDULED",
    "INTERVIEWED",
    "OFFER_RECEIVED",
    "ACCEPTED",
    "REJECTED",
    "WITHDRAWN",
    "OTHER",
  ];

  const getNextStatus = (current: string) => {
    const idx = statusFlow.indexOf(current);
    if (idx === -1 || idx === statusFlow.length - 1) return current;
    return statusFlow[idx + 1];
  };

  const handleUpdateStatus = async (app: Application) => {
    if (!userId) return;
    const next = getNextStatus(app.status);
    if (next === app.status) return;
    setUpdatingId(app.id);
    setError(null);
    try {
      const res = await fetch("/api/applications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: app.id, userId: userId, status: next }),
      });
      if (!res.ok) throw new Error(`Update failed (${res.status})`);
      const updated = await res.json();
      setApplications((prev) => prev.map((a) => (a.id === app.id ? { ...a, ...updated } : a)));
      showToast("Status aktualisiert.");
    } catch (err) {
      console.error("Status update failed", err);
      setError("Status konnte nicht aktualisiert werden.");
      showToast("Status konnte nicht aktualisiert werden.", "error");
    } finally {
      setUpdatingId(null);
    }
  };

  const openEdit = (app: Application) => {
    setEditingId(app.id);
    setEditForm({
      ...app,
      status: app.status === "PLANNED" ? "INTERVIEW_SCHEDULED" : app.status,
      jobUrl: (app as any).jobUrl || "",
      salary: app.salary || "",
    });
    setShowEdit(true);
    setError(null);
  };

  const openDetail = (app: Application) => {
    setDetailApp(app);
    setShowDetail(true);
    setCoachResult(null);
    setCoachError(null);
    const seed = [
      `${app.position} @ ${app.companyName}`,
      app.requirements || app.notesText || "",
    ]
      .filter(Boolean)
      .join("\n\n");
    setCoachInput(seed);
  };

  const closeDetail = () => {
    setShowDetail(false);
    setDetailApp(null);
  };

  const closeEdit = () => {
    setShowEdit(false);
    setEditingId(null);
    setEditForm({});
  };

  const handleEditChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked =
      e.target instanceof HTMLInputElement ? e.target.checked : undefined;
    setEditForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSaveEdit = async () => {
    if (!userId || !editingId) return;
    setUpdatingId(editingId);
    setError(null);
    try {
      // Strip undefined so Prisma doesn't receive null/undefined for required fields
      const rawPayload = {
        id: editingId,
        userId: userId,
        companyName: editForm.companyName,
        position: editForm.position,
        location: editForm.location,
        country: editForm.country,
        isInland: editForm.isInland,
        status: editForm.status,
        priority: editForm.priority,
        jobType: (editForm as any).jobType,
        salary: editForm.salary,
        jobUrl: (editForm as any).jobUrl,
        companyUrl: (editForm as any).companyUrl,
        notesText: editForm.notesText,
        requirements: editForm.requirements,
      };

      const payload = Object.fromEntries(
        Object.entries(rawPayload).filter(([, v]) => v !== undefined)
      );

      const res = await fetch("/api/applications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => null);
        const msg = errBody?.error
          ? `${errBody.error}${errBody.received ? ` (${errBody.received})` : ""}`
          : `Update failed (${res.status})`;
        throw new Error(msg);
      }

      const updated = await res.json();
      setApplications((prev) => prev.map((a) => (a.id === editingId ? { ...a, ...updated } : a)));
      closeEdit();
      showToast("Bewerbung aktualisiert.");
    } catch (err) {
      console.error("Edit failed", err);
      const message = err instanceof Error ? err.message : "Bewerbung konnte nicht aktualisiert werden.";
      setError(message);
      showToast(message, "error");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!userId) return;
    const confirmed = window.confirm("Bewerbung wirklich löschen?");
    if (!confirmed) return;
    setDeletingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/applications?id=${id}&userId=${userId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error(`Delete failed (${res.status})`);
      setApplications((prev) => prev.filter((a) => a.id !== id));
      showToast("Bewerbung gelöscht.");
    } catch (err) {
      console.error("Delete failed", err);
      setError("Bewerbung konnte nicht gelöscht werden.");
      showToast("Bewerbung konnte nicht gelöscht werden.", "error");
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const getStatusBadge = (status: string) => {
    const config = statusConfig[status as keyof typeof statusConfig];
    if (!config) return null;

    const Icon = config.icon;
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color} dark:bg-slate-700 dark:text-slate-100`}
      >
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </span>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const config = priorityConfig[priority as keyof typeof priorityConfig];
    if (!config) return null;

    return (
      <span
        className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${config.color}`}
      >
        {config.label}
      </span>
    );
  };

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };



  const openUploadModal = (app: Application) => {
    setUploadForApp(app);
    setUploadFile(null);
    setUploadDocType("CV");
    setUploadError(null);
    loadDocumentsForApp(app.id);
  };

  const closeUploadModal = () => {
    setUploadForApp(null);
    setUploadFile(null);
    setUploadDocType("CV");
    setUploadingDoc(false);
    setUploadError(null);
    setPreviewDocs([]);
    setPreviewError(null);
    setPreviewLoading(false);
  };

  const loadDocumentsForApp = async (applicationId: string) => {
    if (!userId) return;
    setPreviewLoading(true);
    setPreviewError(null);
    try {
      const res = await fetch(`/api/documents?applicationId=${applicationId}`);
      if (!res.ok) throw new Error(`Dokumente laden fehlgeschlagen (${res.status})`);
      const docs = (await res.json()) as DocumentPreview[];
      setPreviewDocs(docs);
      setRowDocs((prev) => ({ ...prev, [applicationId]: docs }));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Dokumente konnten nicht geladen werden.";
      setPreviewError(message);
      setRowDocsError(message);
    } finally {
      setPreviewLoading(false);
    }
  };

  const loadDocumentsForRow = async (applicationId: string) => {
    if (!userId) return;
    setRowDocsLoading(applicationId);
    setRowDocsError(null);
    try {
      const res = await fetch(`/api/documents?applicationId=${applicationId}`);
      if (!res.ok) throw new Error(`Dokumente laden fehlgeschlagen (${res.status})`);
      const docs = (await res.json()) as DocumentPreview[];
      setRowDocs((prev) => ({ ...prev, [applicationId]: docs }));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Dokumente konnten nicht geladen werden.";
      setRowDocsError(message);
    } finally {
      setRowDocsLoading(null);
    }
  };

  const handlePreviewDoc = (doc: DocumentPreview) => {
    if (doc.filePath) {
      window.open(doc.filePath, "_blank", "noopener");
    } else {
      showToast("Kein Preview verfügbar.", "error");
    }
  };

  const handleUploadDocument = async () => {
    if (!userId || !uploadForApp) {
      setUploadError("Bitte anmelden.");
      return;
    }
    if (!uploadFile) {
      setUploadError("Bitte Datei auswählen.");
      return;
    }
    setUploadingDoc(true);
    setUploadError(null);
    try {
      const formData = new FormData();
      formData.append("file", uploadFile);
      formData.append("applicationId", uploadForApp.id);
      formData.append("name", uploadFile.name);
      formData.append("type", uploadDocType);
      formData.append("description", `Anlage zu ${uploadForApp.position} @ ${uploadForApp.companyName}`);
      formData.append("tags", JSON.stringify([]));

      const res = await fetch("/api/documents", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || `Upload fehlgeschlagen (${res.status})`);
      }

      showToast("Dokument hochgeladen.");
      await loadDocumentsForApp(uploadForApp.id);
      closeUploadModal();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload fehlgeschlagen.";
      setUploadError(message);
      showToast(message, "error");
    } finally {
      setUploadingDoc(false);
    }
  };

  const loadDuplicates = async () => {
    setDupLoading(true);
    setDupError(null);
    try {
      const res = await fetch(`/api/applications/duplicates?threshold=0.72`);
      if (!res.ok) throw new Error(`Duplikate fehlgeschlagen (${res.status})`);
      const data = (await res.json()) as {
        pairs?: { a: string; b: string; score: number; reasons: string[] }[];
        total?: number;
      };
      setDupPairs(data.pairs ?? []);
      showToast(`Duplikate gefunden: ${data.pairs?.length ?? 0}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Duplikate konnten nicht geladen werden.";
      setDupError(message);
      showToast(message, "error");
    } finally {
      setDupLoading(false);
    }
  };

  const mergeDuplicate = async (keepId: string, dropId: string) => {
    setDupLoading(true);
    setDupError(null);
    try {
      const res = await fetch(`/api/applications/merge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ primaryId: keepId, duplicateId: dropId }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        const msg = body?.error || `Merge fehlgeschlagen (${res.status})`;
        throw new Error(msg);
      }
      await loadApplications();
      await loadDuplicates();
      showToast("Duplikat zusammengeführt.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Merge fehlgeschlagen.";
      setDupError(message);
      showToast(message, "error");
    } finally {
      setDupLoading(false);
    }
  };

  const runCoach = async () => {
    if (!detailApp) return;
    setCoachLoading(true);
    setCoachError(null);
    setCoachResult(null);
    try {
      const res = await fetch("/api/ai/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: coachMode,
          applicantText: coachInput,
          jobDescription: detailApp.notesText,
          requirements: detailApp.requirements,
          position: detailApp.position,
          company: detailApp.companyName,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        const message = body?.error || `Coach fehlgeschlagen (${res.status})`;
        throw new Error(message);
      }

      const data = (await res.json()) as {
        feedback: string;
        missingKeywords?: string[];
        usedMode: string;
      };
      setCoachResult(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Coach konnte nicht ausgeführt werden.";
      setCoachError(message);
      showToast(message, "error");
    } finally {
      setCoachLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Bewerbungen</h1>
          <p className="mt-2 text-gray-600">
            Verwalten Sie alle Ihre Bewerbungen an einem Ort.
          </p>
          {false && (
            <p className="text-sm text-gray-500 mt-1">Lade Benutzer...</p>
          )}
          {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
        </div>
        <button
          onClick={() => (window.location.href = "/applications/new")}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          disabled={!userId}
        >
          <PlusIcon className="w-4 h-4 mr-2" />
          Neue Bewerbung
        </button>
      </div>

      {toast && (
        <div
          className={`rounded-lg border px-4 py-3 flex items-center gap-2 ${
            toast.type === "success"
              ? "bg-green-50 border-green-200 text-green-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          <span className="font-medium">
            {toast.type === "success" ? "Erfolg" : "Fehler"}
          </span>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <HomeIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Gesamt</p>
              <p className="text-xl font-bold text-gray-900">
                {loading ? "…" : applications.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <ClockIcon className="w-5 h-5 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Ausstehend</p>
              <p className="text-xl font-bold text-gray-900">
                {loading
                  ? "…"
                  : applications.filter((app) =>
                      ["APPLIED", "REVIEWED"].includes(app.status)
                    ).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CalendarDaysIcon className="w-5 h-5 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Interviews</p>
              <p className="text-xl font-bold text-gray-900">
                {loading
                  ? "…"
                  : applications.filter((app) =>
                      ["INTERVIEW_SCHEDULED", "INTERVIEWED"].includes(
                        app.status
                      )
                    ).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <GlobeEuropeAfricaIcon className="w-5 h-5 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">International</p>
              <p className="text-xl font-bold text-gray-900">
                {loading
                  ? "…"
                  : applications.filter((app) => !app.isInland).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Duplicate Finder */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <p className="text-sm font-semibold text-gray-900">Duplikate finden & mergen</p>
            <p className="text-xs text-gray-600">Fuzzy (Jaro-Winkler + TF-IDF) auf Firmenname + Position.</p>
          </div>
          <button
            type="button"
            onClick={loadDuplicates}
            disabled={dupLoading}
            className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {dupLoading ? "Prüfe..." : "Duplikate prüfen"}
          </button>
        </div>

        {dupError && <p className="text-sm text-red-600">{dupError}</p>}

        {dupPairs.length > 0 && (
          <div className="divide-y divide-gray-200">
            {dupPairs.map((pair) => {
              const appA = applications.find((a) => a.id === pair.a);
              const appB = applications.find((a) => a.id === pair.b);
              if (!appA || !appB) return null;

              const keepA = () => mergeDuplicate(appA.id, appB.id);
              const keepB = () => mergeDuplicate(appB.id, appA.id);

              return (
                <div key={`${pair.a}-${pair.b}`} className="py-3 flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <span className="px-2 py-1 rounded bg-amber-100 text-amber-800 text-xs font-semibold">Score {(pair.score * 100).toFixed(0)}%</span>
                    <span className="text-xs text-gray-500">{pair.reasons.join(" · ")}</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="border rounded-lg p-3">
                      <p className="font-semibold text-gray-900">{appA.position}</p>
                      <p className="text-sm text-gray-700">{appA.companyName}</p>
                      <p className="text-xs text-gray-500">{appA.location}</p>
                      <button
                        type="button"
                        onClick={keepA}
                        disabled={dupLoading}
                        className="mt-2 px-3 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-60"
                      >
                        Behalten & mergen
                      </button>
                    </div>
                    <div className="border rounded-lg p-3">
                      <p className="font-semibold text-gray-900">{appB.position}</p>
                      <p className="text-sm text-gray-700">{appB.companyName}</p>
                      <p className="text-xs text-gray-500">{appB.location}</p>
                      <button
                        type="button"
                        onClick={keepB}
                        disabled={dupLoading}
                        className="mt-2 px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
                      >
                        Diesen behalten & mergen
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!dupLoading && dupPairs.length === 0 && (
          <p className="text-sm text-gray-600">Noch keine Duplikate geladen. Prüfen starten.</p>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                id="app-search"
                name="search"
                type="text"
                placeholder="Nach Firma, Position oder Ort suchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg placeholder-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Location Filter */}
          <div className="flex items-center">
            <FunnelIcon className="w-4 h-4 text-gray-400 mr-2" />
            <select
              id="app-location-filter"
              name="locationFilter"
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 dark:focus:ring-blue-400 dark:focus:border-blue-400"
            >
              <option value="all">Alle Bewerbungen</option>
              <option value="inland">Nur Inland</option>
              <option value="international">Nur International</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              id="app-status-filter"
              name="statusFilter"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 dark:focus:ring-blue-400 dark:focus:border-blue-400"
            >
              <option value="all">Alle Status</option>
              <option value="APPLIED">Beworben</option>
              <option value="REVIEWED">Geprüft</option>
              <option value="INTERVIEW_SCHEDULED">Interview geplant</option>
              <option value="INTERVIEWED">Interview geführt</option>
              <option value="OFFER_RECEIVED">Angebot erhalten</option>
              <option value="ACCEPTED">Angenommen</option>
              <option value="REJECTED">Abgelehnt</option>
              <option value="WITHDRAWN">Zurückgezogen</option>
              <option value="OTHER">Sonstiges</option>
            </select>
          </div>
        </div>
      </div>

      {/* Applications Table */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
        {showEdit && editingId && (
          <div className="fixed inset-0 bg-black/40 z-30 flex items-center justify-center px-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl border border-gray-200 p-6 relative">
              <button
                className="absolute right-3 top-3 text-gray-500 hover:text-gray-700"
                onClick={closeEdit}
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
              <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <PencilSquareIcon className="w-5 h-5 mr-2 text-indigo-600" />
                Bewerbung bearbeiten
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Firma</label>
                  <input
                    name="companyName"
                    value={editForm.companyName || ""}
                    onChange={handleEditChange}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                  <input
                    name="position"
                    value={editForm.position || ""}
                    onChange={handleEditChange}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ort</label>
                  <input
                    name="location"
                    value={editForm.location || ""}
                    onChange={handleEditChange}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Land</label>
                  <input
                    name="country"
                    value={editForm.country || ""}
                    onChange={handleEditChange}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    name="status"
                    value={editForm.status || "APPLIED"}
                    onChange={handleEditChange}
                    className="w-full px-3 py-2 border text-gray-800 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="PLANNED">Geplant</option>
                    <option value="APPLIED">Beworben</option>
                    <option value="REVIEWED">Geprüft</option>
                    <option value="INTERVIEW_SCHEDULED">Interview geplant</option>
                    <option value="INTERVIEWED">Interview geführt</option>
                    <option value="OFFER_RECEIVED">Angebot erhalten</option>
                    <option value="ACCEPTED">Angenommen</option>
                    <option value="REJECTED">Abgelehnt</option>
                    <option value="WITHDRAWN">Zurückgezogen</option>
                    <option value="OTHER">Sonstiges</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priorität</label>
                  <select
                    name="priority"
                    value={editForm.priority || "MEDIUM"}
                    onChange={handleEditChange}
                    className="w-full px-3 py-2 border text-gray-800 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="LOW">Niedrig</option>
                    <option value="MEDIUM">Mittel</option>
                    <option value="HIGH">Hoch</option>
                    <option value="URGENT">Dringend</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Job-Typ</label>
                  <select
                    name="jobType"
                    value={(editForm as any).jobType || "FULLTIME"}
                    onChange={handleEditChange}
                    className="w-full px-3 py-2 border text-gray-800 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="FULLTIME">Vollzeit</option>
                    <option value="PARTTIME">Teilzeit</option>
                    <option value="CONTRACT">Vertrag</option>
                    <option value="FREELANCE">Freiberuflich</option>
                    <option value="INTERNSHIP">Praktikum</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-1">Gehalt</label>
                  <input
                    name="salary"
                    value={editForm.salary || ""}
                    onChange={handleEditChange}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-1">Job-URL</label>
                  <input
                    name="jobUrl"
                    value={(editForm as any).jobUrl || ""}
                    onChange={handleEditChange}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="https://..."
                  />
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="checkbox"
                    name="isInland"
                    checked={!!editForm.isInland}
                    onChange={handleEditChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700">Inland</span>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                  onClick={closeEdit}
                >
                  Abbrechen
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  disabled={updatingId === editingId}
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  Speichern
                </button>
              </div>
            </div>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Unternehmen & Position
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Standort
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priorität
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Beworben am
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Gehalt
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aktionen
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-6 text-center text-sm text-gray-500"
                  >
                    Bewerbungen werden geladen...
                  </td>
                </tr>
              ) : (
                filteredApplications.map((application) => (
                  <Fragment key={application.id}>
                    <tr
                      className="hover:bg-gray-50"
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        const file = e.dataTransfer?.files?.[0];
                        if (!file) return;
                        openUploadModal(application);
                        setUploadFile(file);
                      }}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {application.companyName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {application.position}
                          </div>
                          <div className="text-xs text-gray-400">
                            {
                              jobTypeConfig[
                                application.jobType as keyof typeof jobTypeConfig
                              ]
                            }
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {application.isInland ? (
                            <HomeIcon className="w-4 h-4 text-blue-500 mr-2" />
                          ) : (
                            <GlobeEuropeAfricaIcon className="w-4 h-4 text-purple-500 mr-2" />
                          )}
                          <div>
                            <div className="text-sm text-gray-900">
                              {application.location}
                            </div>
                            <div className="text-xs text-gray-500">
                              {application.country}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(application.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getPriorityBadge(application.priority)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(application.appliedAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {application.salary || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            className="text-blue-600 hover:text-blue-900 p-1"
                            title="Details anzeigen"
                            onClick={() => openDetail(application)}
                          >
                            <EyeIcon className="w-4 h-4" />
                          </button>
                          <button
                            className="text-gray-600 hover:text-gray-900 p-1"
                            title="Dokumente ansehen"
                            onClick={() => {
                              const isOpen = rowDocsExpanded === application.id;
                              setRowDocsExpanded(isOpen ? null : application.id);
                              if (!isOpen && !rowDocs[application.id]) {
                                loadDocumentsForRow(application.id);
                              }
                            }}
                          >
                            <span className="text-xs font-semibold">Docs</span>
                          </button>
                          <button
                            className="text-green-600 hover:text-green-800 p-1"
                            title="Dokument hochladen / anzeigen"
                            onClick={() => openUploadModal(application)}
                          >
                            <CloudArrowUpIcon className="w-4 h-4" />
                          </button>
                          <button
                            className="text-indigo-600 hover:text-indigo-900 p-1 disabled:opacity-60"
                            onClick={() => openEdit(application)}
                            title="Bearbeiten"
                          >
                            <PencilSquareIcon className="w-4 h-4" />
                          </button>
                          <button
                            className="text-gray-600 hover:text-gray-900 p-1 disabled:opacity-60"
                            onClick={() => handleUpdateStatus(application)}
                            disabled={updatingId === application.id}
                            title="Status vorwärts schieben"
                          >
                            <ArrowPathIcon className="w-4 h-4" />
                          </button>
                          <button
                            className="text-red-600 hover:text-red-900 p-1 disabled:opacity-60"
                            onClick={() => handleDelete(application.id)}
                            disabled={deletingId === application.id}
                            title="Löschen"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {rowDocsExpanded === application.id && (
                      <tr>
                        <td colSpan={7} className="bg-gray-50 px-6 py-4 text-sm text-gray-800">
                          {rowDocsLoading === application.id && <p>Lade Dokumente…</p>}
                          {rowDocsError && <p className="text-red-600">{rowDocsError}</p>}
                          {!rowDocsLoading && !rowDocsError && (
                            <div className="space-y-2">
                              {rowDocs[application.id]?.length ? (
                                rowDocs[application.id]!.map((doc) => {
                                  return (
                                    <div key={doc.id} className="flex items-center justify-between gap-3 rounded border border-gray-200 bg-white px-3 py-2">
                                      <div>
                                        <p className="font-medium text-gray-900">{doc.name}</p>
                                        <p className="text-xs text-gray-500">{doc.type} · {doc.storageType || "LOCAL"}</p>
                                      </div>
                                      <div className="flex items-center gap-3">
                                        {doc.filePath ? (
                                          <button
                                            type="button"
                                            onClick={() => handlePreviewDoc(doc)}
                                            className="text-xs text-blue-600 hover:underline"
                                          >
                                            Preview
                                          </button>
                                        ) : (
                                          <span className="text-xs text-gray-400">Kein Direkt-Preview</span>
                                        )}
                                        <span className="text-xs text-gray-400">{doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString("de-DE") : ""}</span>
                                      </div>
                                    </div>
                                  );
                                })
                              ) : (
                                <p className="text-gray-600">Keine Dokumente für diese Bewerbung.</p>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && filteredApplications.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500">
              <ClockIcon className="mx-auto h-12 w-12 mb-4" />
              <h3 className="text-lg font-medium mb-2">
                Keine Bewerbungen gefunden
              </h3>
              <p>
                Versuchen Sie andere Suchkriterien oder erstellen Sie eine neue
                Bewerbung.
              </p>
              <button
                onClick={() => (window.location.href = "/applications/new")}
                className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Erste Bewerbung erstellen
              </button>
            </div>
          </div>
        )}
      </div>

      {showDetail && detailApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-gray-200 dark:border-slate-700 overflow-hidden flex flex-col max-h-[80vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-slate-700">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-slate-400">Bewerbung</p>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {detailApp.position} @ {detailApp.companyName}
                </h3>
              </div>
              <button
                onClick={closeDetail}
                className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500 dark:text-slate-300"
                aria-label="Schließen"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="text-sm text-gray-700 dark:text-slate-200">
                    <span className="font-medium">Ort:</span> {detailApp.location} ({detailApp.country})
                  </div>
                  <div className="text-sm text-gray-700 dark:text-slate-200">
                    <span className="font-medium">Jobtyp:</span> {jobTypeConfig[detailApp.jobType as keyof typeof jobTypeConfig]}
                  </div>
                  <div className="text-sm text-gray-700 dark:text-slate-200">
                    <span className="font-medium">Gehalt:</span> {detailApp.salary || "-"}
                  </div>
                  <div className="text-sm text-gray-700 dark:text-slate-200">
                    <span className="font-medium">Beworben am:</span> {formatDate(detailApp.appliedAt)}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {getStatusBadge(detailApp.status)}
                    {getPriorityBadge(detailApp.priority)}
                  </div>
                  <div className="space-y-2 text-sm">
                    {detailApp.jobUrl && (
                      <a
                        href={detailApp.jobUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        Job-Link öffnen
                      </a>
                    )}
                    {detailApp.companyUrl && (
                      <a
                        href={detailApp.companyUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 hover:underline block"
                      >
                        Firmen-Website
                      </a>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">Stellenbeschreibung</p>
                    <p className="mt-1 text-sm text-gray-700 dark:text-slate-200 whitespace-pre-wrap">
                      {detailApp.notesText?.trim() ? detailApp.notesText : "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">Anforderungen</p>
                    <p className="mt-1 text-sm text-gray-700 dark:text-slate-200 whitespace-pre-wrap">
                      {detailApp.requirements?.trim() ? detailApp.requirements : "-"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8 border border-gray-200 dark:border-slate-700 rounded-lg p-4 bg-gray-50 dark:bg-slate-800/50">
                <div className="flex flex-wrap items-center gap-2 justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">AI-Bewerbungscoach (privacy-first)</p>
                    <p className="text-xs text-gray-600 dark:text-slate-300">
                      Analysiert lokal oder via Zero-Retention-API, keine Serverpersistenz.
                    </p>
                  </div>
                  <span className="text-[11px] px-2 py-1 rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200">Beta</span>
                </div>

                <div className="mt-4 flex flex-col md:flex-row gap-3">
                  <label className="text-xs font-medium text-gray-700 dark:text-slate-200">Modus</label>
                  <div className="flex gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setCoachMode("local")}
                      className={`px-3 py-1.5 rounded-lg border text-sm ${
                        coachMode === "local"
                          ? "border-green-500 bg-green-50 text-green-800"
                          : "border-gray-300 text-gray-700"
                      }`}
                    >
                      Lokal (Browser)
                    </button>
                    <button
                      type="button"
                      onClick={() => setCoachMode("anthropic")}
                      className={`px-3 py-1.5 rounded-lg border text-sm ${
                        coachMode === "anthropic"
                          ? "border-blue-500 bg-blue-50 text-blue-800"
                          : "border-gray-300 text-gray-700"
                      }`}
                    >
                      Claude (Zero-Retention)
                    </button>
                  </div>
                </div>

                <textarea
                  id="coach-input"
                  name="coachInput"
                  className="mt-4 w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-35"
                  placeholder="Profil oder Anschreiben einfügen (Bleibt lokal)"
                  value={coachInput}
                  onChange={(e) => setCoachInput(e.target.value)}
                />

                <div className="mt-3 flex flex-col gap-2 text-xs text-gray-600 dark:text-slate-300">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-green-500" />
                    <span>Lokal: Heuristische Analyse im Browser, keine Übertragung.</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-blue-500" />
                    <span>Claude: TLS-verschlüsselt, Zero-Retention; Inhalte werden nicht gespeichert.</span>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={runCoach}
                    disabled={coachLoading || !coachInput.trim()}
                    className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
                  >
                    {coachLoading ? "Analysiere..." : "Analyse starten"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCoachInput(detailApp.requirements || detailApp.notesText || "");
                      setCoachResult(null);
                      setCoachError(null);
                    }}
                    className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    Zurücksetzen
                  </button>
                  <span className="text-xs text-gray-500">Analyse bleibt kontextbasiert, kein Serverlogging.</span>
                </div>

                {coachError && (
                  <div className="mt-3 text-sm text-red-600">{coachError}</div>
                )}

                {coachResult && (
                  <div className="mt-4 space-y-3">
                    <div className="text-sm font-semibold text-gray-900 dark:text-white">
                      Feedback ({coachResult.usedMode})
                    </div>
                    <div className="text-sm text-gray-800 dark:text-slate-100 whitespace-pre-wrap border border-gray-200 dark:border-slate-700 rounded-lg p-3 bg-white dark:bg-slate-900">
                      {coachResult.feedback}
                    </div>
                    {coachResult.missingKeywords?.length ? (
                      <div className="flex flex-wrap gap-2 text-xs">
                        {coachResult.missingKeywords.map((kw) => (
                          <span key={kw} className="px-2 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                            {kw}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-600 dark:text-slate-300">Keine fehlenden Keywords erkannt.</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 dark:border-slate-700 flex justify-end">
              <button
                onClick={closeDetail}
                className="px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800"
              >
                Schließen
              </button>
            </div>
          </div>
        </div>
      )}

      {uploadForApp && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 px-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-lg bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500">Dokument hochladen</p>
                <h3 className="text-lg font-semibold text-gray-900">
                  {uploadForApp.position} @ {uploadForApp.companyName}
                </h3>
              </div>
              <button
                onClick={closeUploadModal}
                className="rounded-lg p-2 hover:bg-gray-100 text-gray-500"
                aria-label="Schließen"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="px-5 py-4 space-y-4">
              <div className="space-y-2">
                <label htmlFor="upload-file-input" className="text-sm font-medium text-gray-800">Datei (PDF, DOC, DOCX, PNG, JPG)</label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    Datei auswählen
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                    id="upload-file-input"
                    name="file"
                    onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
                    className="hidden"
                  />
                  <span className="text-sm text-gray-600">
                    {uploadFile ? uploadFile.name : "Keine Datei ausgewählt"}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="upload-doc-type" className="text-sm font-medium text-gray-800">Dokumenttyp</label>
                <select
                  id="upload-doc-type"
                  name="docType"
                  value={uploadDocType}
                  onChange={(e) => setUploadDocType(e.target.value as UploadDocType)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="CV">Lebenslauf</option>
                  <option value="COVER_LETTER">Anschreiben</option>
                  <option value="CERTIFICATE">Zertifikat</option>
                  <option value="REFERENCE">Referenz</option>
                  <option value="OTHER">Sonstiges</option>
                </select>
              </div>

              <div className="rounded-lg border border-blue-100 bg-blue-50 text-sm text-blue-800 px-3 py-2">
                Verschlüsselung ist aktiviert; der Schlüssel bleibt nur im Browser gespeichert.
              </div>

              {uploadError && (
                <div className="text-sm text-red-600">{uploadError}</div>
              )}

              <div className="space-y-2">
                <p className="text-sm font-semibold text-gray-900">Bereits hochgeladen</p>
                {previewLoading && <p className="text-sm text-gray-600">Lade…</p>}
                {previewError && <p className="text-sm text-red-600">{previewError}</p>}
                {!previewLoading && !previewError && previewDocs.length === 0 && (
                  <p className="text-sm text-gray-500">Keine Dokumente für diese Bewerbung.</p>
                )}
                <div className="max-h-52 overflow-y-auto space-y-2">
                  {previewDocs.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between rounded border border-gray-200 px-3 py-2 text-sm"
                    >
                      <div className="space-y-0.5">
                        <p className="font-medium text-gray-900">{doc.name}</p>
                        <p className="text-xs text-gray-500">{doc.type}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        {doc.filePath ? (
                          <button
                            type="button"
                            onClick={() => handlePreviewDoc(doc)}
                            className="text-xs text-blue-600 hover:underline"
                          >
                            Preview
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400">Kein Preview</span>
                        )}
                        <span className="text-xs text-gray-400">
                          {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString("de-DE") : ""}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-5 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeUploadModal}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Abbrechen
              </button>
              <button
                type="button"
                onClick={handleUploadDocument}
                disabled={uploadingDoc}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {uploadingDoc ? "Lädt..." : "Hochladen"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Results Summary */}
      {filteredApplications.length > 0 && (
        <div className="text-sm text-gray-600 text-center">
          {filteredApplications.length} von {applications.length} Bewerbungen
          angezeigt
        </div>
      )}
    </div>
  );
}
