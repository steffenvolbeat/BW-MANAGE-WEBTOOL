"use client";
import { useState, useCallback } from "react";
import {
  PrinterIcon, PencilSquareIcon, CheckIcon,
  PlusIcon, TrashIcon, EnvelopeIcon, PhoneIcon,
  MapPinIcon, LinkIcon, XMarkIcon,
} from "@heroicons/react/24/outline";

// ─── Tokens ──────────────────────────────────────────────────────────────────
const A  = "#3ecfd6";          // teal accent
const SBG = "#1d2a3a";         // sidebar bg
const DOC_FONT = "'Nunito','Calibri','Segoe UI',Arial,sans-serif";
const TEXT     = "#111827";
const SUBTLE   = "#374151";
const MUTED    = "#9ca3af";

// ─── Types ────────────────────────────────────────────────────────────────────
interface CLData {
  personal: {
    name: string; subtitle: string; email: string; phone: string;
    location: string; website: string; linkedin: string; github: string;
  };
  recipient: { company: string; street: string; cityZip: string; country: string };
  date: string; subject: string; salutation: string;
  bodyParagraphs: string[];
  closing: string; signatureName: string;
}

// ─── Default data ─────────────────────────────────────────────────────────────
const DEFAULT_CL: CLData = {
  personal: {
    name: "Steffen Lorenz",
    subtitle: "Web- und Softwareentwickler",
    email: "steffen.konstanz@gmx.ch",
    phone: "0173 4235651",
    location: "Erfurt, Deutschland",
    website: "next-gen-developer-portfolio.vercel.app/",
    linkedin: "linkedin.com/in/steffenlorenz-8412873b2",
    github: "github.com/steffenvolbeat",
  },
  recipient: {
    company: "addON Solution GmbH",
    street: "Otto-Eppenstein-Straße",
    cityZip: "26 07745 Jena",
    country: "Germany",
  },
  date: "01. April 2026",
  subject: "Bewerbung als Quereinsteiger (m/w/d) Software-Entwicklung / Web-Entwicklung",
  salutation: "Sehr geehrte Damen und Herren,",
  bodyParagraphs: [
    "Ihre Ausschreibung ist deshalb interessant, weil sie nicht auf formale Lebensläufe fixiert ist, sondern auf echte Entwicklungsbegeisterung, Problemlösung und technisches Wachstum. Genau darin sehe ich meine Stärke. Ich arbeite mich konsequent in Technologien ein, entwickle eigene Projekte, denke strukturiert und bleibe an Problemen so lange dran, bis eine belastbare Lösung steht.",
    "Aktuell absolviere ich eine Weiterbildung zum Web- und Softwareentwickler. Dabei arbeite ich mit Linux, Git-Workflows, HTML, CSS, JavaScript, TypeScript, Node.js, React, Next.js, PostgreSQL, Docker, APIs sowie agilen Workflows. Mein Abschlussprojekt \u201e3D Event Plattform\u201c setze ich eigenständig um. Dadurch kenne ich nicht nur einzelne Werkzeuge, sondern den Aufbau moderner Webanwendungen \u00fcber Frontend, Backend, Datenbank, Testing und saubere Projektstruktur hinweg.",
    "Besonders passend finde ich Ihr Umfeld, weil Sie mit Ihren L\u00f6sungen egON und LeON seit Jahren spezialisierte Software f\u00fcr Energievertriebe, Distributionen und Energieversorger entwickeln. Mich \u00fcberzeugt daran die Verbindung aus fachlicher Spezialisierung, produktnaher Entwicklung und realem Kundennutzen. Dass in Ihrem Team enger Kundenkontakt, kurze Kommunikationswege, agile Zusammenarbeit und Raum f\u00fcr eigene Ideen ausdr\u00fccklich Teil der Arbeitsweise sind, entspricht genau dem Umfeld, in dem ich mich fachlich schnell weiterentwickeln und produktiv einbringen kann.",
    "Ich komme zwar nicht aus einem klassischen Informatikstudium, bringe aber genau die Mischung mit, die Sie f\u00fcr den Einstieg beschreiben, technische Lernbereitschaft, Begeisterung f\u00fcr Programmierung und den Anspruch, mich Schritt f\u00fcr Schritt zu einem belastbaren Entwicklerprofi weiterzuentwickeln. In meinen bisherigen Projekten arbeite ich bereits mit modernen Webtechnologien, komponentenbasierten Strukturen und datengetriebenen Anwendungen. Dabei lege ich Wert auf nachvollziehbaren Code, saubere Architektur und eine L\u00f6sung, die nicht nur funktioniert, sondern auch weiterentwickelbar bleibt.",
    "Ich bewerbe mich bei Ihnen, weil Ihre Stelle nicht auf reine Routine zielt, sondern auf Entwicklung im eigentlichen Sinn \u2013 neues Lernen, Verantwortung \u00fcbernehmen, Ideen umsetzen und in realen Projekten wachsen. Genau diesen Anspruch verfolge ich auch selbst. Ich m\u00f6chte mein technisches Fundament, meine Disziplin und meine hohe Motivation in Ihr Team einbringen und mich dort zu einem starken Entwickler mit belastbarem Praxisbezug weiterentwickeln.",
    "\u00dcber die Einladung zu einem pers\u00f6nlichen Gespr\u00e4ch freue ich mich.",
  ],
  closing: "Mit freundlichen Gr\u00fc\u00dfen,",
  signatureName: "Steffen Lorenz",
};

