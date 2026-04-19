"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAppUser } from "@/hooks/useAppUser";
import { useReadOnly } from "@/hooks/useReadOnly";
import ApplicationTimeline from "@/components/timeline/ApplicationTimeline";
import {
  ClockIcon,
  BriefcaseIcon,
  CalendarDaysIcon,
  DocumentTextIcon,
  UserIcon,
  EnvelopeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  ChatBubbleLeftIcon,
  PencilIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  XMarkIcon,
  TrashIcon,
  ArrowsRightLeftIcon,
} from "@heroicons/react/24/outline";

interface Activity {
  id: string;
  type:
    | "APPLICATION_SUBMITTED"
    | "INTERVIEW_SCHEDULED"
    | "DOCUMENT_UPLOADED"
    | "CONTACT_ADDED"
    | "STATUS_CHANGED"
    | "REMINDER_SET"
    | "EMAIL_SENT"
    | "NOTE_CREATED";
  title: string;
  description: string;
  relatedEntity: string;
  relatedId: string;
  timestamp: string;
  status: "completed" | "pending" | "failed";
  metadata?: {
    company?: string;
    position?: string;
    contactName?: string;
    documentType?: string;
    oldStatus?: string;
    newStatus?: string;
    reminderDate?: string;
    [key: string]: unknown;
  };
  application?: { companyName: string; position: string } | null;
  contact?: { name: string } | null;
  applicationId?: string | null;
  contactId?: string | null;
}

