import MainLayout from "@/components/layout/MainLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import Link from "next/link";
import { ShieldCheckIcon, UserCircleIcon } from "@heroicons/react/24/outline";

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <MainLayout>
        <div className="max-w-2xl mx-auto py-8 px-4">
          <h1 className="text-2xl font-bold text-foreground mb-2">Profil</h1>
          <p className="text-(--muted) text-sm mb-8">Verwalte dein Konto und deine Einstellungen.</p>

          <div className="grid gap-4">
            <Link
              href="/profile/security"
              className="flex items-center gap-4 p-5 bg-(--card) border border-(--border) rounded-2xl hover:border-blue-500/50 transition group"
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-600/15 group-hover:bg-blue-600/25 transition">
                <ShieldCheckIcon className="w-5 h-5 text-blue-500" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-foreground text-sm">Sicherheit</p>
                <p className="text-xs text-(--muted) mt-0.5">Zwei-Faktor-Authentifizierung, Passwort ändern</p>
              </div>
              <span className="text-(--muted) text-lg">›</span>
            </Link>

            <div className="flex items-center gap-4 p-5 bg-(--card) border border-(--border) rounded-2xl opacity-50 cursor-not-allowed">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-(--surface)">
                <UserCircleIcon className="w-5 h-5 text-(--muted)" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-foreground text-sm">Kontoeinstellungen</p>
                <p className="text-xs text-(--muted) mt-0.5">Name, E-Mail – in Vorbereitung</p>
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}
