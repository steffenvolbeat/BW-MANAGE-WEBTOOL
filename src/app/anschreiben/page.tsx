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
import CL_Neon from "@/components/cv-templates/CL_Neon";
import CL_Ember from "@/components/cv-templates/CL_Ember";
import CL_Violet from "@/components/cv-templates/CL_Violet";
import CL_Coral from "@/components/cv-templates/CL_Coral";
import CL_Slate from "@/components/cv-templates/CL_Slate";
import CL_Mint from "@/components/cv-templates/CL_Mint";
import CL_Indigo from "@/components/cv-templates/CL_Indigo";
import CL_Rust from "@/components/cv-templates/CL_Rust";
import CL_Lavender from "@/components/cv-templates/CL_Lavender";
import CL_Teal from "@/components/cv-templates/CL_Teal";
import CL_Copper from "@/components/cv-templates/CL_Copper";
import CL_Navy from "@/components/cv-templates/CL_Navy";
import CL_Noir from "@/components/cv-templates/CL_Noir";
import CL_Cloud from "@/components/cv-templates/CL_Cloud";
import CL_Sunset from "@/components/cv-templates/CL_Sunset";
import CL_Ocean from "@/components/cv-templates/CL_Ocean";
import CL_Lemon from "@/components/cv-templates/CL_Lemon";
import CL_Marble from "@/components/cv-templates/CL_Marble";
import CL_Graphite from "@/components/cv-templates/CL_Graphite";
import CL_Blush from "@/components/cv-templates/CL_Blush";
import CL_Jade from "@/components/cv-templates/CL_Jade";
import CL_Smoke from "@/components/cv-templates/CL_Smoke";
import CL_Gold from "@/components/cv-templates/CL_Gold";
import CL_Typewriter from "@/components/cv-templates/CL_Typewriter";
import CL_Blueprint from "@/components/cv-templates/CL_Blueprint";
import CL_Glassmorphism from "@/components/cv-templates/CL_Glassmorphism";
import CL_Cyberpunk from "@/components/cv-templates/CL_Cyberpunk";
import CL_Magazine from "@/components/cv-templates/CL_Magazine";
import CL_Terminal from "@/components/cv-templates/CL_Terminal";
import CL_Prism from "@/components/cv-templates/CL_Prism";
import CL_Nordic from "@/components/cv-templates/CL_Nordic";

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
  neon: CL_Neon,
  ember: CL_Ember,
  violet: CL_Violet,
  coral: CL_Coral,
  slate: CL_Slate,
  mint: CL_Mint,
  indigo: CL_Indigo,
  rust: CL_Rust,
  lavender: CL_Lavender,
  teal: CL_Teal,
  copper: CL_Copper,
  navy: CL_Navy,
  noir: CL_Noir,
  cloud: CL_Cloud,
  sunset: CL_Sunset,
  ocean: CL_Ocean,
  lemon: CL_Lemon,
  marble: CL_Marble,
  graphite: CL_Graphite,
  blush: CL_Blush,
  jade: CL_Jade,
  smoke: CL_Smoke,
  gold: CL_Gold,
  typewriter: CL_Typewriter,
  blueprint: CL_Blueprint,
  glass: CL_Glassmorphism,
  cyber: CL_Cyberpunk,
  magazine: CL_Magazine,
  terminal: CL_Terminal,
  prism: CL_Prism,
  nordic: CL_Nordic,
};

function AnschreibenContent() {
  const searchParams = useSearchParams();
  // Tab direkt aus searchParams initialisieren – kein useEffect mit setState nötig
  const [tab, setTab] = useState<"din" | "novoresume" | "templates">(() =>
    searchParams.get("mode") === "novoresume" ? "novoresume" : "din"
  );
  const [clTemplateKey, setClTemplateKey] = useState("midnight");

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
