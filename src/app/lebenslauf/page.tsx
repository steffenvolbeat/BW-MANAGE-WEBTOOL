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
