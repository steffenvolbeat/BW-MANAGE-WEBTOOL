"use client";
// ─── CV Template: Solar ───────────────────────────────────────────────────────
// Warme Orange-Braun-Töne, erdiges Design, energetisch
import { useState, useRef } from "react";
import { PrinterIcon, PencilSquareIcon, CheckIcon, PlusIcon, TrashIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { FONTS, FONT_SIZES, PHOTO_SHAPES, CVData, DEFAULT_CV_DATA, uid } from "./shared";

const A = "#f97316";
const A2 = "#fb923c";
const DARK = "#431407";
const S2 = "#fef3e8";
const FNT = "'Nunito','Calibri',sans-serif";

function E({ value, onChange, editing, multiline = false, style = {} as React.CSSProperties, placeholder = "...", rows = 3, inv = false }: {
  value: string; onChange: (v: string) => void; editing: boolean;
  multiline?: boolean; style?: React.CSSProperties; placeholder?: string; rows?: number; inv?: boolean;
}) {
  const base: React.CSSProperties = { ...style, background: inv ? "rgba(255,255,255,0.1)" : "rgba(249,115,22,0.07)", border: `1px dashed ${inv ? "rgba(255,255,255,0.4)" : "rgba(249,115,22,0.4)"}`, borderRadius: 3, padding: "2px 4px", outline: "none", width: "100%", fontFamily: "inherit", fontSize: "inherit", color: "inherit", lineHeight: "inherit", fontWeight: "inherit", boxSizing: "border-box" };
  if (!editing) return <span style={style}>{value || <span style={{ opacity: 0.3, fontStyle: "italic" }}>{placeholder}</span>}</span>;
  if (multiline) return <textarea style={{ ...base, resize: "vertical", display: "block" }} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows} />;
  return <input style={base} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />;
}

