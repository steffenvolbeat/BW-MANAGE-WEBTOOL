"use client";
import { useAppUser } from "@/hooks/useAppUser";
import { useReadOnly } from "@/hooks/useReadOnly";
import ApplicationTimeline from "@/components/timeline/ApplicationTimeline";
import GlobalApplicationTimeline from "@/components/timeline/GlobalApplicationTimeline";

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
  ChevronUpIcon,
  ChevronDownIcon,
  DocumentTextIcon,
  ChatBubbleLeftEllipsisIcon,
} from "@heroicons/react/24/outline";
import { useRouter, useSearchParams } from "next/navigation";
interface Application {
  id: string;
  companyName: string;
  position: string;
  location: string;
  street?: string;
  zip?: string;
  country: string;
  state?: string;
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
  itBereich?: string;
  documents?: { id: string }[];
  _clCount?: number;
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

interface CoverLetterEntry {
  id?: string;
  title: string;
  itBereich: string;
  senderAddress?: string;
  recipientAddress?: string;
  content: string;
  _new?: boolean;
  _dirty?: boolean;
  _deleted?: boolean;
}

const IT_BEREICHE_OPTIONS = [
  { value: "", label: "— Bereich wählen —" },
  { value: "frontend", label: "🖥️  Frontend-Entwicklung" },
  { value: "backend", label: "⚙️  Backend-Entwicklung" },
  { value: "fullstack", label: "🔀  Full-Stack-Entwicklung" },
  { value: "devops", label: "☁️  DevOps / Cloud Engineering" },
  { value: "datascience", label: "📊  Data Science / KI / ML" },
  { value: "security", label: "🔒  Cybersecurity / IT-Security" },
  { value: "projektmanagement", label: "📋  IT-Projektmanagement / Scrum" },
  { value: "sysadmin", label: "🖧  Systemadministration" },
  { value: "qa", label: "🧪  QA / Softwaretesting" },
  { value: "mobile", label: "📱  Mobile Entwicklung" },
  { value: "architektur", label: "🏛️  Software-Architektur" },
  { value: "erp", label: "🗄️  ERP / SAP-Beratung" },
  { value: "embedded", label: "🔧  Embedded Systems / IoT" },
  { value: "ux", label: "🎨  UX Engineering" },
];


export default function ApplicationsOverview() {
  const { id: userId } = useAppUser();
  const { isReadOnly } = useReadOnly();
  const searchParams = useSearchParams();
  const viewAs = searchParams.get("viewAs");
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Application> & { jobUrl?: string; salary?: string; priority?: string; status?: string }>({});
  const [showEdit, setShowEdit] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [detailApp, setDetailApp] = useState<Application | null>(null);
  const [detailTab, setDetailTab] = useState<"info" | "timeline">("info");
  const [showGlobalTimeline, setShowGlobalTimeline] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedCountry, setSelectedCountry] = useState("all");
  const [selectedState, setSelectedState] = useState("all");
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
  const [undoDoc, setUndoDoc] = useState<{ doc: DocumentPreview; appId: string; timer: ReturnType<typeof setTimeout> } | null>(null);

  // Cover Letters – row expand
  const [rowCLExpanded, setRowCLExpanded] = useState<string | null>(null);
  const [rowCLData, setRowCLData] = useState<Record<string, { id: string; title: string; itBereich?: string; senderAddress?: string; recipientAddress?: string; content?: string }[]>>({});
  const [rowCLLoading, setRowCLLoading] = useState<string | null>(null);
  const [rowCLError, setRowCLError] = useState<string | null>(null);
  const [clPreview, setClPreview] = useState<{ appId: string; application: Application; cl: { id: string; title: string; itBereich?: string; senderAddress?: string; recipientAddress?: string; content?: string } } | null>(null);
  const [clPreviewSaving, setClPreviewSaving] = useState(false);
  const [clDeleting, setClDeleting] = useState<string | null>(null);

  // Nicht-blockierender Confirm-Dialog (ersetzt window.confirm für bessere INP)
  const [confirmDialog, setConfirmDialog] = useState<{
    message: string;
    onConfirm: () => void;
  } | null>(null);

  // Cover Letters – edit modal
  const [editCoverLetters, setEditCoverLetters] = useState<CoverLetterEntry[]>([]);
  const [coverLettersLoading, setCoverLettersLoading] = useState(false);
  const [activeCoverIdx, setActiveCoverIdx] = useState<number | null>(null);

  // Inline-Datepicker "Beworben am"
  const [quickDateId, setQuickDateId] = useState<string | null>(null);
  const [quickDateVal, setQuickDateVal] = useState<string>("");
  const [savingQuickDate, setSavingQuickDate] = useState(false);

