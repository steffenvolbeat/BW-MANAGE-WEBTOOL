"use client";

import { useAppUser } from "@/hooks/useAppUser";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BriefcaseIcon,
  ClockIcon,
  CalendarDaysIcon,
  CurrencyEuroIcon,
  PlusIcon,
  DocumentTextIcon,
  VideoCameraIcon,
  DocumentPlusIcon,
} from "@heroicons/react/24/outline";

type AnalyticsResponse = {
  applicationStats: {
    total: number;
    pending: number;
    rejected: number;
    accepted: number;
    interview: number;
  };
  recentActivities: Array<{
    id: string;
    title: string;
    type: string;
    timestamp: string;
    application?: { companyName?: string | null; position?: string | null };
    contact?: { firstName?: string | null; lastName?: string | null };
  }>;
  upcomingEvents: Array<{
    id: string;
    title: string;
    date: string;
    time: string;
    company?: string | null;
    type: string;
    location?: string | null;
    application?: { companyName?: string | null; position?: string | null };
  }>;
};

export default function Dashboard() {
  const { id: userId } = useAppUser();
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;

    const controller = new AbortController();

    const loadAnalytics = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `/api/analytics?userId=${userId}`,
          { signal: controller.signal }
        );

        if (!response.ok) {
          throw new Error(`Analytics request failed (${response.status})`);
        }

        const data = (await response.json()) as AnalyticsResponse;
        setAnalytics(data);
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
        console.error("Dashboard analytics fetch failed", err);
        setError("Daten konnten nicht geladen werden.");
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
    return () => controller.abort();
  }, [userId]);

  const quickActions = [
    {
      name: "Neue Bewerbung",
      description: "Bewerbung für neue Stelle erstellen",
      href: "/applications",
      icon: PlusIcon,
      color: "bg-blue-500 hover:bg-blue-600",
    },
    {
      name: "Dokument hochladen",
      description: "Lebenslauf oder Zeugnisse hinzufügen",
      href: "/documents",
      icon: DocumentTextIcon,
      color: "bg-green-500 hover:bg-green-600",
    },
    {
      name: "Meeting planen",
      description: "Interview oder Gespräch terminieren",
      href: "/meetings",
      icon: VideoCameraIcon,
      color: "bg-purple-500 hover:bg-purple-600",
    },
    {
      name: "Notiz hinzufügen",
      description: "Wichtige Informationen notieren",
      href: "/notes",
      icon: DocumentPlusIcon,
      color: "bg-indigo-500 hover:bg-indigo-600",
    },
  ];

  const stats = [
    {
      id: 1,
      name: "Gesamt Bewerbungen",
      value: analytics?.applicationStats.total ?? 0,
      icon: BriefcaseIcon,
      color: "blue",
    },
    {
      id: 2,
      name: "Ausstehende Antworten",
      value: analytics?.applicationStats.pending ?? 0,
      icon: ClockIcon,
      color: "yellow",
    },
    {
      id: 3,
      name: "Geplante Interviews",
      value: analytics?.applicationStats.interview ?? 0,
      icon: CalendarDaysIcon,
      color: "green",
    },
    {
      id: 4,
      name: "Erhaltene Angebote",
      value: analytics?.applicationStats.accepted ?? 0,
      icon: CurrencyEuroIcon,
      color: "purple",
    },
  ];

  const getStatColor = (color: string) => {
    switch (color) {
      case "blue":
        return "bg-blue-500";
      case "yellow":
        return "bg-yellow-500";
      case "green":
        return "bg-green-500";
      case "purple":
        return "bg-purple-500";
      default:
        return "bg-gray-500";
    }
  };

  const formatDateTime = (value?: string | null) => {
    if (!value) return "";
    return new Date(value).toLocaleString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const totalApplications = analytics?.applicationStats.total ?? 0;
  const interviewCount = analytics?.applicationStats.interview ?? 0;
  const offersCount = analytics?.applicationStats.accepted ?? 0;

  const progressValue = (value: number) =>
    totalApplications > 0 ? Math.round((value / totalApplications) * 100) : 0;

  const recentActivities = analytics?.recentActivities ?? [];
  const upcomingEvents = analytics?.upcomingEvents ?? [];

  const isLoading = loading || false;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Willkommen zurück! Hier ist eine Übersicht Ihrer
          Bewerbungsaktivitäten.
        </p>
        {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.id}
              className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center">
                <div className={`p-3 rounded-lg ${getStatColor(stat.color)}`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-sm font-medium text-gray-600">
                    {stat.name}
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {isLoading ? "…" : stat.value}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.name}
                href={action.href}
                className={`${action.color} text-white p-6 rounded-lg transition-colors group block`}
              >
                <Icon className="h-8 w-8 mb-3" />
                <h3 className="font-semibold mb-2">{action.name}</h3>
                <p className="text-sm opacity-90">{action.description}</p>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">
          Letzte Aktivitäten
        </h2>
        {isLoading ? (
          <p className="text-sm text-gray-500">Lädt...</p>
        ) : recentActivities.length === 0 ? (
          <p className="text-sm text-gray-500">
            Keine Aktivitäten vorhanden.
          </p>
        ) : (
          <div className="space-y-4">
            {recentActivities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg"
              >
                <div className="shrink-0">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">{activity.title}</p>
                  <div className="flex items-center mt-1 space-x-2">
                    <p className="text-xs text-gray-500">
                      {formatDateTime(activity.timestamp)}
                    </p>
                    {(activity.application?.companyName || activity.contact) && (
                      <>
                        <span className="text-xs text-gray-300">•</span>
                        <p className="text-xs text-gray-500">
                          {activity.application?.companyName ||
                            `${activity.contact?.firstName ?? ""} ${
                              activity.contact?.lastName ?? ""
                            }`.trim()}
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <Link
            href="/activities"
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Alle Aktivitäten anzeigen →
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">
            Anstehende Termine
          </h2>
          {isLoading ? (
            <p className="text-sm text-gray-500">Lädt...</p>
          ) : upcomingEvents.length === 0 ? (
            <div className="text-center py-8">
              <CalendarDaysIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-sm">
                Keine anstehenden Termine vorhanden.
              </p>
              <Link
                href="/calendar"
                className="text-blue-600 hover:text-blue-700 text-sm font-medium mt-2 inline-block"
              >
                Termin hinzufügen
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg"
                >
                  <div className="shrink-0">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">{event.title}</p>
                    <p className="text-xs text-gray-500">
                      {formatDateTime(event.date)}
                      {event.time ? ` • ${event.time}` : ""}
                    </p>
                    {(event.application?.companyName || event.company) && (
                      <p className="text-xs text-gray-500 mt-1">
                        {event.application?.companyName || event.company}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">
            Bewerbungsfortschritt
          </h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Bewerbungen gesendet</span>
                <span className="font-medium">
                  {isLoading ? "…" : `${totalApplications} / ${totalApplications}`}
                </span>
              </div>
              <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: totalApplications > 0 ? "100%" : "0%" }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Interviews geplant</span>
                <span className="font-medium">
                  {isLoading
                    ? "…"
                    : `${interviewCount} / ${totalApplications}`}
                </span>
              </div>
              <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full"
                  style={{ width: `${progressValue(interviewCount)}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Angebote erhalten</span>
                <span className="font-medium">
                  {isLoading ? "…" : `${offersCount} / ${totalApplications}`}
                </span>
              </div>
              <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-purple-600 h-2 rounded-full"
                  style={{ width: `${progressValue(offersCount)}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
