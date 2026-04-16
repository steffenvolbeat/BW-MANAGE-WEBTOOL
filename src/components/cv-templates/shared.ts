// ─────────────────────────────────────────────────────────────────────────────
// Shared types, default data, and constants for all CV & Cover Letter templates
// ─────────────────────────────────────────────────────────────────────────────

export const uid = () => Math.random().toString(36).slice(2, 9);

// ─── Font tokens ──────────────────────────────────────────────────────────────
export const FONTS: { key: string; label: string; family: string; gf: string }[] = [
  { key: "nunito",       label: "Nunito",       family: "'Nunito','Calibri',sans-serif",       gf: "Nunito:wght@400;600;700;800" },
  { key: "roboto",       label: "Roboto",        family: "'Roboto',Arial,sans-serif",           gf: "Roboto:wght@400;500;700" },
  { key: "opensans",     label: "Open Sans",     family: "'Open Sans',Arial,sans-serif",        gf: "Open+Sans:wght@400;600;700" },
  { key: "lato",         label: "Lato",          family: "'Lato',Arial,sans-serif",             gf: "Lato:wght@400;700" },
  { key: "inter",        label: "Inter",         family: "'Inter',Arial,sans-serif",            gf: "Inter:wght@400;500;600;700" },
  { key: "merriweather", label: "Merriweather",  family: "'Merriweather',Georgia,serif",        gf: "Merriweather:wght@400;700" },
  { key: "playfair",     label: "Playfair",      family: "'Playfair Display',Georgia,serif",    gf: "Playfair+Display:wght@400;700" },
  { key: "georgia",      label: "Georgia",       family: "Georgia,serif",                       gf: "" },
];

export const FONT_SIZES: { key: string; label: string; scale: number }[] = [
  { key: "xs", label: "XS", scale: 0.85 },
  { key: "sm", label: "S",  scale: 0.92 },
  { key: "md", label: "M",  scale: 1.0  },
  { key: "lg", label: "L",  scale: 1.08 },
  { key: "xl", label: "XL", scale: 1.15 },
];

export const PHOTO_SHAPES: { key: string; label: string; br: string; w: number; h: number; clip?: string; shadow?: string }[] = [
  { key: "square",  label: "Quadrat",    br: "0px",  w: 96,  h: 112 },
  { key: "rounded", label: "Abgerundet", br: "8px",  w: 96,  h: 112 },
  { key: "pill",    label: "Stark rund", br: "24px", w: 96,  h: 112 },
  { key: "ellipse", label: "Ellipse",    br: "50%",  w: 96,  h: 112 },
  { key: "circle",  label: "Kreis",      br: "50%",  w: 100, h: 100 },
  { key: "diamond", label: "Diamant",    br: "0px",  w: 90,  h: 90,  clip: "polygon(50% 0%,100% 50%,50% 100%,0% 50%)" },
  { key: "wuerfel", label: "Würfel",     br: "0px",  w: 96,  h: 96,  shadow: "6px 6px 0 #0f1e2e, 12px 12px 0 rgba(29,42,58,0.5)" },
  { key: "kugel",   label: "Kugel",      br: "50%",  w: 100, h: 100, shadow: "inset -5px -5px 12px rgba(0,0,0,0.55), inset 4px 4px 8px rgba(255,255,255,0.18), 0 5px 15px rgba(0,0,0,0.25)" },
];

// ─── Template registry ────────────────────────────────────────────────────────
export interface TemplateMeta {
  key: string;
  label: string;
  description: string;
  accent: string;
  bg: string;
  preview: string; // CSS gradient or color for thumbnail
}

