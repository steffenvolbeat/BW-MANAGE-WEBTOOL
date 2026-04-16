"use client";
// ─── CV Template: Matrix ──────────────────────────────────────────────────────
// Neon-Grün auf Schwarz, Hacker/Tech-Ästhetik, Monospace-Feeling
import { useState, useRef } from "react";
import { PrinterIcon, PencilSquareIcon, CheckIcon, PlusIcon, TrashIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { FONTS, FONT_SIZES, PHOTO_SHAPES, CVData, DEFAULT_CV_DATA, uid } from "./shared";

const A = "#4ade80";
const A2 = "#86efac";
const BG = "#052e16";
const S2 = "#0a1a0a";
const S3 = "#14532d";
const FNT = "'Nunito','Calibri',sans-serif";

function E({ value, onChange, editing, multiline = false, style = {} as React.CSSProperties, placeholder = "...", rows = 3 }: {
  value: string; onChange: (v: string) => void; editing: boolean;
  multiline?: boolean; style?: React.CSSProperties; placeholder?: string; rows?: number;
}) {
  const base: React.CSSProperties = { ...style, background: "rgba(74,222,128,0.07)", border: "1px dashed rgba(74,222,128,0.4)", borderRadius: 3, padding: "2px 4px", outline: "none", width: "100%", fontFamily: "inherit", fontSize: "inherit", color: "inherit", lineHeight: "inherit", fontWeight: "inherit", boxSizing: "border-box" };
  if (!editing) return <span style={style}>{value || <span style={{ opacity: 0.3, fontStyle: "italic" }}>{placeholder}</span>}</span>;
  if (multiline) return <textarea style={{ ...base, resize: "vertical", display: "block" }} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows} />;
  return <input style={base} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />;
}

