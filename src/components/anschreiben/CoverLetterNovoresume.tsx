"use client";
import { useState, useCallback, createContext, useContext } from "react";
import {
  PrinterIcon, PencilSquareIcon, CheckIcon,
  PlusIcon, XMarkIcon, EnvelopeIcon, PhoneIcon,
  MapPinIcon, LinkIcon,
} from "@heroicons/react/24/outline";

// ─── Tokens ───────────────────────────────────────────────────────────────────
const DEFAULT_COLORS = { A:"#3ecfd6", SBG:"#1d2a3a", DBG:"#ffffff", CT:"#111827", CB:"#374151", CM:"#9ca3af" };
const hex2rgba = (hex:string,a:number) => { const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16); return `rgba(${r},${g},${b},${a})`; };
const ColCtx = createContext(DEFAULT_COLORS);
const FNT = "'Nunito','Calibri','Segoe UI',Arial,sans-serif";

const FONTS: { key:string; label:string; family:string; gf:string }[] = [
  { key:"nunito",       label:"Nunito",        family:"'Nunito','Calibri',sans-serif",       gf:"Nunito:wght@400;600;700;800" },
  { key:"roboto",       label:"Roboto",         family:"'Roboto',Arial,sans-serif",           gf:"Roboto:wght@400;500;700" },
  { key:"opensans",     label:"Open Sans",      family:"'Open Sans',Arial,sans-serif",        gf:"Open+Sans:wght@400;600;700" },
  { key:"lato",         label:"Lato",           family:"'Lato',Arial,sans-serif",             gf:"Lato:wght@400;700" },
  { key:"inter",        label:"Inter",          family:"'Inter',Arial,sans-serif",            gf:"Inter:wght@400;500;600;700" },
  { key:"merriweather", label:"Merriweather",   family:"'Merriweather',Georgia,serif",        gf:"Merriweather:wght@400;700" },
  { key:"playfair",     label:"Playfair",       family:"'Playfair Display',Georgia,serif",    gf:"Playfair+Display:wght@400;700" },
  { key:"georgia",      label:"Georgia",        family:"Georgia,serif",                       gf:"" },
];
const FONT_SIZES: { key:string; label:string; scale:number }[] = [
  { key:"xs", label:"XS", scale:0.85 },
  { key:"sm", label:"S",  scale:0.92 },
  { key:"md", label:"M",  scale:1.0  },
  { key:"lg", label:"L",  scale:1.08 },
  { key:"xl", label:"XL", scale:1.15 },
];



// ─── Types ────────────────────────────────────────────────────────────────────
interface CLData {
  personal: {
    name: string; subtitle: string; email: string; phone: string;
    location: string; website: string; linkedin: string; github: string;
  };
  recipient: { company: string; street: string; cityZip: string; country: string; };
  date: string; subject: string; salutation: string;
  bodyParagraphs: string[];
  closing: string; signatureName: string;
}

