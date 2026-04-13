"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import AnschreibenStudio from "@/components/anschreiben/AnschreibenStudio";
import CoverLetterNovoresume from "@/components/anschreiben/CoverLetterNovoresume";
import ProtectedRoute from "@/components/ProtectedRoute";
import MainLayout from "@/components/layout/MainLayout";

function AnschreibenContent() {
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<"din" | "novoresume">("din");

  useEffect(() => {
    if (searchParams.get("mode") === "novoresume") {
      setTab("novoresume");
    }
  }, [searchParams]);

  return (
    <>
      {/* Tab-Leiste */}
      <div className="flex gap-1 mb-0 px-4 pt-4 border-b border-gray-200 bg-white">
        <button
          onClick={() => setTab("din")}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
            tab === "din"
              ? "bg-white border border-b-white border-gray-200 text-indigo-700 font-semibold -mb-px z-10"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          DIN-5008 Studio
        </button>
        <button
          onClick={() => setTab("novoresume")}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
            tab === "novoresume"
              ? "bg-white border border-b-white border-gray-200 text-indigo-700 font-semibold -mb-px z-10"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Novoresume-Template
        </button>
      </div>

      {tab === "din" ? (
        <AnschreibenStudio />
      ) : (
        <CoverLetterNovoresume
          initialCompany={searchParams.get("company") ?? undefined}
          initialPosition={searchParams.get("position") ?? undefined}
        />
      )}
    </>
  );
}

export default function AnschreibenPage() {
  return (
    <ProtectedRoute>
      <MainLayout>
        <Suspense fallback={<div className="p-8 text-gray-400">Lade…</div>}>
          <AnschreibenContent />
        </Suspense>
      </MainLayout>
    </ProtectedRoute>
  );
}
