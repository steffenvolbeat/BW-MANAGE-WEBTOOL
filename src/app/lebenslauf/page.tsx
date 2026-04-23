"use client";
import { useState, useEffect } from "react";
import LebenslaufTemplate from "@/components/lebenslauf/LebenslaufTemplate";
import ProtectedRoute from "@/components/ProtectedRoute";
import MainLayout from "@/components/layout/MainLayout";
import TemplateSwitcher from "@/components/cv-templates/TemplateSwitcher";
import { CV_TEMPLATES } from "@/components/cv-templates/shared";
import CV_Midnight from "@/components/cv-templates/CV_Midnight";
import CV_Aurora from "@/components/cv-templates/CV_Aurora";
import CV_Forest from "@/components/cv-templates/CV_Forest";
import CV_Arctic from "@/components/cv-templates/CV_Arctic";
import CV_Crimson from "@/components/cv-templates/CV_Crimson";
import CV_Obsidian from "@/components/cv-templates/CV_Obsidian";
import CV_Solar from "@/components/cv-templates/CV_Solar";
import CV_Sakura from "@/components/cv-templates/CV_Sakura";
import CV_Matrix from "@/components/cv-templates/CV_Matrix";
import CV_Neon from "@/components/cv-templates/CV_Neon";
import CV_Ember from "@/components/cv-templates/CV_Ember";
import CV_Violet from "@/components/cv-templates/CV_Violet";
import CV_Coral from "@/components/cv-templates/CV_Coral";
import CV_Slate from "@/components/cv-templates/CV_Slate";
import CV_Mint from "@/components/cv-templates/CV_Mint";
import CV_Indigo from "@/components/cv-templates/CV_Indigo";
import CV_Rust from "@/components/cv-templates/CV_Rust";
import CV_Lavender from "@/components/cv-templates/CV_Lavender";
import CV_Teal from "@/components/cv-templates/CV_Teal";
import CV_Copper from "@/components/cv-templates/CV_Copper";
import CV_Navy from "@/components/cv-templates/CV_Navy";
import CV_Noir from "@/components/cv-templates/CV_Noir";
import CV_Cloud from "@/components/cv-templates/CV_Cloud";
import CV_Sunset from "@/components/cv-templates/CV_Sunset";
import CV_Ocean from "@/components/cv-templates/CV_Ocean";
import CV_Lemon from "@/components/cv-templates/CV_Lemon";
import CV_Marble from "@/components/cv-templates/CV_Marble";
import CV_Graphite from "@/components/cv-templates/CV_Graphite";
import CV_Blush from "@/components/cv-templates/CV_Blush";
import CV_Jade from "@/components/cv-templates/CV_Jade";
import CV_Smoke from "@/components/cv-templates/CV_Smoke";
import CV_Gold from "@/components/cv-templates/CV_Gold";
import CV_Typewriter from "@/components/cv-templates/CV_Typewriter";
import CV_Blueprint from "@/components/cv-templates/CV_Blueprint";
import CV_Glassmorphism from "@/components/cv-templates/CV_Glassmorphism";
import CV_Cyberpunk from "@/components/cv-templates/CV_Cyberpunk";
import CV_Magazine from "@/components/cv-templates/CV_Magazine";
import CV_Terminal from "@/components/cv-templates/CV_Terminal";
import CV_Prism from "@/components/cv-templates/CV_Prism";
import CV_Nordic from "@/components/cv-templates/CV_Nordic";
import CV_Bauhaus from "@/components/cv-templates/CV_Bauhaus";
import CV_Deco from "@/components/cv-templates/CV_Deco";
import CV_Zen from "@/components/cv-templates/CV_Zen";
import CV_Velvet from "@/components/cv-templates/CV_Velvet";
import CV_Circuit from "@/components/cv-templates/CV_Circuit";
import CV_Parchment from "@/components/cv-templates/CV_Parchment";
import CV_Coastal from "@/components/cv-templates/CV_Coastal";
import CV_Mono from "@/components/cv-templates/CV_Mono";
import CV_Wine from "@/components/cv-templates/CV_Wine";
import CV_Titanium from "@/components/cv-templates/CV_Titanium";
import CV_Origami from "@/components/cv-templates/CV_Origami";
import CV_Brutalist from "@/components/cv-templates/CV_Brutalist";
import CV_Retrowave from "@/components/cv-templates/CV_Retrowave";
import CV_Swiss from "@/components/cv-templates/CV_Swiss";
import CV_Memphis from "@/components/cv-templates/CV_Memphis";
import CV_Newspaper from "@/components/cv-templates/CV_Newspaper";
import CV_Pixel from "@/components/cv-templates/CV_Pixel";
import CV_Watercolor from "@/components/cv-templates/CV_Watercolor";
import CV_Galaxy from "@/components/cv-templates/CV_Galaxy";
import CV_Chalk from "@/components/cv-templates/CV_Chalk";
import CV_Steampunk from "@/components/cv-templates/CV_Steampunk";
import CV_Vaporwave from "@/components/cv-templates/CV_Vaporwave";
import CV_Topographic from "@/components/cv-templates/CV_Topographic";
import CV_Amber from "@/components/cv-templates/CV_Amber";
import CV_Sage from "@/components/cv-templates/CV_Sage";
import CV_Quartz from "@/components/cv-templates/CV_Quartz";
import CV_Bamboo from "@/components/cv-templates/CV_Bamboo";
import CV_Dusk from "@/components/cv-templates/CV_Dusk";
import CV_Scarlet from "@/components/cv-templates/CV_Scarlet";
import CV_Papyrus from "@/components/cv-templates/CV_Papyrus";
import CV_Isometric from "@/components/cv-templates/CV_Isometric";
import CV_Risograph from "@/components/cv-templates/CV_Risograph";
import CV_Holographic from "@/components/cv-templates/CV_Holographic";
import CV_Botanical from "@/components/cv-templates/CV_Botanical";
import CV_Dashboard from "@/components/cv-templates/CV_Dashboard";
import CV_Washi from "@/components/cv-templates/CV_Washi";
import CV_Engraving from "@/components/cv-templates/CV_Engraving";
import CV_Atomic from "@/components/cv-templates/CV_Atomic";
import CV_StainedGlass from "@/components/cv-templates/CV_StainedGlass";
import CV_Cassette from "@/components/cv-templates/CV_Cassette";
import CV_DeepSea from "@/components/cv-templates/CV_DeepSea";
import CV_Cairo from "@/components/cv-templates/CV_Cairo";
import CV_Constructivist from "@/components/cv-templates/CV_Constructivist";
import CV_Lava from "@/components/cv-templates/CV_Lava";
import CV_Solarpunk from "@/components/cv-templates/CV_Solarpunk";
import CV_Kodachrome from "@/components/cv-templates/CV_Kodachrome";
import CV_Manuscript from "@/components/cv-templates/CV_Manuscript";
import CV_Mondrian from "@/components/cv-templates/CV_Mondrian";
import CV_NeoNoir from "@/components/cv-templates/CV_NeoNoir";
import CV_Bento from "@/components/cv-templates/CV_Bento";