const DEFAULT_CL: CLData = {
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
    street:  "Otto-Eppenstein-Stra\u00dfe",
    cityZip: "26 07745 Jena",
    country: "Germany",
  },
  date:       "01. April 2026",
  subject:    "Bewerbung als Quereinsteiger (m/w/d) Software-Entwicklung / Web-Entwicklung",
  salutation: "Sehr geehrte Damen und Herren,",
  bodyParagraphs: [
    "Ihre Ausschreibung ist deshalb interessant, weil sie nicht auf formale Lebensläufe fixiert ist, sondern auf echte Entwicklungsbegeisterung, Problemlösung und technisches Wachstum. Genau darin sehe ich meine Stärke. Ich arbeite mich konsequent in Technologien ein, entwickle eigene Projekte, denke strukturiert und bleibe an Problemen so lange dran, bis eine belastbare Lösung steht.",
    "Aktuell absolviere ich eine Weiterbildung zum Web- und Softwareentwickler. Dabei arbeite ich mit Linux, Git-Workflows, HTML, CSS, JavaScript, TypeScript, Node.js, React, Next.js, PostgreSQL, Docker, APIs sowie agilen Workflows. Mein Abschlussprojekt \u201e3D Event Plattform\u201c setze ich eigenst\u00e4ndig um. Dadurch kenne ich nicht nur einzelne Werkzeuge, sondern den Aufbau moderner Webanwendungen über Frontend, Backend, Datenbank, Testing und saubere Projektstruktur hinweg.",
    "Besonders passend finde ich Ihr Umfeld, weil Sie mit Ihren Lösungen egON und LeON seit Jahren spezialisierte Software für Energievertriebe, Distributionen und Energieversorger entwickeln. Mich überzeugt daran die Verbindung aus fachlicher Spezialisierung, produktnaher Entwicklung und realem Kundennutzen. Dass in Ihrem Team enger Kundenkontakt, kurze Kommunikationswege, agile Zusammenarbeit und Raum für eigene Ideen ausdrücklich Teil der Arbeitsweise sind, entspricht genau dem Umfeld, in dem ich mich fachlich schnell weiterentwickeln und produktiv einbringen kann.",
    "Ich komme zwar nicht aus einem klassischen Informatikstudium, bringe aber genau die Mischung mit, die Sie für den Einstieg beschreiben, technische Lernbereitschaft, Begeisterung für Programmierung und den Anspruch, mich Schritt für Schritt zu einem belastbaren Entwicklerprofi weiterzuentwickeln. In meinen bisherigen Projekten arbeite ich bereits mit modernen Webtechnologien, komponentenbasierten Strukturen und datengetriebenen Anwendungen. Dabei lege ich Wert auf nachvollziehbaren Code, saubere Architektur und eine Lösung, die nicht nur funktioniert, sondern auch weiterentwickelbar bleibt.",
    "Ich bewerbe mich bei Ihnen, weil Ihre Stelle nicht auf reine Routine zielt, sondern auf Entwicklung im eigentlichen Sinn \u2013 neues Lernen, Verantwortung übernehmen, Ideen umsetzen und in realen Projekten wachsen. Genau diesen Anspruch verfolge ich auch selbst. Ich möchte mein technisches Fundament, meine Disziplin und meine hohe Motivation in Ihr Team einbringen und mich dort zu einem starken Entwickler mit belastbarem Praxisbezug weiterentwickeln.",
    "\u00dcber die Einladung zu einem pers\u00f6nlichen Gespr\u00e4ch freue ich mich.",
  ],
  closing:       "Mit freundlichen Gr\u00fc\u00dfen,",
  signatureName: "Steffen Lorenz",
};

// ─── Editable field ───────────────────────────────────────────────────────────
function E({ value, onChange, editing, multiline = false, style = {} as React.CSSProperties, placeholder = "...", rows = 4 }: {
  value: string; onChange: (v: string) => void; editing: boolean;
  multiline?: boolean; style?: React.CSSProperties; placeholder?: string; rows?: number;
}) {
  const {A} = useContext(ColCtx);
  const s: React.CSSProperties = {
    ...style,
    background: hex2rgba(A,0.12), border: `1px dashed ${A}66`, borderRadius: 3,
    padding: "2px 4px", outline: "none", width: "100%", fontFamily: "inherit",
    fontSize: "inherit", color: "inherit", lineHeight: "inherit", fontWeight: "inherit",
    fontStyle: "inherit", boxSizing: "border-box",
  };
  if (!editing) return <span style={style}>{value || <span style={{ opacity: 0.28, fontStyle: "italic" }}>{placeholder}</span>}</span>;
  if (multiline) return <textarea style={{ ...s, resize: "vertical", display: "block" }} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows} />;
  return <input style={s} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />;
}

