"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import {
  ClockIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";

interface LogActivity {
  id: string;
  type: string;
  title: string;
  description: string;
  relatedEntity: string;
  timestamp: string;
  status: string;
  user: { id: string; email: string; name: string | null };
}

const STATUS_COLORS: Record<string, string> = {
  COMPLETED: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  PENDING:   "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300",
  FAILED:    "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
};

export default function AdminLogsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [activities, setActivities] = useState<LogActivity[]>([]);
  const [fetching, setFetching] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (!loading && user?.role !== "ADMIN") {
      router.replace("/dashboard");
    }
  }, [user, loading, router]);

  const load = useCallback(async (p: number) => {
    setFetching(true);
    try {
      const res = await fetch(`/api/admin/logs?page=${p}`);
      if (res.ok) {
        const data = await res.json();
        setActivities(data.activities ?? []);
        setTotal(data.total ?? 0);
        setPages(data.pages ?? 1);
      }
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    if (!loading && user?.role === "ADMIN") {
      load(page);
    }
  }, [user, loading, page, load]);

  if (loading || user?.role !== "ADMIN") {
    return (
      <div className="min-h-screen bg-(--surface) flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-(--surface) p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <ClockIcon className="h-7 w-7 text-blue-500" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">System Logs</h1>
              <p className="text-sm text-muted-foreground">{total} Aktivitäten gesamt</p>
            </div>
          </div>
          <button
            onClick={() => load(page)}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-(--border) text-sm text-foreground hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <ArrowPathIcon className={`h-4 w-4 ${fetching ? "animate-spin" : ""}`} />
            Aktualisieren
          </button>
        </div>

        {/* Tabelle */}
        <div className="bg-(--card) rounded-xl shadow border border-(--border) overflow-hidden">
          {fetching ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
            </div>
          ) : activities.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">Keine Aktivitäten gefunden.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-(--border)">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-foreground">Zeitpunkt</th>
                  <th className="text-left px-4 py-3 font-semibold text-foreground">Nutzer</th>
                  <th className="text-left px-4 py-3 font-semibold text-foreground">Typ</th>
                  <th className="text-left px-4 py-3 font-semibold text-foreground">Titel</th>
                  <th className="text-left px-4 py-3 font-semibold text-foreground">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-(--border)">
                {activities.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                      {new Date(a.timestamp).toLocaleString("de-DE")}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">{a.user.name ?? "–"}</div>
                      <div className="text-xs text-muted-foreground">{a.user.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-block px-2 py-0.5 rounded text-xs font-mono bg-slate-100 dark:bg-slate-700 text-foreground">
                        {a.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-foreground max-w-xs truncate" title={a.description}>
                      {a.title}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[a.status] ?? "bg-slate-100 text-slate-700"}`}>
                        {a.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <span className="text-sm text-muted-foreground">Seite {page} von {pages}</span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1 || fetching}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="inline-flex items-center px-3 py-1.5 rounded-lg border border-(--border) text-sm disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <ChevronLeftIcon className="h-4 w-4" />
              </button>
              <button
                disabled={page >= pages || fetching}
                onClick={() => setPage((p) => Math.min(pages, p + 1))}
                className="inline-flex items-center px-3 py-1.5 rounded-lg border border-(--border) text-sm disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <ChevronRightIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