const CV_MAP: Record<string, React.ComponentType> = {
  novoresume: LebenslaufTemplate,
  midnight: CV_Midnight,
  aurora: CV_Aurora,
  forest: CV_Forest,
  arctic: CV_Arctic,
  crimson: CV_Crimson,
  obsidian: CV_Obsidian,
  solar: CV_Solar,
  sakura: CV_Sakura,
  matrix: CV_Matrix,
  neon: CV_Neon,
  ember: CV_Ember,
  violet: CV_Violet,
  coral: CV_Coral,
  slate: CV_Slate,
  mint: CV_Mint,
  indigo: CV_Indigo,
  rust: CV_Rust,
  lavender: CV_Lavender,
  teal: CV_Teal,
  copper: CV_Copper,
  navy: CV_Navy,
  noir: CV_Noir,
  cloud: CV_Cloud,
  sunset: CV_Sunset,
  ocean: CV_Ocean,
  lemon: CV_Lemon,
  marble: CV_Marble,
  graphite: CV_Graphite,
  blush: CV_Blush,
  jade: CV_Jade,
  smoke: CV_Smoke,
  gold: CV_Gold,
  typewriter: CV_Typewriter,
  blueprint: CV_Blueprint,
  glass: CV_Glassmorphism,
  cyber: CV_Cyberpunk,
  magazine: CV_Magazine,
  terminal: CV_Terminal,
  prism: CV_Prism,
  nordic: CV_Nordic,
  bauhaus: CV_Bauhaus,
  deco: CV_Deco,
  zen: CV_Zen,
  velvet: CV_Velvet,
  circuit: CV_Circuit,
  parchment: CV_Parchment,
  coastal: CV_Coastal,
  mono: CV_Mono,
  wine: CV_Wine,
  titanium: CV_Titanium,
  origami: CV_Origami,
  brutalist: CV_Brutalist,
  retrowave: CV_Retrowave,
  swiss: CV_Swiss,
  memphis: CV_Memphis,
  newspaper: CV_Newspaper,
  pixel: CV_Pixel,
  watercolor: CV_Watercolor,
  galaxy: CV_Galaxy,
  chalk: CV_Chalk,
  steampunk: CV_Steampunk,
  vaporwave: CV_Vaporwave,
  topographic: CV_Topographic,
  amber: CV_Amber,
  sage: CV_Sage,
  quartz: CV_Quartz,
  bamboo: CV_Bamboo,
  dusk: CV_Dusk,
  scarlet: CV_Scarlet,
  papyrus: CV_Papyrus,
  iso: CV_Isometric,
  riso: CV_Risograph,
  holo: CV_Holographic,
  botan: CV_Botanical,
  dash: CV_Dashboard,
  washi: CV_Washi,
  engr: CV_Engraving,
  atom: CV_Atomic,
  stgls: CV_StainedGlass,
  cass: CV_Cassette,
  dsea: CV_DeepSea,
  cairo: CV_Cairo,
  cstr: CV_Constructivist,
  lava: CV_Lava,
  splnk: CV_Solarpunk,
  koda: CV_Kodachrome,
  manu: CV_Manuscript,
  mond: CV_Mondrian,
  nnoir: CV_NeoNoir,
  bento: CV_Bento,
};

function LebenslaufContent() {
  const [templateKey, setTemplateKey] = useState("novoresume");

  // Persist selected template across page reloads
  useEffect(() => {
    try {
      const saved = localStorage.getItem("cv-selected-template");
      if (saved && CV_MAP[saved]) setTemplateKey(saved);
    } catch { /* ignore */ }
  }, []);

  const handleSelect = (key: string) => {
    setTemplateKey(key);
    try { localStorage.setItem("cv-selected-template", key); } catch { /* ignore */ }
  };

  const ActiveTemplate = CV_MAP[templateKey] ?? LebenslaufTemplate;

  return (
    <>
      <TemplateSwitcher templates={CV_TEMPLATES} activeKey={templateKey} onSelect={handleSelect} label="Lebenslauf-Template wählen" />
      <ActiveTemplate />
    </>
  );
}

export default function LebenslaufPage() {
  return (
    <ProtectedRoute>
      <MainLayout>
        <LebenslaufContent />
      </MainLayout>
    </ProtectedRoute>
  );
}
