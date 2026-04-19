"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import MainLayout from "@/components/layout/MainLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import {
  UserIcon,
  BriefcaseIcon,
  CalendarIcon,
  ChartBarIcon,
  PresentationChartLineIcon,
  AcademicCapIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline";

interface Target {
  id: string;
  name: string;
  email: string;
}

const READ_ONLY_ROLES = ["MANAGER", "VERMITTLER"];

const PAGES = [
  {
    label: "Bewerbungen",
    href: "/applications",
    icon: BriefcaseIcon,
  },
  {
    label: "Heatmap & Graph",
    href: "/applications/heatmap",
    icon: PresentationChartLineIcon,
  },
  {
    label: "Kalender",
    href: "/calendar",
    icon: CalendarIcon,
  },
  {
    label: "Aktivitäten",
    href: "/activities",
    icon: ChartBarIcon,
  },
  {
    label: "Kanban-Board",
    href: "/kanban",
    icon: BriefcaseIcon,
  },
  {
    label: "DCI Classroom",
    href: "/classroom",
    icon: AcademicCapIcon,
  },
];

function ObserverTargetsContent() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [targets, setTargets] = useState<Target[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/auth/login");
      return;
    }
    if (!READ_ONLY_ROLES.includes(user.role)) {
      router.replace("/dashboard");
      return;
    }

    const controller = new AbortController();
    fetch("/api/observer/targets", { signal: controller.signal })
      .then((r) => r.json())
      .then((d) => {
        if (d.targets) setTargets(d.targets);
        else setError(d.error ?? "Fehler beim Laden der Teilnehmer.");
      })
      .catch((e) => {
        if (e.name !== "AbortError") setError("Netzwerkfehler. Bitte Seite neu laden.");
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [user, authLoading, router]);

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  const roleLabel =
    user?.role === "MANAGER" ? "Dozent / DCI Management" : "Agentur für Arbeit";
  const roleColor =
    user?.role === "MANAGER"
      ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
      : "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300";

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <UserIcon className="h-8 w-8 text-blue-500" />
          <h1 className="text-2xl font-bold text-foreground">Meine Teilnehmer</h1>
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${roleColor}`}>
            {roleLabel}
          </span>
        </div>
        <p className="text-sm text-(--muted)">
          Lesezugriff auf Bewerbungsunterlagen der Ihnen zugewiesenen Teilnehmer.
        </p>
      </div>

      {/* Fehler */}
      {error && (
        <div className="flex items-center gap-2 p-4 rounded-lg bg-red-900/30 border border-red-700 text-red-300 text-sm">
          <ExclamationCircleIcon className="h-5 w-5 shrink-0" />
          {error}
        </div>
      )}

      {/* Leer */}
      {targets.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="flex items-center justify-center w-20 h-20 rounded-2xl bg-slate-700/50 mb-6">
            <UserIcon className="h-10 w-10 text-slate-400" />
          </div>
          <h2 className="text-lg font-semibold text-foreground mb-2">
            Keine Teilnehmer zugewiesen
          </h2>
          <p className="text-sm text-(--muted) max-w-sm">
            Ihnen wurden noch keine Teilnehmer zugeteilt. Bitte wenden Sie sich an den
            Administrator.
          </p>
        </div>
      )}

      {/* Karten-Grid */}
      {targets.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {targets.map((target) => (
            <div
              key={target.id}
              className="bg-(--card) border border-(--border) rounded-xl shadow-sm p-6 space-y-5 hover:border-blue-500/40 transition-colors"
            >
              {/* Teilnehmer-Info */}
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-11 h-11 rounded-full bg-blue-600/20 shrink-0">
                  <UserIcon className="h-5 w-5 text-blue-400" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-foreground truncate">{target.name}</p>
                  <p className="text-xs text-(--muted) truncate">{target.email}</p>
                </div>
              </div>

              {/* Trennlinie */}
              <div className="border-t border-(--border)" />

              {/* Schnellzugriff */}
              <div>
                <p className="text-xs font-medium text-(--muted) mb-3 uppercase tracking-wide">
                  Schnellzugriff
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {PAGES.map((page) => {
                    const Icon = page.icon;
                    return (
                      <Link
                        key={page.href}
                        href={`${page.href}?viewAs=${target.id}`}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-700/40 hover:bg-blue-600/20 hover:text-blue-300 text-slate-300 text-xs font-medium transition-colors border border-transparent hover:border-blue-500/30"
                      >
                        <Icon className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{page.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ObserverTargetsPage() {
  return (
    <ProtectedRoute>
      <MainLayout>
        <ObserverTargetsContent />
      </MainLayout>
    </ProtectedRoute>
  );
}