export default function CV_Solar() {
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
    <div style={{ minHeight: "100vh", background: "#fff7ed", padding: "24px 16px", fontFamily: FNT }}>
      <style>{`
        ${curFont.gf ? `@import url('https://fonts.googleapis.com/css2?family=${curFont.gf}&display=swap');` : ""}
        .sol-doc, .sol-doc * { font-family: ${fnt} !important; }
        @media print {
          @page { size: A4 portrait; margin: 0; }
          body * { visibility: hidden !important; }
          .sol-doc, .sol-doc * { visibility: visible !important; }
          .sol-doc { position: absolute !important; top: 0 !important; left: 0 !important; width: 210mm !important; box-shadow: none !important; margin: 0 !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .sol-zoom { zoom: 1 !important; width: 100% !important; }
          .sol-ctrl { display: none !important; }
        }
      `}</style>

      {/* Controls */}
      <div className="sol-ctrl" style={{ maxWidth: 850, margin: "0 auto 16px", display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button onClick={() => setEditing(e => !e)} style={{ padding: "7px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", border: "none", backgroundColor: editing ? "#16a34a" : A, color: "white", display: "flex", alignItems: "center", gap: 6 }}>
          {editing ? <CheckIcon style={{ width: 16, height: 16 }} /> : <PencilSquareIcon style={{ width: 16, height: 16 }} />}
          {editing ? "Fertig" : "Bearbeiten"}
        </button>
        <button onClick={() => window.print()} style={{ padding: "7px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", border: "none", backgroundColor: "#374151", color: "white", display: "flex", alignItems: "center", gap: 6 }}>
          <PrinterIcon style={{ width: 16, height: 16 }} />Drucken
        </button>
        <button onClick={() => setShowDesign(v => !v)} style={{ padding: "7px 16px", borderRadius: 8, fontSize: 13, cursor: "pointer", border: `1px solid ${showDesign ? A : "#e5e7eb"}`, backgroundColor: showDesign ? "#fff7ed" : "white", color: showDesign ? A : "#374151" }}>
          🎨 Design
        </button>
        <button onClick={() => { if (window.confirm("Zurücksetzen?")) { setData(JSON.parse(JSON.stringify(DEFAULT_CV_DATA))); } }} style={{ padding: "7px 16px", borderRadius: 8, fontSize: 13, cursor: "pointer", border: "1px solid #e5e7eb", backgroundColor: "white", color: "#374151", display: "flex", alignItems: "center", gap: 6 }}>
          <XMarkIcon style={{ width: 16, height: 16 }} />Reset
        </button>
        {showDesign && (
          <div style={{ width: "100%", background: "white", border: "1px solid #fed7aa", borderRadius: 10, padding: "14px 18px", display: "flex", gap: 24, flexWrap: "wrap" }}>
            <div><div style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", marginBottom: 7, letterSpacing: "0.1em", textTransform: "uppercase" }}>Schriftart</div>
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>{FONTS.map(f => <button key={f.key} onClick={() => setFontKey(f.key)} style={{ padding: "3px 9px", borderRadius: 5, border: `1px solid ${fontKey === f.key ? A : "#e5e7eb"}`, background: fontKey === f.key ? "#fff7ed" : "white", color: fontKey === f.key ? A : "#374151", fontSize: 11, cursor: "pointer", fontFamily: f.family }}>{f.label}</button>)}</div>
            </div>
            <div><div style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", marginBottom: 7, letterSpacing: "0.1em", textTransform: "uppercase" }}>Schriftgröße</div>
              <div style={{ display: "flex", gap: 5 }}>{FONT_SIZES.map(s => <button key={s.key} onClick={() => setSizeKey(s.key)} style={{ padding: "3px 12px", borderRadius: 5, border: `1px solid ${sizeKey === s.key ? A : "#e5e7eb"}`, background: sizeKey === s.key ? "#fff7ed" : "white", color: sizeKey === s.key ? A : "#374151", fontSize: 11, cursor: "pointer" }}>{s.label}</button>)}</div>
            </div>
            <div><div style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", marginBottom: 7, letterSpacing: "0.1em", textTransform: "uppercase" }}>Foto-Form</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{PHOTO_SHAPES.map(s => <button key={s.key} onClick={() => setPhotoShapeKey(s.key)} title={s.label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "5px 7px", borderRadius: 7, border: `2px solid ${photoShapeKey === s.key ? A : "#e5e7eb"}`, background: photoShapeKey === s.key ? "#fff7ed" : "white", cursor: "pointer" }}>
                <div style={{ width: 20, height: s.key === "ellipse" ? 26 : 20, borderRadius: s.br, clipPath: s.clip ?? "", backgroundColor: photoShapeKey === s.key ? A : "#d1d5db" }} />
                <span style={{ fontSize: 8, color: photoShapeKey === s.key ? A : "#9ca3af", whiteSpace: "nowrap" }}>{s.label}</span>
              </button>)}</div>
            </div>
          </div>
        )}
      </div>

      {/* Document */}
      <div className="sol-doc" style={{ width: 850, margin: "0 auto", backgroundColor: "white", boxShadow: `0 8px 40px rgba(249,115,22,0.2)`, overflow: "hidden", fontFamily: fnt }}>
        <div className="sol-zoom" style={{ width: Math.round(850 / scale), zoom: scale }}>
          {/* Gradient header */}
          <div style={{ background: `linear-gradient(135deg, ${DARK} 0%, #9a3412 40%, ${A} 100%)`, padding: "30px 40px 24px", display: "flex", gap: 24, alignItems: "center" }}>
            <div style={{ width: curShape.w, height: curShape.h, borderRadius: curShape.br, clipPath: curShape.clip ?? "", overflow: "hidden", flexShrink: 0, backgroundColor: "rgba(255,255,255,0.15)", border: "3px solid rgba(255,255,255,0.7)", display: "flex", alignItems: "center", justifyContent: "center", cursor: editing ? "pointer" : "default", boxShadow: curShape.shadow ?? "" }} onClick={() => editing && photoInputRef.current?.click()}>
              {photoSrc ? <img src={photoSrc} alt="Foto" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: 10, color: "rgba(255,255,255,0.5)" }}>{editing ? "📷" : "Foto"}</span>}
              <input ref={photoInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => { const f = e.target.files?.[0]; if (!f) return; const r = new FileReader(); r.onload = ev => setPhotoSrc((ev.target?.result as string) ?? ""); r.readAsDataURL(f); }} />
            </div>
            <div style={{ flex: 1 }}>
              <E value={data.personal.name} onChange={v => setPersonal({ name: v })} editing={editing} inv style={{ fontSize: 38, fontWeight: 900, color: "white", lineHeight: 1.1, display: "block", marginBottom: 4 }} />
              <E value={data.personal.subtitle} onChange={v => setPersonal({ subtitle: v })} editing={editing} inv style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", display: "block", marginBottom: 10 }} />
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                {[data.personal.email, data.personal.phone, data.personal.location].map((v, i) => <span key={i} style={{ fontSize: 10, color: "rgba(255,255,255,0.8)" }}>{v}</span>)}
              </div>
            </div>
          </div>
          <div style={{ height: 4, background: `linear-gradient(90deg, ${A2}, #fbbf24)` }} />

          {/* Body */}
          <div style={{ display: "flex" }}>
            <div style={{ flex: 1, padding: "28px 24px 40px 36px", minWidth: 0 }}>
              <E value={data.personal.bio} onChange={v => setPersonal({ bio: v })} editing={editing} multiline rows={3} style={{ fontSize: 11, color: "#78350f", lineHeight: 1.7, display: "block", marginBottom: 22, padding: "10px 14px", background: "#fff7ed", borderRadius: 6, borderLeft: `3px solid ${A}` }} />

              {[
                { title: "Projekte", items: data.projects.map(p => (
                  <div key={p.id} style={{ marginBottom: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <E value={p.title} onChange={v => setData(d => ({ ...d, projects: d.projects.map(x => x.id === p.id ? { ...x, title: v } : x) }))} editing={editing} style={{ fontSize: 12, fontWeight: 700, color: DARK }} />
                      <E value={p.period} onChange={v => setData(d => ({ ...d, projects: d.projects.map(x => x.id === p.id ? { ...x, period: v } : x) }))} editing={editing} style={{ fontSize: 10, color: A, fontStyle: "italic", flexShrink: 0 }} />
                    </div>
                    {p.bullets.map((b, i) => <div key={i} style={{ fontSize: 11, color: "#78350f", paddingLeft: 10, borderLeft: `2px solid ${A2}66`, marginBottom: 2 }}>{b}</div>)}
                    {editing && <button type="button" onClick={() => setData(d => ({ ...d, projects: d.projects.filter(x => x.id !== p.id) }))} style={{ fontSize: 10, color: "#f87171", background: "none", border: "none", cursor: "pointer", marginTop: 4, display: "flex", alignItems: "center", gap: 3 }}><TrashIcon style={{ width: 10, height: 10 }} />Entfernen</button>}
                  </div>
                )), extra: editing ? <button type="button" onClick={() => setData(d => ({ ...d, projects: [...d.projects, { id: uid(), title: "Projekt", period: "", bullets: [] }] }))} style={{ fontSize: 11, color: A, background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}><PlusIcon style={{ width: 12, height: 12 }} />Hinzufügen</button> : null },
                { title: "Berufserfahrung", items: data.experience.map(ex => (
                  <div key={ex.id} style={{ marginBottom: 12 }}>
                    <E value={ex.position} onChange={v => setData(d => ({ ...d, experience: d.experience.map(x => x.id === ex.id ? { ...x, position: v } : x) }))} editing={editing} style={{ fontSize: 12, fontWeight: 700, color: DARK, display: "block" }} />
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <E value={ex.company} onChange={v => setData(d => ({ ...d, experience: d.experience.map(x => x.id === ex.id ? { ...x, company: v } : x) }))} editing={editing} style={{ fontSize: 11, color: A }} />
                      <E value={ex.period} onChange={v => setData(d => ({ ...d, experience: d.experience.map(x => x.id === ex.id ? { ...x, period: v } : x) }))} editing={editing} style={{ fontSize: 10, color: "#9ca3af", fontStyle: "italic" }} />
                    </div>
                    {ex.bullets.map((b, i) => <div key={i} style={{ fontSize: 11, color: "#78350f", paddingLeft: 10, borderLeft: `2px solid ${A2}44`, marginBottom: 2 }}>{b}</div>)}
                  </div>
                )), extra: null },
                { title: "Ausbildung", items: data.education.map(e => (
                  <div key={e.id} style={{ marginBottom: 10 }}>
                    <E value={e.degree} onChange={v => setData(d => ({ ...d, education: d.education.map(x => x.id === e.id ? { ...x, degree: v } : x) }))} editing={editing} style={{ fontSize: 12, fontWeight: 700, color: DARK, display: "block" }} />
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <E value={e.institution} onChange={v => setData(d => ({ ...d, education: d.education.map(x => x.id === e.id ? { ...x, institution: v } : x) }))} editing={editing} style={{ fontSize: 11, color: A }} />
                      <E value={e.period} onChange={v => setData(d => ({ ...d, education: d.education.map(x => x.id === e.id ? { ...x, period: v } : x) }))} editing={editing} style={{ fontSize: 10, color: "#9ca3af", fontStyle: "italic" }} />
                    </div>
                  </div>
                )), extra: null },
              ].map(sec => (
                <div key={sec.title} style={{ marginBottom: 22 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                    <div style={{ width: 20, height: 3, background: `linear-gradient(90deg, ${A}, ${A2})`, borderRadius: 2 }} />
                    <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase" as const, color: DARK }}>{sec.title}</span>
                    <div style={{ flex: 1, height: 1, backgroundColor: "#fed7aa" }} />
                  </div>
                  {sec.items}
                  {sec.extra}
                </div>
              ))}
            </div>

            {/* Sidebar */}
            <div style={{ width: 240, flexShrink: 0, backgroundColor: S2, padding: "28px 18px 40px", borderLeft: "2px solid #fed7aa" }}>
              {[
                { title: "Skills", content: <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>{data.skills.map((s, i) => <span key={i} style={{ fontSize: 9, backgroundColor: "#fed7aa", color: DARK, borderRadius: 20, padding: "1px 7px" }}>{s}</span>)}</div> },
                { title: "Soft Skills", content: <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>{data.softSkills.map((s, i) => <span key={i} style={{ fontSize: 9, border: `1px solid ${A}`, color: A, borderRadius: 20, padding: "1px 7px" }}>{s}</span>)}</div> },
                { title: "Sprachen", content: <div>{data.languages.map(l => <div key={l.id} style={{ marginBottom: 6 }}><E value={l.language} onChange={v => setData(d => ({ ...d, languages: d.languages.map(x => x.id === l.id ? { ...x, language: v } : x) }))} editing={editing} style={{ fontSize: 11, fontWeight: 700, color: DARK, display: "block" }} /><E value={l.level} onChange={v => setData(d => ({ ...d, languages: d.languages.map(x => x.id === l.id ? { ...x, level: v } : x) }))} editing={editing} style={{ fontSize: 10, color: A, display: "block" }} /></div>)}</div> },
                { title: "Zertifikate", content: <div>{data.certificates.map(c => <div key={c.id} style={{ marginBottom: 6 }}><E value={c.name} onChange={v => setData(d => ({ ...d, certificates: d.certificates.map(x => x.id === c.id ? { ...x, name: v } : x) }))} editing={editing} multiline rows={2} style={{ fontSize: 10, color: "#78350f", display: "block", lineHeight: 1.4 }} /></div>)}</div> },
                { title: "Interessen", content: <div>{data.interests.map((s, i) => <div key={i} style={{ fontSize: 10, color: "#92400e", marginBottom: 3 }}>☀ {s}</div>)}</div> },
              ].map(sec => (
                <div key={sec.title} style={{ marginBottom: 18 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <div style={{ width: 4, height: 14, background: `linear-gradient(180deg,${A},${A2})`, borderRadius: 2 }} />
                    <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase" as const, color: DARK }}>{sec.title}</span>
                  </div>
                  {sec.content}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