export const CV_TEMPLATES: TemplateMeta[] = [
  { key: "novoresume",  label: "Novoresume",   description: "Dunkle Sidebar, türkis",           accent: "#3ecfd6", bg: "#1d2a3a", preview: "linear-gradient(135deg,#1d2a3a 40%,#3ecfd6 100%)" },
  { key: "midnight",    label: "Midnight",     description: "Schwarz-gold, elegant",             accent: "#f59e0b", bg: "#0a0a0a", preview: "linear-gradient(135deg,#0a0a0a 40%,#f59e0b 100%)" },
  { key: "aurora",      label: "Aurora",       description: "Lila-Pink Gradient-Header",         accent: "#a855f7", bg: "#1e1b4b", preview: "linear-gradient(135deg,#1e1b4b,#a855f7,#ec4899)" },
  { key: "forest",      label: "Forest",       description: "Grün-natur, clean",                 accent: "#22c55e", bg: "#14532d", preview: "linear-gradient(135deg,#14532d 40%,#22c55e 100%)" },
  { key: "crimson",     label: "Crimson",      description: "Rot-weiß, kraftvoll",               accent: "#ef4444", bg: "#7f1d1d", preview: "linear-gradient(135deg,#7f1d1d 40%,#ef4444 100%)" },
  { key: "arctic",      label: "Arctic",       description: "Eisblau, minimalistisch",           accent: "#38bdf8", bg: "#f0f9ff", preview: "linear-gradient(135deg,#e0f2fe,#38bdf8)" },
  { key: "obsidian",    label: "Obsidian",     description: "Grau-Monochrom, professionell",     accent: "#6b7280", bg: "#111827", preview: "linear-gradient(135deg,#111827 40%,#6b7280 100%)" },
  { key: "solar",       label: "Solar",        description: "Orange-braun, warm",                accent: "#f97316", bg: "#431407", preview: "linear-gradient(135deg,#431407 40%,#f97316 100%)" },
  { key: "sakura",      label: "Sakura",       description: "Rosa, feminin, modern",             accent: "#f472b6", bg: "#831843", preview: "linear-gradient(135deg,#831843 40%,#f472b6 100%)" },
  { key: "matrix",      label: "Matrix",       description: "Grün auf Schwarz, Tech/Hacker",     accent: "#4ade80", bg: "#052e16", preview: "linear-gradient(135deg,#052e16 30%,#4ade80 100%)" },
];

export const CL_TEMPLATES: TemplateMeta[] = [
  { key: "novoresume",  label: "Novoresume",   description: "Dunkle Header-Bar, türkis",         accent: "#3ecfd6", bg: "#1d2a3a", preview: "linear-gradient(135deg,#1d2a3a 40%,#3ecfd6 100%)" },
  { key: "midnight",    label: "Midnight",     description: "Schwarz-gold, elegant",             accent: "#f59e0b", bg: "#0a0a0a", preview: "linear-gradient(135deg,#0a0a0a 40%,#f59e0b 100%)" },
  { key: "aurora",      label: "Aurora",       description: "Lila-Pink Gradient-Header",         accent: "#a855f7", bg: "#1e1b4b", preview: "linear-gradient(135deg,#1e1b4b,#a855f7,#ec4899)" },
  { key: "forest",      label: "Forest",       description: "Grün-natur, clean",                 accent: "#22c55e", bg: "#14532d", preview: "linear-gradient(135deg,#14532d 40%,#22c55e 100%)" },
  { key: "crimson",     label: "Crimson",      description: "Rot-weiß, kraftvoll",               accent: "#ef4444", bg: "#7f1d1d", preview: "linear-gradient(135deg,#7f1d1d 40%,#ef4444 100%)" },
  { key: "arctic",      label: "Arctic",       description: "Eisblau, minimalistisch",           accent: "#38bdf8", bg: "#f0f9ff", preview: "linear-gradient(135deg,#e0f2fe,#38bdf8)" },
  { key: "obsidian",    label: "Obsidian",     description: "Grau-Monochrom, professionell",     accent: "#6b7280", bg: "#111827", preview: "linear-gradient(135deg,#111827 40%,#6b7280 100%)" },
  { key: "solar",       label: "Solar",        description: "Orange-braun, warm",                accent: "#f97316", bg: "#431407", preview: "linear-gradient(135deg,#431407 40%,#f97316 100%)" },
  { key: "sakura",      label: "Sakura",       description: "Rosa, feminin, modern",             accent: "#f472b6", bg: "#831843", preview: "linear-gradient(135deg,#831843 40%,#f472b6 100%)" },
  { key: "matrix",      label: "Matrix",       description: "Grün auf Schwarz, Tech/Hacker",     accent: "#4ade80", bg: "#052e16", preview: "linear-gradient(135deg,#052e16 30%,#4ade80 100%)" },
];

// ─── CV Types ─────────────────────────────────────────────────────────────────
export interface Project    { id: string; title: string; period: string; bullets: string[]; link?: string; }
export interface Education  { id: string; degree: string; institution: string; period: string; location: string; type: string; bullets: string[]; }
export interface Experience { id: string; position: string; company: string; period: string; location: string; description?: string; type?: string; bullets: string[]; contact?: string; }
export interface TechSkill  { id: string; name: string; description: string; }
export interface Language   { id: string; language: string; level: string; }
export interface Certificate{ id: string; name: string; period: string; }
export interface Reference  { id: string; company: string; person?: string; }

