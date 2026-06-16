"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { HomeIcon } from "@heroicons/react/24/solid";
import Header from "./Header";
import ReadOnlyBanner from "@/components/ReadOnlyBanner";

// SSR deaktiviert – Sidebar nutzt useAuth/mounted-Logik die nur im Browser gilt
const Sidebar = dynamic(() => import("./Sidebar"), {
  ssr: false,
  loading: () => (
    <aside className="hidden md:flex md:flex-col w-64 bg-(--card) border-r border-(--border) shrink-0" />
  ),
});

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const isDashboard = pathname === "/" || pathname === "/dashboard";

  const handleMobileMenuToggle = () => setIsMobileMenuOpen((v) => !v);
  const handleCloseMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <div className="min-h-screen bg-(--surface) text-foreground transition-colors">
      {/* Header */}
      <Header
        onMobileMenuToggle={handleMobileMenuToggle}
        isMobileMenuOpen={isMobileMenuOpen}
      />

      {/* Lesezugriff-Banner für MANAGER / VERMITTLER */}
      <ReadOnlyBanner />

      <div className="flex">
        {/* Sidebar */}
        <Sidebar isOpen={isMobileMenuOpen} onClose={handleCloseMobileMenu} />

        {/* Main Content */}
        <main className="flex-1 md:ml-0">
          <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">{children}</div>
        </main>
      </div>

      {/* Floating Dashboard-Button — auf jeder Seite außer Dashboard selbst */}
      {!isDashboard && (
        <Link
          href="/dashboard"
          className="fixed bottom-6 left-6 z-50 flex items-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm rounded-2xl shadow-xl transition-all hover:scale-105 active:scale-95"
          title="Zurück zum Dashboard"
        >
          <HomeIcon className="w-5 h-5 shrink-0" />
          <span>Dashboard</span>
        </Link>
      )}
    </div>
  );
}
