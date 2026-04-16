"use client";
import { useState } from "react";
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
};

function LebenslaufContent() {
  const [templateKey, setTemplateKey] = useState("novoresume");
  const ActiveTemplate = CV_MAP[templateKey] ?? LebenslaufTemplate;

  return (
    <>
      <TemplateSwitcher templates={CV_TEMPLATES} activeKey={templateKey} onSelect={setTemplateKey} label="Lebenslauf-Template wählen" />
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
