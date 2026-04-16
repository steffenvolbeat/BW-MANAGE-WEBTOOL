"use client";
// ─── CV Template: Arctic ──────────────────────────────────────────────────────
// Helles, luftiges Design. Eisblau-Akzente, minimalistisch, viel Weißraum
import { useState, useRef } from "react";
import { PrinterIcon, PencilSquareIcon, CheckIcon, PlusIcon, TrashIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { FONTS, FONT_SIZES, PHOTO_SHAPES, CVData, DEFAULT_CV_DATA, uid } from "./shared";

const A = "#0ea5e9";
const A2 = "#38bdf8";
const FNT = "'Nunito','Calibri',sans-serif";

function E({ value, onChange, editing, multiline = false, style = {} as React.CSSProperties, placeholder = "...", rows = 3 }: {
  value: string; onChange: (v: string) => void; editing: boolean;
  multiline?: boolean; style?: React.CSSProperties; placeholder?: string; rows?: number;
}) {
  const base: React.CSSProperties = { ...style, background: "rgba(14,165,233,0.06)", border: "1px dashed rgba(14,165,233,0.4)", borderRadius: 3, padding: "2px 4px", outline: "none", width: "100%", fontFamily: "inherit", fontSize: "inherit", color: "inherit", lineHeight: "inherit", fontWeight: "inherit", boxSizing: "border-box" };
  if (!editing) return <span style={style}>{value || <span style={{ opacity: 0.3, fontStyle: "italic" }}>{placeholder}</span>}</span>;
  if (multiline) return <textarea style={{ ...base, resize: "vertical", display: "block" }} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows} />;
  return <input style={base} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />;
}