export interface CVData {
  personal: { name: string; subtitle: string; bio: string; email: string; phone: string; location: string; linkedin: string; github: string; website?: string; };
  projects: Project[]; education: Education[]; experience: Experience[];
  skills: string[]; technicalSkills: TechSkill[]; softSkills: string[];
  references: Reference[]; certificates: Certificate[]; languages: Language[]; interests: string[];
}

// ─── Cover Letter Types ────────────────────────────────────────────────────────
export interface CLData {
  personal: { name: string; subtitle: string; email: string; phone: string; location: string; website: string; linkedin: string; github: string; };
  recipient: { company: string; street: string; cityZip: string; country: string; };
  date: string; subject: string; salutation: string;
  bodyParagraphs: string[];
  closing: string; signatureName: string;
}

// ─── Default CV Data ──────────────────────────────────────────────────────────
export const DEFAULT_CV_DATA: CVData = {
  personal: {
    name:     "Steffen Lorenz",
    subtitle: "Webentwickler / Fullstack",
    bio:      "Als motivierter und engagierter Web-Entwickler mit Fokus auf strukturierte, semantische und performante Weblösungen. Meine Schwerpunkte liegen in HTML5, CSS3, JavaScript, Next.js und SQL. Durch meine IT-Umschulung und vielseitige Praxiserfahrung arbeite ich analytisch, zuverlässig und lösungsorientiert. Eigene Projekte und ständiges Lernen treiben mich an – ebenso wie Musik, E-Gitarren und Laufen.",
    email:    "steffen.konstanz@gmx.ch",
    phone:    "0173 4235651",
    location: "Erfurt, Deutschland",
    linkedin: "linkedin.com/in/steffenlorenz-8412873b2",
    github:   "github.com/steffenvolbeat",
    website:  "",
  },
  projects: [
    { id: uid(), title: "Band-Website", period: "08/2025 - In Progress", link: "steffenvolbeatBand-Website", bullets: [
      "React 19, Vite 7, Tailwind CSS 4, React Router – mehrseitige Band-Webseite.",
      "Bereiche: Home, Band, About, Tour, Media, Contact mit einheitlichem RootLayout.",
      "Datengetrieben via generischem Fetch-Hook aus lokalen JSON-Dateien.",
      "Foto-Galerie, Videokomponenten und strukturiertes Kontaktformular.",
    ]},
    { id: uid(), title: "FullStack-Todo-Web-App", period: "10/2025 - In Progress", link: "FullStack-Todo-Web-App", bullets: [
      "Next.js 16, React 19, TypeScript, Prisma, PostgreSQL – vollständige CRUD-Verwaltung.",
      "Next.js App Router, serverseitiges Rendering und RESTful API-Routen.",
      "Persistente Datenspeicherung, automatische Zeitstempel, Loading States.",
    ]},
    { id: uid(), title: "Abschluss-Projekt Metal3DEvent-Plattform", period: "07/2025 - In Progress", link: "steffenvolbeatMETAL3DCORE-Plattform", bullets: [
      "Next.js, React, TypeScript + React Three Fiber, Drei, Three.js, Postprocessing.",
      "Prisma & PostgreSQL Backend, NextAuth, React Hook Form, Zod.",
      "Jest Unit-Tests + Cypress E2E-Tests für Qualitätssicherung.",
    ]},
  ],
  education: [
    { id: uid(), degree: "Web- und Softwareentwicklung", institution: "Digital Career Institute GmbH", period: "02/2025 - 04/2026", location: "Berlin / Deutschland", type: "Kurse / Inhalte", bullets: [
      "Webentwicklung mit HTML5, CSS3, JavaScript",
      "Frontend-Entwicklung mit Next.js",
      "Datenbanken & SQL (PostgreSQL, Prisma)",
      "Versionskontrolle mit Git/GitHub",
      "Grundlagen Backend & API-Konzepte",
    ]},
    { id: uid(), degree: "Umschulung", institution: "BFW – Thüringen", period: "03/2020 - 06/2021", location: "Seelingstädt / Deutschland", type: "Kurse / Inhalte", bullets: [
      "Windows- und Client-Administration",
      "Netzwerke (WAN/LAN), Hardware & Peripherie",
      "IT-Support, Fehleranalyse und Troubleshooting",
    ]},
  ],
  experience: [
    { id: uid(), position: "Produktionsmitarbeiter", company: "Mercedes-Benz Zentrum", period: "09/2022 - 07/2024", location: "Kölleda, Erfurt / Deutschland", description: "Motorenwerk – Qualitätskontrolle und Montage.", type: "Aufgaben", bullets: [
      "Durchführen von Qualitätskontrollen",
      "Fachgerechtes Montieren von Bauteilen",
    ], contact: "Kathrin Niemann – erfurt@office-people.com"},
    { id: uid(), position: "Praktikant", company: "Secosys-IT", period: "03/2021 - 06/2021", location: "Erfurt / Deutschland", description: "IT-Systemhaus für Telekommunikationsinfrastrukturen.", type: "Aufgaben", bullets: [
      "Konfiguration von Routern und Netzwerken (WAN, LAN, Routing, NAT).",
      "Aufnahme von PCs in Domänen, Migration von Clientsystemen.",
    ], contact: "Christian Ranft – info@secosys-it.de"},
  ],
  skills: ["HTML 5","CSS 3","JavaScript","NextJS","React","TypeScript","Python","SQL","Docker","Git","Figma","Netzwerk"],
  technicalSkills: [
    { id: uid(), name: "React.js",  description: "Zum Erstellen von Benutzeroberflächen." },
    { id: uid(), name: "Node.js",   description: "Für die serverseitige Entwicklung." },
    { id: uid(), name: "Git",       description: "Versionskontrolle und GitHub-Zusammenarbeit." },
  ],
  softSkills: ["Teamfähig","Kreativ","Analytisch","Motiviert","Selbstständig"],
  references: [{ id: uid(), company: "Secosys IT", person: "Christian Ranft, Geschäftsführer" }],
  certificates: [
    { id: uid(), name: "Web & Software Development Certificate – DCI", period: "(02/2025 - 04/2026)" },
    { id: uid(), name: "PC-Service / IT-Grundlagen",                   period: "(02/2020 - 06/2021)" },
  ],
  languages: [
    { id: uid(), language: "Deutsch",  level: "Muttersprache" },
    { id: uid(), language: "Englisch", level: "Eingeschränkte Arbeitskompetenz" },
  ],
  interests: ["E-Gitarre", "Fitness / Laufen"],
};

