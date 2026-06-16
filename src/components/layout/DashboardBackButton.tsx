"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HomeIcon } from "@heroicons/react/24/solid";

export default function DashboardBackButton() {
  const pathname = usePathname();
  const isDashboard =
    pathname === "/" ||
    pathname === "/dashboard" ||
    pathname?.startsWith("/auth/");

  if (isDashboard) return null;

  return (
    <Link
      href="/dashboard"
      className="fixed bottom-6 left-4 sm:left-6 z-50 flex items-center gap-2 px-3 py-2.5 sm:px-4 sm:py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm rounded-2xl shadow-xl transition-all hover:scale-105 active:scale-95"
      style={{ paddingBottom: "calc(0.625rem + env(safe-area-inset-bottom, 0px))" }}
      title="Zurück zum Dashboard"
    >
      <HomeIcon className="w-5 h-5 shrink-0" />
      <span className="hidden xs:inline sm:inline">Dashboard</span>
    </Link>
  );
}
