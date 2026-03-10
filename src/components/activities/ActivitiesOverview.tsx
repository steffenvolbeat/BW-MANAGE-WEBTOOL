"use client";

import { useState, useEffect } from "react";
import { useAppUser } from "@/hooks/useAppUser";
import {
  ClockIcon,
  BriefcaseIcon,
  CalendarDaysIcon,
  DocumentTextIcon,
  UserIcon,
  PhoneIcon,
  EnvelopeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  ChatBubbleLeftIcon,
  PencilIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
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
}

export default function ActivitiesOverview() {
  const { id: userId } = useAppUser();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    fetch(`/api/activities?userId=${userId}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        // Normalisiere Status-Werte (COMPLETED → completed)
        const normalized = data.map((a: any) => ({
          ...a,
          status: (a.status as string).toLowerCase() as Activity["status"],
          metadata: {
            ...(a.metadata ?? {}),
            company: a.application?.companyName ?? (a.metadata as any)?.company,
            position: a.application?.position ?? (a.metadata as any)?.position,
            contactName: a.contact?.name ?? (a.metadata as any)?.contactName,
          },
        }));
        setActivities(normalized);
      })
      .catch((err) => setError(err.message ?? "Fehler beim Laden"))
      .finally(() => setLoading(false));
  }, [userId]);

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
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Aktivitäten</h1>
          <p className="mt-2 text-gray-600">
            Übersicht über alle Ihre Bewerbungsaktivitäten und Aktionen.
          </p>
          {loading && <p className="text-sm text-gray-500 mt-1">Wird geladen…</p>}
          {error && <p className="text-sm text-red-600 mt-1">Fehler: {error}</p>}
        </div>
        <div className="flex items-center space-x-3">
          <div className="text-right">
            <div className="text-sm text-gray-700">Heute</div>
            <div className="text-lg font-bold text-gray-900">
              {getTodaysActivities()}
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-700">Diese Woche</div>
            <div className="text-lg font-bold text-gray-900">
              {getThisWeeksActivities()}
            </div>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        {Object.entries(activityTypes).map(([type, config]) => {
          const count = activities.filter(
            (activity) => activity.type === type
          ).length;
          const Icon = config.icon;
          return (
            <div
              key={type}
              className="bg-white p-4 rounded-lg border border-gray-200"
            >
              <div className="flex items-center">
                <div
                  className={`p-2 rounded-lg ${config.color
                    .replace("text-", "bg-")
                    .replace("-800", "-100")}`}
                >
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
        </div>
      </div>

      {/* Activity Feed */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Aktivitäts-Feed
          </h3>
        </div>

        <div className="divide-y divide-gray-200">
          {filteredActivities.map((activity) => (
            <div key={activity.id} className="p-6 hover:bg-gray-50">
              <div className="flex items-start space-x-4">
                {/* Icon */}
                <div
                  className={`p-2 rounded-lg ${activityTypes[
                    activity.type
                  ]?.color
                    .replace("text-", "bg-")
                    .replace("-800", "-100")}`}
                >
                  {getActivityIcon(activity.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <h4 className="text-sm font-medium text-gray-900">
                        {activity.title}
                      </h4>
                      {getTypeBadge(activity.type)}
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(activity.status)}
                      <span className="text-xs text-gray-500">
                        {formatRelativeTime(activity.timestamp)}
                      </span>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 mb-2">
                    {activity.description}
                  </p>

                  {/* Metadata */}
                  {activity.metadata && (
                    <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                      {activity.metadata.company && (
                        <span>📢 {activity.metadata.company}</span>
                      )}
                      {activity.metadata.position && (
                        <span>💼 {activity.metadata.position}</span>
                      )}
                      {activity.metadata.contactName && (
                        <span>👤 {activity.metadata.contactName}</span>
                      )}
                      {activity.metadata.documentType && (
                        <span>📄 {activity.metadata.documentType}</span>
                      )}
                      {activity.metadata.oldStatus &&
                        activity.metadata.newStatus && (
                          <span>
                            🔄 {activity.metadata.oldStatus} →{" "}
                            {activity.metadata.newStatus}
                          </span>
                        )}
                      {activity.metadata.reminderDate && (
                        <span>
                          ⏰ {formatDate(activity.metadata.reminderDate)}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex space-x-2">
                  <button className="text-gray-400 hover:text-gray-600">
                    <EyeIcon className="w-4 h-4" />
                  </button>
                  {activity.relatedEntity === "application" && (
                    <button className="text-blue-400 hover:text-blue-600">
                      <BriefcaseIcon className="w-4 h-4" />
                    </button>
                  )}
                  {activity.relatedEntity === "contact" && (
                    <button className="text-green-400 hover:text-green-600">
                      <UserIcon className="w-4 h-4" />
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
                Versuchen Sie andere Suchkriterien oder starten Sie eine neue
                Aktion.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Results Summary */}
      {filteredActivities.length > 0 && (
        <div className="text-sm text-gray-600 text-center">
          {filteredActivities.length} von {activities.length} Aktivitäten
          angezeigt
        </div>
      )}
    </div>
  );
}