// ─── Sidebar contact row ──────────────────────────────────────────────────────
function CRow({ icon, value, editing, onChange, onDelete, hidden }: {
  icon: React.ReactNode; value: string; editing: boolean; onChange: (v: string) => void;
  onDelete?: () => void; hidden?: boolean;
}) {
  const {A} = useContext(ColCtx);
  if (hidden && !editing) return null;
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 14, opacity: hidden ? 0.35 : 1 }}>
      <div style={{ width: 26, height: 26, borderRadius: 4, backgroundColor: hidden ? "#6b7280" : A, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
        <span style={{ color: "white", display: "flex" }}>{icon}</span>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        {editing
          ? <input value={value} onChange={e => onChange(e.target.value)}
              style={{ background: "rgba(255,255,255,0.12)", border: "1px dashed rgba(255,255,255,0.4)", borderRadius: 3, padding: "1px 4px", outline: "none", color: "white", fontFamily: FNT, fontSize: 12, width: "100%", boxSizing: "border-box" }} />
          : <span style={{ fontSize: 10.5, color: "white", lineHeight: 1.4, whiteSpace: "nowrap" }}>{value}</span>
        }
      </div>
      {editing && onDelete && (
        <button
          type="button"
          onClick={onDelete}
          title={hidden ? "Wieder einblenden" : "Ausblenden"}
          style={{ background: hidden ? "rgba(62,207,214,0.18)" : "rgba(248,113,113,0.18)", border: `1px solid ${hidden ? A : "#f87171"}`, borderRadius: 4, cursor: "pointer", color: hidden ? A : "#f87171", padding: "2px 4px", lineHeight: 1, flexShrink: 0, marginTop: 2, display: "flex", alignItems: "center" }}
        >
          <XMarkIcon style={{ width: 14, height: 14 }} />
        </button>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function CoverLetterNovoresume({
  initialCompany, initialPosition,
}: { initialCompany?: string; initialPosition?: string; }) {
  const start = JSON.parse(JSON.stringify(DEFAULT_CL)) as CLData;
  if (initialCompany)  start.recipient.company = initialCompany;
  if (initialPosition) start.subject = `Bewerbung als ${initialPosition}`;
  const [data, setData]       = useState<CLData>(start);
  const [editing, setEditing] = useState(false);
  const [hiddenContacts, setHiddenContacts] = useState<Set<string>>(new Set());
  const [fontKey, setFontKey]   = useState("nunito");
  const [sizeKey, setSizeKey]   = useState("md");
  const [showDesign, setShowDesign] = useState(false);
  const [clrs, setClrs] = useState(DEFAULT_COLORS);
  const {A, SBG, DBG, CT, CB, CM} = clrs;
  const curFont = FONTS.find(f => f.key === fontKey) ?? FONTS[0];
  const curSize = FONT_SIZES.find(s => s.key === sizeKey) ?? FONT_SIZES[2];
  const fnt   = curFont.family;
  const scale = curSize.scale;

  const toggleContact = (key: string) =>
    setHiddenContacts(s => { const n = new Set(s); n.has(key) ? n.delete(key) : n.add(key); return n; });

  const setP = (p: Partial<CLData["personal"]>)  => setData(d => ({ ...d, personal:  { ...d.personal,  ...p } }));
  const setR = (p: Partial<CLData["recipient"]>) => setData(d => ({ ...d, recipient: { ...d.recipient, ...p } }));

  const updatePara = useCallback((i: number, v: string) =>
    setData(d => { const b = [...d.bodyParagraphs]; b[i] = v; return { ...d, bodyParagraphs: b }; }), []);
  const addPara    = () => setData(d => ({ ...d, bodyParagraphs: [...d.bodyParagraphs, ""] }));
  const removePara = (i: number) => setData(d => ({ ...d, bodyParagraphs: d.bodyParagraphs.filter((_, idx) => idx !== i) }));

  return (
  <ColCtx.Provider value={clrs}>
    <div style={{ minHeight: "100vh", backgroundColor: "#f3f4f6", padding: "24px 16px", fontFamily: FNT }}>
      <style>{`
        ${curFont.gf ? `@import url('https://fonts.googleapis.com/css2?family=${curFont.gf}&display=swap');` : ""}
        .cl-doc, .cl-doc * { font-family: ${fnt} !important; }
        @media print {
          @page { size: A4 portrait; margin: 0; }
          *, *::before, *::after { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
          body * { visibility: hidden !important; }
          .cl-doc, .cl-doc * { visibility: visible !important; }
          .cl-ctrl { display: none !important; visibility: hidden !important; }

          .cl-doc {
            position: absolute !important;
            top: 0 !important; left: 0 !important;
            width: 850px !important; max-width: 850px !important;
            height: 297mm !important; max-height: 297mm !important;
            overflow: hidden !important;
            box-shadow: none !important; margin: 0 !important;
            zoom: 0.935 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .cl-zoom-wrapper { zoom: 1 !important; width: 100% !important; height: 100% !important; min-height: unset !important; }
          .cl-header {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .cl-left {
            padding: 20px 32px !important;
          }
          .cl-para * {
            font-size: 11px !important;
            line-height: 1.42 !important;
          }
          .cl-paras { gap: 7px !important; }
          .cl-date  { margin-bottom: 12px !important; }
          .cl-sig   { margin-top: 16px !important; }
        }
      `}</style>

      {/* Controls */}
      <div className="cl-ctrl" style={{ maxWidth: 850, margin: "0 auto 20px", display: "flex", gap: 10, flexWrap: "wrap", position: "sticky", top: 0, zIndex: 20, backgroundColor: "#f3f4f6", paddingTop: 8, paddingBottom: 8 }}>
        <button onClick={() => setEditing(e => !e)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", border: "none", backgroundColor: editing ? "#16a34a" : "#4f46e5", color: "white", fontFamily: FNT }}>
          {editing ? <CheckIcon style={{ width: 16, height: 16 }} /> : <PencilSquareIcon style={{ width: 16, height: 16 }} />}
          {editing ? "Fertig bearbeiten" : "Bearbeiten"}
        </button>
        <button onClick={() => window.print()} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", border: "none", backgroundColor: "#374151", color: "white", fontFamily: FNT }}>
          <PrinterIcon style={{ width: 16, height: 16 }} />Drucken / PDF
        </button>
        <button onClick={() => setShowDesign(v => !v)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", border: `1px solid ${showDesign ? "#4f46e5" : "#e5e7eb"}`, backgroundColor: showDesign ? "#eef2ff" : "white", color: showDesign ? "#4f46e5" : CB, fontFamily: FNT }}>
          🎨 Design
        </button>
        <button onClick={() => { setData(JSON.parse(JSON.stringify(DEFAULT_CL))); setHiddenContacts(new Set()); setFontKey("nunito"); setSizeKey("md"); setClrs(DEFAULT_COLORS); setShowDesign(false); }} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", border: "1px solid #d1d5db", backgroundColor: "white", color: CB, fontFamily: FNT }}>
          <XMarkIcon style={{ width: 16, height: 16 }} />Zurücksetzen
        </button>
        {editing && <span style={{ alignSelf: "center", fontSize: 12, color: "#6b7280", fontStyle: "italic" }}>Alle Felder direkt bearbeitbar</span>}
        {showDesign && (
          <div style={{ width: "100%", background: "white", border: "1px solid #e5e7eb", borderRadius: 10, padding: "14px 18px", display: "flex", gap: 24, flexWrap: "wrap", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", marginBottom: 7, letterSpacing: "0.06em", textTransform: "uppercase" }}>Schriftart</div>
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                {FONTS.map(f => (
                  <button key={f.key} onClick={() => setFontKey(f.key)} style={{ padding: "4px 10px", borderRadius: 6, border: `1px solid ${fontKey === f.key ? "#4f46e5" : "#e5e7eb"}`, background: fontKey === f.key ? "#eef2ff" : "white", color: fontKey === f.key ? "#4f46e5" : "#374151", fontSize: 12, cursor: "pointer", fontFamily: f.family, fontWeight: fontKey === f.key ? 700 : 400 }}>
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", marginBottom: 7, letterSpacing: "0.06em", textTransform: "uppercase" }}>Schriftgröße</div>
              <div style={{ display: "flex", gap: 5 }}>
                {FONT_SIZES.map(s => (
                  <button key={s.key} onClick={() => setSizeKey(s.key)} style={{ padding: "4px 14px", borderRadius: 6, border: `1px solid ${sizeKey === s.key ? "#4f46e5" : "#e5e7eb"}`, background: sizeKey === s.key ? "#eef2ff" : "white", color: sizeKey === s.key ? "#4f46e5" : "#374151", fontSize: 12, cursor: "pointer", fontWeight: sizeKey === s.key ? 700 : 400 }}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", marginBottom: 7, letterSpacing: "0.06em", textTransform: "uppercase" }}>Farben</div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
                {([{k:"A" as const,l:"Akzent"},{k:"SBG" as const,l:"Sidebar-BG"},{k:"DBG" as const,l:"Dok.-BG"},{k:"CT" as const,l:"Titel-Text"},{k:"CB" as const,l:"Body-Text"},{k:"CM" as const,l:"Gedimmt"}]).map(({k,l}) => (
                  <label key={k} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, cursor: "pointer" }}>
                    <input type="color" value={clrs[k]} onChange={e => setClrs(c => ({ ...c, [k]: e.target.value }))} style={{ width: 32, height: 32, padding: 2, borderRadius: 6, border: "1px solid #d1d5db", cursor: "pointer", background: "none" }} />
                    <span style={{ fontSize: 9, color: "#9ca3af" }}>{l}</span>
                  </label>
                ))}
                <button onClick={() => setClrs(DEFAULT_COLORS)} style={{ padding: "4px 10px", borderRadius: 6, fontSize: 11, border: "1px solid #d1d5db", background: "transparent", color: "#9ca3af", cursor: "pointer", alignSelf: "center" }}>↺ Reset</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Document ────────────────────────────────────────────────────────── */}
      <div className="cl-doc" style={{ width: 850, margin: "0 auto", fontFamily: fnt, backgroundColor: DBG, boxShadow: "0 4px 32px rgba(0,0,0,0.14)", overflow: "hidden" }}>
        <div className="cl-zoom-wrapper" style={{ width: Math.round(850/scale), zoom: scale, display: "flex", flexDirection: "column", minHeight: Math.round(1056/scale) }}>

        {/* ── DUNKLER HEADER (volle Breite) ─────────────────────────────────── */}
        <div className="cl-header" style={{ backgroundColor: SBG, padding: "22px 40px", display: "flex", gap: 32, alignItems: "center" }}>
          {/* Name + Subtitle links */}
          <div style={{ flex: "0 0 340px" }}>
            {editing
              ? <input value={data.personal.name} onChange={e => setP({ name: e.target.value })} style={{ display: "block", fontSize: 36, fontWeight: 800, color: "white", lineHeight: 1.1, marginBottom: 5, fontFamily: FNT, background: "rgba(255,255,255,0.1)", border: "1px dashed rgba(255,255,255,0.4)", borderRadius: 3, padding: "2px 4px", outline: "none", width: "100%", boxSizing: "border-box" }} />
              : <div style={{ fontSize: 36, fontWeight: 800, color: "white", lineHeight: 1.1, marginBottom: 5 }}>{data.personal.name}</div>
            }
            {editing
              ? <input value={data.personal.subtitle} onChange={e => setP({ subtitle: e.target.value })} style={{ display: "block", fontSize: 13, fontWeight: 600, color: A, fontFamily: FNT, background: "rgba(255,255,255,0.1)", border: "1px dashed rgba(255,255,255,0.4)", borderRadius: 3, padding: "2px 4px", outline: "none", width: "100%", boxSizing: "border-box" }} />
              : <div style={{ fontSize: 13, fontWeight: 600, color: A }}>{data.personal.subtitle}</div>
            }
          </div>
          {/* Kontakte rechts */}
          <div style={{ flex: 1 }}>
            <CRow icon={<EnvelopeIcon style={{ width: 13, height: 13 }} />}
              value={data.personal.email} editing={editing} onChange={v => setP({ email: v })}
              hidden={hiddenContacts.has("email")} onDelete={() => toggleContact("email")} />
            <CRow icon={<PhoneIcon style={{ width: 13, height: 13 }} />}
              value={data.personal.phone} editing={editing} onChange={v => setP({ phone: v })}
              hidden={hiddenContacts.has("phone")} onDelete={() => toggleContact("phone")} />
            <CRow icon={<MapPinIcon style={{ width: 13, height: 13 }} />}
              value={data.personal.location} editing={editing} onChange={v => setP({ location: v })}
              hidden={hiddenContacts.has("location")} onDelete={() => toggleContact("location")} />
            <CRow icon={<LinkIcon style={{ width: 13, height: 13 }} />}
              value={data.personal.website} editing={editing} onChange={v => setP({ website: v })}
              hidden={hiddenContacts.has("website")} onDelete={() => toggleContact("website")} />
            <CRow
              icon={<svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 13, height: 13 }}><path d="M19 3a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h14zM8 10v7H6v-7h2zm0-2a1 1 0 10-2 0 1 1 0 002 0zm8 3.5c0-1.38-1.12-2.5-2.5-2.5H13v1.5h.5c.55 0 1 .45 1 1V17h2v-5.5z"/></svg>}
              value={data.personal.linkedin} editing={editing} onChange={v => setP({ linkedin: v })}
              hidden={hiddenContacts.has("linkedin")} onDelete={() => toggleContact("linkedin")} />
            <CRow
              icon={<svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 13, height: 13 }}><path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.009-.868-.014-1.703-2.782.604-3.369-1.342-3.369-1.342-.454-1.155-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.268 2.75 1.026A9.578 9.578 0 0112 6.836c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.026 2.747-1.026.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.137 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z"/></svg>}
              value={data.personal.github} editing={editing} onChange={v => setP({ github: v })}
              hidden={hiddenContacts.has("github")} onDelete={() => toggleContact("github")} />
          </div>
        </div>

        {/* ── BRIEF-INHALT (volle Dokumentbreite) ───────────────────────────── */}
        <div className="cl-left" style={{ flex: 1, backgroundColor: DBG, padding: "28px 40px 32px" }}>

          {/* Empfänger */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontStyle: "italic", color: CM, marginBottom: 4 }}>An</div>
            {editing
              ? <input value={data.recipient.company} onChange={e => setR({ company: e.target.value })} style={{ display: "block", fontSize: 15, fontWeight: 700, color: CT, fontFamily: FNT, background: "rgba(219,234,254,0.35)", border: "1px dashed #93c5fd", borderRadius: 3, padding: "2px 4px", outline: "none", width: "100%", boxSizing: "border-box", marginBottom: 3 }} />
              : <div style={{ fontSize: 15, fontWeight: 700, color: CT, marginBottom: 3 }}>{data.recipient.company}</div>
            }
            {(["street", "cityZip", "country"] as const).map(k => (
              editing
                ? <input key={k} value={data.recipient[k]} onChange={e => setR({ [k]: e.target.value })} style={{ display: "block", fontSize: 14, color: CT, fontFamily: FNT, background: "rgba(219,234,254,0.35)", border: "1px dashed #93c5fd", borderRadius: 3, padding: "2px 4px", outline: "none", width: "100%", boxSizing: "border-box", marginBottom: 2, fontWeight: k === "country" ? 600 : 400 }} />
                : <div key={k} style={{ fontSize: 14, color: CT, marginBottom: 2, fontWeight: k === "country" ? 600 : 400 }}>{data.recipient[k]}</div>
            ))}
          </div>

          {/* Datum */}
          <div className="cl-date" style={{ marginBottom: 22 }}>
            {editing
              ? <input value={data.date} onChange={e => setData(d => ({ ...d, date: e.target.value }))} style={{ fontSize: 13, fontStyle: "italic", color: A, fontFamily: FNT, background: "rgba(219,234,254,0.35)", border: "1px dashed #93c5fd", borderRadius: 3, padding: "2px 4px", outline: "none", boxSizing: "border-box" }} />
              : <div style={{ fontSize: 13, fontStyle: "italic", color: A }}>{data.date}</div>
            }
          </div>

          {/* Brieftext – türkiser linker Rand */}
          <div style={{ borderLeft: `4px solid ${A}`, paddingLeft: 18 }}>
            {/* Betreff */}
            <div style={{ marginBottom: 12 }}>
              <E value={data.subject} onChange={v => setData(d => ({ ...d, subject: v }))} editing={editing} style={{ fontSize: 13, fontWeight: 600, color: CT, display: "block" }} />
            </div>
            {/* Anrede */}
            <div style={{ marginBottom: 10 }}>
              <E value={data.salutation} onChange={v => setData(d => ({ ...d, salutation: v }))} editing={editing} style={{ fontSize: 13, color: CT }} />
            </div>
            {/* Absätze */}
            <div className="cl-paras" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {data.bodyParagraphs.map((para, i) => (
                <div key={i} className="cl-para" style={{ position: "relative", paddingRight: editing ? 22 : 0 }}>
                  <E value={para} onChange={v => updatePara(i, v)} editing={editing} multiline rows={5} style={{ fontSize: 13, color: CB, lineHeight: 1.65, display: "block" }} />
                  {editing && (
                    <button type="button" onClick={() => removePara(i)} style={{ position: "absolute", top: 0, right: 0, background: "none", border: "none", cursor: "pointer", color: "#f87171", padding: 0 }}>
                      <XMarkIcon style={{ width: 14, height: 14 }} />
                    </button>
                  )}
                </div>
              ))}
              {editing && (
                <button type="button" onClick={addPara} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#3b82f6", background: "none", border: "none", cursor: "pointer", padding: 0, marginTop: 4, fontFamily: FNT }}>
                  <PlusIcon style={{ width: 14, height: 14 }} />Absatz hinzufügen
                </button>
              )}
            </div>
          </div>

          {/* Unterschrift */}
          <div className="cl-sig" style={{ marginTop: 28 }}>
            <E value={data.closing} onChange={v => setData(d => ({ ...d, closing: v }))} editing={editing} style={{ fontSize: 13, color: CT, display: "block", marginBottom: 30 }} />
            <div style={{ borderBottom: "1px solid #d1d5db", width: 180, marginBottom: 6 }} />
            <E value={data.signatureName} onChange={v => setData(d => ({ ...d, signatureName: v }))} editing={editing} style={{ fontSize: 13, fontWeight: 700, color: CT }} />
          </div>

        </div>{/* Ende Brief-Inhalt */}
        </div>{/* end cl-zoom-wrapper */}
      </div>
    </div>
  </ColCtx.Provider>
  );
}
