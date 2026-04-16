"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import AnschreibenStudio from "@/components/anschreiben/AnschreibenStudio";
import CoverLetterNovoresume from "@/components/anschreiben/CoverLetterNovoresume";
import ProtectedRoute from "@/components/ProtectedRoute";
import MainLayout from "@/components/layout/MainLayout";
import TemplateSwitcher from "@/components/cv-templates/TemplateSwitcher";
import { CL_TEMPLATES } from "@/components/cv-templates/shared";
import CL_Midnight from "@/components/cv-templates/CL_Midnight";
import CL_Aurora from "@/components/cv-templates/CL_Aurora";
import CL_Forest from "@/components/cv-templates/CL_Forest";
import CL_Crimson from "@/components/cv-templates/CL_Crimson";
import CL_Arctic from "@/components/cv-templates/CL_Arctic";
import CL_Obsidian from "@/components/cv-templates/CL_Obsidian";
import CL_Solar from "@/components/cv-templates/CL_Solar";
import CL_Sakura from "@/components/cv-templates/CL_Sakura";
import CL_Matrix from "@/components/cv-templates/CL_Matrix";

const CL_CUSTOM_MAP: Record<string, React.ComponentType> = {
  midnight: CL_Midnight,
  aurora: CL_Aurora,
  forest: CL_Forest,
  crimson: CL_Crimson,
  arctic: CL_Arctic,
  obsidian: CL_Obsidian,
  solar: CL_Solar,
  sakura: CL_Sakura,
  matrix: CL_Matrix,
};

function AnschreibenContent() {
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<"din" | "novoresume" | "templates">("din");
  const [clTemplateKey, setClTemplateKey] = useState("midnight");

  useEffect(() => {
    if (searchParams.get("mode") === "novoresume") {
      setTab("novoresume");
    }
  }, [searchParams]);

  return (
    <>
      {/* Tab-Leiste – beim Drucken ausblenden */}
      <div className="flex gap-1 mb-0 px-4 pt-4 border-b border-gray-200 bg-white print:hidden">
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
        <button
          onClick={() => setTab("templates")}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
            tab === "templates"
              ? "bg-white border border-b-white border-gray-200 text-indigo-700 font-semibold -mb-px z-10"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          ✦ Epische Templates
        </button>
      </div>

      {tab === "din" ? (
        <AnschreibenStudio />
      ) : tab === "novoresume" ? (
        <CoverLetterNovoresume
          initialCompany={searchParams.get("company") ?? undefined}
          initialPosition={searchParams.get("position") ?? undefined}
        />
      ) : (() => {
        const CLActive = CL_CUSTOM_MAP[clTemplateKey];
        return (
          <>
            <TemplateSwitcher templates={CL_TEMPLATES} activeKey={clTemplateKey} onSelect={setClTemplateKey} label="Anschreiben-Template wählen" />
            {CLActive && <CLActive />}
          </>
        );
      })()}
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