export default function ActivitiesOverview() {
  const { id: userId } = useAppUser();
  const { isReadOnly } = useReadOnly();
  const router = useRouter();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Detail-Modal
  const [detailActivity, setDetailActivity] = useState<Activity | null>(null);
  const [detailTab, setDetailTab] = useState<"info" | "timeline">("info");

  // Edit-Modal
  const [editActivity, setEditActivity] = useState<Activity | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editStatus, setEditStatus] = useState<Activity["status"]>("completed");
  const [saving, setSaving] = useState(false);

  // Sync-Status
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);

  const normalizeActivity = (a: any): Activity => ({
    ...a,
    status: (a.status as string).toLowerCase() as Activity["status"],
    metadata: {
      ...(a.metadata ?? {}),
      company: a.application?.companyName ?? a.metadata?.company,
      position: a.application?.position ?? a.metadata?.position,
      contactName: a.contact?.name ?? a.metadata?.contactName,
    },
  });

  const loadActivities = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/activities?userId=${userId}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setActivities(data.map(normalizeActivity));
    } catch (err: any) {
      setError(err.message ?? "Fehler beim Laden");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadActivities();
  }, [loadActivities]);

  // ── Bearbeiten ─────────────────────────────────────────────────────────────
  function openEdit(a: Activity) {
    setEditActivity(a);
    setEditTitle(a.title);
    setEditDescription(a.description);
    setEditStatus(a.status);
  }

  async function saveEdit() {
    if (!editActivity) return;
    setSaving(true);
    try {
      const res = await fetch("/api/activities", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editActivity.id,
          userId,
          title: editTitle,
          description: editDescription,
          status: editStatus.toUpperCase(),
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const updated = await res.json();
      setActivities((prev) =>
        prev.map((a) => (a.id === updated.id ? normalizeActivity(updated) : a))
      );
      setEditActivity(null);
    } catch (err: any) {
      alert("Fehler beim Speichern: " + err.message);
    } finally {
      setSaving(false);
    }
  }

  // ── Löschen ────────────────────────────────────────────────────────────────
  async function deleteActivity(id: string) {
    if (!confirm("Aktivität wirklich löschen?")) return;
    try {
      const res = await fetch(`/api/activities?id=${id}&userId=${userId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setActivities((prev) => prev.filter((a) => a.id !== id));
    } catch (err: any) {
      alert("Fehler beim Löschen: " + err.message);
    }
  }

  // ── Sync aus Bewerbungen ───────────────────────────────────────────────────
  async function syncFromApplications() {
    if (!userId) return;
    setSyncing(true);
    setSyncMsg(null);
    try {
      // Alle Bewerbungen laden
      const res = await fetch("/api/applications");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const apps: { id: string; companyName: string; position: string; status: string }[] =
        Array.isArray(json) ? json : (json.applications ?? []);

      let created = 0;
      for (const app of apps) {
        // Prüfen ob bereits eine STATUS_CHANGED Aktivität für diesen Status existiert
        const exists = activities.some(
          (a) =>
            a.applicationId === app.id &&
            a.type === "STATUS_CHANGED" &&
            (a.metadata as any)?.newStatus === app.status
        );
        if (!exists) {
          await fetch("/api/activities", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId,
              applicationId: app.id,
              type: "STATUS_CHANGED",
              title: `Status geändert: ${app.companyName}`,
              description: `${app.position} – Aktueller Status: ${app.status}`,
              status: "COMPLETED",
              metadata: { company: app.companyName, position: app.position, newStatus: app.status },
            }),
          });
          created++;
        }
      }
      setSyncMsg(
        created > 0
          ? `${created} neue Aktivität(en) aus Bewerbungen erstellt.`
          : "Alles aktuell – keine neuen Einträge."
      );
      await loadActivities();
    } catch (err: any) {
      setSyncMsg("Sync-Fehler: " + err.message);
    } finally {
      setSyncing(false);
    }
  }

  // ── Filter zurücksetzen ────────────────────────────────────────────────────
  function resetFilters() {
    setSearchTerm("");
    setSelectedFilter("all");
    setSelectedStatus("all");
  }

  const hasActiveFilters =
    searchTerm !== "" || selectedFilter !== "all" || selectedStatus !== "all";

  const activityTypes = {
    APPLICATION_SUBMITTED: {
      label: "Bewerbung eingereicht",
      color: "bg-blue-100 text-blue-800",
      icon: BriefcaseIcon,
    },
    INTERVIEW_SCHEDULED: {
      label: "Interview geplant",
      color: "bg-green-100 text-green-800",
      icon: CalendarDaysIcon,
    },
    DOCUMENT_UPLOADED: {
      label: "Dokument hochgeladen",
      color: "bg-purple-100 text-purple-800",
      icon: DocumentTextIcon,
    },
    CONTACT_ADDED: {
      label: "Kontakt hinzugefügt",
      color: "bg-indigo-100 text-indigo-800",
      icon: UserIcon,
    },
    STATUS_CHANGED: {
      label: "Status geändert",
      color: "bg-orange-100 text-orange-800",
      icon: ExclamationTriangleIcon,
    },
    REMINDER_SET: {
      label: "Erinnerung gesetzt",
      color: "bg-yellow-100 text-yellow-800",
      icon: ClockIcon,
    },
    EMAIL_SENT: {
      label: "E-Mail gesendet",
      color: "bg-pink-100 text-pink-800",
      icon: EnvelopeIcon,
    },
    NOTE_CREATED: {
      label: "Notiz erstellt",
      color: "bg-gray-100 text-gray-800",
      icon: ChatBubbleLeftIcon,
    },
  };

  const statusConfig = {
    completed: {
      label: "Abgeschlossen",
      color: "text-green-600",
      icon: CheckCircleIcon,
    },
    pending: { label: "Ausstehend", color: "text-yellow-600", icon: ClockIcon },
    failed: {
      label: "Fehlgeschlagen",
      color: "text-red-600",
      icon: XCircleIcon,
    },
  };

  const filteredActivities = activities.filter((activity) => {
    const matchesSearch =
      activity.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (activity.metadata?.company &&
        activity.metadata.company
          .toLowerCase()
          .includes(searchTerm.toLowerCase())) ||
      (activity.metadata?.contactName &&
        activity.metadata.contactName
          .toLowerCase()
          .includes(searchTerm.toLowerCase()));

    const matchesFilter =
      selectedFilter === "all" || activity.type === selectedFilter;
    const matchesStatus =
      selectedStatus === "all" || activity.status === selectedStatus;

    return matchesSearch && matchesFilter && matchesStatus;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatRelativeTime = (dateString: string) => {
    const now = new Date();
    const activityDate = new Date(dateString);
    const diffInHours =
      Math.abs(now.getTime() - activityDate.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const diffInMinutes = Math.round(diffInHours * 60);
      return `vor ${diffInMinutes} Minute${diffInMinutes !== 1 ? "n" : ""}`;
    } else if (diffInHours < 24) {
      const hours = Math.round(diffInHours);
      return `vor ${hours} Stunde${hours !== 1 ? "n" : ""}`;
    } else {
      const days = Math.round(diffInHours / 24);
      return `vor ${days} Tag${days !== 1 ? "en" : ""}`;
    }
  };

  const getActivityIcon = (type: string) => {
    const config = activityTypes[type as keyof typeof activityTypes];
    const Icon = config?.icon || ClockIcon;
    return <Icon className="w-5 h-5" />;
  };

  const getStatusIcon = (status: string) => {
    const config = statusConfig[status as keyof typeof statusConfig];
    const Icon = config?.icon || ClockIcon;
    return <Icon className={`w-4 h-4 ${config?.color}`} />;
  };

  const getTypeBadge = (type: string) => {
    const config = activityTypes[type as keyof typeof activityTypes];
    if (!config) return null;

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}
      >
        {config.label}
      </span>
    );
  };

  const getTodaysActivities = () => {
    const today = new Date().toDateString();
    return activities.filter(
      (activity) => new Date(activity.timestamp).toDateString() === today
    ).length;
  };

  const getThisWeeksActivities = () => {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return activities.filter(
      (activity) => new Date(activity.timestamp) >= oneWeekAgo
    ).length;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-start gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Aktivitäten</h1>
          <p className="mt-2 text-gray-600">
            Übersicht über alle Ihre Bewerbungsaktivitäten und Aktionen.
          </p>
          {loading && <p className="text-sm text-gray-500 mt-1">Wird geladen…</p>}
          {error && <p className="text-sm text-red-600 mt-1">Fehler: {error}</p>}
          {syncMsg && (
            <p className={`text-sm mt-1 ${syncMsg.startsWith("Sync-Fehler") ? "text-red-600" : "text-green-600"}`}>
              {syncMsg}
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Zähler */}
          <div className="text-right mr-2">
            <div className="text-xs text-gray-500">Heute</div>
            <div className="text-lg font-bold text-gray-900">{getTodaysActivities()}</div>
          </div>
          <div className="text-right mr-4">
            <div className="text-xs text-gray-500">Diese Woche</div>
            <div className="text-lg font-bold text-gray-900">{getThisWeeksActivities()}</div>
          </div>
          {/* Sync */}
          <button
            onClick={syncFromApplications}
            disabled={syncing}
            title="Aktivitäten aus Bewerbungen synchronisieren"
            className="flex items-center gap-1.5 px-3 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-50"
          >
            <ArrowsRightLeftIcon className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} />
            Sync
          </button>
          {/* Aktualisieren */}
          <button
            onClick={loadActivities}
            disabled={loading}
            title="Liste neu laden"
            className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
          >
            <ArrowPathIcon className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Aktualisieren
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        {Object.entries(activityTypes).map(([type, config]) => {
          const count = activities.filter((activity) => activity.type === type).length;
          const Icon = config.icon;
          return (
            <div key={type} className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex items-center">
                <div className={`p-2 rounded-lg ${config.color.replace("text-", "bg-").replace("-800", "-100")}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="ml-3">
                  <p className="text-xs text-gray-600">{config.label}</p>
                  <p className="text-lg font-bold text-gray-900">{count}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-600" />
              <input
                id="activity-search"
                name="search"
                type="text"
                placeholder="Nach Aktivitäten suchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg placeholder-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Type Filter */}
          <div className="flex items-center">
            <FunnelIcon className="w-4 h-4 text-gray-400 mr-2" />
            <select
              id="activity-type-filter"
              name="filter"
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Alle Aktivitäten</option>
              {Object.entries(activityTypes).map(([type, config]) => (
                <option key={type} value={type}>
                  {config.label}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              id="activity-status-filter"
              name="statusFilter"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Alle Status</option>
              {Object.entries(statusConfig).map(([status, config]) => (
                <option key={status} value={status}>
                  {config.label}
                </option>
              ))}
            </select>
          </div>

          {/* Reset-Button */}
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              title="Filter zurücksetzen"
              className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
            >
              <XMarkIcon className="w-4 h-4" />
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Activity Feed */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Aktivitäts-Feed</h3>
          <span className="text-sm text-gray-500">
            {filteredActivities.length} von {activities.length} Einträgen
          </span>
        </div>

        <div className="divide-y divide-gray-200">
          {filteredActivities.map((activity) => (
            <div key={activity.id} className="p-5 hover:bg-gray-50 transition-colors">
              <div className="flex items-start space-x-4">
                {/* Icon */}
                <div className={`p-2 rounded-lg flex-shrink-0 ${activityTypes[activity.type]?.color.replace("text-", "bg-").replace("-800", "-100")}`}>
                  {getActivityIcon(activity.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-semibold text-gray-900">{activity.title}</h4>
                      {getTypeBadge(activity.type)}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                      {getStatusIcon(activity.status)}
                      <span className="text-xs text-gray-400" title={formatDate(activity.timestamp)}>
                        {formatRelativeTime(activity.timestamp)}
                      </span>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 mb-2">{activity.description}</p>

                  {/* Metadata */}
                  {activity.metadata && (
                    <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                      {activity.metadata.company && <span>📢 {activity.metadata.company}</span>}
                      {activity.metadata.position && <span>💼 {activity.metadata.position}</span>}
                      {activity.metadata.contactName && <span>👤 {activity.metadata.contactName}</span>}
                      {activity.metadata.documentType && <span>📄 {activity.metadata.documentType}</span>}
                      {activity.metadata.oldStatus && activity.metadata.newStatus && (
                        <span>🔄 {activity.metadata.oldStatus} → {activity.metadata.newStatus}</span>
                      )}
                      {activity.metadata.reminderDate && (
                        <span>⏰ {formatDate(activity.metadata.reminderDate as string)}</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  {/* Auge – Detail anzeigen */}
                  <button
                    onClick={() => setDetailActivity(activity)}
                    title="Details anzeigen"
                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                  >
                    <EyeIcon className="w-4 h-4" />
                  </button>

                  {/* Aktentasche – zur verknüpften Bewerbung navigieren */}
                  {activity.relatedEntity === "application" && (
                    <button
                      onClick={() => router.push("/applications")}
                      title="Zur Bewerbung"
                      className="p-1.5 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    >
                      <BriefcaseIcon className="w-4 h-4" />
                    </button>
                  )}

                  {/* Kontakt-Icon */}
                  {activity.relatedEntity === "contact" && (
                    <button
                      onClick={() => router.push("/contacts")}
                      title="Zum Kontakt"
                      className="p-1.5 text-green-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                    >
                      <UserIcon className="w-4 h-4" />
                    </button>
                  )}

                  {/* Bearbeiten */}
                  {!isReadOnly && (
                  <button
                    onClick={() => openEdit(activity)}
                    title="Bearbeiten"
                    className="p-1.5 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded transition-colors"
                  >
                    <PencilIcon className="w-4 h-4" />
                  </button>
                  )}

                  {/* Löschen */}
                  {!isReadOnly && (
                  <button
                    onClick={() => deleteActivity(activity.id)}
                    title="Löschen"
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredActivities.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500">
              <ClockIcon className="mx-auto h-12 w-12 mb-4" />
              <h3 className="text-lg font-medium mb-2">
                Keine Aktivitäten gefunden
              </h3>
              <p>
                Versuchen Sie andere Suchkriterien oder klicken Sie auf
                &bdquo;Sync&ldquo; um Aktivitäten aus Ihren Bewerbungen zu
                laden.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── Detail-Modal ─────────────────────────────────────────────────── */}
      {detailActivity && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          onClick={() => { setDetailActivity(null); setDetailTab("info"); }}
        >
          <div
            className="bg-white rounded-xl shadow-xl max-w-lg w-full flex flex-col max-h-[85vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 pb-0 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${activityTypes[detailActivity.type]?.color.replace("text-", "bg-").replace("-800", "-100")}`}>
                  {getActivityIcon(detailActivity.type)}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{detailActivity.title}</h2>
                  {getTypeBadge(detailActivity.type)}
                </div>
              </div>
              <button onClick={() => { setDetailActivity(null); setDetailTab("info"); }} className="text-gray-400 hover:text-gray-600">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            </div>
            {/* Tabs */}
            <div className="flex border-b border-gray-200 px-6 mt-3">
              <button
                onClick={() => setDetailTab("info")}
                className={`py-2 px-4 text-sm font-medium border-b-2 transition-colors ${
                  detailTab === "info" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Details
              </button>
              {detailActivity.applicationId && (
                <button
                  onClick={() => setDetailTab("timeline")}
                  className={`py-2 px-4 text-sm font-medium border-b-2 transition-colors ${
                    detailTab === "timeline" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Timeline
                </button>
              )}
            </div>
            <div className="flex-1 overflow-y-auto p-6">
            {detailTab === "timeline" && detailActivity.applicationId ? (
              <ApplicationTimeline
                applicationId={detailActivity.applicationId}
                applicationName={detailActivity.application?.companyName ?? detailActivity.metadata?.company as string ?? "Bewerbung"}
              />
            ) : (
              <>
            <p className="text-sm text-gray-700">{detailActivity.description}</p>

            <dl className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <dt className="text-gray-500 text-xs">Status</dt>
                <dd className="flex items-center gap-1 font-medium">
                  {getStatusIcon(detailActivity.status)}
                  {statusConfig[detailActivity.status]?.label ?? detailActivity.status}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500 text-xs">Zeitpunkt</dt>
                <dd className="font-medium">{formatDate(detailActivity.timestamp)}</dd>
              </div>
              {detailActivity.metadata?.company && (
                <div>
                  <dt className="text-gray-500 text-xs">Unternehmen</dt>
                  <dd className="font-medium">{detailActivity.metadata.company as string}</dd>
                </div>
              )}
              {detailActivity.metadata?.position && (
                <div>
                  <dt className="text-gray-500 text-xs">Position</dt>
                  <dd className="font-medium">{detailActivity.metadata.position as string}</dd>
                </div>
              )}
              {detailActivity.metadata?.contactName && (
                <div>
                  <dt className="text-gray-500 text-xs">Kontakt</dt>
                  <dd className="font-medium">{detailActivity.metadata.contactName as string}</dd>
                </div>
              )}
              {detailActivity.metadata?.oldStatus && detailActivity.metadata?.newStatus && (
                <div className="col-span-2">
                  <dt className="text-gray-500 text-xs">Status-Änderung</dt>
                  <dd className="font-medium">
                    {detailActivity.metadata.oldStatus as string} → {detailActivity.metadata.newStatus as string}
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-gray-500 text-xs">Verknüpft mit</dt>
                <dd className="font-medium capitalize">{detailActivity.relatedEntity}</dd>
              </div>
            </dl>

            <div className="flex gap-2 pt-2">
              {!isReadOnly && (
              <button
                onClick={() => { setDetailActivity(null); setDetailTab("info"); openEdit(detailActivity); }}
                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
              >
                <PencilIcon className="w-4 h-4" /> Bearbeiten
              </button>
              )}
              <button
                onClick={() => { setDetailActivity(null); setDetailTab("info"); }}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
              >
                Schließen
              </button>
            </div>
              </>
            )}
            </div>
          </div>
        </div>
      )}

      {/* ── Edit-Modal ───────────────────────────────────────────────────── */}
      {editActivity && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          onClick={() => setEditActivity(null)}
        >
          <div
            className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Aktivität bearbeiten</h2>
              <button onClick={() => setEditActivity(null)} className="text-gray-400 hover:text-gray-600">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label htmlFor="edit-activity-title" className="block text-sm font-medium text-gray-700 mb-1">Titel</label>
                <input
                  id="edit-activity-title"
                  name="edit-activity-title"
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label htmlFor="edit-activity-description" className="block text-sm font-medium text-gray-700 mb-1">Beschreibung</label>
                <textarea
                  id="edit-activity-description"
                  name="edit-activity-description"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                />
              </div>
              <div>
                <label htmlFor="edit-activity-status" className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  id="edit-activity-status"
                  name="edit-activity-status"
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as Activity["status"])}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="completed">Abgeschlossen</option>
                  <option value="pending">Ausstehend</option>
                  <option value="failed">Fehlgeschlagen</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setEditActivity(null)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
              >
                Abbrechen
              </button>
              <button
                onClick={saveEdit}
                disabled={saving || !editTitle.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {saving && <ArrowPathIcon className="w-4 h-4 animate-spin" />}
                Speichern
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
