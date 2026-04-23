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
  { key: "novoresume",  label: "Novoresume",   description: "Dunkle Sidebar, türkis",             accent: "#3ecfd6", bg: "#1d2a3a",  preview: "linear-gradient(135deg,#1d2a3a 40%,#3ecfd6 100%)" },
  { key: "midnight",    label: "Midnight",     description: "Schwarz-gold, elegant",              accent: "#f59e0b", bg: "#0a0a0a",  preview: "linear-gradient(135deg,#0a0a0a 40%,#f59e0b 100%)" },
  { key: "aurora",      label: "Aurora",       description: "Lila-Pink Gradient-Header",          accent: "#a855f7", bg: "#1e1b4b",  preview: "linear-gradient(135deg,#1e1b4b,#a855f7,#ec4899)" },
  { key: "forest",      label: "Forest",       description: "Grün-natur, clean",                  accent: "#22c55e", bg: "#14532d",  preview: "linear-gradient(135deg,#14532d 40%,#22c55e 100%)" },
  { key: "crimson",     label: "Crimson",      description: "Rot-weiß, kraftvoll",                accent: "#ef4444", bg: "#7f1d1d",  preview: "linear-gradient(135deg,#7f1d1d 40%,#ef4444 100%)" },
  { key: "arctic",      label: "Arctic",       description: "Eisblau, minimalistisch",            accent: "#38bdf8", bg: "#f0f9ff",  preview: "linear-gradient(135deg,#e0f2fe,#38bdf8)" },
  { key: "obsidian",    label: "Obsidian",     description: "Grau-Monochrom, professionell",      accent: "#6b7280", bg: "#111827",  preview: "linear-gradient(135deg,#111827 40%,#6b7280 100%)" },
  { key: "solar",       label: "Solar",        description: "Orange-braun, warm",                 accent: "#f97316", bg: "#431407",  preview: "linear-gradient(135deg,#431407 40%,#f97316 100%)" },
  { key: "sakura",      label: "Sakura",       description: "Rosa, feminin, modern",              accent: "#f472b6", bg: "#831843",  preview: "linear-gradient(135deg,#831843 40%,#f472b6 100%)" },
  { key: "matrix",      label: "Matrix",       description: "Grün auf Schwarz, Tech/Hacker",      accent: "#4ade80", bg: "#052e16",  preview: "linear-gradient(135deg,#052e16 30%,#4ade80 100%)" },
  { key: "neon",        label: "Neon",         description: "Elektrisches Cyan, dunkel",          accent: "#22d3ee", bg: "#0c1a22",  preview: "linear-gradient(135deg,#0c1a22 40%,#22d3ee 100%)" },
  { key: "ember",       label: "Ember",        description: "Glutrot-Orange, Kontrast",           accent: "#fb923c", bg: "#1a0600",  preview: "linear-gradient(135deg,#1a0600 40%,#fb923c 100%)" },
  { key: "violet",      label: "Violet",       description: "Tiefviolett, edel",                  accent: "#7c3aed", bg: "#1e0e3c",  preview: "linear-gradient(135deg,#1e0e3c 40%,#7c3aed 100%)" },
  { key: "coral",       label: "Coral",        description: "Korallrot, lebendig",                accent: "#fb7185", bg: "#1f0a14",  preview: "linear-gradient(135deg,#1f0a14 40%,#fb7185 100%)" },
  { key: "slate",       label: "Slate",        description: "Stahl-Blaugrau, sachlich",           accent: "#94a3b8", bg: "#0f172a",  preview: "linear-gradient(135deg,#0f172a 40%,#94a3b8 100%)" },
  { key: "mint",        label: "Mint",         description: "Frisches Mint, dunkelgrün",          accent: "#34d399", bg: "#064e3b",  preview: "linear-gradient(135deg,#064e3b 40%,#34d399 100%)" },
  { key: "indigo",      label: "Indigo",       description: "Klassisches Indigo, dunkel",         accent: "#818cf8", bg: "#1e1b4b",  preview: "linear-gradient(135deg,#1e1b4b 40%,#818cf8 100%)" },
  { key: "rust",        label: "Rust",         description: "Rost-Kupfer, industriell",           accent: "#c2410c", bg: "#1c0800",  preview: "linear-gradient(135deg,#1c0800 40%,#c2410c 100%)" },
  { key: "lavender",    label: "Lavender",     description: "Lavendel, sanft-lila",               accent: "#c084fc", bg: "#1e0a3e",  preview: "linear-gradient(135deg,#1e0a3e 40%,#c084fc 100%)" },
  { key: "teal",        label: "Teal",         description: "Dunkles Teal, fokussiert",           accent: "#2dd4bf", bg: "#042f2e",  preview: "linear-gradient(135deg,#042f2e 40%,#2dd4bf 100%)" },
  { key: "copper",      label: "Copper",       description: "Kupfer-Metallic, luxuriös",          accent: "#d97706", bg: "#1c1000",  preview: "linear-gradient(135deg,#1c1000 40%,#d97706 100%)" },
  { key: "navy",        label: "Navy",         description: "Tiefes Marineblau, klassisch",       accent: "#3b82f6", bg: "#1e3a5f",  preview: "linear-gradient(135deg,#1e3a5f 40%,#3b82f6 100%)" },
  { key: "noir",        label: "Noir",         description: "Reinweiß auf Schwarz, maximal",      accent: "#e2e8f0", bg: "#000000",  preview: "linear-gradient(135deg,#000 50%,#e2e8f0 100%)" },
  { key: "cloud",       label: "Cloud",        description: "Himmelblau, helles Design",          accent: "#0ea5e9", bg: "#f0f9ff",  preview: "linear-gradient(135deg,#e0f2fe,#0ea5e9)" },
  { key: "sunset",      label: "Sunset",       description: "Sonnenuntergang-Gradient",           accent: "#fb923c", bg: "#1a0505",  preview: "linear-gradient(135deg,#1a0505,#7c1d4f,#fb923c)" },
  { key: "ocean",       label: "Ocean",        description: "Tiefseeblau, dunkel",                accent: "#2563eb", bg: "#0d1a3d",  preview: "linear-gradient(135deg,#0d1a3d 40%,#2563eb 100%)" },
  { key: "lemon",       label: "Lemon",        description: "Elektrisch Gelb, mutig",             accent: "#fde047", bg: "#1a1500",  preview: "linear-gradient(135deg,#1a1500 40%,#fde047 100%)" },
  { key: "marble",      label: "Marble",       description: "Marmor, hell und clean",             accent: "#6b7280", bg: "#f9fafb",  preview: "linear-gradient(135deg,#f9fafb,#e5e7eb,#9ca3af)" },
  { key: "graphite",    label: "Graphite",     description: "Anthrazit, dunkel-grau",             accent: "#9ca3af", bg: "#1f2937",  preview: "linear-gradient(135deg,#1f2937 40%,#9ca3af 100%)" },
  { key: "blush",       label: "Blush",        description: "Helles Rosa, feminin-modern",        accent: "#ec4899", bg: "#fdf2f8",  preview: "linear-gradient(135deg,#fdf2f8,#fbcfe8,#ec4899)" },
  { key: "jade",        label: "Jade",         description: "Jadegrün, hell und frisch",          accent: "#059669", bg: "#f0fdf4",  preview: "linear-gradient(135deg,#f0fdf4,#d1fae5,#059669)" },
  { key: "smoke",       label: "Smoke",        description: "Rauchgrau, warm-dunkel",             accent: "#a8a29e", bg: "#1c1917",  preview: "linear-gradient(135deg,#1c1917 40%,#a8a29e 100%)" },
  { key: "gold",        label: "Gold",         description: "Reines Gold auf Schwarz",            accent: "#fbbf24", bg: "#0f0a00",  preview: "linear-gradient(135deg,#0f0a00 40%,#fbbf24 100%)" },
  { key: "typewriter",  label: "Typewriter",   description: "Retro Schreibmaschinen-Look",         accent: "#8B4513", bg: "#f5f0e8",  preview: "linear-gradient(135deg,#f5f0e8,#e8dcc8,#8B4513)" },
  { key: "blueprint",   label: "Blueprint",    description: "Technische Zeichnung",                accent: "#60d4ff", bg: "#0b2441",  preview: "linear-gradient(135deg,#0b2441 40%,#60d4ff 100%)" },
  { key: "glass",       label: "Glassmorphism",description: "Frosted Glass Panels",                accent: "#c084fc", bg: "#1a0a2e",  preview: "linear-gradient(135deg,#1a0a2e,#2d1b4e,#c084fc)" },
  { key: "cyber",       label: "Cyberpunk",    description: "Neon-Dystopie Hot-Pink/Cyan",         accent: "#f900ff", bg: "#080015",  preview: "linear-gradient(135deg,#080015,#1a0030,#f900ff)" },
  { key: "magazine",    label: "Magazine",     description: "Redaktionelles Layout",               accent: "#dc2626", bg: "#ffffff",  preview: "linear-gradient(135deg,#fff,#f5f5f5,#dc2626)" },
  { key: "terminal",    label: "Terminal",     description: "CLI / Kommandozeile",                 accent: "#00ff41", bg: "#0a0a0a",  preview: "linear-gradient(135deg,#0a0a0a 40%,#00ff41 100%)" },
  { key: "prism",       label: "Prism",        description: "Holografisches Regenbogen-Design",    accent: "#818cf8", bg: "#0f0f1a",  preview: "linear-gradient(90deg,#f00,#ff0,#0f0,#0ff,#00f,#f0f)" },
  { key: "nordic",      label: "Nordic",       description: "Skandinavisches Minimalismus",        accent: "#2563eb", bg: "#fafafa",  preview: "linear-gradient(135deg,#fafafa,#e8ecf0,#2563eb)" },
  { key: "bauhaus",   label: "Bauhaus",    description: "Geometrisches Bauhaus-Design",          accent: "#e63946", bg: "#ffffff",  preview: "linear-gradient(135deg,#fff,#f4f4f4,#e63946)" },
  { key: "deco",      label: "Art Deco",   description: "Gold Art Deco auf Schwarz",              accent: "#d4af37", bg: "#0d0d0d",  preview: "linear-gradient(135deg,#0d0d0d 40%,#d4af37 100%)" },
  { key: "zen",       label: "Zen",        description: "Japanischer Minimalismus",               accent: "#c62828", bg: "#fafaf7",  preview: "linear-gradient(135deg,#fafaf7,#f2f2ef,#c62828)" },
  { key: "velvet",    label: "Velvet",     description: "Tiefviolett mit Gold, luxuriös",         accent: "#f4c430", bg: "#1a0533",  preview: "linear-gradient(135deg,#1a0533 40%,#f4c430 100%)" },
  { key: "circuit",   label: "Circuit",    description: "Leiterplatten-Design, Tech",             accent: "#76ff03", bg: "#0a1a08",  preview: "linear-gradient(135deg,#0a1a08 40%,#76ff03 100%)" },
  { key: "parchment", label: "Parchment",  description: "Altes Pergament, Handschrift-Stil",      accent: "#6b3a2a", bg: "#fef3e2",  preview: "linear-gradient(135deg,#fef3e2,#f5e6c8,#6b3a2a)" },
  { key: "coastal",   label: "Coastal",    description: "Mediterran, Meeresblau",                 accent: "#0077b6", bg: "#f0f8ff",  preview: "linear-gradient(135deg,#f0f8ff,#e0f0fa,#0077b6)" },
  { key: "mono",      label: "Mono",       description: "Reines Schwarz-Weiß, Typografie",        accent: "#000000", bg: "#ffffff",  preview: "linear-gradient(135deg,#fff,#f4f4f4,#000)" },
  { key: "wine",      label: "Wine",       description: "Weinrot, elegant und edel",              accent: "#9b2226", bg: "#fff5f0",  preview: "linear-gradient(135deg,#fff5f0,#f5e8e5,#9b2226)" },
  { key: "titanium",  label: "Titanium",   description: "Dunkles Metall, industriell",            accent: "#90a4ae", bg: "#1c2833",  preview: "linear-gradient(135deg,#1c2833 40%,#90a4ae 100%)" },
  { key: "origami",     label: "Origami",      description: "Papierfaltung, präzise und clean",       accent: "#4f46e5", bg: "#eef2ff",  preview: "linear-gradient(135deg,#eef2ff,#c7d2fe,#4f46e5)" },
  { key: "brutalist",   label: "Brutalist",    description: "Hartes Raster, starke Kontraste",        accent: "#111827", bg: "#f3f4f6",  preview: "linear-gradient(135deg,#f3f4f6,#d1d5db,#111827)" },
  { key: "retrowave",   label: "Retrowave",    description: "Synthwave-Neon mit Sunset-Vibe",         accent: "#f43f5e", bg: "#1f1147",  preview: "linear-gradient(135deg,#1f1147,#7c3aed,#f43f5e)" },
  { key: "swiss",       label: "Swiss",        description: "Typografisch, modular und minimal",      accent: "#dc2626", bg: "#ffffff",  preview: "linear-gradient(135deg,#ffffff,#f3f4f6,#dc2626)" },
  { key: "memphis",     label: "Memphis",      description: "Geometrisch, verspielt und farbig",      accent: "#f59e0b", bg: "#fff7ed",  preview: "linear-gradient(135deg,#fff7ed,#fde68a,#f59e0b)" },
  { key: "newspaper",   label: "Newspaper",    description: "Editorial-Look mit klassischer Anmutung", accent: "#1f2937", bg: "#fafaf9", preview: "linear-gradient(135deg,#fafaf9,#e7e5e4,#1f2937)" },
  { key: "pixel",       label: "Pixel",        description: "8-Bit Retro, dunkel und neon",           accent: "#00e676", bg: "#0f0f23",  preview: "linear-gradient(135deg,#0f0f23,#1a1a3a,#00e676)" },
  { key: "watercolor",  label: "Watercolor",   description: "Aquarell-Look, weich und organisch",      accent: "#7b9ea0", bg: "#fdfaf5",  preview: "linear-gradient(135deg,#fdfaf5,#e8e0d4,#7b9ea0)" },
  { key: "galaxy",      label: "Galaxy",       description: "Kosmisch, tief und leuchtend",            accent: "#c084fc", bg: "#06040f",  preview: "linear-gradient(135deg,#06040f,#120e30,#c084fc)" },
  { key: "chalk",       label: "Chalk",        description: "Tafeloptik, handschriftlich und warm",    accent: "#7ee8a2", bg: "#1c3426",  preview: "linear-gradient(135deg,#1c3426,#284a35,#7ee8a2)" },
  { key: "steampunk",   label: "Steampunk",    description: "Messing/Kupfer, industriell-vintage",     accent: "#b87333", bg: "#1a1208",  preview: "linear-gradient(135deg,#1a1208,#2e2010,#b87333)" },
  { key: "vaporwave",   label: "Vaporwave",    description: "Neonpastell auf dunklem Grund",           accent: "#ff6ec7", bg: "#1a0838",  preview: "linear-gradient(135deg,#1a0838,#25104a,#ff6ec7)" },
  { key: "topographic", label: "Topographic",  description: "Kartografisch, erdig und strukturiert",    accent: "#5a7c5a", bg: "#f5f2ea",  preview: "linear-gradient(135deg,#f5f2ea,#e0dac8,#5a7c5a)" },
  { key: "amber",       label: "Amber",        description: "Warmes Bernstein-Farbschema",             accent: "#c47a20", bg: "#fdf8ee",  preview: "linear-gradient(135deg,#fdf8ee,#ede4cc,#c47a20)" },
  { key: "sage",        label: "Sage",         description: "Ruhiges Salbei-Grün, modern",              accent: "#4a7040", bg: "#f4f8f0",  preview: "linear-gradient(135deg,#f4f8f0,#dce8d8,#4a7040)" },
  { key: "quartz",      label: "Quartz",       description: "Kristall-Optik, dunkel und schimmernd",    accent: "#a855f7", bg: "#0f0618",  preview: "linear-gradient(135deg,#0f0618,#1c0e30,#a855f7)" },
  { key: "bamboo",      label: "Bamboo",       description: "Zen-Bambus mit natürlicher Palette",       accent: "#5a8a4a", bg: "#f8faf2",  preview: "linear-gradient(135deg,#f8faf2,#e4eede,#5a8a4a)" },
  { key: "dusk",        label: "Dusk",         description: "Dämmerung mit warm-kaltem Verlauf",        accent: "#e07840", bg: "#100c20",  preview: "linear-gradient(135deg,#100c20,#1a1030,#e07840)" },
  { key: "scarlet",     label: "Scarlet",      description: "Kräftiges Rot mit hoher Lesbarkeit",       accent: "#c0152a", bg: "#fff8f8",  preview: "linear-gradient(135deg,#fff8f8,#ffe0e0,#c0152a)" },
  { key: "papyrus",     label: "Papyrus",      description: "Pergamentstil mit antiker Anmutung",       accent: "#8b5a20", bg: "#f5edd0",  preview: "linear-gradient(135deg,#f5edd0,#e4d8b0,#8b5a20)" },
  { key: "iso",         label: "Isometric",    description: "3D isometrisches Gitter-Design",           accent: "#00c8ff", bg: "#0a1628",  preview: "linear-gradient(135deg,#0a1628,#0f1f3d,#00c8ff)" },
  { key: "riso",        label: "Risograph",    description: "Retro Risograph Druckästhetik",            accent: "#e8416e", bg: "#fdf4e3",  preview: "linear-gradient(135deg,#fdf4e3,#f5e8d0,#e8416e)" },
  { key: "holo",        label: "Holographic",  description: "Holografische Irisierend-Folie",           accent: "#a855f7", bg: "#06020f",  preview: "linear-gradient(135deg,#06020f,#0e0520,#a855f7)" },
  { key: "botan",       label: "Botanical",    description: "Botanischer Natur-Stil",                   accent: "#2d6a4f", bg: "#fdfbf7",  preview: "linear-gradient(135deg,#fdfbf7,#f4f8f0,#2d6a4f)" },
  { key: "dash",        label: "Dashboard",    description: "Dunkles Tech-Dashboard Design",            accent: "#6366f1", bg: "#0f172a",  preview: "linear-gradient(135deg,#0f172a,#1e293b,#6366f1)" },
  { key: "washi",       label: "Washi",        description: "Japanisches Washi-Tape Design",            accent: "#e06c9e", bg: "#fffaf5",  preview: "linear-gradient(135deg,#fffaf5,#fff0f5,#e06c9e)" },
  { key: "engr",        label: "Engraving",    description: "Kupferstich-Gravur Ästhetik",              accent: "#8b4513", bg: "#fdf8f0",  preview: "linear-gradient(135deg,#fdf8f0,#f5edd8,#8b4513)" },
  { key: "atom",        label: "Atomic",       description: "1950er Atompunk Retro-Style",              accent: "#f97316", bg: "#fefce8",  preview: "linear-gradient(135deg,#fefce8,#fef9c3,#f97316)" },
  { key: "stgls",       label: "StainedGlass", description: "Glasmalerei Kirchenfenster",               accent: "#f59e0b", bg: "#1a0a00",  preview: "linear-gradient(135deg,#1a0a00,#240e00,#f59e0b)" },
  { key: "cass",        label: "Cassette",     description: "Vintage Kassetten-Tape Ästhetik",          accent: "#f0e000", bg: "#0a0a0a",  preview: "linear-gradient(135deg,#0a0a0a,#141414,#f0e000)" },
  { key: "dsea",        label: "DeepSea",      description: "Tiefsee Biolumineszenz Design",            accent: "#00e5ff", bg: "#000d1a",  preview: "linear-gradient(135deg,#000d1a,#001428,#00e5ff)" },
  { key: "cairo",       label: "Cairo",        description: "Islamische Geometrie Gold-Design",         accent: "#c9a227", bg: "#fafaf5",  preview: "linear-gradient(135deg,#fafaf5,#f5f0e0,#c9a227)" },
  { key: "cstr",        label: "Constructivist",description: "Russischer Konstruktivismus",             accent: "#dc2626", bg: "#ffffff",  preview: "linear-gradient(135deg,#ffffff,#f0f0f0,#dc2626)" },
  { key: "lava",        label: "Lava",         description: "Lava-Lampe Blob-Ästhetik",                accent: "#ff6b35", bg: "#0a0015",  preview: "linear-gradient(135deg,#0a0015,#120020,#ff6b35)" },
  { key: "splnk",       label: "Solarpunk",    description: "Grüne Solarpunk Zukunft",                  accent: "#4caf50", bg: "#f5fff0",  preview: "linear-gradient(135deg,#f5fff0,#e8f8e0,#4caf50)" },
  { key: "koda",        label: "Kodachrome",   description: "Kodachrome Film-Ästhetik",                 accent: "#e53935", bg: "#fffdf8",  preview: "linear-gradient(135deg,#fffdf8,#fff8f0,#e53935)" },
  { key: "manu",        label: "Manuscript",   description: "Illuminiertes Manuskript",                 accent: "#8b2252", bg: "#fdf6e3",  preview: "linear-gradient(135deg,#fdf6e3,#f8edd8,#8b2252)" },
  { key: "mond",        label: "Mondrian",     description: "Piet Mondrian Primärfarben",               accent: "#e63946", bg: "#ffffff",  preview: "linear-gradient(135deg,#ffffff,#fff9e0,#e63946)" },
  { key: "nnoir",       label: "NeoNoir",      description: "Neo-Noir Film Ästhetik",                   accent: "#fbbf24", bg: "#050505",  preview: "linear-gradient(135deg,#050505,#0f0f0f,#fbbf24)" },
  { key: "bento",       label: "Bento",        description: "Japanische Bento-Box Grid-Layout",         accent: "#6366f1", bg: "#f4f4f5",  preview: "linear-gradient(135deg,#f4f4f5,#e4e4e7,#6366f1)" },
];