  // Schnell-Notiz Modal
  const [notesModalId, setNotesModalId] = useState<string | null>(null);
  const [notesModalValue, setNotesModalValue] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);

  const openNotesModal = (app: Application) => {
    setNotesModalId(app.id);
    setNotesModalValue(app.notesText ?? "");
  };

  const saveNotes = async () => {
    if (!notesModalId || !userId) return;
    setSavingNotes(true);
    try {
      const res = await fetch("/api/applications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: notesModalId, userId, notesText: notesModalValue }),
      });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const updated = await res.json();
      setApplications((prev) => prev.map((a) => (a.id === notesModalId ? { ...a, ...updated } : a)));
      showToast("Notiz gespeichert.");
      setNotesModalId(null);
    } catch (err) {
      showToast("Notiz konnte nicht gespeichert werden.", "error");
    } finally {
      setSavingNotes(false);
    }
  };

  const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
    SAVED: { label: "Gespeichert", color: "bg-gray-100 text-gray-600", icon: ClockIcon },
    APPLIED: { label: "Beworben", color: "bg-blue-100 text-blue-800", icon: ClockIcon },
    INITIATIVE: { label: "Initiativbewerbung", color: "bg-teal-100 text-teal-800", icon: GlobeEuropeAfricaIcon },
    REVIEWED: { label: "Geprüft", color: "bg-purple-100 text-purple-800", icon: EyeIcon },
    TASK_RECEIVED: { label: "Testaufgabe erhalten", color: "bg-orange-100 text-orange-800", icon: CalendarDaysIcon },
    TASK_SUBMITTED: { label: "Testaufgabe eingereicht", color: "bg-amber-100 text-amber-800", icon: CalendarDaysIcon },
    INTERVIEW_SCHEDULED: { label: "Interview geplant", color: "bg-yellow-100 text-yellow-800", icon: CalendarDaysIcon },
    INTERVIEWED: { label: "Interview geführt", color: "bg-indigo-100 text-indigo-800", icon: CalendarDaysIcon },
    OFFER_RECEIVED: { label: "Angebot erhalten", color: "bg-green-100 text-green-800", icon: CalendarDaysIcon },
    NEGOTIATION: { label: "Verhandlung", color: "bg-lime-100 text-lime-800", icon: CalendarDaysIcon },
    ACCEPTED: { label: "Angenommen", color: "bg-emerald-100 text-emerald-800", icon: CalendarDaysIcon },
    REJECTED: { label: "Abgelehnt", color: "bg-red-100 text-red-800", icon: CalendarDaysIcon },
    GHOSTING: { label: "Ghosting", color: "bg-zinc-100 text-zinc-600", icon: CalendarDaysIcon },
    WITHDRAWN: { label: "Zurückgezogen", color: "bg-gray-100 text-gray-800", icon: CalendarDaysIcon },
    OTHER: { label: "Sonstiges", color: "bg-slate-100 text-slate-800", icon: CalendarDaysIcon },
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

  const [sortBy, setSortBy] = useState<"appliedAt" | "status">("appliedAt");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");

  const STATUS_ORDER: Record<string, number> = {
    SAVED: 1,
    APPLIED: 2,
    INITIATIVE: 3,
    REVIEWED: 4,
    TASK_RECEIVED: 5,
    TASK_SUBMITTED: 6,
    INTERVIEW_SCHEDULED: 7,
    INTERVIEWED: 8,
    OFFER_RECEIVED: 9,
    NEGOTIATION: 10,
    ACCEPTED: 11,
    REJECTED: 12,
    GHOSTING: 13,
    WITHDRAWN: 14,
    OTHER: 15,
    PLANNED: 7,
  };

  const handleSortClick = (field: "appliedAt" | "status") => {
    if (sortBy === field) {
      setSortOrder((o) => (o === "desc" ? "asc" : "desc"));
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  const filteredApplications = applications
    .filter((app) => {
      const searchLower = searchTerm.toLowerCase();
      const appliedAtStr = app.appliedAt ? new Date(app.appliedAt).toLocaleDateString("de-DE") : "";
      const matchesSearch =
        app.companyName.toLowerCase().includes(searchLower) ||
        app.position.toLowerCase().includes(searchLower) ||
        app.location.toLowerCase().includes(searchLower) ||
        (app.country || "").toLowerCase().includes(searchLower) ||
        (app.state || "").toLowerCase().includes(searchLower) ||
        (app.itBereich || "").toLowerCase().includes(searchLower) ||
        (app.salary || "").toLowerCase().includes(searchLower) ||
        appliedAtStr.includes(searchTerm);

      const matchesFilter =
        selectedFilter === "all" ||
        (selectedFilter === "inland" && app.isInland) ||
        (selectedFilter === "international" && !app.isInland);

      const matchesStatus =
        selectedStatus === "all" || app.status === selectedStatus;

      const matchesCountry =
        selectedCountry === "all" || (app.country || "") === selectedCountry;

      const matchesState =
        selectedState === "all" || (app.state || "") === selectedState;

      return matchesSearch && matchesFilter && matchesStatus && matchesCountry && matchesState;
    })
    .sort((a, b) => {
      if (sortBy === "status") {
        const sa = STATUS_ORDER[a.status] ?? 99;
        const sb = STATUS_ORDER[b.status] ?? 99;
        return sortOrder === "asc" ? sa - sb : sb - sa;
      }
      const dateA = new Date(a.appliedAt).getTime();
      const dateB = new Date(b.appliedAt).getTime();
      return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
    });

  const loadApplications = async () => {
    if (!userId) return;
    if (isReadOnly && !viewAs) return;
    setLoading(true);
    setError(null);
    try {
      const url = isReadOnly && viewAs
        ? `/api/applications?viewAs=${viewAs}`
        : `/api/applications?userId=${userId}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Fetch failed (${res.status})`);
      const json = await res.json();
      const data = (Array.isArray(json) ? json : (json.applications ?? [])) as Application[];
      const normalized = data.map((app) => {
        const base = app.status === "PLANNED"
          ? { ...app, status: "INTERVIEW_SCHEDULED" }
          : app;
        return { ...base, _clCount: (app as any)._count?.coverLetters ?? app._clCount };
      });
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
  }, [userId, isReadOnly, viewAs]);

  const statusFlow = [
    "SAVED",
    "APPLIED",
    "INITIATIVE",
    "REVIEWED",
    "TASK_RECEIVED",
    "TASK_SUBMITTED",
    "INTERVIEW_SCHEDULED",
    "INTERVIEWED",
    "OFFER_RECEIVED",
    "NEGOTIATION",
    "ACCEPTED",
    "REJECTED",
    "GHOSTING",
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
    setEditCoverLetters([]);
    setActiveCoverIdx(null);
    // Load cover letters async
    setCoverLettersLoading(true);
    fetch(`/api/applications/${app.id}/cover-letters`)
      .then((r) => { if (!r.ok) throw new Error(`Status ${r.status}`); return r.json(); })
      .then((data: { id: string; title: string; itBereich: string | null; senderAddress: string | null; recipientAddress: string | null; content: string }[]) => {
        setEditCoverLetters(
          (Array.isArray(data) ? data : []).map((cl) => ({
            id: cl.id,
            title: cl.title,
            itBereich: cl.itBereich ?? "",
            senderAddress: cl.senderAddress ?? "",
            recipientAddress: cl.recipientAddress ?? "",
            content: cl.content,
          }))
        );
      })
      .catch((err) => {
        console.error("CL-Laden fehlgeschlagen:", err);
        showToast("Anschreiben konnten nicht geladen werden: " + (err?.message ?? ""), "error");
      })
      .finally(() => setCoverLettersLoading(false));
    setEditForm({
      ...app,
      status: app.status === "PLANNED" ? "INTERVIEW_SCHEDULED" : app.status,
      jobUrl: (app as any).jobUrl || "",
      salary: app.salary || "",
      state: app.state || "",
      street: app.street || "",
      zip: app.zip || "",
      appliedAt: app.appliedAt ? new Date(app.appliedAt).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
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
    setDetailTab("info");
  };

  const closeEdit = () => {
    setShowEdit(false);
    setEditingId(null);
    setEditForm({});
    setEditCoverLetters([]);
    setActiveCoverIdx(null);
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
        street: (editForm as any).street || null,
        zip: (editForm as any).zip || null,
        country: editForm.country,
        state: (editForm as any).state || null,
        isInland: editForm.isInland,
        status: editForm.status,
        priority: editForm.priority,
        jobType: (editForm as any).jobType,
        salary: editForm.salary,
        jobUrl: (editForm as any).jobUrl,
        companyUrl: (editForm as any).companyUrl,
        notesText: editForm.notesText,
        requirements: editForm.requirements,
        itBereich: (editForm as any).itBereich || null,
        appliedAt: (editForm as any).appliedAt,
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
      // Save cover letters
      const appId = editingId;
      const saves = editCoverLetters.map(async (cl) => {
        if (cl._deleted && cl.id) {
          const r = await fetch(`/api/applications/${appId}/cover-letters?letterId=${cl.id}`, { method: "DELETE" });
          if (!r.ok) throw new Error(`Anschreiben löschen fehlgeschlagen (${r.status})`);
        } else if (cl._new || !cl.id) {
          const r = await fetch(`/api/applications/${appId}/cover-letters`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: cl.title, itBereich: cl.itBereich || null, senderAddress: cl.senderAddress || null, recipientAddress: cl.recipientAddress || null, content: cl.content ?? "" }),
          });
          if (!r.ok) {
            const errBody = await r.json().catch(() => null);
            throw new Error(errBody?.error ? `${errBody.error} (${r.status})` : `Neues Anschreiben speichern fehlgeschlagen (${r.status})`);
          }
        } else if (cl.id) {
          // Bestehende CLs immer aktualisieren (inkl. Adressfelder), unabhängig vom _dirty-Flag
          const r = await fetch(`/api/applications/${appId}/cover-letters`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ letterId: cl.id, title: cl.title, itBereich: cl.itBereich || null, senderAddress: cl.senderAddress || null, recipientAddress: cl.recipientAddress || null, content: cl.content ?? "" }),
          });
          if (!r.ok) {
            const errBody = await r.json().catch(() => null);
            throw new Error(errBody?.error ? `${errBody.error} (${r.status})` : `Anschreiben aktualisieren fehlgeschlagen (${r.status})`);
          }
        }
      });
      await Promise.all(saves);

      await loadApplications();
      // Expand-Row-Cache für diese Bewerbung leeren, damit beim nächsten Öffnen neu geladen wird
      setRowCLData((prev) => { const n = { ...prev }; delete n[appId!]; return n; });
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

  const handleDelete = (id: string) => {
    if (!userId) return;
    setConfirmDialog({
      message: "Bewerbung wirklich löschen?",
      onConfirm: async () => {
        setConfirmDialog(null);
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
      },
    });
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

  const handleCLPreviewSave = async () => {
    if (!clPreview) return;
    setClPreviewSaving(true);
    const { appId, cl } = clPreview;
    try {
      const method = cl.id ? "PUT" : "POST";
      const body = cl.id
        ? { letterId: cl.id, title: cl.title, itBereich: cl.itBereich || null, senderAddress: cl.senderAddress || null, recipientAddress: cl.recipientAddress || null, content: cl.content ?? "" }
        : { title: cl.title, itBereich: cl.itBereich || null, senderAddress: cl.senderAddress || null, recipientAddress: cl.recipientAddress || null, content: cl.content ?? "" };
      const res = await fetch(`/api/applications/${appId}/cover-letters`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => null);
        throw new Error(errBody?.error ? `${errBody.error} (${res.status})` : `Speichern fehlgeschlagen (${res.status})`);
      }
      const saved = await res.json();
      // Expand-Row-Cache leeren → nächster Expand lädt frisch aus DB
      setRowCLData((prev) => { const n = { ...prev }; delete n[appId]; return n; });
      // Alle gespeicherten Felder in Preview aktualisieren
      setClPreview((p) => p ? {
        ...p,
        cl: {
          ...p.cl,
          id: saved.id,
          title: saved.title,
          itBereich: saved.itBereich ?? "",
          senderAddress: saved.senderAddress ?? "",
          recipientAddress: saved.recipientAddress ?? "",
          content: saved.content ?? "",
        },
      } : p);
      showToast("Anschreiben gespeichert.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Fehler beim Speichern.";
      showToast(message, "error");
    } finally {
      setClPreviewSaving(false);
    }
  };

  const handleDeleteCL = (appId: string, letterId: string) => {
    setConfirmDialog({
      message: "Anschreiben wirklich löschen?",
      onConfirm: async () => {
        setConfirmDialog(null);
        setClDeleting(letterId);
        try {
          const r = await fetch(`/api/applications/${appId}/cover-letters?letterId=${letterId}`, { method: "DELETE" });
          if (!r.ok) throw new Error(`Löschen fehlgeschlagen (${r.status})`);
          setRowCLData((prev) => ({
            ...prev,
            [appId]: (prev[appId] ?? []).filter((c) => c.id !== letterId),
          }));
          setApplications((prev) =>
            prev.map((a) =>
              a.id === appId ? { ...a, _clCount: Math.max(0, (a._clCount ?? 1) - 1) } : a
            )
          );
          setClPreview((p) => (p?.cl.id === letterId ? null : p));
          showToast("Anschreiben gelöscht.");
        } catch (err) {
          showToast(err instanceof Error ? err.message : "Fehler beim Löschen.", "error");
        } finally {
          setClDeleting(null);
        }
      },
    });
  };

  const loadCLForRow = async (applicationId: string) => {
    setRowCLLoading(applicationId);
    setRowCLError(null);
    try {
      const res = await fetch(`/api/applications/${applicationId}/cover-letters`);
      if (!res.ok) throw new Error(`Anschreiben laden fehlgeschlagen (${res.status})`);
      const data = await res.json();
      setRowCLData((prev) => ({ ...prev, [applicationId]: data }));
      setApplications((prev) =>
        prev.map((a) => (a.id === applicationId ? { ...a, _clCount: data.length } : a))
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Anschreiben konnten nicht geladen werden.";
      setRowCLError(message);
    } finally {
      setRowCLLoading(null);
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

  const handleDeleteDoc = (doc: DocumentPreview, appId: string) => {
    // Optimistic: sofort aus UI entfernen
    setRowDocs((prev) => ({
      ...prev,
      [appId]: (prev[appId] ?? []).filter((d) => d.id !== doc.id),
    }));
    setApplications((prev) =>
      prev.map((a) =>
        a.id === appId
          ? { ...a, documents: (a.documents ?? []).filter((d) => d.id !== doc.id) }
          : a
      )
    );
    // Vorherigen Undo-Timer abbrechen und sofort löschen
    if (undoDoc) {
      clearTimeout(undoDoc.timer);
      fetch(`/api/documents?id=${undoDoc.doc.id}`, { method: "DELETE" });
    }
    const timer = setTimeout(async () => {
      await fetch(`/api/documents?id=${doc.id}`, { method: "DELETE" });
      setUndoDoc(null);
    }, 5000);
    setUndoDoc({ doc, appId, timer });
  };

  const handleUndoDeleteDoc = () => {
    if (!undoDoc) return;
    clearTimeout(undoDoc.timer);
    setRowDocs((prev) => ({
      ...prev,
      [undoDoc.appId]: [...(prev[undoDoc.appId] ?? []), undoDoc.doc],
    }));
    setApplications((prev) =>
      prev.map((a) =>
        a.id === undoDoc.appId
          ? { ...a, documents: [...(a.documents ?? []), { id: undoDoc.doc.id }] }
          : a
      )
    );
    setUndoDoc(null);
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

  const handleQuickDateSave = async (appId: string, dateValue: string) => {
    if (!userId || !dateValue) return;
    setSavingQuickDate(true);
    try {
      const res = await fetch("/api/applications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: appId, userId, appliedAt: dateValue }),
      });
      if (!res.ok) throw new Error(`Update fehlgeschlagen (${res.status})`);
      const updated = await res.json();
      setApplications((prev) =>
        prev.map((a) => (a.id === appId ? { ...a, appliedAt: updated.appliedAt ?? dateValue } : a))
      );
      showToast("Datum gespeichert.");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Datum konnte nicht gespeichert werden.", "error");
    } finally {
      setSavingQuickDate(false);
      setQuickDateId(null);
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
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowGlobalTimeline(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg transition-colors"
          >
            <ClockIcon className="w-4 h-4" />
            Gesamter Verlauf
          </button>
          <button
            onClick={() => (window.location.href = "/applications/new")}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            disabled={!userId}
            style={isReadOnly ? { display: "none" } : undefined}
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            Neue Bewerbung
          </button>
        </div>
      </div>

      {undoDoc && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white rounded-lg px-4 py-3 flex items-center gap-3 shadow-xl">
          <span className="text-sm">Dokument &bdquo;{undoDoc.doc.name}&ldquo; gelöscht</span>
          <button
            onClick={handleUndoDeleteDoc}
            className="text-blue-400 hover:text-blue-300 text-sm font-semibold underline"
          >
            Rückgängig
          </button>
        </div>
      )}

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

      {/* Nicht-blockierender Confirm-Dialog (ersetzt window.confirm) */}
      {confirmDialog && (
        <div
          className="fixed inset-0 z-9999 flex items-center justify-center bg-black/40"
          role="dialog"
          aria-modal="true"
          aria-label="Bestätigung"
        >
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl p-6 max-w-sm w-full mx-4">
            <p className="text-gray-900 dark:text-white font-medium mb-6">{confirmDialog.message}</p>
            <div className="flex justify-end gap-3">
              <button
                className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
                onClick={() => setConfirmDialog(null)}
              >
                Abbrechen
              </button>
              <button
                className="px-4 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700"
                onClick={confirmDialog.onConfirm}
              >
                Löschen
              </button>
            </div>
          </div>
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
                      {appA.itBereich && <p className="text-xs text-indigo-500">{appA.itBereich}</p>}
                      <p className="text-xs text-gray-400">
                        {appA.appliedAt ? new Date(appA.appliedAt).toLocaleDateString("de-DE") : "–"}
                      </p>
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
                      {appB.itBereich && <p className="text-xs text-indigo-500">{appB.itBereich}</p>}
                      <p className="text-xs text-gray-400">
                        {appB.appliedAt ? new Date(appB.appliedAt).toLocaleDateString("de-DE") : "–"}
                      </p>
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
                placeholder="Nach Firma, Position, Ort, Land, Bundesland, IT-Bereich, Gehalt, Datum suchen..."
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
              <option value="SAVED">Gespeichert</option>
              <option value="APPLIED">Beworben</option>
              <option value="INITIATIVE">Initiativbewerbung</option>
              <option value="REVIEWED">Geprüft</option>
              <option value="TASK_RECEIVED">Testaufgabe erhalten</option>
              <option value="TASK_SUBMITTED">Testaufgabe eingereicht</option>
              <option value="INTERVIEW_SCHEDULED">Interview geplant</option>
              <option value="INTERVIEWED">Interview geführt</option>
              <option value="OFFER_RECEIVED">Angebot erhalten</option>
              <option value="NEGOTIATION">Verhandlung</option>
              <option value="ACCEPTED">Angenommen</option>
              <option value="REJECTED">Abgelehnt</option>
              <option value="GHOSTING">Ghosting</option>
              <option value="WITHDRAWN">Zurückgezogen</option>
              <option value="OTHER">Sonstiges</option>
            </select>
          </div>

          {/* Land Filter */}
          <div>
            <select
              value={selectedCountry}
              onChange={(e) => { setSelectedCountry(e.target.value); setSelectedState("all"); }}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
            >
              <option value="all">Alle Länder</option>
              <option value="Deutschland">Deutschland</option>
              <option value="Österreich">Österreich</option>
              <option value="Schweiz">Schweiz</option>
              <option value="Luxemburg">Luxemburg</option>
              <option value="Niederlande">Niederlande</option>
              <option value="Belgien">Belgien</option>
              <option value="Frankreich">Frankreich</option>
              <option value="Italien">Italien</option>
              <option value="Spanien">Spanien</option>
              <option value="Portugal">Portugal</option>
              <option value="Polen">Polen</option>
              <option value="Tschechien">Tschechien</option>
              <option value="Ungarn">Ungarn</option>
              <option value="Rumänien">Rumänien</option>
              <option value="Schweden">Schweden</option>
              <option value="Norwegen">Norwegen</option>
              <option value="Dänemark">Dänemark</option>
              <option value="Finnland">Finnland</option>
              <option value="Irland">Irland</option>
              <option value="Vereinigtes Königreich">Vereinigtes Königreich</option>
              <option value="Griechenland">Griechenland</option>
              <option value="Kroatien">Kroatien</option>
              <option value="Slowenien">Slowenien</option>
              <option value="Slowakei">Slowakei</option>
              <option value="USA">USA</option>
              <option value="Kanada">Kanada</option>
              <option value="Australien">Australien</option>
              <option value="Sonstiges">Sonstiges</option>
            </select>
          </div>

          {/* Bundesland / Kanton Filter */}
          {(() => {
            const allStatesByCountry: Record<string, string[]> = {
              Deutschland: ["Baden-Württemberg","Bayern","Berlin","Brandenburg","Bremen","Hamburg","Hessen","Mecklenburg-Vorpommern","Niedersachsen","Nordrhein-Westfalen","Rheinland-Pfalz","Saarland","Sachsen","Sachsen-Anhalt","Schleswig-Holstein","Thüringen"],
              Österreich: ["Burgenland","Kärnten","Niederösterreich","Oberösterreich","Salzburg","Steiermark","Tirol","Vorarlberg","Wien"],
              Schweiz: ["Aargau","Appenzell Ausserrhoden","Appenzell Innerrhoden","Basel-Landschaft","Basel-Stadt","Bern","Freiburg","Genf","Glarus","Graubünden","Jura","Luzern","Neuenburg","Nidwalden","Obwalden","Schaffhausen","Schwyz","Solothurn","St. Gallen","Tessin","Thurgau","Uri","Waadt","Wallis","Zug","Zürich"],
              Luxemburg: ["Capellen","Clervaux","Diekirch","Echternach","Esch-sur-Alzette","Grevenmacher","Luxemburg","Mersch","Redange","Remich","Vianden","Wiltz"],
            };
            const stateList = selectedCountry !== "all" ? (allStatesByCountry[selectedCountry] ?? []) : [];
            if (stateList.length === 0) return null;
            const isKanton = selectedCountry === "Schweiz" || selectedCountry === "Luxemburg";
            return (
              <div>
                <select
                  value={selectedState}
                  onChange={(e) => setSelectedState(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
                >
                  <option value="all">{isKanton ? "Alle Kantone" : "Alle Bundesländer"}</option>
                  {stateList.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Applications Table */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
        {showEdit && editingId && (
          <div className="fixed inset-0 bg-black/40 z-30 flex items-center justify-center px-4 py-6">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl border border-gray-200 relative flex flex-col max-h-[90vh]">
              <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100 shrink-0">
                <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                  <PencilSquareIcon className="w-5 h-5 mr-2 text-indigo-600" />
                  Bewerbung bearbeiten
                </h3>
                <button
                  className="text-gray-500 hover:text-gray-700"
                  onClick={closeEdit}
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
              <div className="overflow-y-auto p-6">
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">IT-Bereich</label>
                  <select
                    name="itBereich"
                    value={(editForm as any).itBereich || ""}
                    onChange={handleEditChange}
                    className="w-full px-3 py-2 border text-gray-800 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  >
                    {IT_BEREICHE_OPTIONS.map((b) => (
                      <option key={b.value} value={b.value}>{b.label}</option>
                    ))}
                  </select>
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
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Straße &amp; Hausnummer</label>
                  <input
                    name="street"
                    value={(editForm as any).street || ""}
                    onChange={handleEditChange}
                    placeholder="z.B. Musterstraße 42"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Postleitzahl (PLZ)</label>
                  <input
                    name="zip"
                    value={(editForm as any).zip || ""}
                    onChange={handleEditChange}
                    maxLength={10}
                    placeholder="z.B. 07743"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Land</label>
                  <select
                    name="country"
                    value={editForm.country || "Deutschland"}
                    onChange={handleEditChange}
                    className="w-full px-3 py-2 border text-gray-800 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {[
                      "Deutschland", "Österreich", "Schweiz", "Luxemburg",
                      "Niederlande", "Belgien", "Frankreich", "Italien", "Spanien", "Portugal",
                      "Polen", "Tschechien", "Ungarn", "Rumänien",
                      "Schweden", "Norwegen", "Dänemark", "Finnland",
                      "Irland", "Vereinigtes Königreich",
                      "Griechenland", "Kroatien", "Slowenien", "Slowakei",
                      "Estland", "Lettland", "Litauen",
                      "USA", "Kanada", "Australien", "Neuseeland",
                      "Singapur", "Vereinigte Arabische Emirate", "Sonstiges",
                    ].map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                {(() => {
                  const statesByCountry: Record<string, string[]> = {
                    Deutschland: ["Baden-Württemberg","Bayern","Berlin","Brandenburg","Bremen","Hamburg","Hessen","Mecklenburg-Vorpommern","Niedersachsen","Nordrhein-Westfalen","Rheinland-Pfalz","Saarland","Sachsen","Sachsen-Anhalt","Schleswig-Holstein","Thüringen"],
                    Österreich: ["Burgenland","Kärnten","Niederösterreich","Oberösterreich","Salzburg","Steiermark","Tirol","Vorarlberg","Wien"],
                    Schweiz: ["Aargau","Appenzell Ausserrhoden","Appenzell Innerrhoden","Basel-Landschaft","Basel-Stadt","Bern","Freiburg","Genf","Glarus","Graubünden","Jura","Luzern","Neuenburg","Nidwalden","Obwalden","Schaffhausen","Schwyz","Solothurn","St. Gallen","Tessin","Thurgau","Uri","Waadt","Wallis","Zug","Zürich"],
                    Luxemburg: ["Capellen","Clervaux","Diekirch","Echternach","Esch-sur-Alzette","Grevenmacher","Luxemburg","Mersch","Redange","Remich","Vianden","Wiltz"],
                  };
                  const states = statesByCountry[editForm.country || ""] ?? [];
                  if (states.length === 0) return null;
                  return (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {editForm.country === "Schweiz" || editForm.country === "Luxemburg" ? "Kanton" : "Bundesland"}
                      </label>
                      <select
                        name="state"
                        value={(editForm as any).state || ""}
                        onChange={handleEditChange}
                        className="w-full px-3 py-2 border text-gray-800 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">
                          {editForm.country === "Schweiz" || editForm.country === "Luxemburg" ? "Kanton wählen…" : "Bundesland wählen…"}
                        </option>
                        {states.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  );
                })()}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    name="status"
                    value={editForm.status || "APPLIED"}
                    onChange={handleEditChange}
                    className="w-full px-3 py-2 border text-gray-800 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="SAVED">Gespeichert</option>
                    <option value="APPLIED">Beworben</option>
                    <option value="INITIATIVE">Initiativbewerbung</option>
                    <option value="REVIEWED">Geprüft</option>
                    <option value="TASK_RECEIVED">Testaufgabe erhalten</option>
                    <option value="TASK_SUBMITTED">Testaufgabe eingereicht</option>
                    <option value="INTERVIEW_SCHEDULED">Interview geplant</option>
                    <option value="INTERVIEWED">Interview geführt</option>
                    <option value="OFFER_RECEIVED">Angebot erhalten</option>
                    <option value="NEGOTIATION">Verhandlung</option>
                    <option value="ACCEPTED">Angenommen</option>
                    <option value="REJECTED">Abgelehnt</option>
                    <option value="GHOSTING">Ghosting</option>
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
                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-1">Beworben am</label>
                  <input
                    type="date"
                    name="appliedAt"
                    value={(editForm as any).appliedAt || ""}
                    onChange={handleEditChange}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-1">Firmen-URL</label>
                  <input
                    name="companyUrl"
                    value={(editForm as any).companyUrl || ""}
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
              <div className="mt-4 grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stellenbeschreibung / Notizen</label>
                  <textarea
                    name="notesText"
                    value={editForm.notesText || ""}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, notesText: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Beschreibung der Position..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Anforderungen</label>
                  <textarea
                    name="requirements"
                    value={editForm.requirements || ""}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, requirements: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Erforderliche Qualifikationen..."
                  />
                </div>

                {/* ─── Bewerbungsanschreiben ─── */}
                <div className="border-t border-gray-200 pt-5">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                      <DocumentTextIcon className="h-5 w-5 text-blue-500" />
                      Bewerbungsanschreiben
                      <span className="ml-1 text-xs font-normal text-gray-400">
                        ({editCoverLetters.filter((cl) => !cl._deleted).length})
                      </span>
                    </h4>
                    <button
                      type="button"
                      onClick={() => {
                        const idx = editCoverLetters.length;
                        setEditCoverLetters((prev) => [
                          ...prev,
                          { title: `Anschreiben ${prev.filter(c => !c._deleted).length + 1}`, itBereich: "", content: "", _new: true },
                        ]);
                        setActiveCoverIdx(idx);
                      }}
                      className="flex items-center gap-1 text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      <PlusIcon className="h-3.5 w-3.5" /> Neu
                    </button>
                  </div>

                  {coverLettersLoading ? (
                    <p className="text-xs text-gray-400">Lade Anschreiben...</p>
                  ) : editCoverLetters.filter((cl) => !cl._deleted).length === 0 ? (
                    <p className="text-xs text-gray-400 italic">Noch keine Anschreiben gespeichert.</p>
                  ) : (
                    <div className="space-y-2 mb-3">
                      {editCoverLetters.map((cl, idx) =>
                        cl._deleted ? null : (
                          <div
                            key={idx}
                            className={`flex items-center justify-between px-3 py-2 rounded-lg border cursor-pointer ${
                              activeCoverIdx === idx
                                ? "border-blue-500 bg-blue-50"
                                : "border-gray-200 hover:border-gray-300"
                            }`}
                            onClick={() => setActiveCoverIdx(activeCoverIdx === idx ? null : idx)}
                          >
                            <div className="min-w-0">
                              <span className="text-sm font-medium text-gray-800 truncate block">{cl.title || "Anschreiben"}</span>
                              {cl.itBereich && (
                                <span className="text-xs text-blue-600">
                                  {IT_BEREICHE_OPTIONS.find((b) => b.value === cl.itBereich)?.label ?? cl.itBereich}
                                </span>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditCoverLetters((prev) =>
                                  prev.map((c, i) => (i === idx ? { ...c, _deleted: true } : c))
                                );
                                if (activeCoverIdx === idx) setActiveCoverIdx(null);
                              }}
                              className="ml-2 text-red-400 hover:text-red-600 shrink-0"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        )
                      )}
                    </div>
                  )}

                  {/* Editor für ausgewähltes Anschreiben */}
                  {activeCoverIdx !== null && editCoverLetters[activeCoverIdx] && !editCoverLetters[activeCoverIdx]._deleted && (() => {
                    const cl = editCoverLetters[activeCoverIdx];
                    const update = (patch: Partial<CoverLetterEntry>) =>
                      setEditCoverLetters((prev) =>
                        prev.map((c, i) =>
                          i === activeCoverIdx ? { ...c, ...patch, _dirty: true } : c
                        )
                      );
                    return (
                      <div className="border border-blue-200 rounded-lg p-4 bg-blue-50/30 space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label htmlFor={`cl-title-${activeCoverIdx}`} className="block text-xs font-medium text-gray-700 mb-1">Titel</label>
                            <input
                              id={`cl-title-${activeCoverIdx}`}
                              name="cl-title"
                              autoComplete="off"
                              value={cl.title}
                              onChange={(e) => update({ title: e.target.value })}
                              className="w-full px-2 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="z.B. Version 1 – formell"
                            />
                          </div>
                          <div>
                            <label htmlFor={`cl-it-bereich-${activeCoverIdx}`} className="block text-xs font-medium text-gray-700 mb-1">IT-Bereich</label>
                            <select
                              id={`cl-it-bereich-${activeCoverIdx}`}
                              name="cl-it-bereich"
                              value={cl.itBereich}
                              onChange={(e) => update({ itBereich: e.target.value })}
                              className="w-full px-2 py-1.5 text-sm border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                              {IT_BEREICHE_OPTIONS.map((b) => (
                                <option key={b.value} value={b.value}>{b.label}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label htmlFor={`cl-sender-${activeCoverIdx}`} className="block text-xs font-medium text-gray-700 mb-1">Absender-Adresse</label>
                            <textarea
                              id={`cl-sender-${activeCoverIdx}`}
                              name="cl-sender-address"
                              autoComplete="off"
                              value={cl.senderAddress ?? ""}
                              onChange={(e) => update({ senderAddress: e.target.value })}
                              rows={4}
                              className="w-full px-2 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Max Mustermann&#10;Musterstraße 1&#10;12345 Musterstadt"
                            />
                          </div>
                          <div>
                            <label htmlFor={`cl-recipient-${activeCoverIdx}`} className="block text-xs font-medium text-gray-700 mb-1">Empfänger-Adresse</label>
                            <textarea
                              id={`cl-recipient-${activeCoverIdx}`}
                              name="cl-recipient-address"
                              autoComplete="off"
                              value={cl.recipientAddress ?? ""}
                              onChange={(e) => update({ recipientAddress: e.target.value })}
                              rows={4}
                              className="w-full px-2 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Muster GmbH&#10;z.Hd. Frau Muster&#10;Firmenstraße 2&#10;54321 Firmenstadt"
                            />
                          </div>
                        </div>
                        <div>
                          <label htmlFor={`cl-content-${activeCoverIdx}`} className="block text-xs font-medium text-gray-700 mb-1">Anschreiben-Text</label>
                          <textarea
                            id={`cl-content-${activeCoverIdx}`}
                            name="cl-content"
                            autoComplete="off"
                            value={cl.content}
                            onChange={(e) => update({ content: e.target.value })}
                            rows={12}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono leading-relaxed"
                            placeholder="Sehr geehrte Damen und Herren,"
                          />
                          <p className="text-xs text-gray-400 mt-0.5">{cl.content.length} Zeichen</p>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
              </div>
              <div className="shrink-0 px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
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
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none hover:text-gray-700"
                  onClick={() => handleSortClick("status")}
                >
                  <span className="flex items-center gap-1">
                    Status
                    {sortBy === "status" ? (
                      sortOrder === "asc" ? <ChevronUpIcon className="w-3 h-3" /> : <ChevronDownIcon className="w-3 h-3" />
                    ) : (
                      <ChevronUpIcon className="w-3 h-3 opacity-30" />
                    )}
                  </span>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priorität
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none hover:text-gray-700"
                  onClick={() => handleSortClick("appliedAt")}
                >
                  <span className="flex items-center gap-1">
                    Beworben am
                    {sortBy === "appliedAt" ? (
                      sortOrder === "desc" ? <ChevronDownIcon className="w-3 h-3" /> : <ChevronUpIcon className="w-3 h-3" />
                    ) : (
                      <ChevronUpIcon className="w-3 h-3 opacity-30" />
                    )}
                  </span>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Gehalt
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Anschreiben
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
                          {application.itBereich && (
                            <div className="text-xs text-indigo-500 mt-0.5">
                              {application.itBereich}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-start">
                          {application.isInland ? (
                            <HomeIcon className="w-4 h-4 text-blue-500 mr-2 mt-0.5 shrink-0" />
                          ) : (
                            <GlobeEuropeAfricaIcon className="w-4 h-4 text-purple-500 mr-2 mt-0.5 shrink-0" />
                          )}
                          <div>
                            <div className="text-sm text-gray-900">
                              {application.location}
                            </div>
                            {application.street && (
                              <div className="text-xs text-gray-500">
                                {application.street}
                              </div>
                            )}
                            {application.zip && (
                              <div className="text-xs text-gray-500">
                                {application.zip}
                              </div>
                            )}
                            {application.state && (
                              <div className="text-xs text-gray-400">
                                {application.state}
                              </div>
                            )}
                            <div className="text-xs text-gray-400">
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
                      <td className="px-6 py-4 whitespace-nowrap">
                        {quickDateId === application.id ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="date"
                              className="text-xs border border-blue-400 rounded px-1.5 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-800"
                              value={quickDateVal}
                              onChange={(e) => setQuickDateVal(e.target.value)}
                              autoFocus
                            />
                            <button
                              type="button"
                              disabled={savingQuickDate}
                              onClick={() => handleQuickDateSave(application.id, quickDateVal)}
                              className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-60"
                            >
                              {savingQuickDate ? "…" : "OK"}
                            </button>
                            <button
                              type="button"
                              onClick={() => setQuickDateId(null)}
                              className="text-xs px-1.5 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <>
                          <button
                            type="button"
                            title="Klicken zum Ändern"
                            onClick={() => {
                              const val = application.appliedAt
                                ? new Date(application.appliedAt).toISOString().slice(0, 10)
                                : new Date().toISOString().slice(0, 10);
                              setQuickDateVal(val);
                              setQuickDateId(application.id);
                            }}
                            className="flex items-center gap-1 text-sm text-gray-900 hover:text-blue-600 hover:underline group"
                          >
                            <CalendarDaysIcon className="w-3.5 h-3.5 text-gray-400 group-hover:text-blue-500" />
                            {formatDate(application.appliedAt)}
                          </button>
                          {(() => {
                            const siblings = applications.filter(
                              (a) =>
                                a.id !== application.id &&
                                a.companyName.toLowerCase() === application.companyName.toLowerCase()
                            );
                            return siblings.length > 0 ? (
                              <span
                                title={siblings.map((s) => `${s.position} (${formatDate(s.appliedAt)})`).join("\n")}
                                className="mt-1 inline-block text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200 cursor-default"
                              >
                                +{siblings.length} weitere Bewerbung{siblings.length > 1 ? "en" : ""}
                              </span>
                            ) : null;
                          })()}
                          </>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {application.salary || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          className="flex items-center gap-1 text-blue-600 hover:text-blue-900"
                          title="Anschreiben anzeigen"
                          onClick={() => {
                            const isOpen = rowCLExpanded === application.id;
                            setRowCLExpanded(isOpen ? null : application.id);
                            if (!isOpen && !rowCLData[application.id]) {
                              loadCLForRow(application.id);
                            }
                          }}
                        >
                          <DocumentTextIcon className="w-4 h-4" />
                          {(() => {
                            const count = rowCLData[application.id]?.length ?? application._clCount;
                            return count !== undefined ? (
                              <span className={`text-xs font-bold rounded-full px-1 leading-none ${
                                count > 0 ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-400"
                              }`}>{count}</span>
                            ) : (
                              <span className="text-xs text-gray-400">–</span>
                            );
                          })()}
                        </button>
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
                            className="relative text-yellow-600 hover:text-yellow-800 p-1"
                            title={application.notesText?.trim() ? `Notiz: ${application.notesText.slice(0, 60)}…` : "Notiz hinzufügen"}
                            onClick={() => openNotesModal(application)}
                            style={isReadOnly ? { display: "none" } : undefined}
                          >
                            <ChatBubbleLeftEllipsisIcon className="w-4 h-4" />
                            {application.notesText?.trim() && (
                              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-yellow-400 rounded-full" />
                            )}
                          </button>
                          <button
                            className="text-indigo-500 hover:text-indigo-800 p-1"
                            title="Timeline öffnen"
                            onClick={() => {
                              setDetailApp(application);
                              setDetailTab("timeline");
                              setShowDetail(true);
                            }}
                          >
                            <ClockIcon className="w-4 h-4" />
                          </button>
                          <button
                            className="text-purple-600 hover:text-purple-900 p-1"
                            title="Anschreiben (Panel)"
                            onClick={() => {
                              const isOpen = rowCLExpanded === application.id;
                              setRowCLExpanded(isOpen ? null : application.id);
                              if (!isOpen && !rowCLData[application.id]) {
                                loadCLForRow(application.id);
                              }
                            }}
                          >
                            <DocumentTextIcon className="w-4 h-4" />
                          </button>
                          <button
                            className="text-teal-600 hover:text-teal-800 p-1"
                            title="Novoresume Anschreiben erstellen"
                            style={isReadOnly ? { display: "none" } : undefined}
                            onClick={() => {
                              const params = new URLSearchParams({
                                mode: "novoresume",
                                company: application.companyName,
                                position: application.position,
                              });
                              router.push(`/anschreiben?${params.toString()}`);
                            }}
                          >
                            <DocumentTextIcon className="w-4 h-4" />
                            <span className="text-xs leading-none ml-0.5 font-semibold">NR</span>
                          </button>
                          <button
                            className="text-orange-500 hover:text-orange-700 p-1 flex items-center gap-0.5"
                            title="Lebenslauf (Novoresume Template) öffnen"
                            onClick={() => router.push("/lebenslauf")}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                            </svg>
                            <span className="text-xs leading-none font-semibold">CV</span>
                          </button>
                          <button
                            className="text-gray-600 hover:text-gray-900 p-1 flex items-center gap-0.5"
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
                            {(() => {
                              const count =
                                rowDocs[application.id]?.length ??
                                application.documents?.length;
                              return count !== undefined ? (
                                <span className={`text-xs font-bold rounded-full px-1 leading-none ${
                                  count > 0
                                    ? "bg-blue-100 text-blue-700"
                                    : "bg-gray-100 text-gray-400"
                                }`}>{count}</span>
                              ) : null;
                            })()}
                          </button>
                          <button
                            className="text-green-600 hover:text-green-800 p-1"
                            title="Dokument hochladen / anzeigen"
                            onClick={() => openUploadModal(application)}
                            style={isReadOnly ? { display: "none" } : undefined}
                          >
                            <CloudArrowUpIcon className="w-4 h-4" />
                          </button>
                          <button
                            className="text-indigo-600 hover:text-indigo-900 p-1 disabled:opacity-60"
                            onClick={() => openEdit(application)}
                            title="Bearbeiten"
                            style={isReadOnly ? { display: "none" } : undefined}
                          >
                            <PencilSquareIcon className="w-4 h-4" />
                          </button>
                          <button
                            className="text-gray-600 hover:text-gray-900 p-1 disabled:opacity-60"
                            onClick={() => handleUpdateStatus(application)}
                            disabled={updatingId === application.id}
                            title="Status vorwärts schieben"
                            style={isReadOnly ? { display: "none" } : undefined}
                          >
                            <ArrowPathIcon className="w-4 h-4" />
                          </button>
                          <button
                            className="text-red-600 hover:text-red-900 p-1 disabled:opacity-60"
                            onClick={() => handleDelete(application.id)}
                            disabled={deletingId === application.id}
                            title="Löschen"
                            style={isReadOnly ? { display: "none" } : undefined}
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {rowCLExpanded === application.id && (
                      <tr>
                        <td colSpan={8} className="bg-blue-50 px-6 py-4 text-sm">
                          <div className="flex items-center gap-2 mb-2">
                            <DocumentTextIcon className="w-4 h-4 text-blue-500" />
                            <span className="font-semibold text-blue-800">Bewerbungsanschreiben</span>
                          </div>
                          {rowCLLoading === application.id && <p className="text-gray-500">Lade…</p>}
                          {rowCLError && <p className="text-red-600">{rowCLError}</p>}
                          {rowCLLoading !== application.id && !rowCLError && (
                            rowCLData[application.id]?.length ? (
                              <div className="flex flex-wrap gap-2">
                                {rowCLData[application.id].map((cl) => (
                                  <div
                                    key={cl.id}
                                    className="group flex items-center gap-1.5 bg-white border border-blue-200 rounded-lg px-3 py-1.5 cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
                                    onClick={() => setClPreview({ appId: application.id, application, cl })}
                                    title="Vorschau öffnen"
                                  >
                                    <DocumentTextIcon className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                                    <span className="text-sm font-medium text-gray-800">{cl.title}</span>
                                    {cl.itBereich && (
                                      <span className="text-xs text-blue-500 bg-blue-50 rounded px-1">
                                        {IT_BEREICHE_OPTIONS.find((b) => b.value === cl.itBereich)?.label ?? cl.itBereich}
                                      </span>
                                    )}
                                    <PencilSquareIcon
                                      className="w-3.5 h-3.5 text-gray-300 group-hover:text-blue-500 shrink-0 ml-1"
                                      onClick={(e) => { e.stopPropagation(); setClPreview({ appId: application.id, application, cl }); }}
                                      title="Anschreiben bearbeiten"
                                      style={isReadOnly ? { display: "none" } : undefined}
                                    />
                                    <TrashIcon
                                      className="w-3.5 h-3.5 text-gray-300 group-hover:text-red-400 shrink-0"
                                      onClick={(e) => { e.stopPropagation(); handleDeleteCL(application.id, cl.id); }}
                                      title="Anschreiben löschen"
                                      style={isReadOnly ? { display: "none" } : undefined}
                                    />
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-gray-500 italic">Keine Anschreiben für diese Bewerbung.</p>
                            )
                          )}
                        </td>
                      </tr>
                    )}
                    {rowDocsExpanded === application.id && (
                      <tr>
                        <td colSpan={8} className="bg-gray-50 px-6 py-4 text-sm text-gray-800">
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
                                        <button
                                          type="button"
                                          onClick={() => handleDeleteDoc(doc, application.id)}
                                          title="Dokument löschen"
                                          className="text-red-400 hover:text-red-600 transition-colors p-1"
                                          style={isReadOnly ? { display: "none" } : undefined}
                                        >
                                          <TrashIcon className="w-3.5 h-3.5" />
                                        </button>
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
            {/* Tabs */}
            <div className="flex border-b border-gray-200 dark:border-slate-700 px-6">
              <button
                onClick={() => setDetailTab("info")}
                className={`py-2 px-4 text-sm font-medium border-b-2 transition-colors ${
                  detailTab === "info"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
              >
                Informationen
              </button>
              <button
                onClick={() => setDetailTab("timeline")}
                className={`py-2 px-4 text-sm font-medium border-b-2 transition-colors ${
                  detailTab === "timeline"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
              >
                Timeline
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-6">
              {detailTab === "timeline" ? (
                <ApplicationTimeline
                  applicationId={detailApp.id}
                  applicationName={`${detailApp.position} @ ${detailApp.companyName}`}
                  itBereich={detailApp.itBereich}
                  currentStatus={detailApp.status}
                  viewAs={viewAs}
                />
              ) : (
                <>
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

              {(() => {
                const siblings = applications.filter(
                  (a) =>
                    a.id !== detailApp.id &&
                    a.companyName.toLowerCase() === detailApp.companyName.toLowerCase()
                );
                if (siblings.length === 0) return null;
                return (
                  <div className="mt-6 border border-amber-200 dark:border-amber-700/50 rounded-lg p-4 bg-amber-50 dark:bg-amber-900/20">
                    <p className="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-3">
                      Weitere Bewerbungen bei {detailApp.companyName}
                    </p>
                    <ul className="space-y-2">
                      {siblings.map((s) => (
                        <li key={s.id} className="flex items-center justify-between text-sm">
                          <button
                            type="button"
                            className="text-left text-blue-700 dark:text-blue-400 hover:underline font-medium"
                            onClick={() => { setDetailApp(s); setDetailTab("info"); }}
                          >
                            {s.position}
                          </button>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500 dark:text-slate-400">
                              Beworben am {formatDate(s.appliedAt)}
                            </span>
                            {getStatusBadge(s.status)}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })()}

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
                </>
            )}
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

      {/* CL Vorschau / Editor Modal */}
      {clPreview && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setClPreview(null)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start gap-3 px-6 py-4 border-b border-gray-100">
              <DocumentTextIcon className="w-5 h-5 text-blue-500 mt-1 shrink-0" />
              <div className="flex-1 min-w-0">
                <input
                  className="w-full text-lg font-semibold text-gray-900 bg-transparent border-0 border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none px-0 leading-tight"
                  value={clPreview.cl.title}
                  onChange={(e) => setClPreview((p) => p ? { ...p, cl: { ...p.cl, title: e.target.value } } : p)}
                  placeholder="Titel"
                />
                <div className="flex items-center gap-3 mt-1.5">
                  <select
                    value={clPreview.cl.itBereich ?? ""}
                    onChange={(e) => setClPreview((p) => p ? { ...p, cl: { ...p.cl, itBereich: e.target.value } } : p)}
                    className="text-xs border border-gray-200 rounded px-2 py-0.5 bg-white text-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    {IT_BEREICHE_OPTIONS.map((b) => (
                      <option key={b.value} value={b.value}>{b.label}</option>
                    ))}
                  </select>
                  <span className="text-xs text-gray-400">{clPreview.application.companyName} · {clPreview.application.position}</span>
                </div>
              </div>
              <button onClick={() => setClPreview(null)} className="text-gray-400 hover:text-gray-600 p-1 shrink-0">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Absender</label>
                  <textarea
                    value={clPreview.cl.senderAddress ?? ""}
                    onChange={(e) => setClPreview((p) => p ? { ...p, cl: { ...p.cl, senderAddress: e.target.value } } : p)}
                    rows={4}
                    className="w-full resize-none border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Max Mustermann&#10;Musterstraße 1&#10;12345 Musterstadt"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Empfänger</label>
                  <textarea
                    value={clPreview.cl.recipientAddress ?? ""}
                    onChange={(e) => setClPreview((p) => p ? { ...p, cl: { ...p.cl, recipientAddress: e.target.value } } : p)}
                    rows={4}
                    className="w-full resize-none border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Muster GmbH&#10;z.Hd. Frau Muster&#10;Firmenstraße 2"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Inhalt</label>
                <textarea
                  value={clPreview.cl.content ?? ""}
                  onChange={(e) => setClPreview((p) => p ? { ...p, cl: { ...p.cl, content: e.target.value } } : p)}
                  rows={14}
                  className="w-full resize-none border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 font-sans leading-relaxed focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Sehr geehrte Damen und Herren,"
                />
                <p className="text-xs text-gray-400 mt-1">{(clPreview.cl.content ?? "").length} Zeichen</p>
              </div>
            </div>
            <div className="shrink-0 px-6 py-4 border-t border-gray-100 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <button
                  className="text-sm text-gray-500 hover:text-gray-700 px-3 py-2"
                  onClick={() => setClPreview(null)}
                >
                  Schließen
                </button>
                {clPreview.cl.id && !isReadOnly && (
                  <button
                    className="text-sm text-red-500 hover:text-red-700 px-3 py-2 flex items-center gap-1 disabled:opacity-50"
                    disabled={clDeleting === clPreview.cl.id}
                    onClick={() => handleDeleteCL(clPreview.appId, clPreview.cl.id!)}
                  >
                    {clDeleting === clPreview.cl.id
                      ? <ArrowPathIcon className="w-4 h-4 animate-spin" />
                      : <TrashIcon className="w-4 h-4" />}
                    Löschen
                  </button>
                )}
              </div>
              {!isReadOnly && (
              <button
                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-sm flex items-center gap-2 disabled:opacity-60"
                disabled={clPreviewSaving}
                onClick={handleCLPreviewSave}
              >
                {clPreviewSaving && <ArrowPathIcon className="w-4 h-4 animate-spin" />}
                Speichern
              </button>
              )}
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

      {/* Globale Timeline – Vollbild-Modal */}
      {showGlobalTimeline && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 overflow-y-auto pt-6 pb-12">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-3xl mx-4 min-h-[60vh] flex flex-col">
            {/* Modal-Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <ClockIcon className="w-5 h-5 text-indigo-600" />
                <span className="font-bold text-gray-900 dark:text-white text-lg">Gesamter Bewerbungsverlauf</span>
              </div>
              <button
                onClick={() => setShowGlobalTimeline(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Schließen"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            {/* Modal-Body */}
            <div className="p-6 overflow-y-auto">
              <GlobalApplicationTimeline
                viewAs={viewAs}
                onOpenApplication={(applicationId) => {
                  const app = applications.find((a) => a.id === applicationId);
                  if (app) {
                    setShowGlobalTimeline(false);
                    setDetailApp(app);
                    setDetailTab("timeline");
                    setShowDetail(true);
                  }
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Schnell-Notiz Modal ─────────────────────────────────────────── */}
      {notesModalId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setNotesModalId(null)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <ChatBubbleLeftEllipsisIcon className="w-5 h-5 text-yellow-500" />
                <h2 className="text-lg font-semibold text-gray-800">
                  Notiz — {applications.find((a) => a.id === notesModalId)?.companyName}
                </h2>
              </div>
              <button onClick={() => setNotesModalId(null)} className="text-gray-400 hover:text-gray-600 p-1">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-5">
              <label className="block text-sm font-medium text-gray-700 mb-2">Notizen zu diesem Unternehmen</label>
              <textarea
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-yellow-400 resize-y"
                rows={7}
                placeholder="Eigene Notizen, Gesprächsnotizen, Kontaktpersonen, Besonderheiten…"
                value={notesModalValue}
                onChange={(e) => setNotesModalValue(e.target.value)}
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-3 px-6 pb-5">
              <button
                onClick={() => setNotesModalId(null)}
                className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Abbrechen
              </button>
              <button
                onClick={saveNotes}
                disabled={savingNotes}
                className="px-5 py-2 rounded-lg bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-semibold disabled:opacity-60"
              >
                {savingNotes ? "Speichert…" : "Speichern"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
