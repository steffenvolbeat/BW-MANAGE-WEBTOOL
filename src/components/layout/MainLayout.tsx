"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Header from "./Header";
import ReadOnlyBanner from "@/components/ReadOnlyBanner";

// SSR deaktiviert – Sidebar nutzt useAuth/mounted-Logik die nur im Browser gilt
// Verhindert Hydration-Mismatch zwischen Server (kein User-Kontext) und Client
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

  const handleMobileMenuToggle = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleCloseMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

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
          <div className="px-4 sm:px-6 lg:px-8 py-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