// ─── Default Cover Letter Data ────────────────────────────────────────────────
export const DEFAULT_CL_DATA: CLData = {
  personal: {
    name:     "Steffen Lorenz",
    subtitle: "Web- und Softwareentwickler",
    email:    "steffen.konstanz@gmx.ch",
    phone:    "0173 4235651",
    location: "Erfurt, Deutschland",
    website:  "next-gen-developer-portfolio.vercel.app/",
    linkedin: "linkedin.com/in/steffenlorenz-8412873b2",
    github:   "github.com/steffenvolbeat",
  },
  recipient: {
    company: "addON Solution GmbH",
    street:  "Otto-Eppenstein-Straße",
    cityZip: "26 07745 Jena",
    country: "Germany",
  },
  date:       "01. April 2026",
  subject:    "Bewerbung als Quereinsteiger (m/w/d) Software-Entwicklung / Web-Entwicklung",
  salutation: "Sehr geehrte Damen und Herren,",
  bodyParagraphs: [
    "Ihre Ausschreibung ist deshalb interessant, weil sie nicht auf formale Lebensläufe fixiert ist, sondern auf echte Entwicklungsbegeisterung, Problemlösung und technisches Wachstum. Genau darin sehe ich meine Stärke.",
    "Aktuell absolviere ich eine Weiterbildung zum Web- und Softwareentwickler. Dabei arbeite ich mit Linux, Git-Workflows, HTML, CSS, JavaScript, TypeScript, Node.js, React, Next.js, PostgreSQL, Docker und APIs.",
    "Besonders passend finde ich Ihr Umfeld, weil Sie seit Jahren spezialisierte Software entwickeln. Mich überzeugt die Verbindung aus fachlicher Spezialisierung, produktnaher Entwicklung und realem Kundennutzen.",
    "Ich komme zwar nicht aus einem klassischen Informatikstudium, bringe aber genau die Mischung mit: technische Lernbereitschaft, Begeisterung für Programmierung und den Anspruch, mich Schritt für Schritt weiterzuentwickeln.",
    "Über die Einladung zu einem persönlichen Gespräch freue ich mich.",
  ],
  closing:       "Mit freundlichen Grüßen,",
  signatureName: "Steffen Lorenz",
};
