"use client";

import { useState } from "react";
import Link from "next/link";
import { useTheme } from "@/components/theme/ThemeProvider";
import { useAuth } from "@/components/AuthProvider";
import {
  Bars3Icon,
  XMarkIcon,
  CogIcon,
  UserIcon,
  MoonIcon,
  SunIcon,
  ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/outline";

interface HeaderProps {
  onMobileMenuToggle: () => void;
  isMobileMenuOpen: boolean;
}

export default function Header({
  onMobileMenuToggle,
  isMobileMenuOpen,
}: HeaderProps) {
  const [showAdminMenu, setShowAdminMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "??";

  return (
    <header className="bg-(--card) text-foreground shadow-sm border-b border-(--border) sticky top-0 z-50 transition-colors">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Mobile menu button */}
          <div className="flex items-center">
            <button
              type="button"
              className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800"
              onClick={onMobileMenuToggle}
              aria-expanded="false"
            >
              <span className="sr-only">Hauptmenü öffnen</span>
              {isMobileMenuOpen ? (
                <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>

            {/* Logo */}
            <div className="flex items-center ml-4 md:ml-0">
              <Link href="/dashboard" className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-linear-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">IT</span>
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-xl font-bold">Bewerbungs-Management</h1>
                  <p className="text-xs text-(--muted) -mt-1">für IT-Profis</p>
                </div>
              </Link>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-3">
            {/* Theme Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className="inline-flex items-center justify-center rounded-md border border-(--border) bg-(--card) p-2 text-sm font-medium shadow-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              aria-label="Theme umschalten"
              suppressHydrationWarning={true}
            >
              {theme === "dark" ? (
                <SunIcon className="h-5 w-5 text-amber-400" />
              ) : (
                <MoonIcon className="h-5 w-5 text-slate-600" />
              )}
            </button>

            {/* Admin-Menü */}
            <div className="relative">
              <button
                type="button"
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:border-slate-600 dark:text-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700"
                onClick={() => { setShowAdminMenu(!showAdminMenu); setShowUserMenu(false); }}
              >
                <CogIcon className="h-4 w-4 mr-2" />
                Admin
              </button>
              {showAdminMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-(--card) rounded-md shadow-lg py-1 z-50 border border-(--border)">
                  <Link
                    href="/admin/coming-soon"
                    className="block px-4 py-2 text-sm text-foreground hover:bg-slate-100 dark:hover:bg-slate-800"
                    onClick={() => setShowAdminMenu(false)}
                  >
                    🚀 Coming Soon Page
                  </Link>
                  <Link
                    href="/admin/settings"
                    className="block px-4 py-2 text-sm text-foreground hover:bg-slate-100 dark:hover:bg-slate-800"
                    onClick={() => setShowAdminMenu(false)}
                  >
                    ⚙️ Einstellungen
                  </Link>
                  <Link
                    href="/admin/logs"
                    className="block px-4 py-2 text-sm text-foreground hover:bg-slate-100 dark:hover:bg-slate-800"
                    onClick={() => setShowAdminMenu(false)}
                  >
                    📊 System Logs
                  </Link>
                </div>
              )}
            </div>

            {/* User-Menü mit Logout */}
            <div className="relative">
              <button
                type="button"
                onClick={() => { setShowUserMenu(!showUserMenu); setShowAdminMenu(false); }}
                className="flex items-center space-x-2 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <div className="w-9 h-9 bg-linear-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-sm font-bold shadow">
                  {user?.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={user.avatarUrl} alt={user.name} className="w-9 h-9 rounded-full object-cover" />
                  ) : initials}
                </div>
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-(--card) rounded-xl shadow-xl py-2 z-50 border border-(--border)">
                  <div className="px-4 py-3 border-b border-(--border)">
                    <p className="text-sm font-semibold text-foreground truncate">{user?.name ?? "Benutzer"}</p>
                    <p className="text-xs text-(--muted) truncate">{user?.email}</p>
                  </div>
                  <Link
                    href="/profile"
                    className="flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-slate-100 dark:hover:bg-slate-800"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <UserIcon className="h-4 w-4" />
                    Mein Profil
                  </Link>
                  <div className="border-t border-(--border) mt-1 pt-1">
                    <button
                      type="button"
                      onClick={logout}
                      className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 transition"
                    >
                      <ArrowRightOnRectangleIcon className="h-4 w-4" />
                      Abmelden
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

