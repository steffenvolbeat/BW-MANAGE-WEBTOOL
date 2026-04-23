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
import CL_Bauhaus from "@/components/cv-templates/CL_Bauhaus";
import CL_Deco from "@/components/cv-templates/CL_Deco";
import CL_Zen from "@/components/cv-templates/CL_Zen";
import CL_Velvet from "@/components/cv-templates/CL_Velvet";
import CL_Circuit from "@/components/cv-templates/CL_Circuit";
import CL_Parchment from "@/components/cv-templates/CL_Parchment";
import CL_Coastal from "@/components/cv-templates/CL_Coastal";
import CL_Mono from "@/components/cv-templates/CL_Mono";
import CL_Wine from "@/components/cv-templates/CL_Wine";
import CL_Titanium from "@/components/cv-templates/CL_Titanium";
import CL_Origami from "@/components/cv-templates/CL_Origami";
import CL_Brutalist from "@/components/cv-templates/CL_Brutalist";
import CL_Retrowave from "@/components/cv-templates/CL_Retrowave";
import CL_Swiss from "@/components/cv-templates/CL_Swiss";
import CL_Memphis from "@/components/cv-templates/CL_Memphis";
import CL_Newspaper from "@/components/cv-templates/CL_Newspaper";
import CL_Pixel from "@/components/cv-templates/CL_Pixel";
import CL_Watercolor from "@/components/cv-templates/CL_Watercolor";
import CL_Galaxy from "@/components/cv-templates/CL_Galaxy";
import CL_Chalk from "@/components/cv-templates/CL_Chalk";
import CL_Steampunk from "@/components/cv-templates/CL_Steampunk";
import CL_Vaporwave from "@/components/cv-templates/CL_Vaporwave";
import CL_Topographic from "@/components/cv-templates/CL_Topographic";
import CL_Amber from "@/components/cv-templates/CL_Amber";
import CL_Sage from "@/components/cv-templates/CL_Sage";
import CL_Quartz from "@/components/cv-templates/CL_Quartz";
import CL_Bamboo from "@/components/cv-templates/CL_Bamboo";
import CL_Dusk from "@/components/cv-templates/CL_Dusk";
import CL_Scarlet from "@/components/cv-templates/CL_Scarlet";
import CL_Papyrus from "@/components/cv-templates/CL_Papyrus";
import CL_Isometric from "@/components/cv-templates/CL_Isometric";
import CL_Risograph from "@/components/cv-templates/CL_Risograph";
import CL_Holographic from "@/components/cv-templates/CL_Holographic";
import CL_Botanical from "@/components/cv-templates/CL_Botanical";
import CL_Dashboard from "@/components/cv-templates/CL_Dashboard";
import CL_Washi from "@/components/cv-templates/CL_Washi";
import CL_Engraving from "@/components/cv-templates/CL_Engraving";
import CL_Atomic from "@/components/cv-templates/CL_Atomic";
import CL_StainedGlass from "@/components/cv-templates/CL_StainedGlass";
import CL_Cassette from "@/components/cv-templates/CL_Cassette";
import CL_DeepSea from "@/components/cv-templates/CL_DeepSea";
import CL_Cairo from "@/components/cv-templates/CL_Cairo";
import CL_Constructivist from "@/components/cv-templates/CL_Constructivist";
import CL_Lava from "@/components/cv-templates/CL_Lava";
import CL_Solarpunk from "@/components/cv-templates/CL_Solarpunk";
import CL_Kodachrome from "@/components/cv-templates/CL_Kodachrome";
import CL_Manuscript from "@/components/cv-templates/CL_Manuscript";
import CL_Mondrian from "@/components/cv-templates/CL_Mondrian";
import CL_NeoNoir from "@/components/cv-templates/CL_NeoNoir";
import CL_Bento from "@/components/cv-templates/CL_Bento";

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
  bauhaus: CL_Bauhaus,
  deco: CL_Deco,
  zen: CL_Zen,
  velvet: CL_Velvet,
  circuit: CL_Circuit,
  parchment: CL_Parchment,
  coastal: CL_Coastal,
  mono: CL_Mono,
  wine: CL_Wine,
  titanium: CL_Titanium,
  clori: CL_Origami,
  clbru: CL_Brutalist,
  clrwave: CL_Retrowave,
  clswi: CL_Swiss,
  clmem: CL_Memphis,
  clnws: CL_Newspaper,
  clpix: CL_Pixel,
  clwclr: CL_Watercolor,
  clglx: CL_Galaxy,
  clchk: CL_Chalk,
  clstmp: CL_Steampunk,
  clvpw: CL_Vaporwave,
  cltopo: CL_Topographic,
  clamb: CL_Amber,
  clsge: CL_Sage,
  clqtz: CL_Quartz,
  clbam: CL_Bamboo,
  cldsk: CL_Dusk,
  clsclt: CL_Scarlet,
  clppy: CL_Papyrus,
  cliso: CL_Isometric,
  clriso: CL_Risograph,
  clholo: CL_Holographic,
  clbotan: CL_Botanical,
  cldash: CL_Dashboard,
  clwashi: CL_Washi,
  clengr: CL_Engraving,
  clatom: CL_Atomic,
  clstgls: CL_StainedGlass,
  clcass: CL_Cassette,
  cldsea: CL_DeepSea,
  clcairo: CL_Cairo,
  clcstr: CL_Constructivist,
  cllava: CL_Lava,
  clsplnk: CL_Solarpunk,
  clkoda: CL_Kodachrome,
  clmanu: CL_Manuscript,
  clmond: CL_Mondrian,
  clnnoir: CL_NeoNoir,
  clbento: CL_Bento,
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