export default function CV_Matrix() {
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
    <div style={{ minHeight: "100vh", background: "#000", padding: "24px 16px", fontFamily: FNT }}>
      <style>{`
        ${curFont.gf ? `@import url('https://fonts.googleapis.com/css2?family=${curFont.gf}&display=swap');` : ""}
        .mat-doc, .mat-doc * { font-family: ${fnt} !important; }
        @media print {
          @page { size: A4 portrait; margin: 0; }
          body * { visibility: hidden !important; }
          .mat-doc, .mat-doc * { visibility: visible !important; }
          .mat-doc { position: absolute !important; top: 0 !important; left: 0 !important; width: 210mm !important; box-shadow: none !important; margin: 0 !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .mat-zoom { zoom: 1 !important; width: 100% !important; }
          .mat-ctrl { display: none !important; }
        }
      `}</style>

      {/* Controls */}
      <div className="mat-ctrl" style={{ maxWidth: 850, margin: "0 auto 16px", display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button onClick={() => setEditing(e => !e)} style={{ padding: "7px 16px", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer", border: `1px solid ${A}`, backgroundColor: editing ? A : "transparent", color: editing ? "#000" : A, display: "flex", alignItems: "center", gap: 6, fontFamily: "monospace" }}>
          {editing ? <CheckIcon style={{ width: 16, height: 16 }} /> : <PencilSquareIcon style={{ width: 16, height: 16 }} />}
          {editing ? "[FERTIG]" : "[BEARBEITEN]"}
        </button>
        <button onClick={() => window.print()} style={{ padding: "7px 16px", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer", border: "1px solid #374151", backgroundColor: "transparent", color: "#9ca3af", display: "flex", alignItems: "center", gap: 6, fontFamily: "monospace" }}>
          <PrinterIcon style={{ width: 16, height: 16 }} />[DRUCKEN]
        </button>
        <button onClick={() => setShowDesign(v => !v)} style={{ padding: "7px 16px", borderRadius: 6, fontSize: 13, cursor: "pointer", border: `1px solid ${showDesign ? A : "#374151"}`, backgroundColor: "transparent", color: showDesign ? A : "#6b7280", fontFamily: "monospace" }}>
          [DESIGN]
        </button>
        <button onClick={() => { if (window.confirm("Zurücksetzen?")) { setData(JSON.parse(JSON.stringify(DEFAULT_CV_DATA))); } }} style={{ padding: "7px 16px", borderRadius: 6, fontSize: 13, cursor: "pointer", border: "1px solid #374151", backgroundColor: "transparent", color: "#6b7280", display: "flex", alignItems: "center", gap: 6, fontFamily: "monospace" }}>
          <XMarkIcon style={{ width: 16, height: 16 }} />[RESET]
        </button>
        {showDesign && (
          <div style={{ width: "100%", background: S2, border: `1px solid ${S3}`, borderRadius: 8, padding: "14px 18px", display: "flex", gap: 24, flexWrap: "wrap" }}>
            <div><div style={{ fontSize: 10, fontWeight: 700, color: "#4b5563", marginBottom: 7, letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "monospace" }}>// SCHRIFT</div>
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>{FONTS.map(f => <button key={f.key} onClick={() => setFontKey(f.key)} style={{ padding: "3px 9px", borderRadius: 4, border: `1px solid ${fontKey === f.key ? A : "#374151"}`, background: fontKey === f.key ? "rgba(74,222,128,0.1)" : "transparent", color: fontKey === f.key ? A : "#6b7280", fontSize: 11, cursor: "pointer", fontFamily: f.family }}>{f.label}</button>)}</div>
            </div>
            <div><div style={{ fontSize: 10, fontWeight: 700, color: "#4b5563", marginBottom: 7, letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "monospace" }}>// GRÖSSE</div>
              <div style={{ display: "flex", gap: 5 }}>{FONT_SIZES.map(s => <button key={s.key} onClick={() => setSizeKey(s.key)} style={{ padding: "3px 12px", borderRadius: 4, border: `1px solid ${sizeKey === s.key ? A : "#374151"}`, background: sizeKey === s.key ? "rgba(74,222,128,0.1)" : "transparent", color: sizeKey === s.key ? A : "#6b7280", fontSize: 11, cursor: "pointer", fontFamily: "monospace" }}>{s.label}</button>)}</div>
            </div>
            <div><div style={{ fontSize: 10, fontWeight: 700, color: "#4b5563", marginBottom: 7, letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "monospace" }}>// FOTO-FORM</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{PHOTO_SHAPES.map(s => <button key={s.key} onClick={() => setPhotoShapeKey(s.key)} title={s.label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "5px 7px", borderRadius: 6, border: `2px solid ${photoShapeKey === s.key ? A : "#374151"}`, background: photoShapeKey === s.key ? "rgba(74,222,128,0.1)" : "transparent", cursor: "pointer" }}>
                <div style={{ width: 20, height: s.key === "ellipse" ? 26 : 20, borderRadius: s.br, clipPath: s.clip ?? "", backgroundColor: photoShapeKey === s.key ? A : "#374151" }} />
                <span style={{ fontSize: 8, color: photoShapeKey === s.key ? A : "#4b5563", whiteSpace: "nowrap" }}>{s.label}</span>
              </button>)}</div>
            </div>
          </div>
        )}
      </div>

      {/* Document */}
      <div className="mat-doc" style={{ width: 850, margin: "0 auto", backgroundColor: BG, boxShadow: `0 0 80px rgba(74,222,128,0.15), 0 0 2px ${A}44`, overflow: "hidden", fontFamily: fnt }}>
        <div className="mat-zoom" style={{ width: Math.round(850 / scale), zoom: scale }}>
          {/* Scan-line top bar */}
          <div style={{ height: 2, background: `linear-gradient(90deg, transparent, ${A}, transparent)` }} />

          {/* Header */}
          <div style={{ backgroundColor: S2, padding: "28px 40px 22px", borderBottom: `1px solid ${S3}`, position: "relative", overflow: "hidden" }}>
            {/* Corner decoration */}
            <div style={{ position: "absolute", top: 8, right: 24, fontSize: 10, color: `${A}44`, letterSpacing: "0.08em", fontFamily: "monospace" }}>01001000 01000101 01001100 01001100 01001111</div>
            <div style={{ display: "flex", gap: 22, alignItems: "center", position: "relative", zIndex: 1 }}>
              <div style={{ width: curShape.w, height: curShape.h, borderRadius: curShape.br, clipPath: curShape.clip ?? "", overflow: "hidden", flexShrink: 0, backgroundColor: S3, border: `2px solid ${A}66`, display: "flex", alignItems: "center", justifyContent: "center", cursor: editing ? "pointer" : "default", boxShadow: curShape.shadow ?? `0 0 16px ${A}44` }} onClick={() => editing && photoInputRef.current?.click()}>
                {photoSrc ? <img src={photoSrc} alt="Foto" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: 10, color: `${A}66` }}>{editing ? "📷" : "[FOTO]"}</span>}
                <input ref={photoInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => { const f = e.target.files?.[0]; if (!f) return; const r = new FileReader(); r.onload = ev => setPhotoSrc((ev.target?.result as string) ?? ""); r.readAsDataURL(f); }} />
              </div>
              <div style={{ flex: 1 }}>
                <E value={data.personal.name} onChange={v => setPersonal({ name: v })} editing={editing} style={{ fontSize: 38, fontWeight: 900, color: A, lineHeight: 1.1, display: "block", marginBottom: 4, textShadow: `0 0 20px ${A}66` }} />
                <div style={{ height: 1, background: `linear-gradient(90deg,${A}44,transparent)`, marginBottom: 6 }} />
                <E value={data.personal.subtitle} onChange={v => setPersonal({ subtitle: v })} editing={editing} style={{ fontSize: 11, color: A2, letterSpacing: "0.12em", display: "block", marginBottom: 10 }} />
                <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                  {[data.personal.email, data.personal.phone, data.personal.location, data.personal.github].map((v, i) => <span key={i} style={{ fontSize: 10, color: "#6b7280", fontFamily: "monospace" }}>{v}</span>)}
                </div>
              </div>
            </div>
          </div>

          {/* Body */}
          <div style={{ display: "flex" }}>
            <div style={{ flex: 1, padding: "24px 20px 40px 32px", minWidth: 0 }}>
              <E value={data.personal.bio} onChange={v => setPersonal({ bio: v })} editing={editing} multiline rows={3} style={{ fontSize: 11, color: "#86efac", lineHeight: 1.7, display: "block", marginBottom: 22, padding: "10px 14px", background: "rgba(74,222,128,0.05)", borderRadius: 4, borderLeft: `3px solid ${A}`, borderRight: `1px solid ${S3}` }} />

              {[
                { title: "PROJEKTE", content: data.projects.map(p => (
                  <div key={p.id} style={{ marginBottom: 14 }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <E value={p.title} onChange={v => setData(d => ({ ...d, projects: d.projects.map(x => x.id === p.id ? { ...x, title: v } : x) }))} editing={editing} style={{ fontSize: 12, fontWeight: 700, color: A }} />
                      <E value={p.period} onChange={v => setData(d => ({ ...d, projects: d.projects.map(x => x.id === p.id ? { ...x, period: v } : x) }))} editing={editing} style={{ fontSize: 10, color: "#6b7280", fontFamily: "monospace", flexShrink: 0 }} />
                    </div>
                    {p.bullets.map((b, i) => <div key={i} style={{ fontSize: 11, color: A2, paddingLeft: 12, marginBottom: 2 }}>▸ {b}</div>)}
                    {editing && <button type="button" onClick={() => setData(d => ({ ...d, projects: d.projects.filter(x => x.id !== p.id) }))} style={{ fontSize: 10, color: "#f87171", background: "none", border: "none", cursor: "pointer", marginTop: 4, display: "flex", alignItems: "center", gap: 3 }}><TrashIcon style={{ width: 10, height: 10 }} />del</button>}
                  </div>
                )), extra: editing ? <button type="button" onClick={() => setData(d => ({ ...d, projects: [...d.projects, { id: uid(), title: "Projekt", period: "", bullets: [] }] }))} style={{ fontSize: 11, color: A, background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontFamily: "monospace" }}><PlusIcon style={{ width: 12, height: 12 }} />+ push()</button> : null },
                { title: "ERFAHRUNG", content: data.experience.map(ex => (
                  <div key={ex.id} style={{ marginBottom: 14 }}>
                    <E value={ex.position} onChange={v => setData(d => ({ ...d, experience: d.experience.map(x => x.id === ex.id ? { ...x, position: v } : x) }))} editing={editing} style={{ fontSize: 12, fontWeight: 700, color: A, display: "block" }} />
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <E value={ex.company} onChange={v => setData(d => ({ ...d, experience: d.experience.map(x => x.id === ex.id ? { ...x, company: v } : x) }))} editing={editing} style={{ fontSize: 11, color: "#4ade8088" }} />
                      <E value={ex.period} onChange={v => setData(d => ({ ...d, experience: d.experience.map(x => x.id === ex.id ? { ...x, period: v } : x) }))} editing={editing} style={{ fontSize: 10, color: "#6b7280", fontFamily: "monospace" }} />
                    </div>
                    {ex.bullets.map((b, i) => <div key={i} style={{ fontSize: 11, color: A2, paddingLeft: 12, marginBottom: 2 }}>▸ {b}</div>)}
                  </div>
                )), extra: null },
                { title: "AUSBILDUNG", content: data.education.map(e => (
                  <div key={e.id} style={{ marginBottom: 10 }}>
                    <E value={e.degree} onChange={v => setData(d => ({ ...d, education: d.education.map(x => x.id === e.id ? { ...x, degree: v } : x) }))} editing={editing} style={{ fontSize: 12, fontWeight: 700, color: A, display: "block" }} />
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <E value={e.institution} onChange={v => setData(d => ({ ...d, education: d.education.map(x => x.id === e.id ? { ...x, institution: v } : x) }))} editing={editing} style={{ fontSize: 11, color: "#4ade8088" }} />
                      <E value={e.period} onChange={v => setData(d => ({ ...d, education: d.education.map(x => x.id === e.id ? { ...x, period: v } : x) }))} editing={editing} style={{ fontSize: 10, color: "#6b7280", fontFamily: "monospace" }} />
                    </div>
                  </div>
                )), extra: null },
              ].map(sec => (
                <div key={sec.title} style={{ marginBottom: 22 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                    <span style={{ color: A, fontFamily: "monospace", fontSize: 10 }}>&gt;_</span>
                    <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.18em", color: A, fontFamily: "monospace" }}>{sec.title}</span>
                    <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg,${A}55,transparent)` }} />
                  </div>
                  {sec.content}
                  {sec.extra}
                </div>
              ))}
            </div>

            {/* Sidebar */}
            <div style={{ width: 230, flexShrink: 0, backgroundColor: S2, padding: "24px 16px 40px", borderLeft: `1px solid ${S3}` }}>
              {[
                { title: "SKILLS", content: <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>{data.skills.map((s, i) => <span key={i} style={{ fontSize: 9, border: `1px solid ${A}44`, color: A2, borderRadius: 3, padding: "1px 6px", fontFamily: "monospace" }}>{s}</span>)}</div> },
                { title: "SOFT SKILLS", content: <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>{data.softSkills.map((s, i) => <span key={i} style={{ fontSize: 9, border: `1px solid ${A}22`, color: "#6b7280", borderRadius: 3, padding: "1px 6px" }}>{s}</span>)}</div> },
                { title: "SPRACHEN", content: <div>{data.languages.map(l => <div key={l.id} style={{ marginBottom: 6 }}><E value={l.language} onChange={v => setData(d => ({ ...d, languages: d.languages.map(x => x.id === l.id ? { ...x, language: v } : x) }))} editing={editing} style={{ fontSize: 11, fontWeight: 700, color: A, display: "block" }} /><E value={l.level} onChange={v => setData(d => ({ ...d, languages: d.languages.map(x => x.id === l.id ? { ...x, level: v } : x) }))} editing={editing} style={{ fontSize: 10, color: "#6b7280", display: "block" }} /></div>)}</div> },
                { title: "ZERTIFIKATE", content: <div>{data.certificates.map(c => <div key={c.id} style={{ marginBottom: 6 }}><E value={c.name} onChange={v => setData(d => ({ ...d, certificates: d.certificates.map(x => x.id === c.id ? { ...x, name: v } : x) }))} editing={editing} multiline rows={2} style={{ fontSize: 10, color: "#6b7280", display: "block", lineHeight: 1.4 }} /></div>)}</div> },
                { title: "INTERESSEN", content: <div>{data.interests.map((s, i) => <div key={i} style={{ fontSize: 10, color: "#6b7280", marginBottom: 3, fontFamily: "monospace" }}>// {s}</div>)}</div> },
              ].map(sec => (
                <div key={sec.title} style={{ marginBottom: 18 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8, paddingBottom: 4, borderBottom: `1px solid ${S3}` }}>
                    <span style={{ color: A, fontSize: 9, fontFamily: "monospace" }}>#</span>
                    <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.16em", color: `${A}aa`, fontFamily: "monospace" }}>{sec.title}</span>
                  </div>
                  {sec.content}
                </div>
              ))}
            </div>
          </div>
          <div style={{ height: 2, background: `linear-gradient(90deg, transparent, ${A}, transparent)` }} />
        </div>
      </div>
    </div>
  );
}
