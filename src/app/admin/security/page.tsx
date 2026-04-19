"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheckIcon, ClockIcon } from "@heroicons/react/24/outline";
import { useAuth } from "@/components/AuthProvider";

export default function SecurityPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user?.role !== "ADMIN") {
      router.replace("/dashboard");
    }
  }, [user, loading, router]);

  if (loading || user?.role !== "ADMIN") {
    return (
      <div className="min-h-screen bg-(--surface) flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-(--surface) p-6 flex flex-col items-center justify-center">
      <div className="max-w-lg w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="p-4 rounded-full bg-purple-500/10 border border-purple-500/20">
            <ShieldCheckIcon className="h-12 w-12 text-purple-500" />
          </div>
        </div>

        <div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Anomalie-Detection</h1>
          <p className="text-(--muted) text-sm">Insider-Threat Detection &amp; Sicherheitsüberwachung</p>
        </div>

        <div className="bg-(--card) border border-(--border) rounded-xl p-6 text-left space-y-4">
          <p className="text-sm text-(--muted)">
            Dieses Modul erkennt ungewöhnliche Aktivitätsmuster im System – z.&nbsp;B. massenhafte Datenzugriffe,
            verdächtige Login-Versuche oder auffällige API-Nutzung.
          </p>

          <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <ClockIcon className="h-5 w-5 text-amber-400 shrink-0" />
            <span className="text-sm text-amber-300 font-medium">In Entwicklung – noch nicht verfügbar</span>
          </div>

          <ul className="space-y-2 text-sm text-(--muted)">
            <li className="flex items-start gap-2">
              <span className="text-purple-400 mt-0.5">•</span>
              Echtzeit-Monitoring aller API-Aufrufe
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-400 mt-0.5">•</span>
              Automatische Alerts bei auffälligem Verhalten
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-400 mt-0.5">•</span>
              Audit-Trail mit Benutzer-Aktionen
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-400 mt-0.5">•</span>
              Integration mit bestehenden Audit-Logs
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
