"use client";
import { useState, useRef, useCallback } from "react";
import {
  PrinterIcon,
  PencilSquareIcon,
  CheckIcon,
  PlusIcon,
  TrashIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  LinkIcon,
  ArrowDownTrayIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

// ── Tokens ────────────────────────────────────────────────────────────────────
const ACCENT = "#3ecfd6";
const SIDEBAR_BG = "#1d2a3a";
const TAG_BG = "#0f1e2e";
const DOC_FONT = "'Nunito','Calibri','Segoe UI',Arial,sans-serif";

// ── Types ─────────────────────────────────────────────────────────────────────
interface Project {
  id: string;
  title: string;
  period: string;
  bullets: string[];
  link?: string;
}
interface Education {
  id: string;
  degree: string;
  institution: string;
  period: string;
  location: string;
  type: string;
  bullets: string[];
}
interface Experience {
  id: string;
  position: string;
  company: string;
  period: string;
  location: string;
  description?: string;
  type?: string;
  bullets: string[];
  contact?: string;
}
interface TechSkill {
  id: string;
  name: string;
  description: string;
}
interface Language {
  id: string;
  language: string;
  level: string;
}
interface Certificate {
  id: string;
  name: string;
  period: string;
}
interface Reference {
  id: string;
  company: string;
  person?: string;
}

interface CVData {
  personal: {
    name: string;
    subtitle: string;
    bio: string;
    email: string;
    phone: string;
    location: string;
    linkedin: string;
    github: string;
    website?: string;
  };
  projects: Project[];
  education: Education[];
  experience: Experience[];
  skills: string[];
  technicalSkills: TechSkill[];
  softSkills: string[];
  references: Reference[];
  certificates: Certificate[];
  languages: Language[];
  interests: string[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2, 9);

// ── Default Data (Steffen Lorenz) ─────────────────────────────────────────────
const DEFAULT_DATA: CVData = {
  personal: {
    name: "Steffen Lorenz",
    subtitle: "Webentwickler / Fullstack",
    bio: "Als motivierter und engagierter Web-Entwickler mit Fokus auf strukturierte, semantische und performante Weblösungen. Meine Schwerpunkte liegen in HTML5, CSS3, JavaScript, Next.js und SQL. Durch meine IT-Umschulung und vielseitige Praxiserfahrung arbeite ich analytisch, zuverlässig und lösungsorientiert. Eigene Projekte und ständiges Lernen treiben mich an – ebenso wie Musik, E-Gitarren und Laufen.",
    email: "steffen.konstanz@gmx.ch",
    phone: "0173 4235651",
    location: "Erfurt, Deutschland",
    linkedin: "linkedin.com/in/steffenlorenz-8412873b2",
    github: "github.com/steffenvolbeat",
    website: "",
  },
  projects: [
    {
      id: uid(),
      title: "Band-Website",
      period: "08/2025 - In Progress",
      link: "steffenvolbeatBand-Website",
      bullets: [
        'Im Projekt "Band-Website" entwickelte ich eine moderne Band-Webseite auf Basis von React 19, Vite 7, Tailwind CSS 4 und React Router.',
        "Die Anwendung ist als mehrseitige Frontend-Struktur aufgebaut und umfasst die Bereiche Home, Band, About, Tour, Media und Contact.",
        "Für eine konsistente Benutzerführung implementierte ich ein zentrales RootLayout mit Navigation, Footer und einem einheitlich dunkel gestalteten Seitenaufbau.",
        "Die Inhalte werden datengetrieben über einen generischen Fetch-Hook aus lokalen JSON-Dateien geladen, unter anderem für Band- und Albumdaten auf der Startseite.",
        "Zusätzlich integrierte ich im Medienbereich eine Foto-Galerie und Videokomponenten sowie im Kontaktbereich Social-Media-Links und ein strukturiertes Kontaktformular.",
      ],
    },
    {
      id: uid(),
      title: "LandingPage",
      period: "09/2025 - In Progress",
      link: "steffenvolbeatLanding_Page",
      bullets: [
        'Im Projekt "Landing_Page" entwickelte ich im Team eine moderne Landingpage auf Basis von Next.js 15.5.4, React 19.1.0, TypeScript und Tailwind CSS 4.',
        "Die Anwendung ist modular aufgebaut und gliedert sich in eine zentrale App-Struktur mit Komponenten für Header, Footer, Kundenbereich, Demo-Sektion, Registrierungs-Swiper und weitere Inhaltsblöcke.",
        "Für die Benutzeroberfläche integrierte ich ein Theme-System mit ThemeProvider sowie einen Dark/Light Mode mit angepassten Farbvariablen, automatischer Systemerkennung und sanften Übergängen.",
        'Zusätzlich nutzt das Projekt next/font mit Geist und Geist Mono und ist als moderne Business-Landingpage mit dem Seitentitel "Nextcent-Modern Landing Page" aufgebaut.',
        "Interaktive UI-Elemente werden unter anderem mit Swiper umgesetzt, was auf dynamische Inhalte und Registrierungsbereiche innerhalb der Seite ausgelegt ist.",
      ],
    },
    {
      id: uid(),
      title: "FullStack-Todo-Web-App",
      period: "10/2025 - In Progress",
      link: "FullStack-Todo-Web-App",
      bullets: [
        'Im Projekt "FullStack Todo Web-App" entwickelte ich eine moderne, responsive Aufgabenverwaltung auf Basis von Next.js 16, React 19, TypeScript, Prisma und PostgreSQL.',
        "Die Anwendung wurde als FullStack-Lösung mit Next.js App Router, serverseitigem Rendering und RESTful API-Routen umgesetzt.",
        "Funktional umfasst das Projekt die vollständige CRUD-Verwaltung von Todos einschließlich Erstellen, Bearbeitung, Löschen und Statusänderung.",
        "Zusätzlich integrierte ich persistente Datenspeicherung, automatische Zeitstempel, Fehlerbehandlung, Loading States und interaktive Echtzeit-Updates in der Benutzeroberfläche.",
        "Die Architektur ist modular aufgebaut und gliedert sich in klar getrennte Bereiche: UI-Komponenten, API-Endpunkte, Prisma-Konfiguration, gemeinsame Bibliotheken und TypeScript-Typdefinitionen.",
      ],
    },
    {
      id: uid(),
      title: "Portfolio für NextGen-Entwickler",
      period: "11/2025 - In Progress",
      link: "steffenvolbeatNextGen-Developer-Portfolio",
      bullets: [
        "Im Projekt NextGen Developer Portfolio habe ich ein interaktives 3D-Portfolio auf Basis von Next.js, React, TypeScript und Tailwind CSS entwickelt.",
        "Der Schwerpunkt lag auf einer fotorealistischen 3D-Scene im Motherboard-Design sowie interaktiven Portfolio-Stationen.",
        "Zusätzlich habe ich ein vollständiges Dark-/Light-Mode-System mit automatischer Systemerkennung, Toggle-Funktion und persistenter Speicherung umgesetzt.",
        "Die Projektdaten werden zentral verwaltet. Mock- und Demo-Daten wurden entfernt und durch strukturierte Dateninhalte ersetzt.",
        "Darüber hinaus ist das Projekt modular dokumentiert und auf Erweiterungen wie Cypress-E2E-Tests, Docker sowie eine spätere Anbindung von Prisma und PostgreSQL vorbereitet.",
      ],
    },
    {
      id: uid(),
      title: 'Abschluss-Projekt Metal3DEvent-Plattform',
      period: "07/2025 - In Progress",
      link: "steffenvolbeatMETAL3DCORE-Plattform",
      bullets: [
        'Im Projekt "METAL3DCORE-Plattform" entwickelte ich eine moderne Webanwendung auf Basis von Next.js, React und TypeScript mit Fokus auf eine performante und modular aufgebaute Architektur.',
        "Für die visuelle Umsetzung nutze ich einen 3D-Stack aus React Three Fiber, Drei, Three.js und Postprocessing, um interaktive und grafisch anspruchsvolle Oberflächen umzusetzen.",
        "Die Daten- und Backend-Anbindung ist mit Prisma und PostgreSQL angelegt und wird durch PGAdmin sowie Docker-Strukturen für die Entwicklung und das Deployment ergänzt.",
        "Darüber hinaus integrierte ich Bausteine für Authentifizierung, Formularverarbeitung und Validierung mit NextAuth, React Hook Form und Zod.",
        "Für die Qualitätssicherung implementierte ich eine strukturierte Testumgebung mit Jest für Unit-Tests sowie Cypress für End-to-End-Tests.",
      ],
    },
  ],
  education: [
    {
      id: uid(),
      degree: "Web- und Softwareentwicklung",
      institution: "Digital Career Institute GmbH",
      period: "02/2025 - 04/2026",
      location: "Berlin / Deutschland",
      type: "Kurse / Inhalte",
      bullets: [
        "Webentwicklung mit HTML5, CSS3, JavaScript",
        "Frontend-Entwicklung mit Next.js",
        "Datenbanken & SQL (PostgreSQL, Prisma)",
        "Versionskontrolle mit Git/GitHub",
        "Grundlagen Backend & API-Konzepte",
        "Projektarbeit (Fullstack-Webanwendungen)",
      ],
    },
    {
      id: uid(),
      degree: "Umschulung",
      institution: "BFW – Thüringen",
      period: "03/2020 - 06/2021",
      location: "Seelingstädt / Deutschland",
      type: "Kurse / Inhalte",
      bullets: [
        "Windows- und Client-Administration",
        "Netzwerke (WAN/LAN), Hardware & Peripherie",
        "IT-Support, Fehleranalyse und Troubleshooting",
        "Grundlagen der IT-Sicherheit",
        "Praktische Projekt- und Werkstattarbeit",
      ],
    },
    {
      id: uid(),
      degree: "Ausbildung",
      institution: "Berufsschule / Saalfeld",
      period: "08/1992 - 08/1995",
      location: "Saalfeld",
      type: "Abschluss",
      bullets: ["Geselle im Zimmerhandwerk"],
    },
  ],
  experience: [
    {
      id: uid(),
      position: "Produktionsmitarbeiter",
      company: "Mercedes-Benz Zentrum / Büropersonal",
      period: "09/2022 - 07/2024",
      location: "Kölleda, Erfurt / Deutschland",
      description: "Das Motorenwerk steht für erstklassige Innovation und stetige Verbesserung.",
      type: "Aufgaben",
      bullets: [
        "Durchführen von Qualitätskontrollen",
        "fachgerechtes Montieren von Bauteilen",
        "Sicherstellen der Produktqualität",
      ],
      contact: "Kathrin Niemann – erfurt@office-people.com",
    },
    {
      id: uid(),
      position: "Praktikant",
      company: "Secosys-IT",
      period: "03/2021 - 06/2021",
      location: "Erfurt / Deutschland",
      description: "Ist ein IT-Systemhaus, welches Telekommunikationsinfrastrukturen in Planung, Implementierung & Wartung anbietet",
      type: "Aufgaben",
      bullets: [
        "Konfiguration von Routern und Netzwerken (WAN, LAN, Routing, NAT).",
        "Aufnahme von PCs in Domänen und Einrichtung von Arbeitsplatzsystemen.",
        "Migration von Clientsystemen inklusive Datenübernahme.",
        "Mitarbeit in Kundenprojekten und Vor-Ort-IT-Support.",
        "Unterstützung bei Fehleranalyse und technischer Problemlösung.",
      ],
      contact: "Christian Ranft – info@secosys-it.de",
    },
    {
      id: uid(),
      position: "Zimmermann",
      company: "Yelloshark, Das Team",
      period: "05/2009 - 06/2018",
      location: "Österreich / Schweiz",
      description: "Ausländische temporäre Einsätze (Österreich, Schweiz), Salzburg/Land, Innsbruck, Wien, Luzern, Zürich, Bern, Basel, Interlaken",
      type: "Aufgaben",
      bullets: [
        "Durchführung von Qualitätskontrollen und fachgerechtem Montieren von Bauteilen.",
        "Ausführung von Zimmer- und Holzbauarbeiten.",
        "Mitarbeit bei Ausbau- und Dämmarbeiten.",
        "Arbeit nach technischen Vorgaben und Qualitätsstandards in wechselnden Einsatzorten (DE/AT/CH).",
      ],
      contact: "Damian Rimo – Yellowshark AG",
    },
  ],
  skills: [
    "HTML 5", "CSS 3", "JavaScript", "NextJS", "Fiber.js", "Figma",
    "Python", "SQL", "Docker", "TCP/IP", "Netzwerk", "Lan/Wan", "VMware", "Netzwerksicherheit",
  ],
  technicalSkills: [
    { id: uid(), name: "React.js", description: "Zum Erstellen von Benutzeroberflächen." },
    { id: uid(), name: "Node.js", description: "Für die serverseitige Entwicklung." },
    { id: uid(), name: "Git", description: "Für Versionskontrolle und Zusammenarbeit auf GitHub." },
  ],
  softSkills: ["Teamfähig", "Kreativ", "analytisches Denken", "Motivation", "Selbstständigkeit"],
  references: [
    { id: uid(), company: "Secosys IT", person: '"Christian Ranft Geschäftsführer"' },
  ],
  certificates: [
    { id: uid(), name: "Web & Software Development Certificate – Digital Career Institute (DCI)", period: "(02/2025 - 04/2026)" },
    { id: uid(), name: "PC-Service / IT-Grundlagen", period: "(02/2020 - 06/2021)" },
  ],
  languages: [
    { id: uid(), language: "Deutsch", level: "Muttersprachliche" },
    { id: uid(), language: "Englisch", level: "Eingeschränkte Arbeitskompetenz" },
  ],
  interests: ["E-Gitarre Spielen", "Fitness / Laufen"],
};

// ── Sub-components ────────────────────────────────────────────────────────────

/** Inline editable text – rendering as span in view, input in edit mode */
function E({
  value,
  onChange,
  editing,
  multiline = false,
  className = "",
  placeholder = "...",
  style,
}: {
  value: string;
  onChange: (v: string) => void;
  editing: boolean;
  multiline?: boolean;
  className?: string;
  placeholder?: string;
  style?: React.CSSProperties;
}) {
  if (!editing) return <span className={className} style={style}>{value || <span className="opacity-30">{placeholder}</span>}</span>;
  if (multiline)
    return (
      <textarea
        className={`w-full border border-dashed border-blue-300 rounded px-1 py-0.5 text-inherit bg-blue-50/40 resize-y outline-none focus:border-blue-500 ${className}`}
        style={style}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={3}
      />
    );
  return (
    <input
      className={`border border-dashed border-blue-300 rounded px-1 py-0.5 text-inherit bg-blue-50/40 outline-none focus:border-blue-500 w-full ${className}`}
      style={style}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
  );
}

/** Section heading with icon circle (Novoresume style) */
function SectionHeading({ title, icon }: { title: string; icon: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
      <div
        style={{ width: 26, height: 26, borderRadius: "50%", border: `2px solid ${ACCENT}`, color: ACCENT, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
      >
        {icon}
      </div>
      <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#1a202c", whiteSpace: "nowrap" }}>{title}</span>
      <div style={{ flex: 1, height: 1, background: "#e5e7eb" }} />
    </div>
  );
}

/** Sidebar section heading */
function SidebarHeading({ title, icon }: { title: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div
        className="w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0"
        style={{ borderColor: ACCENT, color: ACCENT }}
      >
        {icon}
      </div>
      <h2 className="text-xs font-bold tracking-widest uppercase" style={{ color: ACCENT }}>
        {title}
      </h2>
    </div>
  );
}

/** Sidebar contact row */
function ContactRow({ icon, value, editing, onChange }: { icon: React.ReactNode; value: string; editing: boolean; onChange: (v: string) => void }) {
  return (
    <div className="flex items-start gap-2 mb-2.5">
      <div
        className="w-6 h-6 rounded flex items-center justify-center shrink-0 mt-0.5"
        style={{ backgroundColor: ACCENT }}
      >
        <span className="text-white w-3.5 h-3.5 flex items-center justify-center">{icon}</span>
      </div>
      <E
        value={value}
        onChange={onChange}
        editing={editing}
        className="text-xs text-white leading-tight break-all"
        placeholder="..."
      />
    </div>
  );
}

// ── Inline bullet list editor ─────────────────────────────────────────────────
function BulletList({
  bullets,
  onChange,
  editing,
}: {
  bullets: string[];
  onChange: (b: string[]) => void;
  editing: boolean;
}) {
  return (
    <ul className="space-y-1">
      {bullets.map((b, i) => (
        <li key={i} className="flex items-start gap-1.5">
          <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: ACCENT }} />
          <span className="flex-1">
            {editing ? (
              <div className="flex items-center gap-1">
                <input
                  className="flex-1 text-xs border border-dashed border-blue-300 rounded px-1 py-0.5 bg-blue-50/40 outline-none"
                  value={b}
                  onChange={(e) => {
                    const nb = [...bullets];
                    nb[i] = e.target.value;
                    onChange(nb);
                  }}
                />
                <button
                  type="button"
                  onClick={() => onChange(bullets.filter((_, idx) => idx !== i))}
                  className="text-red-400 hover:text-red-600 shrink-0"
                  title="Entfernen"
                >
                  <XMarkIcon className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <span className="text-xs text-gray-700">{b}</span>
            )}
          </span>
        </li>
      ))}
      {editing && (
        <li>
          <button
            type="button"
            onClick={() => onChange([...bullets, ""])}
            className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 mt-1"
          >
            <PlusIcon className="w-3 h-3" /> Punkt hinzufügen
          </button>
        </li>
      )}
    </ul>
  );
}

// ── Tag list editor ───────────────────────────────────────────────────────────
function TagList({
  tags,
  onChange,
  editing,
  dark = false,
  outlined = false,
}: {
  tags: string[];
  onChange: (t: string[]) => void;
  editing: boolean;
  dark?: boolean;
  outlined?: boolean;
}) {
  const [newTag, setNewTag] = useState("");
  const tagStyle: React.CSSProperties = outlined
    ? { border: "1px solid rgba(255,255,255,0.35)", color: "white", backgroundColor: "transparent", borderRadius: 12, padding: "2px 10px", fontSize: 11 }
    : dark
    ? { backgroundColor: TAG_BG, color: "white", borderRadius: 3, padding: "2px 9px", fontSize: 11 }
    : { backgroundColor: "#e5f9fa", color: "#0e7490", borderRadius: 3, padding: "2px 9px", fontSize: 11 };
  return (
    <div className="flex flex-wrap gap-1.5">
      {tags.map((t, i) => (
        <div
          key={i}
          style={{ ...tagStyle, display: "flex", alignItems: "center", gap: 4 }}
        >
          {t}
          {editing && (
            <button
              type="button"
              onClick={() => onChange(tags.filter((_, idx) => idx !== i))}
              className="text-red-400 hover:text-red-600"
            >
              <XMarkIcon className="w-2.5 h-2.5" />
            </button>
          )}
        </div>
      ))}
      {editing && (
        <div className="flex items-center gap-1">
          <input
            className="w-20 text-xs border border-dashed border-blue-300 rounded px-1 py-0.5 bg-blue-50/40 outline-none text-gray-800"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && newTag.trim()) {
                onChange([...tags, newTag.trim()]);
                setNewTag("");
              }
            }}
            placeholder="+ Neu"
          />
        </div>
      )}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function LebenslaufTemplate() {
  const [data, setData] = useState<CVData>(JSON.parse(JSON.stringify(DEFAULT_DATA)));
  const [editing, setEditing] = useState(false);
  const [photoSrc, setPhotoSrc] = useState<string>("");
  const photoInputRef = useRef<HTMLInputElement>(null);

  const setPersonal = (patch: Partial<CVData["personal"]>) =>
    setData((d) => ({ ...d, personal: { ...d.personal, ...patch } }));

  const setProjects = (projects: Project[]) => setData((d) => ({ ...d, projects }));
  const setEducation = (education: Education[]) => setData((d) => ({ ...d, education }));
  const setExperience = (experience: Experience[]) => setData((d) => ({ ...d, experience }));
  const setTechSkills = (ts: TechSkill[]) => setData((d) => ({ ...d, technicalSkills: ts }));
  const setReferences = (r: Reference[]) => setData((d) => ({ ...d, references: r }));
  const setCertificates = (c: Certificate[]) => setData((d) => ({ ...d, certificates: c }));
  const setLanguages = (l: Language[]) => setData((d) => ({ ...d, languages: l }));

  const updateProject = useCallback(
    (id: string, patch: Partial<Project>) =>
      setData((d) => ({ ...d, projects: d.projects.map((p) => (p.id === id ? { ...p, ...patch } : p)) })),
    []
  );
  const updateEducation = useCallback(
    (id: string, patch: Partial<Education>) =>
      setData((d) => ({ ...d, education: d.education.map((e) => (e.id === id ? { ...e, ...patch } : e)) })),
    []
  );
  const updateExperience = useCallback(
    (id: string, patch: Partial<Experience>) =>
      setData((d) => ({ ...d, experience: d.experience.map((ex) => (ex.id === id ? { ...ex, ...patch } : ex)) })),
    []
  );

  return (
    <div style={{ minHeight: "100vh", background: "#f3f4f6", padding: "24px 16px", overflowX: "auto" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800&display=swap');`}</style>
      {/* Controls */}
      <div className="flex gap-3 mb-5 print:hidden" style={{ maxWidth: 850, margin: "0 auto 20px" }}>
        <button
          onClick={() => setEditing((e) => !e)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            editing
              ? "bg-green-600 hover:bg-green-700 text-white"
              : "bg-indigo-600 hover:bg-indigo-700 text-white"
          }`}
        >
          {editing ? <CheckIcon className="w-4 h-4" /> : <PencilSquareIcon className="w-4 h-4" />}
          {editing ? "Fertig bearbeiten" : "Bearbeiten"}
        </button>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-gray-700 hover:bg-gray-800 text-white transition-colors"
        >
          <PrinterIcon className="w-4 h-4" />
          Drucken / PDF
        </button>
        <button
          onClick={() => {
            if (window.confirm("Alle Änderungen zurücksetzen?"))
              setData(JSON.parse(JSON.stringify(DEFAULT_DATA)));
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-gray-200 hover:bg-gray-300 text-gray-700 transition-colors"
        >
          <XMarkIcon className="w-4 h-4" />
          Zurücksetzen
        </button>
        {editing && (
          <p className="self-center text-xs text-gray-500 italic">
            Alle Felder sind jetzt direkt bearbeitbar.
          </p>
        )}
      </div>

      {/* ── CV Document ────────────────────────────────────────────────────────── */}
      <div
        className="print:shadow-none"
        style={{ maxWidth: 850, margin: "0 auto", fontFamily: DOC_FONT, backgroundColor: "white", boxShadow: "0 4px 32px rgba(0,0,0,0.14)" }}
      >
        <div style={{ display: "flex" }}>
          {/* ─── LEFT COLUMN ──────────────────────────────────────────────────── */}
          <div style={{ flex: 1, backgroundColor: "white", padding: "32px 20px 32px 32px", color: "#111827" }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 28, paddingBottom: 24, borderBottom: "1px solid #f3f4f6" }}>
              <div
                style={{ width: 96, height: 112, borderRadius: 4, overflow: "hidden", flexShrink: 0, backgroundColor: "#e5e7eb", border: `2px solid ${ACCENT}`, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", cursor: editing ? "pointer" : "default" }}
                onClick={() => editing && photoInputRef.current?.click()}
                title={editing ? "Klicken zum Foto hochladen" : ""}
              >
                {photoSrc ? (
                  <img src={photoSrc} alt="Profilfoto" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <span style={{ fontSize: 11, color: "#9ca3af", textAlign: "center", padding: "0 4px", lineHeight: 1.3 }}>
                    {editing ? "📷 Hochladen" : "Foto"}
                  </span>
                )}
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (ev) => setPhotoSrc((ev.target?.result as string) ?? "");
                    reader.readAsDataURL(file);
                  }}
                />
              </div>
              <div style={{ flex: 1 }}>
                {editing ? (
                  <input
                    value={data.personal.name}
                    onChange={(e) => setPersonal({ name: e.target.value })}
                    style={{ display: "block", fontSize: 34, fontWeight: 700, color: "#0f1e2e", lineHeight: 1.2, marginBottom: 4, border: "1px dashed #93c5fd", borderRadius: 3, padding: "2px 4px", background: "rgba(219,234,254,0.3)", outline: "none", width: "100%" }}
                  />
                ) : (
                  <span style={{ display: "block", fontSize: 34, fontWeight: 700, color: "#0f1e2e", lineHeight: 1.2, marginBottom: 4 }}>{data.personal.name}</span>
                )}
                {editing ? (
                  <input
                    style={{ display: "block", fontSize: 14, color: ACCENT, fontWeight: 500, marginBottom: 8, border: "1px dashed #93c5fd", borderRadius: 3, padding: "2px 4px", background: "rgba(219,234,254,0.3)", outline: "none", width: "100%" }}
                    value={data.personal.subtitle}
                    onChange={(e) => setPersonal({ subtitle: e.target.value })}
                    placeholder="Berufsbezeichnung..."
                  />
                ) : (
                  <span style={{ display: "block", fontSize: 14, color: ACCENT, fontWeight: 500, marginBottom: 8 }}>
                    {data.personal.subtitle}
                  </span>
                )}
                <E
                  value={data.personal.bio}
                  onChange={(v) => setPersonal({ bio: v })}
                  editing={editing}
                  multiline
                  className="block"
                  placeholder="Profiltext / Bio..."
                  style={{ fontSize: 11, color: "#6b7280", lineHeight: 1.5 }}
                />
              </div>
            </div>

            {/* ─── PROJEKTE ──────────────────────────────────────────────────── */}
            <div className="mb-6">
              <SectionHeading
                title="Projekte"
                icon={
                  <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="2" y="2" width="12" height="9" rx="1" />
                    <path d="M5 14h6M8 11v3" />
                  </svg>
                }
              />
              {data.projects.map((project) => (
                <div key={project.id} className="mb-4">
                  <div className="flex items-baseline justify-between mb-1">
                    <E
                      value={project.title}
                      onChange={(v) => updateProject(project.id, { title: v })}
                      editing={editing}
                      className="font-semibold text-sm text-gray-900"
                    />
                    <E
                      value={project.period}
                      onChange={(v) => updateProject(project.id, { period: v })}
                      editing={editing}
                      className="text-xs ml-2 shrink-0"
                    />
                  </div>
                  <BulletList
                    bullets={project.bullets}
                    onChange={(b) => updateProject(project.id, { bullets: b })}
                    editing={editing}
                  />
                  {(project.link || editing) && (
                    editing ? (
                      <E
                        value={project.link ?? ""}
                        onChange={(v) => updateProject(project.id, { link: v })}
                        editing={editing}
                        className="text-xs mt-1"
                      />
                    ) : (
                      <span className="text-xs mt-1 block underline" style={{ color: ACCENT }}>
                        {project.link}
                      </span>
                    )
                  )}
                  {editing && (
                    <button
                      type="button"
                      onClick={() => setProjects(data.projects.filter((p) => p.id !== project.id))}
                      className="mt-1 flex items-center gap-1 text-xs text-red-400 hover:text-red-600"
                    >
                      <TrashIcon className="w-3 h-3" /> Projekt entfernen
                    </button>
                  )}
                </div>
              ))}
              {editing && (
                <button
                  type="button"
                  onClick={() =>
                    setProjects([...data.projects, { id: uid(), title: "Neues Projekt", period: "", bullets: [], link: "" }])
                  }
                  className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 mt-1"
                >
                  <PlusIcon className="w-3.5 h-3.5" /> Projekt hinzufügen
                </button>
              )}
            </div>

            {/* ─── AUSBILDUNG ─────────────────────────────────────────────────── */}
            <div className="mb-6">
              <SectionHeading
                title="Ausbildung"
                icon={
                  <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M2 6l6-4 6 4-6 4-6-4z" />
                    <path d="M14 6v5M4 8.5v3.5a6 6 0 008 0V8.5" />
                  </svg>
                }
              />
              {data.education.map((edu) => (
                <div key={edu.id} className="mb-4">
                  <div className="flex items-baseline justify-between flex-wrap gap-1 mb-0.5">
                    <E
                      value={edu.degree}
                      onChange={(v) => updateEducation(edu.id, { degree: v })}
                      editing={editing}
                      className="font-bold text-sm text-gray-900"
                    />
                  </div>
                  <E
                    value={edu.institution}
                    onChange={(v) => updateEducation(edu.id, { institution: v })}
                    editing={editing}
                    className="text-sm text-gray-700 block"
                  />
                  <div className="flex items-center justify-between text-xs mt-0.5 mb-1" style={{ color: ACCENT }}>
                    <E
                      value={edu.period}
                      onChange={(v) => updateEducation(edu.id, { period: v })}
                      editing={editing}
                      className="italic"
                    />
                    <E
                      value={edu.location}
                      onChange={(v) => updateEducation(edu.id, { location: v })}
                      editing={editing}
                      className="italic ml-2"
                    />
                  </div>
                  <p className="text-xs italic mb-1" style={{ color: ACCENT }}>
                    <E
                      value={edu.type}
                      onChange={(v) => updateEducation(edu.id, { type: v })}
                      editing={editing}
                      className="italic"
                    />
                  </p>
                  <BulletList
                    bullets={edu.bullets}
                    onChange={(b) => updateEducation(edu.id, { bullets: b })}
                    editing={editing}
                  />
                  {editing && (
                    <button
                      type="button"
                      onClick={() => setEducation(data.education.filter((e) => e.id !== edu.id))}
                      className="mt-1 flex items-center gap-1 text-xs text-red-400 hover:text-red-600"
                    >
                      <TrashIcon className="w-3 h-3" /> Eintrag entfernen
                    </button>
                  )}
                </div>
              ))}
              {editing && (
                <button
                  type="button"
                  onClick={() =>
                    setEducation([
                      ...data.education,
                      { id: uid(), degree: "Abschluss", institution: "Schule / Universität", period: "", location: "", type: "Abschluss", bullets: [] },
                    ])
                  }
                  className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 mt-1"
                >
                  <PlusIcon className="w-3.5 h-3.5" /> Ausbildung hinzufügen
                </button>
              )}
            </div>

            {/* ─── BERUFSERFAHRUNG ─────────────────────────────────────────────── */}
            <div className="mb-6">
              <SectionHeading
                title="Berufserfahrung"
                icon={
                  <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="4" y="5" width="8" height="8" rx="1" />
                    <path d="M5 5V4a3 3 0 016 0v1" />
                  </svg>
                }
              />
              {data.experience.map((exp) => (
                <div key={exp.id} className="mb-5">
                  <div className="flex items-baseline justify-between flex-wrap gap-1 mb-0.5">
                    <E
                      value={exp.position}
                      onChange={(v) => updateExperience(exp.id, { position: v })}
                      editing={editing}
                      className="font-bold text-sm text-gray-900"
                    />
                  </div>
                  <E
                    value={exp.company}
                    onChange={(v) => updateExperience(exp.id, { company: v })}
                    editing={editing}
                    className="text-sm text-gray-700 block"
                  />
                  <div className="flex items-center justify-between text-xs mt-0.5 mb-1" style={{ color: ACCENT }}>
                    <E
                      value={exp.period}
                      onChange={(v) => updateExperience(exp.id, { period: v })}
                      editing={editing}
                      className="italic"
                    />
                    <E
                      value={exp.location}
                      onChange={(v) => updateExperience(exp.id, { location: v })}
                      editing={editing}
                      className="italic ml-2"
                    />
                  </div>
                  {(exp.description || editing) && (
                    <E
                      value={exp.description ?? ""}
                      onChange={(v) => updateExperience(exp.id, { description: v })}
                      editing={editing}
                      className="text-xs italic text-gray-500 block mb-1"
                    />
                  )}
                  <p className="text-xs italic mb-1" style={{ color: ACCENT }}>
                    <E
                      value={exp.type ?? "Aufgaben"}
                      onChange={(v) => updateExperience(exp.id, { type: v })}
                      editing={editing}
                      className="italic"
                    />
                  </p>
                  <BulletList
                    bullets={exp.bullets}
                    onChange={(b) => updateExperience(exp.id, { bullets: b })}
                    editing={editing}
                  />
                  {(exp.contact || editing) && (
                    <p className="text-xs italic mt-1.5" style={{ color: ACCENT }}>
                      Kontakt:{" "}
                      <E
                        value={exp.contact ?? ""}
                        onChange={(v) => updateExperience(exp.id, { contact: v })}
                        editing={editing}
                        className="inline"
                      />
                    </p>
                  )}
                  {editing && (
                    <button
                      type="button"
                      onClick={() => setExperience(data.experience.filter((e) => e.id !== exp.id))}
                      className="mt-1 flex items-center gap-1 text-xs text-red-400 hover:text-red-600"
                    >
                      <TrashIcon className="w-3 h-3" /> Eintrag entfernen
                    </button>
                  )}
                </div>
              ))}
              {editing && (
                <button
                  type="button"
                  onClick={() =>
                    setExperience([
                      ...data.experience,
                      { id: uid(), position: "Position", company: "Unternehmen", period: "", location: "", description: "", type: "Aufgaben", bullets: [] },
                    ])
                  }
                  className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 mt-1"
                >
                  <PlusIcon className="w-3.5 h-3.5" /> Berufserfahrung hinzufügen
                </button>
              )}
            </div>
          </div>

          {/* ─── RIGHT SIDEBAR ─────────────────────────────────────────────────── */}
          <div
            style={{ width: 295, flexShrink: 0, backgroundColor: SIDEBAR_BG, color: "white", padding: "32px 20px" }}
          >
            {/* Contact */}
            <div className="mb-6">
              <ContactRow
                icon={<EnvelopeIcon className="w-3 h-3" />}
                value={data.personal.email}
                editing={editing}
                onChange={(v) => setPersonal({ email: v })}
              />
              <ContactRow
                icon={<PhoneIcon className="w-3 h-3" />}
                value={data.personal.phone}
                editing={editing}
                onChange={(v) => setPersonal({ phone: v })}
              />
              <ContactRow
                icon={<MapPinIcon className="w-3 h-3" />}
                value={data.personal.location}
                editing={editing}
                onChange={(v) => setPersonal({ location: v })}
              />
              <ContactRow
                icon={
                  <svg viewBox="0 0 16 16" className="w-3 h-3" fill="currentColor">
                    <path d="M13 2H3a1 1 0 00-1 1v10a1 1 0 001 1h10a1 1 0 001-1V3a1 1 0 00-1-1zM6 11H4V6h2v5zm-1-5.7a1.15 1.15 0 110-2.3 1.15 1.15 0 010 2.3zM12 11h-2V8.5c0-.6-.5-1-1-1s-1 .4-1 1V11H6V6h2v.8A2.5 2.5 0 0112 8.5V11z" />
                  </svg>
                }
                value={data.personal.linkedin}
                editing={editing}
                onChange={(v) => setPersonal({ linkedin: v })}
              />
              <ContactRow
                icon={
                  <svg viewBox="0 0 16 16" className="w-3 h-3" fill="currentColor">
                    <path d="M8 0a8 8 0 100 16A8 8 0 008 0zm0 1.5a6.5 6.5 0 016.28 4.83L9.5 4.5V3L8 1.5zm-1.5 0L5 3v1.5L.22 6.33A6.5 6.5 0 016.5 1.5zM8 14.5a6.47 6.47 0 01-5.5-3.08L5 10l1.5 1.5H9L10.5 10l2.5 1.42A6.47 6.47 0 018 14.5z" />
                  </svg>
                }
                value={data.personal.github}
                editing={editing}
                onChange={(v) => setPersonal({ github: v })}
              />
              {(data.personal.website || editing) && (
                <ContactRow
                  icon={<LinkIcon className="w-3 h-3" />}
                  value={data.personal.website ?? ""}
                  editing={editing}
                  onChange={(v) => setPersonal({ website: v })}
                />
              )}
            </div>

            {/* FERTIGKEITEN */}
            <div className="mb-5">
              <SidebarHeading
                title="Fertigkeiten"
                icon={
                  <svg viewBox="0 0 16 16" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <circle cx="8" cy="8" r="6" />
                    <path d="M8 5v3l2 2" />
                  </svg>
                }
              />
              <TagList
                tags={data.skills}
                onChange={(t) => setData((d) => ({ ...d, skills: t }))}
                editing={editing}
                dark
              />
            </div>

            {/* TECHNISCHE FERTIGKEITEN */}
            <div className="mb-5">
              <SidebarHeading
                title="Technische Fertigkeiten"
                icon={
                  <svg viewBox="0 0 16 16" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M5 3l-3 5 3 5M11 3l3 5-3 5M9 2l-2 12" />
                  </svg>
                }
              />
              {data.technicalSkills.map((ts) => (
                <div key={ts.id} className="mb-2">
                  <E
                    value={ts.name}
                    onChange={(v) => setTechSkills(data.technicalSkills.map((t) => (t.id === ts.id ? { ...t, name: v } : t)))}
                    editing={editing}
                    className="text-xs font-bold text-white block"
                  />
                  <E
                    value={ts.description}
                    onChange={(v) => setTechSkills(data.technicalSkills.map((t) => (t.id === ts.id ? { ...t, description: v } : t)))}
                    editing={editing}
                    className="text-xs text-gray-300 block"
                  />
                  {editing && (
                    <button
                      type="button"
                      onClick={() => setTechSkills(data.technicalSkills.filter((t) => t.id !== ts.id))}
                      className="flex items-center gap-0.5 text-xs text-red-300 hover:text-red-500 mt-0.5"
                    >
                      <XMarkIcon className="w-2.5 h-2.5" /> Entfernen
                    </button>
                  )}
                </div>
              ))}
              {editing && (
                <button
                  type="button"
                  onClick={() => setTechSkills([...data.technicalSkills, { id: uid(), name: "Neue Technologie", description: "Beschreibung..." }])}
                  className="flex items-center gap-1 text-xs text-blue-300 hover:text-blue-100 mt-1"
                >
                  <PlusIcon className="w-3 h-3" /> Hinzufügen
                </button>
              )}
            </div>

            {/* SOFT SKILLS */}
            <div className="mb-5">
              <SidebarHeading
                title="Soft Skills"
                icon={
                  <svg viewBox="0 0 16 16" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M8 1a4 4 0 100 8A4 4 0 008 1zM1.5 15c0-3.5 3-5.5 6.5-5.5S14.5 11.5 14.5 15" />
                  </svg>
                }
              />
              <TagList
                tags={data.softSkills}
                onChange={(t) => setData((d) => ({ ...d, softSkills: t }))}
                editing={editing}
                dark
              />
            </div>

            {/* REFERENZEN */}
            <div className="mb-5">
              <SidebarHeading
                title="Referenzen"
                icon={
                  <svg viewBox="0 0 16 16" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M3 13V9a5 5 0 0110 0v4M8 4a2 2 0 100-4 2 2 0 000 4z" />
                  </svg>
                }
              />
              {data.references.map((ref) => (
                <div key={ref.id} className="mb-2">
                  <E
                    value={ref.company}
                    onChange={(v) => setReferences(data.references.map((r) => (r.id === ref.id ? { ...r, company: v } : r)))}
                    editing={editing}
                    className="text-xs font-semibold text-white block"
                  />
                  {(ref.person || editing) && (
                    <E
                      value={ref.person ?? ""}
                      onChange={(v) => setReferences(data.references.map((r) => (r.id === ref.id ? { ...r, person: v } : r)))}
                      editing={editing}
                      className="text-xs italic text-gray-300 block"
                    />
                  )}
                  {editing && (
                    <button
                      type="button"
                      onClick={() => setReferences(data.references.filter((r) => r.id !== ref.id))}
                      className="flex items-center gap-0.5 text-xs text-red-300 hover:text-red-500 mt-0.5"
                    >
                      <XMarkIcon className="w-2.5 h-2.5" /> Entfernen
                    </button>
                  )}
                </div>
              ))}
              {editing && (
                <button
                  type="button"
                  onClick={() => setReferences([...data.references, { id: uid(), company: "Unternehmen", person: "" }])}
                  className="flex items-center gap-1 text-xs text-blue-300 hover:text-blue-100 mt-1"
                >
                  <PlusIcon className="w-3 h-3" /> Hinzufügen
                </button>
              )}
            </div>

            {/* ZERTIFIKATE */}
            <div className="mb-5">
              <SidebarHeading
                title="Zertifikate"
                icon={
                  <svg viewBox="0 0 16 16" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="2" y="3" width="12" height="9" rx="1" />
                    <path d="M6 10V8l2-2 2 2v2M8 6V3" />
                  </svg>
                }
              />
              {data.certificates.map((cert) => (
                <div key={cert.id} className="mb-2">
                  <E
                    value={cert.name}
                    onChange={(v) => setCertificates(data.certificates.map((c) => (c.id === cert.id ? { ...c, name: v } : c)))}
                    editing={editing}
                    className="text-xs text-white block leading-tight"
                    multiline
                  />
                  <E
                    value={cert.period}
                    onChange={(v) => setCertificates(data.certificates.map((c) => (c.id === cert.id ? { ...c, period: v } : c)))}
                    editing={editing}
                    className="text-xs text-gray-300 block mt-0.5"
                  />
                  {editing && (
                    <button
                      type="button"
                      onClick={() => setCertificates(data.certificates.filter((c) => c.id !== cert.id))}
                      className="flex items-center gap-0.5 text-xs text-red-300 hover:text-red-500 mt-0.5"
                    >
                      <XMarkIcon className="w-2.5 h-2.5" /> Entfernen
                    </button>
                  )}
                </div>
              ))}
              {editing && (
                <button
                  type="button"
                  onClick={() => setCertificates([...data.certificates, { id: uid(), name: "Zertifikat", period: "" }])}
                  className="flex items-center gap-1 text-xs text-blue-300 hover:text-blue-100 mt-1"
                >
                  <PlusIcon className="w-3 h-3" /> Hinzufügen
                </button>
              )}
            </div>

            {/* SPRACHEN */}
            <div className="mb-5">
              <SidebarHeading
                title="Sprachen"
                icon={
                  <svg viewBox="0 0 16 16" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <circle cx="8" cy="8" r="6" />
                    <path d="M8 2c-2 2-2 8 0 12M8 2c2 2 2 8 0 12M2 8h12" />
                  </svg>
                }
              />
              {data.languages.map((lang) => (
                <div key={lang.id} className="mb-1.5">
                  <E
                    value={lang.language}
                    onChange={(v) => setLanguages(data.languages.map((l) => (l.id === lang.id ? { ...l, language: v } : l)))}
                    editing={editing}
                    className="text-xs font-semibold text-white block"
                  />
                  <E
                    value={lang.level}
                    onChange={(v) => setLanguages(data.languages.map((l) => (l.id === lang.id ? { ...l, level: v } : l)))}
                    editing={editing}
                    className="text-xs italic block"
                    style={{ color: ACCENT }}
                  />
                  {editing && (
                    <button
                      type="button"
                      onClick={() => setLanguages(data.languages.filter((l) => l.id !== lang.id))}
                      className="flex items-center gap-0.5 text-xs text-red-300 hover:text-red-500 mt-0.5"
                    >
                      <XMarkIcon className="w-2.5 h-2.5" /> Entfernen
                    </button>
                  )}
                </div>
              ))}
              {editing && (
                <button
                  type="button"
                  onClick={() => setLanguages([...data.languages, { id: uid(), language: "Sprache", level: "Niveau" }])}
                  className="flex items-center gap-1 text-xs text-blue-300 hover:text-blue-100 mt-1"
                >
                  <PlusIcon className="w-3 h-3" /> Hinzufügen
                </button>
              )}
            </div>

            {/* INTERESSEN */}
            <div className="mb-2">
              <SidebarHeading
                title="Interessen"
                icon={
                  <svg viewBox="0 0 16 16" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M8 1l1.9 3.9 4.3.6-3.1 3 .7 4.3L8 10.5 4.2 12.8l.7-4.3L1.8 5.5l4.3-.6z" />
                  </svg>
                }
              />
              <TagList
                tags={data.interests}
                onChange={(t) => setData((d) => ({ ...d, interests: t }))}
                editing={editing}
                outlined
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 32px", borderTop: "1px solid #f3f4f6", fontSize: 11, color: "#9ca3af" }}>
          <span>{new Date().toLocaleDateString("de-DE", { day: "2-digit", month: "long", year: "numeric" })}</span>
          <span>Seite 1 von 1</span>
        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          body { margin: 0; }
          .print\\:hidden { display: none !important; }
          .print\\:shadow-none { box-shadow: none !important; }
        }
      `}</style>
    </div>
  );
}