export default function CV_Arctic() {
  const [data, setData] = useState<CVData>(JSON.parse(JSON.stringify(DEFAULT_CV_DATA)));
  const [editing, setEditing] = useState(false);
  const [photoSrc, setPhotoSrc] = useState("");
  const [fontKey, setFontKey] = useState("nunito");
  const [sizeKey, setSizeKey] = useState("md");
  const [photoShapeKey, setPhotoShapeKey] = useState("circle");
  const [showDesign, setShowDesign] = useState(false);
  const curFont = FONTS.find(f => f.key === fontKey) ?? FONTS[0];
  const curSize = FONT_SIZES.find(s => s.key === sizeKey) ?? FONT_SIZES[2];
  const curShape = PHOTO_SHAPES.find(s => s.key === photoShapeKey) ?? PHOTO_SHAPES[4];
  const fnt = curFont.family;
  const scale = curSize.scale;
  const photoInputRef = useRef<HTMLInputElement>(null);
  const setPersonal = (p: Partial<CVData["personal"]>) => setData(d => ({ ...d, personal: { ...d.personal, ...p } }));

  return (
    <div style={{ minHeight: "100vh", background: "#e0f2fe", padding: "24px 16px", fontFamily: FNT }}>
      <style>{`
        ${curFont.gf ? `@import url('https://fonts.googleapis.com/css2?family=${curFont.gf}&display=swap');` : ""}
        .arc-doc, .arc-doc * { font-family: ${fnt} !important; }
        @media print {
          @page { size: A4 portrait; margin: 0; }
          body * { visibility: hidden !important; }
          .arc-doc, .arc-doc * { visibility: visible !important; }
          .arc-doc { position: absolute !important; top: 0 !important; left: 0 !important; width: 210mm !important; box-shadow: none !important; margin: 0 !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .arc-zoom { zoom: 1 !important; width: 100% !important; }
          .arc-ctrl { display: none !important; }
        }
      `}</style>

      {/* Controls */}
      <div className="arc-ctrl" style={{ maxWidth: 850, margin: "0 auto 16px", display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button onClick={() => setEditing(e => !e)} style={{ padding: "7px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", border: "none", backgroundColor: editing ? "#16a34a" : A, color: "white", display: "flex", alignItems: "center", gap: 6 }}>
          {editing ? <CheckIcon style={{ width: 16, height: 16 }} /> : <PencilSquareIcon style={{ width: 16, height: 16 }} />}
          {editing ? "Fertig" : "Bearbeiten"}
        </button>
        <button onClick={() => window.print()} style={{ padding: "7px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", border: "none", backgroundColor: "#374151", color: "white", display: "flex", alignItems: "center", gap: 6 }}>
          <PrinterIcon style={{ width: 16, height: 16 }} />Drucken
        </button>
        <button onClick={() => setShowDesign(v => !v)} style={{ padding: "7px 16px", borderRadius: 8, fontSize: 13, cursor: "pointer", border: `1px solid ${showDesign ? A : "#bae6fd"}`, backgroundColor: showDesign ? "#e0f2fe" : "white", color: showDesign ? A : "#374151" }}>
          🎨 Design
        </button>
        <button onClick={() => { if (window.confirm("Zurücksetzen?")) { setData(JSON.parse(JSON.stringify(DEFAULT_CV_DATA))); } }} style={{ padding: "7px 16px", borderRadius: 8, fontSize: 13, cursor: "pointer", border: "1px solid #bae6fd", backgroundColor: "white", color: "#374151", display: "flex", alignItems: "center", gap: 6 }}>
          <XMarkIcon style={{ width: 16, height: 16 }} />Reset
        </button>
        {showDesign && (
          <div style={{ width: "100%", background: "white", border: "1px solid #bae6fd", borderRadius: 10, padding: "14px 18px", display: "flex", gap: 24, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", marginBottom: 7, letterSpacing: "0.1em", textTransform: "uppercase" }}>Schriftart</div>
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                {FONTS.map(f => <button key={f.key} onClick={() => setFontKey(f.key)} style={{ padding: "3px 9px", borderRadius: 5, border: `1px solid ${fontKey === f.key ? A : "#e5e7eb"}`, background: fontKey === f.key ? "#e0f2fe" : "white", color: fontKey === f.key ? A : "#374151", fontSize: 11, cursor: "pointer", fontFamily: f.family }}>{f.label}</button>)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", marginBottom: 7, letterSpacing: "0.1em", textTransform: "uppercase" }}>Schriftgröße</div>
              <div style={{ display: "flex", gap: 5 }}>
                {FONT_SIZES.map(s => <button key={s.key} onClick={() => setSizeKey(s.key)} style={{ padding: "3px 12px", borderRadius: 5, border: `1px solid ${sizeKey === s.key ? A : "#e5e7eb"}`, background: sizeKey === s.key ? "#e0f2fe" : "white", color: sizeKey === s.key ? A : "#374151", fontSize: 11, cursor: "pointer" }}>{s.label}</button>)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", marginBottom: 7, letterSpacing: "0.1em", textTransform: "uppercase" }}>Foto-Form</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {PHOTO_SHAPES.map(s => <button key={s.key} onClick={() => setPhotoShapeKey(s.key)} title={s.label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "5px 7px", borderRadius: 7, border: `2px solid ${photoShapeKey === s.key ? A : "#e5e7eb"}`, background: photoShapeKey === s.key ? "#e0f2fe" : "white", cursor: "pointer" }}>
                  <div style={{ width: 20, height: s.key === "ellipse" ? 26 : 20, borderRadius: s.br, clipPath: s.clip ?? "", backgroundColor: photoShapeKey === s.key ? A : "#d1d5db" }} />
                  <span style={{ fontSize: 8, color: photoShapeKey === s.key ? A : "#9ca3af", whiteSpace: "nowrap" }}>{s.label}</span>
                </button>)}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Document */}
      <div className="arc-doc" style={{ width: 850, margin: "0 auto", backgroundColor: "white", boxShadow: "0 8px 40px rgba(14,165,233,0.15)", overflow: "hidden", fontFamily: fnt }}>
        <div className="arc-zoom" style={{ width: Math.round(850 / scale), zoom: scale }}>

          {/* Top accent */}
          <div style={{ height: 5, background: `linear-gradient(90deg, ${A}, ${A2}, #7dd3fc)` }} />

          {/* Header */}
          <div style={{ backgroundColor: "#f0f9ff", padding: "32px 40px 28px", display: "flex", gap: 28, alignItems: "center", borderBottom: `1px solid #bae6fd` }}>
            <div style={{ width: curShape.w, height: curShape.h, borderRadius: curShape.br, clipPath: curShape.clip ?? "", overflow: "hidden", flexShrink: 0, backgroundColor: "#bae6fd", border: `3px solid ${A2}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: editing ? "pointer" : "default", boxShadow: curShape.shadow ?? "" }} onClick={() => editing && photoInputRef.current?.click()}>
              {photoSrc ? <img src={photoSrc} alt="Foto" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: 10, color: A, textAlign: "center" }}>{editing ? "📷" : "Foto"}</span>}
              <input ref={photoInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => { const f = e.target.files?.[0]; if (!f) return; const r = new FileReader(); r.onload = ev => setPhotoSrc((ev.target?.result as string) ?? ""); r.readAsDataURL(f); }} />
            </div>
            <div style={{ flex: 1 }}>
              {editing
                ? <input value={data.personal.name} onChange={e => setPersonal({ name: e.target.value })} style={{ display: "block", fontSize: 36, fontWeight: 900, color: "#0c4a6e", lineHeight: 1.1, marginBottom: 4, fontFamily: fnt, background: "rgba(14,165,233,0.06)", border: "1px dashed rgba(14,165,233,0.4)", borderRadius: 3, padding: "2px 6px", outline: "none", width: "100%", boxSizing: "border-box" }} />
                : <div style={{ fontSize: 36, fontWeight: 900, color: "#0c4a6e", lineHeight: 1.1, marginBottom: 4 }}>{data.personal.name}</div>
              }
              {editing
                ? <input value={data.personal.subtitle} onChange={e => setPersonal({ subtitle: e.target.value })} style={{ display: "block", fontSize: 13, color: A, fontWeight: 500, marginBottom: 10, fontFamily: fnt, background: "rgba(14,165,233,0.06)", border: "1px dashed rgba(14,165,233,0.4)", borderRadius: 3, padding: "2px 6px", outline: "none", width: "100%", boxSizing: "border-box" }} />
                : <div style={{ fontSize: 13, color: A, fontWeight: 500, marginBottom: 10 }}>{data.personal.subtitle}</div>
              }
              <div style={{ display: "flex", flexWrap: "wrap", gap: 14 }}>
                {[data.personal.email, data.personal.phone, data.personal.location].map((v, i) => (
                  <span key={i} style={{ fontSize: 10, color: "#0369a1" }}>{v}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Body */}
          <div style={{ display: "flex" }}>
            {/* Main */}
            <div style={{ flex: 1, padding: "28px 28px 40px 40px", minWidth: 0 }}>
              <E value={data.personal.bio} onChange={v => setPersonal({ bio: v })} editing={editing} multiline rows={3} style={{ fontSize: 11, color: "#475569", lineHeight: 1.7, display: "block", marginBottom: 22 }} />

              {/* Projekte */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase" as const, color: A, marginBottom: 10, paddingBottom: 6, borderBottom: `2px solid ${A2}` }}>Projekte</div>
                {data.projects.map(p => (
                  <div key={p.id} style={{ marginBottom: 14 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                      <E value={p.title} onChange={v => setData(d => ({ ...d, projects: d.projects.map(x => x.id === p.id ? { ...x, title: v } : x) }))} editing={editing} style={{ fontSize: 12, fontWeight: 700, color: "#0c4a6e" }} />
                      <E value={p.period} onChange={v => setData(d => ({ ...d, projects: d.projects.map(x => x.id === p.id ? { ...x, period: v } : x) }))} editing={editing} style={{ fontSize: 10, color: A2, fontStyle: "italic", flexShrink: 0 }} />
                    </div>
                    {p.bullets.map((b, i) => <div key={i} style={{ fontSize: 11, color: "#64748b", paddingLeft: 10, marginBottom: 2 }}>— {b}</div>)}
                    {editing && <button type="button" onClick={() => setData(d => ({ ...d, projects: d.projects.filter(x => x.id !== p.id) }))} style={{ fontSize: 10, color: "#f87171", background: "none", border: "none", cursor: "pointer", marginTop: 4, display: "flex", alignItems: "center", gap: 3 }}><TrashIcon style={{ width: 10, height: 10 }} />Entfernen</button>}
                  </div>
                ))}
                {editing && <button type="button" onClick={() => setData(d => ({ ...d, projects: [...d.projects, { id: uid(), title: "Projekt", period: "", bullets: [] }] }))} style={{ fontSize: 11, color: A, background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}><PlusIcon style={{ width: 12, height: 12 }} />Hinzufügen</button>}
              </div>

              {/* Erfahrung */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase" as const, color: A, marginBottom: 10, paddingBottom: 6, borderBottom: `2px solid ${A2}` }}>Berufserfahrung</div>
                {data.experience.map(ex => (
                  <div key={ex.id} style={{ marginBottom: 14 }}>
                    <E value={ex.position} onChange={v => setData(d => ({ ...d, experience: d.experience.map(x => x.id === ex.id ? { ...x, position: v } : x) }))} editing={editing} style={{ fontSize: 12, fontWeight: 700, color: "#0c4a6e", display: "block" }} />
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <E value={ex.company} onChange={v => setData(d => ({ ...d, experience: d.experience.map(x => x.id === ex.id ? { ...x, company: v } : x) }))} editing={editing} style={{ fontSize: 11, color: A }} />
                      <E value={ex.period} onChange={v => setData(d => ({ ...d, experience: d.experience.map(x => x.id === ex.id ? { ...x, period: v } : x) }))} editing={editing} style={{ fontSize: 10, color: "#94a3b8", fontStyle: "italic" }} />
                    </div>
                    {ex.bullets.map((b, i) => <div key={i} style={{ fontSize: 11, color: "#64748b", paddingLeft: 10, marginBottom: 2 }}>— {b}</div>)}
                  </div>
                ))}
              </div>

              {/* Ausbildung */}
              <div>
                <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase" as const, color: A, marginBottom: 10, paddingBottom: 6, borderBottom: `2px solid ${A2}` }}>Ausbildung</div>
                {data.education.map(e => (
                  <div key={e.id} style={{ marginBottom: 12 }}>
                    <E value={e.degree} onChange={v => setData(d => ({ ...d, education: d.education.map(x => x.id === e.id ? { ...x, degree: v } : x) }))} editing={editing} style={{ fontSize: 12, fontWeight: 700, color: "#0c4a6e", display: "block" }} />
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <E value={e.institution} onChange={v => setData(d => ({ ...d, education: d.education.map(x => x.id === e.id ? { ...x, institution: v } : x) }))} editing={editing} style={{ fontSize: 11, color: A }} />
                      <E value={e.period} onChange={v => setData(d => ({ ...d, education: d.education.map(x => x.id === e.id ? { ...x, period: v } : x) }))} editing={editing} style={{ fontSize: 10, color: "#94a3b8", fontStyle: "italic" }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sidebar */}
            <div style={{ width: 240, flexShrink: 0, backgroundColor: "#f0f9ff", padding: "28px 18px 40px", borderLeft: "1px solid #bae6fd" }}>
              <div style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase" as const, color: A, marginBottom: 8, paddingBottom: 4, borderBottom: "1px solid #bae6fd" }}>Skills</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {data.skills.map((s, i) => <span key={i} style={{ fontSize: 9, backgroundColor: "#dbeafe", color: "#1e40af", border: "1px solid #bfdbfe", borderRadius: 20, padding: "1px 7px" }}>{s}</span>)}
                </div>
              </div>
              <div style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase" as const, color: A, marginBottom: 8, paddingBottom: 4, borderBottom: "1px solid #bae6fd" }}>Soft Skills</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {data.softSkills.map((s, i) => <span key={i} style={{ fontSize: 9, border: `1px solid ${A}`, color: A, borderRadius: 20, padding: "1px 7px" }}>{s}</span>)}
                </div>
              </div>
              <div style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase" as const, color: A, marginBottom: 8, paddingBottom: 4, borderBottom: "1px solid #bae6fd" }}>Sprachen</div>
                {data.languages.map(l => <div key={l.id} style={{ marginBottom: 7 }}>
                  <E value={l.language} onChange={v => setData(d => ({ ...d, languages: d.languages.map(x => x.id === l.id ? { ...x, language: v } : x) }))} editing={editing} style={{ fontSize: 11, fontWeight: 700, color: "#0c4a6e", display: "block" }} />
                  <E value={l.level} onChange={v => setData(d => ({ ...d, languages: d.languages.map(x => x.id === l.id ? { ...x, level: v } : x) }))} editing={editing} style={{ fontSize: 10, color: A2, display: "block" }} />
                </div>)}
              </div>
              <div style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase" as const, color: A, marginBottom: 8, paddingBottom: 4, borderBottom: "1px solid #bae6fd" }}>Zertifikate</div>
                {data.certificates.map(c => <div key={c.id} style={{ marginBottom: 7 }}>
                  <E value={c.name} onChange={v => setData(d => ({ ...d, certificates: d.certificates.map(x => x.id === c.id ? { ...x, name: v } : x) }))} editing={editing} multiline rows={2} style={{ fontSize: 10, color: "#334155", display: "block", lineHeight: 1.4 }} />
                  <E value={c.period} onChange={v => setData(d => ({ ...d, certificates: d.certificates.map(x => x.id === c.id ? { ...x, period: v } : x) }))} editing={editing} style={{ fontSize: 9, color: "#94a3b8", display: "block" }} />
                </div>)}
              </div>
              <div>
                <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase" as const, color: A, marginBottom: 8, paddingBottom: 4, borderBottom: "1px solid #bae6fd" }}>Interessen</div>
                {data.interests.map((s, i) => <div key={i} style={{ fontSize: 10, color: "#475569", marginBottom: 4 }}>❄ {s}</div>)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