export const CL_TEMPLATES: TemplateMeta[] = [
  { key: "novoresume",  label: "Novoresume",   description: "Dunkle Header-Bar, türkis",          accent: "#3ecfd6", bg: "#1d2a3a",  preview: "linear-gradient(135deg,#1d2a3a 40%,#3ecfd6 100%)" },
  { key: "midnight",    label: "Midnight",     description: "Schwarz-gold, elegant",              accent: "#f59e0b", bg: "#0a0a0a",  preview: "linear-gradient(135deg,#0a0a0a 40%,#f59e0b 100%)" },
  { key: "aurora",      label: "Aurora",       description: "Lila-Pink Gradient-Header",          accent: "#a855f7", bg: "#1e1b4b",  preview: "linear-gradient(135deg,#1e1b4b,#a855f7,#ec4899)" },
  { key: "forest",      label: "Forest",       description: "Grün-natur, clean",                  accent: "#22c55e", bg: "#14532d",  preview: "linear-gradient(135deg,#14532d 40%,#22c55e 100%)" },
  { key: "crimson",     label: "Crimson",      description: "Rot-weiß, kraftvoll",                accent: "#ef4444", bg: "#7f1d1d",  preview: "linear-gradient(135deg,#7f1d1d 40%,#ef4444 100%)" },
  { key: "arctic",      label: "Arctic",       description: "Eisblau, minimalistisch",            accent: "#38bdf8", bg: "#f0f9ff",  preview: "linear-gradient(135deg,#e0f2fe,#38bdf8)" },
  { key: "obsidian",    label: "Obsidian",     description: "Grau-Monochrom, professionell",      accent: "#6b7280", bg: "#111827",  preview: "linear-gradient(135deg,#111827 40%,#6b7280 100%)" },
  { key: "solar",       label: "Solar",        description: "Orange-braun, warm",                 accent: "#f97316", bg: "#431407",  preview: "linear-gradient(135deg,#431407 40%,#f97316 100%)" },
  { key: "sakura",      label: "Sakura",       description: "Rosa, feminin, modern",              accent: "#f472b6", bg: "#831843",  preview: "linear-gradient(135deg,#831843 40%,#f472b6 100%)" },
  { key: "matrix",      label: "Matrix",       description: "Grün auf Schwarz, Tech/Hacker",      accent: "#4ade80", bg: "#052e16",  preview: "linear-gradient(135deg,#052e16 30%,#4ade80 100%)" },
  { key: "neon",        label: "Neon",         description: "Elektrisches Cyan, dunkel",          accent: "#22d3ee", bg: "#0c1a22",  preview: "linear-gradient(135deg,#0c1a22 40%,#22d3ee 100%)" },
  { key: "ember",       label: "Ember",        description: "Glutrot-Orange, Kontrast",           accent: "#fb923c", bg: "#1a0600",  preview: "linear-gradient(135deg,#1a0600 40%,#fb923c 100%)" },
  { key: "violet",      label: "Violet",       description: "Tiefviolett, edel",                  accent: "#7c3aed", bg: "#1e0e3c",  preview: "linear-gradient(135deg,#1e0e3c 40%,#7c3aed 100%)" },
  { key: "coral",       label: "Coral",        description: "Korallrot, lebendig",                accent: "#fb7185", bg: "#1f0a14",  preview: "linear-gradient(135deg,#1f0a14 40%,#fb7185 100%)" },
  { key: "slate",       label: "Slate",        description: "Stahl-Blaugrau, sachlich",           accent: "#94a3b8", bg: "#0f172a",  preview: "linear-gradient(135deg,#0f172a 40%,#94a3b8 100%)" },
  { key: "mint",        label: "Mint",         description: "Frisches Mint, dunkelgrün",          accent: "#34d399", bg: "#064e3b",  preview: "linear-gradient(135deg,#064e3b 40%,#34d399 100%)" },
  { key: "indigo",      label: "Indigo",       description: "Klassisches Indigo, dunkel",         accent: "#818cf8", bg: "#1e1b4b",  preview: "linear-gradient(135deg,#1e1b4b 40%,#818cf8 100%)" },
  { key: "rust",        label: "Rust",         description: "Rost-Kupfer, industriell",           accent: "#c2410c", bg: "#1c0800",  preview: "linear-gradient(135deg,#1c0800 40%,#c2410c 100%)" },
  { key: "lavender",    label: "Lavender",     description: "Lavendel, sanft-lila",               accent: "#c084fc", bg: "#1e0a3e",  preview: "linear-gradient(135deg,#1e0a3e 40%,#c084fc 100%)" },
  { key: "teal",        label: "Teal",         description: "Dunkles Teal, fokussiert",           accent: "#2dd4bf", bg: "#042f2e",  preview: "linear-gradient(135deg,#042f2e 40%,#2dd4bf 100%)" },
  { key: "copper",      label: "Copper",       description: "Kupfer-Metallic, luxuriös",          accent: "#d97706", bg: "#1c1000",  preview: "linear-gradient(135deg,#1c1000 40%,#d97706 100%)" },
  { key: "navy",        label: "Navy",         description: "Tiefes Marineblau, klassisch",       accent: "#3b82f6", bg: "#1e3a5f",  preview: "linear-gradient(135deg,#1e3a5f 40%,#3b82f6 100%)" },
  { key: "noir",        label: "Noir",         description: "Reinweiß auf Schwarz, maximal",      accent: "#e2e8f0", bg: "#000000",  preview: "linear-gradient(135deg,#000 50%,#e2e8f0 100%)" },
  { key: "cloud",       label: "Cloud",        description: "Himmelblau, helles Design",          accent: "#0ea5e9", bg: "#f0f9ff",  preview: "linear-gradient(135deg,#e0f2fe,#0ea5e9)" },
  { key: "sunset",      label: "Sunset",       description: "Sonnenuntergang-Gradient",           accent: "#fb923c", bg: "#1a0505",  preview: "linear-gradient(135deg,#1a0505,#7c1d4f,#fb923c)" },
  { key: "ocean",       label: "Ocean",        description: "Tiefseeblau, dunkel",                accent: "#2563eb", bg: "#0d1a3d",  preview: "linear-gradient(135deg,#0d1a3d 40%,#2563eb 100%)" },
  { key: "lemon",       label: "Lemon",        description: "Elektrisch Gelb, mutig",             accent: "#fde047", bg: "#1a1500",  preview: "linear-gradient(135deg,#1a1500 40%,#fde047 100%)" },
  { key: "marble",      label: "Marble",       description: "Marmor, hell und clean",             accent: "#6b7280", bg: "#f9fafb",  preview: "linear-gradient(135deg,#f9fafb,#e5e7eb,#9ca3af)" },
  { key: "graphite",    label: "Graphite",     description: "Anthrazit, dunkel-grau",             accent: "#9ca3af", bg: "#1f2937",  preview: "linear-gradient(135deg,#1f2937 40%,#9ca3af 100%)" },
  { key: "blush",       label: "Blush",        description: "Helles Rosa, feminin-modern",        accent: "#ec4899", bg: "#fdf2f8",  preview: "linear-gradient(135deg,#fdf2f8,#fbcfe8,#ec4899)" },
  { key: "jade",        label: "Jade",         description: "Jadegrün, hell und frisch",          accent: "#059669", bg: "#f0fdf4",  preview: "linear-gradient(135deg,#f0fdf4,#d1fae5,#059669)" },
  { key: "smoke",       label: "Smoke",        description: "Rauchgrau, warm-dunkel",             accent: "#a8a29e", bg: "#1c1917",  preview: "linear-gradient(135deg,#1c1917 40%,#a8a29e 100%)" },
  { key: "gold",        label: "Gold",         description: "Reines Gold auf Schwarz",            accent: "#fbbf24", bg: "#0f0a00",  preview: "linear-gradient(135deg,#0f0a00 40%,#fbbf24 100%)" },
  { key: "typewriter",  label: "Typewriter",   description: "Retro Schreibmaschinen-Look",         accent: "#8B4513", bg: "#f5f0e8",  preview: "linear-gradient(135deg,#f5f0e8,#e8dcc8,#8B4513)" },
  { key: "blueprint",   label: "Blueprint",    description: "Technische Zeichnung",                accent: "#60d4ff", bg: "#0b2441",  preview: "linear-gradient(135deg,#0b2441 40%,#60d4ff 100%)" },
  { key: "glass",       label: "Glassmorphism",description: "Frosted Glass Panels",                accent: "#c084fc", bg: "#1a0a2e",  preview: "linear-gradient(135deg,#1a0a2e,#2d1b4e,#c084fc)" },
  { key: "cyber",       label: "Cyberpunk",    description: "Neon-Dystopie Hot-Pink/Cyan",         accent: "#f900ff", bg: "#080015",  preview: "linear-gradient(135deg,#080015,#1a0030,#f900ff)" },
  { key: "magazine",    label: "Magazine",     description: "Redaktionelles Layout",               accent: "#dc2626", bg: "#ffffff",  preview: "linear-gradient(135deg,#fff,#f5f5f5,#dc2626)" },
  { key: "terminal",    label: "Terminal",     description: "CLI / Kommandozeile",                 accent: "#00ff41", bg: "#0a0a0a",  preview: "linear-gradient(135deg,#0a0a0a 40%,#00ff41 100%)" },
  { key: "prism",       label: "Prism",        description: "Holografisches Regenbogen-Design",    accent: "#818cf8", bg: "#0f0f1a",  preview: "linear-gradient(90deg,#f00,#ff0,#0f0,#0ff,#00f,#f0f)" },
  { key: "nordic",      label: "Nordic",       description: "Skandinavisches Minimalismus",        accent: "#2563eb", bg: "#fafafa",  preview: "linear-gradient(135deg,#fafafa,#e8ecf0,#2563eb)" },
  { key: "bauhaus",   label: "Bauhaus",    description: "Geometrisches Bauhaus-Design",          accent: "#e63946", bg: "#ffffff",  preview: "linear-gradient(135deg,#fff,#f4f4f4,#e63946)" },
  { key: "deco",      label: "Art Deco",   description: "Gold Art Deco auf Schwarz",              accent: "#d4af37", bg: "#0d0d0d",  preview: "linear-gradient(135deg,#0d0d0d 40%,#d4af37 100%)" },
  { key: "zen",       label: "Zen",        description: "Japanischer Minimalismus",               accent: "#c62828", bg: "#fafaf7",  preview: "linear-gradient(135deg,#fafaf7,#f2f2ef,#c62828)" },
  { key: "velvet",    label: "Velvet",     description: "Tiefviolett mit Gold, luxuriös",         accent: "#f4c430", bg: "#1a0533",  preview: "linear-gradient(135deg,#1a0533 40%,#f4c430 100%)" },
  { key: "circuit",   label: "Circuit",    description: "Leiterplatten-Design, Tech",             accent: "#76ff03", bg: "#0a1a08",  preview: "linear-gradient(135deg,#0a1a08 40%,#76ff03 100%)" },
  { key: "parchment", label: "Parchment",  description: "Altes Pergament, Handschrift-Stil",      accent: "#6b3a2a", bg: "#fef3e2",  preview: "linear-gradient(135deg,#fef3e2,#f5e6c8,#6b3a2a)" },
  { key: "coastal",   label: "Coastal",    description: "Mediterran, Meeresblau",                 accent: "#0077b6", bg: "#f0f8ff",  preview: "linear-gradient(135deg,#f0f8ff,#e0f0fa,#0077b6)" },
  { key: "mono",      label: "Mono",       description: "Reines Schwarz-Weiß, Typografie",        accent: "#000000", bg: "#ffffff",  preview: "linear-gradient(135deg,#fff,#f4f4f4,#000)" },
  { key: "wine",      label: "Wine",       description: "Weinrot, elegant und edel",              accent: "#9b2226", bg: "#fff5f0",  preview: "linear-gradient(135deg,#fff5f0,#f5e8e5,#9b2226)" },
  { key: "titanium",  label: "Titanium",   description: "Dunkles Metall, industriell",            accent: "#90a4ae", bg: "#1c2833",  preview: "linear-gradient(135deg,#1c2833 40%,#90a4ae 100%)" },
  { key: "clori",   label: "Origami",      description: "Papierfaltung, präzise und clean",         accent: "#4f46e5", bg: "#eef2ff",  preview: "linear-gradient(135deg,#eef2ff,#c7d2fe,#4f46e5)" },
  { key: "clbru",   label: "Brutalist",    description: "Hartes Raster, starke Kontraste",          accent: "#111827", bg: "#f3f4f6",  preview: "linear-gradient(135deg,#f3f4f6,#d1d5db,#111827)" },
  { key: "clrwave", label: "Retrowave",    description: "Synthwave-Neon mit Sunset-Vibe",           accent: "#f43f5e", bg: "#1f1147",  preview: "linear-gradient(135deg,#1f1147,#7c3aed,#f43f5e)" },
  { key: "clswi",   label: "Swiss",        description: "Typografisch, modular und minimal",        accent: "#dc2626", bg: "#ffffff",  preview: "linear-gradient(135deg,#ffffff,#f3f4f6,#dc2626)" },
  { key: "clmem",   label: "Memphis",      description: "Geometrisch, verspielt und farbig",        accent: "#f59e0b", bg: "#fff7ed",  preview: "linear-gradient(135deg,#fff7ed,#fde68a,#f59e0b)" },
  { key: "clnws",   label: "Newspaper",    description: "Editorial-Look mit klassischer Anmutung",   accent: "#1f2937", bg: "#fafaf9", preview: "linear-gradient(135deg,#fafaf9,#e7e5e4,#1f2937)" },
  { key: "clpix",   label: "Pixel",        description: "8-Bit Retro, dunkel und neon",             accent: "#00e676", bg: "#0f0f23",  preview: "linear-gradient(135deg,#0f0f23,#1a1a3a,#00e676)" },
  { key: "clwclr",  label: "Watercolor",   description: "Aquarell-Look, weich und organisch",        accent: "#7b9ea0", bg: "#fdfaf5",  preview: "linear-gradient(135deg,#fdfaf5,#e8e0d4,#7b9ea0)" },
  { key: "clglx",   label: "Galaxy",       description: "Kosmisch, tief und leuchtend",              accent: "#c084fc", bg: "#06040f",  preview: "linear-gradient(135deg,#06040f,#120e30,#c084fc)" },
  { key: "clchk",   label: "Chalk",        description: "Tafeloptik, handschriftlich und warm",      accent: "#7ee8a2", bg: "#1c3426",  preview: "linear-gradient(135deg,#1c3426,#284a35,#7ee8a2)" },
  { key: "clstmp",  label: "Steampunk",    description: "Messing/Kupfer, industriell-vintage",       accent: "#b87333", bg: "#1a1208",  preview: "linear-gradient(135deg,#1a1208,#2e2010,#b87333)" },
  { key: "clvpw",   label: "Vaporwave",    description: "Neonpastell auf dunklem Grund",             accent: "#ff6ec7", bg: "#1a0838",  preview: "linear-gradient(135deg,#1a0838,#25104a,#ff6ec7)" },
  { key: "cltopo",  label: "Topographic",  description: "Kartografisch, erdig und strukturiert",      accent: "#5a7c5a", bg: "#f5f2ea",  preview: "linear-gradient(135deg,#f5f2ea,#e0dac8,#5a7c5a)" },
  { key: "clamb",   label: "Amber",        description: "Warmes Bernstein-Farbschema",               accent: "#c47a20", bg: "#fdf8ee",  preview: "linear-gradient(135deg,#fdf8ee,#ede4cc,#c47a20)" },
  { key: "clsge",   label: "Sage",         description: "Ruhiges Salbei-Grün, modern",                accent: "#4a7040", bg: "#f4f8f0",  preview: "linear-gradient(135deg,#f4f8f0,#dce8d8,#4a7040)" },
  { key: "clqtz",   label: "Quartz",       description: "Kristall-Optik, dunkel und schimmernd",      accent: "#a855f7", bg: "#0f0618",  preview: "linear-gradient(135deg,#0f0618,#1c0e30,#a855f7)" },
  { key: "clbam",   label: "Bamboo",       description: "Zen-Bambus mit natürlicher Palette",         accent: "#5a8a4a", bg: "#f8faf2",  preview: "linear-gradient(135deg,#f8faf2,#e4eede,#5a8a4a)" },
  { key: "cldsk",   label: "Dusk",         description: "Dämmerung mit warm-kaltem Verlauf",          accent: "#e07840", bg: "#100c20",  preview: "linear-gradient(135deg,#100c20,#1a1030,#e07840)" },
  { key: "clsclt",  label: "Scarlet",      description: "Kräftiges Rot mit hoher Lesbarkeit",         accent: "#c0152a", bg: "#fff8f8",  preview: "linear-gradient(135deg,#fff8f8,#ffe0e0,#c0152a)" },
  { key: "clppy",   label: "Papyrus",      description: "Pergamentstil mit antiker Anmutung",         accent: "#8b5a20", bg: "#f5edd0",  preview: "linear-gradient(135deg,#f5edd0,#e4d8b0,#8b5a20)" },
  { key: "cliso",   label: "Isometric",    description: "3D isometrisches Gitter-Design",             accent: "#00c8ff", bg: "#0a1628",  preview: "linear-gradient(135deg,#0a1628,#0f1f3d,#00c8ff)" },
  { key: "clriso",  label: "Risograph",    description: "Retro Risograph Druckästhetik",              accent: "#e8416e", bg: "#fdf4e3",  preview: "linear-gradient(135deg,#fdf4e3,#f5e8d0,#e8416e)" },
  { key: "clholo",  label: "Holographic",  description: "Holografische Irisierend-Folie",             accent: "#a855f7", bg: "#06020f",  preview: "linear-gradient(135deg,#06020f,#0e0520,#a855f7)" },
  { key: "clbotan", label: "Botanical",    description: "Botanischer Natur-Stil",                     accent: "#2d6a4f", bg: "#fdfbf7",  preview: "linear-gradient(135deg,#fdfbf7,#f4f8f0,#2d6a4f)" },
  { key: "cldash",  label: "Dashboard",    description: "Dunkles Tech-Dashboard Design",              accent: "#6366f1", bg: "#0f172a",  preview: "linear-gradient(135deg,#0f172a,#1e293b,#6366f1)" },
  { key: "clwashi", label: "Washi",        description: "Japanisches Washi-Tape Design",              accent: "#e06c9e", bg: "#fffaf5",  preview: "linear-gradient(135deg,#fffaf5,#fff0f5,#e06c9e)" },
  { key: "clengr",  label: "Engraving",    description: "Kupferstich-Gravur Ästhetik",                accent: "#8b4513", bg: "#fdf8f0",  preview: "linear-gradient(135deg,#fdf8f0,#f5edd8,#8b4513)" },
  { key: "clatom",  label: "Atomic",       description: "1950er Atompunk Retro-Style",                accent: "#f97316", bg: "#fefce8",  preview: "linear-gradient(135deg,#fefce8,#fef9c3,#f97316)" },
  { key: "clstgls", label: "StainedGlass", description: "Glasmalerei Kirchenfenster",                 accent: "#f59e0b", bg: "#1a0a00",  preview: "linear-gradient(135deg,#1a0a00,#240e00,#f59e0b)" },
  { key: "clcass",  label: "Cassette",     description: "Vintage Kassetten-Tape Ästhetik",            accent: "#f0e000", bg: "#0a0a0a",  preview: "linear-gradient(135deg,#0a0a0a,#141414,#f0e000)" },
  { key: "cldsea",  label: "DeepSea",      description: "Tiefsee Biolumineszenz Design",              accent: "#00e5ff", bg: "#000d1a",  preview: "linear-gradient(135deg,#000d1a,#001428,#00e5ff)" },
  { key: "clcairo", label: "Cairo",        description: "Islamische Geometrie Gold-Design",           accent: "#c9a227", bg: "#fafaf5",  preview: "linear-gradient(135deg,#fafaf5,#f5f0e0,#c9a227)" },
  { key: "clcstr",  label: "Constructivist",description: "Russischer Konstruktivismus",               accent: "#dc2626", bg: "#ffffff",  preview: "linear-gradient(135deg,#ffffff,#f0f0f0,#dc2626)" },
  { key: "cllava",  label: "Lava",         description: "Lava-Lampe Blob-Ästhetik",                  accent: "#ff6b35", bg: "#0a0015",  preview: "linear-gradient(135deg,#0a0015,#120020,#ff6b35)" },
  { key: "clsplnk", label: "Solarpunk",    description: "Grüne Solarpunk Zukunft",                   accent: "#4caf50", bg: "#f5fff0",  preview: "linear-gradient(135deg,#f5fff0,#e8f8e0,#4caf50)" },
  { key: "clkoda",  label: "Kodachrome",   description: "Kodachrome Film-Ästhetik",                  accent: "#e53935", bg: "#fffdf8",  preview: "linear-gradient(135deg,#fffdf8,#fff8f0,#e53935)" },
  { key: "clmanu",  label: "Manuscript",   description: "Illuminiertes Manuskript",                  accent: "#8b2252", bg: "#fdf6e3",  preview: "linear-gradient(135deg,#fdf6e3,#f8edd8,#8b2252)" },
  { key: "clmond",  label: "Mondrian",     description: "Piet Mondrian Primärfarben",                accent: "#e63946", bg: "#ffffff",  preview: "linear-gradient(135deg,#ffffff,#fff9e0,#e63946)" },
  { key: "clnnoir", label: "NeoNoir",      description: "Neo-Noir Film Ästhetik",                    accent: "#fbbf24", bg: "#050505",  preview: "linear-gradient(135deg,#050505,#0f0f0f,#fbbf24)" },
  { key: "clbento", label: "Bento",        description: "Japanische Bento-Box Grid-Layout",          accent: "#6366f1", bg: "#f4f4f5",  preview: "linear-gradient(135deg,#f4f4f5,#e4e4e7,#6366f1)" },
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
    bio:      "Motivierter Web-Entwickler mit Fokus auf strukturierte, performante Weblösungen. Schwerpunkte: HTML5, CSS3, JavaScript, Next.js und SQL. Analytisch, zuverlässig und lösungsorientiert – angetrieben durch eigene Projekte und ständiges Lernen.",
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

// ─── Persistence hook ─────────────────────────────────────────────────────────
// Speichert jeden State-Wert automatisch in localStorage.
// Wird in allen CL-Templates verwendet, damit Änderungen nach dem Reload erhalten bleiben.
import { useState, useEffect } from "react";

export function usePersistentCLState<T>(
  storageKey: string,
  defaultValue: T
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [state, setState] = useState<T>(() => {
    if (typeof window === "undefined") return defaultValue;
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) return JSON.parse(stored) as T;
    } catch { /* Fehler beim Parsen – Default verwenden */ }
    return defaultValue;
  });

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(state));
    } catch { /* localStorage voll oder nicht verfügbar */ }
  }, [storageKey, state]);

  return [state, setState];
}
