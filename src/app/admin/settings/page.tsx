"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import {
  Cog6ToothIcon,
  ShieldCheckIcon,
  BellIcon,
  CircleStackIcon,
} from "@heroicons/react/24/outline";

export default function AdminSettingsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [saved, setSaved] = useState(false);
  // Datum direkt im State-Initializer berechnen (kein useEffect nötig)
  const [buildDate] = useState(() =>
    typeof window !== "undefined" ? new Date().toLocaleDateString("de-DE") : ""
  );

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
    <div className="min-h-screen bg-(--surface) p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <Cog6ToothIcon className="h-7 w-7 text-blue-500" />
          <h1 className="text-2xl font-bold text-foreground">System-Einstellungen</h1>
        </div>

        {/* Karte: Sicherheit */}
        <section className="bg-(--card) rounded-xl shadow border border-(--border) p-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheckIcon className="h-5 w-5 text-green-500" />
            <h2 className="text-lg font-semibold text-foreground">Sicherheit</h2>
          </div>
          <div className="grid grid-cols-1 gap-3 text-sm text-foreground">
            <InfoRow label="JWT-Expiry" value="7 Tage (via JWT_EXPIRES_IN)" />
            <InfoRow label="2FA (TOTP)" value="Verfügbar für alle Nutzer (Profil → Sicherheit)" />
            <InfoRow label="WebAuthn / Passkeys" value="Verfügbar (Profil → Sicherheit)" />
            <InfoRow label="Rate-Limiting" value="Auth: 5 req/min · API: 20 req/min" />
            <InfoRow label="CSP-Header" value="Aktiv (unsafe-inline + Vercel Live)" />
          </div>
        </section>

        {/* Karte: Datenbank */}
        <section className="bg-(--card) rounded-xl shadow border border-(--border) p-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <CircleStackIcon className="h-5 w-5 text-blue-500" />
            <h2 className="text-lg font-semibold text-foreground">Datenbank</h2>
          </div>
          <div className="grid grid-cols-1 gap-3 text-sm text-foreground">
            <InfoRow label="Typ" value="Prisma Postgres (db.prisma.io)" />
            <InfoRow label="ORM" value="Prisma 7" />
            <InfoRow label="Migrations" value="Automatisch beim Deploy (migrate deploy)" />
          </div>
        </section>

        {/* Karte: Benachrichtigungen */}
        <section className="bg-(--card) rounded-xl shadow border border-(--border) p-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <BellIcon className="h-5 w-5 text-yellow-500" />
            <h2 className="text-lg font-semibold text-foreground">Über das System</h2>
          </div>
          <div className="grid grid-cols-1 gap-3 text-sm text-foreground">
            <InfoRow label="App" value="BW-Manage Webtool" />
            <InfoRow label="Framework" value="Next.js 15 (App Router)" />
            <InfoRow label="Hosting" value="Vercel (bw-manage-webtool.vercel.app)" />
            <InfoRow label="Build" value={buildDate} />
          </div>
        </section>

        {saved && (
          <p className="text-green-600 text-sm font-medium">Einstellungen gespeichert ✓</p>
        )}
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 border-b border-(--border) last:border-0">
      <span className="font-medium text-muted-foreground min-w-[180px]">{label}</span>
      <span className="text-right text-foreground">{value}</span>
    </div>
  );
}