// ─── Editable Field ───────────────────────────────────────────────────────────
function E({
  value, onChange, editing, multiline = false, style = {}, placeholder = "...", rows = 4,
}: {
  value: string; onChange: (v: string) => void; editing: boolean;
  multiline?: boolean; style?: React.CSSProperties; placeholder?: string; rows?: number;
}) {
  const base: React.CSSProperties = {
    ...style,
    background: editing ? "rgba(219,234,254,0.35)" : "transparent",
    border: editing ? "1px dashed #93c5fd" : "none",
    borderRadius: 3,
    padding: editing ? "2px 4px" : 0,
    outline: "none",
    width: "100%",
    fontFamily: "inherit",
    fontSize: "inherit",
    color: "inherit",
    lineHeight: "inherit",
    fontWeight: "inherit",
    fontStyle: "inherit",
    boxSizing: "border-box" as const,
  };
  if (!editing)
    return <span style={style}>{value || <span style={{ opacity: 0.3, fontStyle: "italic" }}>{placeholder}</span>}</span>;
  if (multiline)
    return <textarea style={{ ...base, resize: "vertical", display: "block" }} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={rows} />;
  return <input style={base} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />;
}

// ─── Contact Row ──────────────────────────────────────────────────────────────
function ContactRow({ icon, value, editing, onChange }: {
  icon: React.ReactNode; value: string; editing: boolean; onChange: (v: string) => void;
}) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 14 }}>
      <div style={{ width: 26, height: 26, borderRadius: 4, backgroundColor: A, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
        <span style={{ color: "white", display: "flex" }}>{icon}</span>
      </div>
      <E value={value} onChange={onChange} editing={editing}
        style={{ fontSize: 12, color: "white", lineHeight: 1.4, wordBreak: "break-all" as const }} />
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function CoverLetterNovoresume({
  initialCompany, initialPosition,
}: { initialCompany?: string; initialPosition?: string }) {
  const startData = JSON.parse(JSON.stringify(DEFAULT_CL)) as CLData;
  if (initialCompany) startData.recipient.company = initialCompany;
  if (initialPosition) startData.subject = `Bewerbung als ${initialPosition}`;
  const [data, setData] = useState<CLData>(startData);
  const [editing, setEditing] = useState(false);

  const setPersonal  = (p: Partial<CLData["personal"]>)  => setData((d) => ({ ...d, personal:  { ...d.personal,  ...p } }));
  const setRecipient = (p: Partial<CLData["recipient"]>) => setData((d) => ({ ...d, recipient: { ...d.recipient, ...p } }));

  const updateParagraph = useCallback((idx: number, val: string) =>
    setData((d) => { const bp = [...d.bodyParagraphs]; bp[idx] = val; return { ...d, bodyParagraphs: bp }; }), []);
  const addParagraph    = () => setData((d) => ({ ...d, bodyParagraphs: [...d.bodyParagraphs, ""] }));
  const removeParagraph = (idx: number) => setData((d) => ({ ...d, bodyParagraphs: d.bodyParagraphs.filter((_, i) => i !== idx) }));

  return (
    <div style={{ minHeight: "100vh", background: "#f3f4f6", padding: "24px 16px", fontFamily: DOC_FONT }}>

      {/* Google Font */}
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800&display=swap');`}</style>

      {/* Controls */}
      <div className="print:hidden" style={{ maxWidth: 850, margin: "0 auto 20px", display: "flex", gap: 10, flexWrap: "wrap" as const }}>
        <button onClick={() => setEditing((e) => !e)}
          style={{ display:"flex", alignItems:"center", gap:6, padding:"7px 16px", borderRadius:8, fontSize:13, fontWeight:600, cursor:"pointer", border:"none", backgroundColor: editing ? "#16a34a" : "#4f46e5", color:"white" }}>
          {editing ? <CheckIcon style={{width:16,height:16}} /> : <PencilSquareIcon style={{width:16,height:16}} />}
          {editing ? "Fertig bearbeiten" : "Bearbeiten"}
        </button>
        <button onClick={() => window.print()}
          style={{ display:"flex", alignItems:"center", gap:6, padding:"7px 16px", borderRadius:8, fontSize:13, fontWeight:600, cursor:"pointer", border:"none", backgroundColor:"#374151", color:"white" }}>
          <PrinterIcon style={{width:16,height:16}} /> Drucken / PDF
        </button>
        <button onClick={() => { if (window.confirm("Alle \u00c4nderungen zur\u00fccksetzen?")) setData(JSON.parse(JSON.stringify(DEFAULT_CL))); }}
          style={{ display:"flex", alignItems:"center", gap:6, padding:"7px 16px", borderRadius:8, fontSize:13, fontWeight:600, cursor:"pointer", border:"1px solid #d1d5db", backgroundColor:"white", color:"#374151" }}>
          <XMarkIcon style={{width:16,height:16}} /> Zur\u00fccksetzen
        </button>
        {editing && <span style={{ alignSelf:"center", fontSize:12, color:"#6b7280", fontStyle:"italic" }}>Alle Felder direkt bearbeitbar</span>}
      </div>

      {/* ── Document ── */}
      <div style={{ maxWidth: 850, margin: "0 auto", fontFamily: DOC_FONT, boxShadow: "0 4px 32px rgba(0,0,0,0.15)" }}>
        <div style={{ display: "flex", minHeight: 1100 }}>

          {/* LEFT COLUMN */}
          <div style={{ flex: 1, backgroundColor: "white", padding: "40px 28px 40px 40px", color: TEXT }}>

            {/* Name + subtitle */}
            {editing
              ? <input value={data.personal.name} onChange={(e) => setPersonal({ name: e.target.value })}
                  style={{ display:"block", fontSize:42, fontWeight:800, color:TEXT, lineHeight:1.1, marginBottom:4, fontFamily:DOC_FONT, background:"rgba(219,234,254,0.35)", border:"1px dashed #93c5fd", borderRadius:3, padding:"2px 4px", outline:"none", width:"100%", boxSizing:"border-box" }} />
              : <div style={{ fontSize:42, fontWeight:800, color:TEXT, lineHeight:1.1, marginBottom:4 }}>{data.personal.name}</div>
            }
            {editing
              ? <input value={data.personal.subtitle} onChange={(e) => setPersonal({ subtitle: e.target.value })}
                  style={{ display:"block", fontSize:15, fontWeight:600, color:A, marginBottom:28, fontFamily:DOC_FONT, background:"rgba(219,234,254,0.35)", border:"1px dashed #93c5fd", borderRadius:3, padding:"2px 4px", outline:"none", width:"100%", boxSizing:"border-box" }} />
              : <div style={{ fontSize:15, fontWeight:600, color:A, marginBottom:28 }}>{data.personal.subtitle}</div>
            }

            {/* Recipient */}
            <div style={{ marginBottom: 4 }}>
              <div style={{ fontSize:11, fontStyle:"italic", color:MUTED, marginBottom:2 }}>An</div>
              {editing
                ? <input value={data.recipient.company} onChange={(e) => setRecipient({ company: e.target.value })}
                    style={{ display:"block", fontSize:16, fontWeight:700, color:TEXT, fontFamily:DOC_FONT, background:"rgba(219,234,254,0.35)", border:"1px dashed #93c5fd", borderRadius:3, padding:"2px 4px", outline:"none", width:"100%", boxSizing:"border-box", marginBottom:2 }} />
                : <div style={{ fontSize:16, fontWeight:700, color:TEXT }}>{data.recipient.company}</div>
              }
            </div>
            {["street","cityZip","country"].map((k) => (
              editing
                ? <input key={k} value={(data.recipient as Record<string,string>)[k]} onChange={(e) => setRecipient({ [k]: e.target.value })}
                    style={{ display:"block", fontSize:15, color:TEXT, fontFamily:DOC_FONT, background:"rgba(219,234,254,0.35)", border:"1px dashed #93c5fd", borderRadius:3, padding:"2px 4px", outline:"none", width:"100%", boxSizing:"border-box", marginBottom:2, fontWeight: k==="country" ? 600 : 400 }} />
                : <div key={k} style={{ fontSize:15, color:TEXT, marginBottom:2, fontWeight: k==="country" ? 600 : 400 }}>{(data.recipient as Record<string,string>)[k]}</div>
            ))}

            {/* Date */}
            <div style={{ marginTop:14, marginBottom:32 }}>
              {editing
                ? <input value={data.date} onChange={(e) => setData((d) => ({ ...d, date: e.target.value }))}
                    style={{ fontSize:14, fontStyle:"italic", color:A, fontFamily:DOC_FONT, background:"rgba(219,234,254,0.35)", border:"1px dashed #93c5fd", borderRadius:3, padding:"2px 4px", outline:"none", boxSizing:"border-box" }} />
                : <div style={{ fontSize:14, fontStyle:"italic", color:A }}>{data.date}</div>
              }
            </div>

            {/* Body – teal left border */}
            <div style={{ borderLeft: `4px solid ${A}`, paddingLeft: 18 }}>
              {/* Subject */}
              <div style={{ marginBottom:18 }}>
                <E value={data.subject} onChange={(v) => setData((d) => ({ ...d, subject: v }))} editing={editing}
                  style={{ fontSize:13, fontWeight:600, color:TEXT }} />
              </div>
              {/* Salutation */}
              <div style={{ marginBottom:14 }}>
                <E value={data.salutation} onChange={(v) => setData((d) => ({ ...d, salutation: v }))} editing={editing}
                  style={{ fontSize:13, color:TEXT }} />
              </div>
              {/* Paragraphs */}
              <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                {data.bodyParagraphs.map((para, idx) => (
                  <div key={idx} style={{ position:"relative", paddingRight: editing ? 20 : 0 }}>
                    <E value={para} onChange={(v) => updateParagraph(idx, v)} editing={editing} multiline rows={5}
                      style={{ fontSize:13, color:SUBTLE, lineHeight:1.65, display:"block" }} />
                    {editing && (
                      <button type="button" onClick={() => removeParagraph(idx)} title="Absatz entfernen"
                        style={{ position:"absolute", top:0, right:0, background:"none", border:"none", cursor:"pointer", color:"#f87171", padding:0 }}>
                        <XMarkIcon style={{width:14,height:14}} />
                      </button>
                    )}
                  </div>
                ))}
                {editing && (
                  <button type="button" onClick={addParagraph}
                    style={{ display:"flex", alignItems:"center", gap:4, fontSize:12, color:"#3b82f6", background:"none", border:"none", cursor:"pointer", padding:0, marginTop:4 }}>
                    <PlusIcon style={{width:14,height:14}} /> Absatz hinzuf\u00fcgen
                  </button>
                )}
              </div>
            </div>

            {/* Signature */}
            <div style={{ marginTop:40 }}>
              <E value={data.closing} onChange={(v) => setData((d) => ({ ...d, closing: v }))} editing={editing}
                style={{ fontSize:13, color:TEXT, display:"block", marginBottom:36 }} />
              <div style={{ borderBottom:"1px solid #d1d5db", width:180, marginBottom:6 }} />
              <E value={data.signatureName} onChange={(v) => setData((d) => ({ ...d, signatureName: v }))} editing={editing}
                style={{ fontSize:13, fontWeight:700, color:TEXT }} />
            </div>
          </div>

          {/* RIGHT SIDEBAR */}
          <div style={{ width:295, flexShrink:0, backgroundColor:SBG, padding:"40px 22px", color:"white" }}>
            <ContactRow icon={<EnvelopeIcon style={{width:13,height:13}}/>} value={data.personal.email} editing={editing} onChange={(v) => setPersonal({email:v})} />
            <ContactRow icon={<PhoneIcon style={{width:13,height:13}}/>} value={data.personal.phone} editing={editing} onChange={(v) => setPersonal({phone:v})} />
            <ContactRow icon={<MapPinIcon style={{width:13,height:13}}/>} value={data.personal.location} editing={editing} onChange={(v) => setPersonal({location:v})} />
            <ContactRow icon={<LinkIcon style={{width:13,height:13}}/>} value={data.personal.website} editing={editing} onChange={(v) => setPersonal({website:v})} />
            <ContactRow
              icon={<svg viewBox="0 0 24 24" style={{width:13,height:13}} fill="currentColor"><path d="M19 3a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h14zm-5 6.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm-4 0a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM8 14v-2H7v2h1zm0 0h9v-2H8v2zm0 0v1H7v-1h1zm9 0v1h-1v-1h1z"/></svg>}
              value={data.personal.linkedin} editing={editing} onChange={(v) => setPersonal({linkedin:v})} />
            <ContactRow
              icon={<svg viewBox="0 0 24 24" style={{width:13,height:13}} fill="currentColor"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.009-.868-.014-1.703-2.782.604-3.369-1.342-3.369-1.342-.454-1.155-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.268 2.75 1.026A9.578 9.578 0 0112 6.836c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.026 2.747-1.026.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.137 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z"/></svg>}
              value={data.personal.github} editing={editing} onChange={(v) => setPersonal({github:v})} />
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          body { margin: 0; }
          .print\\:hidden { display: none !important; }
        }
      `}</style>
    </div>
  );
}
