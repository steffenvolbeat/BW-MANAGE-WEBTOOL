"use client";
// ─── CV Template: Forest ─────────────────────────────────────────────────────
// Tiefdunkles Grün links (Sidebar), hellweißes Papier rechts, Natur-Akzente
import { useState, useRef } from "react";
import { PrinterIcon, PencilSquareIcon, CheckIcon, PlusIcon, TrashIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { FONTS, FONT_SIZES, PHOTO_SHAPES, CVData, DEFAULT_CV_DATA, uid } from "./shared";

const A = "#22c55e";
const SIDEBAR = "#14532d";
const SIDEBAR2 = "#166534";
const FNT = "'Nunito','Calibri',sans-serif";

function E({ value, onChange, editing, multiline = false, style = {} as React.CSSProperties, placeholder = "...", rows = 3, dark = false }: {
  value: string; onChange: (v: string) => void; editing: boolean;
  multiline?: boolean; style?: React.CSSProperties; placeholder?: string; rows?: number; dark?: boolean;
}) {
  const base: React.CSSProperties = { ...style, background: dark ? "rgba(34,197,94,0.1)" : "rgba(34,197,94,0.06)", border: `1px dashed ${dark ? "rgba(34,197,94,0.4)" : "rgba(34,197,94,0.3)"}`, borderRadius: 3, padding: "2px 4px", outline: "none", width: "100%", fontFamily: "inherit", fontSize: "inherit", color: "inherit", lineHeight: "inherit", fontWeight: "inherit", boxSizing: "border-box" };
  if (!editing) return <span style={style}>{value || <span style={{ opacity: 0.3, fontStyle: "italic" }}>{placeholder}</span>}</span>;
  if (multiline) return <textarea style={{ ...base, resize: "vertical", display: "block" }} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows} />;
  return <input style={base} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />;
}

function SecH({ title, dark = false }: { title: string; dark?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
      <span style={{ fontSize: 8, color: dark ? A : "#86efac" }}>●●●</span>
      <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase" as const, color: dark ? A : "#86efac" }}>{title}</span>
      <div style={{ flex: 1, height: 1, backgroundColor: dark ? "#d1fae5" : "rgba(134,239,172,0.2)" }} />
    </div>
  );
}

export default function CV_Forest() {
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
    <div style={{ minHeight: "100vh", background: "#f0fdf4", padding: "24px 16px", fontFamily: FNT }}>
      <style>{`
        ${curFont.gf ? `@import url('https://fonts.googleapis.com/css2?family=${curFont.gf}&display=swap');` : ""}
        .fst-doc, .fst-doc * { font-family: ${fnt} !important; }
        @media print {
          @page { size: A4 portrait; margin: 0; }
          body * { visibility: hidden !important; }
          .fst-doc, .fst-doc * { visibility: visible !important; }
          .fst-doc { position: absolute !important; top: 0 !important; left: 0 !important; width: 210mm !important; box-shadow: none !important; margin: 0 !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .fst-zoom { zoom: 1 !important; width: 100% !important; }
          .fst-ctrl { display: none !important; }
        }
      `}</style>

      {/* Controls */}
      <div className="fst-ctrl" style={{ maxWidth: 850, margin: "0 auto 16px", display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button onClick={() => setEditing(e => !e)} style={{ padding: "7px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", border: "none", backgroundColor: editing ? "#16a34a" : SIDEBAR, color: "white", display: "flex", alignItems: "center", gap: 6 }}>
          {editing ? <CheckIcon style={{ width: 16, height: 16 }} /> : <PencilSquareIcon style={{ width: 16, height: 16 }} />}
          {editing ? "Fertig" : "Bearbeiten"}
        </button>
        <button onClick={() => window.print()} style={{ padding: "7px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", border: "none", backgroundColor: "#374151", color: "white", display: "flex", alignItems: "center", gap: 6 }}>
          <PrinterIcon style={{ width: 16, height: 16 }} />Drucken
        </button>
        <button onClick={() => setShowDesign(v => !v)} style={{ padding: "7px 16px", borderRadius: 8, fontSize: 13, cursor: "pointer", border: `1px solid ${showDesign ? A : "#e5e7eb"}`, backgroundColor: showDesign ? "#f0fdf4" : "white", color: showDesign ? A : "#374151" }}>
          🎨 Design
        </button>
        <button onClick={() => { if (window.confirm("Zurücksetzen?")) { setData(JSON.parse(JSON.stringify(DEFAULT_CV_DATA))); } }} style={{ padding: "7px 16px", borderRadius: 8, fontSize: 13, cursor: "pointer", border: "1px solid #e5e7eb", backgroundColor: "white", color: "#374151", display: "flex", alignItems: "center", gap: 6 }}>
          <XMarkIcon style={{ width: 16, height: 16 }} />Reset
        </button>
        {showDesign && (
          <div style={{ width: "100%", background: "white", border: "1px solid #e5e7eb", borderRadius: 10, padding: "14px 18px", display: "flex", gap: 24, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", marginBottom: 7, letterSpacing: "0.1em", textTransform: "uppercase" }}>Schriftart</div>
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                {FONTS.map(f => <button key={f.key} onClick={() => setFontKey(f.key)} style={{ padding: "3px 9px", borderRadius: 5, border: `1px solid ${fontKey === f.key ? A : "#e5e7eb"}`, background: fontKey === f.key ? "#f0fdf4" : "white", color: fontKey === f.key ? A : "#374151", fontSize: 11, cursor: "pointer", fontFamily: f.family }}>{f.label}</button>)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", marginBottom: 7, letterSpacing: "0.1em", textTransform: "uppercase" }}>Schriftgröße</div>
              <div style={{ display: "flex", gap: 5 }}>
                {FONT_SIZES.map(s => <button key={s.key} onClick={() => setSizeKey(s.key)} style={{ padding: "3px 12px", borderRadius: 5, border: `1px solid ${sizeKey === s.key ? A : "#e5e7eb"}`, background: sizeKey === s.key ? "#f0fdf4" : "white", color: sizeKey === s.key ? A : "#374151", fontSize: 11, cursor: "pointer" }}>{s.label}</button>)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", marginBottom: 7, letterSpacing: "0.1em", textTransform: "uppercase" }}>Foto-Form</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {PHOTO_SHAPES.map(s => <button key={s.key} onClick={() => setPhotoShapeKey(s.key)} title={s.label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "5px 7px", borderRadius: 7, border: `2px solid ${photoShapeKey === s.key ? A : "#e5e7eb"}`, background: photoShapeKey === s.key ? "#f0fdf4" : "white", cursor: "pointer" }}>
                  <div style={{ width: 20, height: s.key === "ellipse" ? 26 : 20, borderRadius: s.br, clipPath: s.clip ?? "", backgroundColor: photoShapeKey === s.key ? A : "#d1d5db" }} />
                  <span style={{ fontSize: 8, color: photoShapeKey === s.key ? A : "#9ca3af", whiteSpace: "nowrap" }}>{s.label}</span>
                </button>)}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Document */}
      <div className="fst-doc" style={{ width: 850, margin: "0 auto", backgroundColor: "white", boxShadow: "0 8px 40px rgba(20,83,45,0.2)", overflow: "hidden", fontFamily: fnt, display: "flex" }}>
        <div className="fst-zoom" style={{ width: Math.round(850 / scale), zoom: scale, display: "flex", flex: 1 }}>

          {/* Left sidebar */}
          <div style={{ width: 270, flexShrink: 0, backgroundColor: SIDEBAR, padding: "0 0 40px", display: "flex", flexDirection: "column" }}>
            {/* Photo area */}
            <div style={{ backgroundColor: SIDEBAR2, padding: "32px 24px 24px", textAlign: "center" }}>
              <div style={{ margin: "0 auto 16px", width: curShape.w, height: curShape.h, borderRadius: curShape.br, clipPath: curShape.clip ?? "", overflow: "hidden", backgroundColor: "rgba(34,197,94,0.2)", border: `3px solid ${A}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: editing ? "pointer" : "default", boxShadow: curShape.shadow ?? "" }} onClick={() => editing && photoInputRef.current?.click()}>
                {photoSrc ? <img src={photoSrc} alt="Foto" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: 10, color: "rgba(134,239,172,0.5)", textAlign: "center" }}>{editing ? "📷" : "Foto"}</span>}
                <input ref={photoInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => { const f = e.target.files?.[0]; if (!f) return; const r = new FileReader(); r.onload = ev => setPhotoSrc((ev.target?.result as string) ?? ""); r.readAsDataURL(f); }} />
              </div>
              {editing
                ? <input value={data.personal.name} onChange={e => setPersonal({ name: e.target.value })} style={{ display: "block", textAlign: "center", fontSize: 20, fontWeight: 800, color: "white", fontFamily: fnt, background: "rgba(34,197,94,0.15)", border: "1px dashed rgba(34,197,94,0.4)", borderRadius: 3, padding: "2px 4px", outline: "none", width: "100%", boxSizing: "border-box", marginBottom: 4 }} />
                : <div style={{ fontSize: 20, fontWeight: 800, color: "white", marginBottom: 4, lineHeight: 1.2 }}>{data.personal.name}</div>
              }
              {editing
                ? <input value={data.personal.subtitle} onChange={e => setPersonal({ subtitle: e.target.value })} style={{ display: "block", textAlign: "center", fontSize: 11, color: A, fontFamily: fnt, background: "rgba(34,197,94,0.15)", border: "1px dashed rgba(34,197,94,0.4)", borderRadius: 3, padding: "2px 4px", outline: "none", width: "100%", boxSizing: "border-box" }} />
                : <div style={{ fontSize: 11, color: A, fontWeight: 500 }}>{data.personal.subtitle}</div>
              }
            </div>

            <div style={{ padding: "20px 20px 0", flex: 1 }}>
              <div style={{ marginBottom: 18 }}>
                <SecH title="Kontakt" dark={false} />
                {[
                  { v: data.personal.email }, { v: data.personal.phone },
                  { v: data.personal.location }, { v: data.personal.github }, { v: data.personal.linkedin }
                ].map(({ v }, i) => <div key={i} style={{ fontSize: 10, color: "#d1fae5", marginBottom: 4, wordBreak: "break-all" }}>{v}</div>)}
              </div>
              <div style={{ marginBottom: 18 }}>
                <SecH title="Skills" dark={false} />
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {data.skills.map((s, i) => <span key={i} style={{ fontSize: 9, backgroundColor: "rgba(34,197,94,0.15)", border: `1px solid rgba(34,197,94,0.3)`, color: "#86efac", borderRadius: 3, padding: "1px 6px" }}>{s}</span>)}
                </div>
              </div>
              <div style={{ marginBottom: 18 }}>
                <SecH title="Sprachen" dark={false} />
                {data.languages.map(l => <div key={l.id} style={{ marginBottom: 6 }}>
                  <E value={l.language} onChange={v => setData(d => ({ ...d, languages: d.languages.map(x => x.id === l.id ? { ...x, language: v } : x) }))} editing={editing} dark style={{ fontSize: 11, fontWeight: 700, color: "white", display: "block" }} />
                  <E value={l.level} onChange={v => setData(d => ({ ...d, languages: d.languages.map(x => x.id === l.id ? { ...x, level: v } : x) }))} editing={editing} dark style={{ fontSize: 10, color: A, display: "block" }} />
                </div>)}
              </div>
              <div>
                <SecH title="Interessen" dark={false} />
                {data.interests.map((s, i) => <div key={i} style={{ fontSize: 10, color: "#86efac", marginBottom: 3 }}>🌿 {s}</div>)}
              </div>
            </div>
          </div>

          {/* Right main */}
          <div style={{ flex: 1, padding: "32px 32px 40px", minWidth: 0 }}>
            {/* Bio */}
            <div style={{ marginBottom: 22, padding: "14px 16px", backgroundColor: "#f0fdf4", borderRadius: 8, borderLeft: `4px solid ${A}` }}>
              <E value={data.personal.bio} onChange={v => setPersonal({ bio: v })} editing={editing} multiline rows={3} style={{ fontSize: 11, color: "#374151", lineHeight: 1.6 }} />
            </div>

            <div style={{ marginBottom: 22 }}>
              <SecH title="Projekte" dark />
              {data.projects.map(p => (
                <div key={p.id} style={{ marginBottom: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                    <E value={p.title} onChange={v => setData(d => ({ ...d, projects: d.projects.map(x => x.id === p.id ? { ...x, title: v } : x) }))} editing={editing} style={{ fontSize: 12, fontWeight: 700, color: SIDEBAR }} />
                    <E value={p.period} onChange={v => setData(d => ({ ...d, projects: d.projects.map(x => x.id === p.id ? { ...x, period: v } : x) }))} editing={editing} style={{ fontSize: 10, color: A, fontStyle: "italic", flexShrink: 0 }} />
                  </div>
                  {p.bullets.map((b, i) => <div key={i} style={{ fontSize: 11, color: "#6b7280", paddingLeft: 10, borderLeft: `2px solid ${A}55`, marginBottom: 2, lineHeight: 1.5 }}>● {b}</div>)}
                  {editing && <button type="button" onClick={() => setData(d => ({ ...d, projects: d.projects.filter(x => x.id !== p.id) }))} style={{ fontSize: 10, color: "#f87171", background: "none", border: "none", cursor: "pointer", marginTop: 4, display: "flex", alignItems: "center", gap: 3 }}><TrashIcon style={{ width: 10, height: 10 }} />Entfernen</button>}
                </div>
              ))}
              {editing && <button type="button" onClick={() => setData(d => ({ ...d, projects: [...d.projects, { id: uid(), title: "Projekt", period: "", bullets: [] }] }))} style={{ fontSize: 11, color: A, background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}><PlusIcon style={{ width: 12, height: 12 }} />Hinzufügen</button>}
            </div>

            <div style={{ marginBottom: 22 }}>
              <SecH title="Berufserfahrung" dark />
              {data.experience.map(ex => (
                <div key={ex.id} style={{ marginBottom: 14 }}>
                  <E value={ex.position} onChange={v => setData(d => ({ ...d, experience: d.experience.map(x => x.id === ex.id ? { ...x, position: v } : x) }))} editing={editing} style={{ fontSize: 12, fontWeight: 700, color: SIDEBAR, display: "block" }} />
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <E value={ex.company} onChange={v => setData(d => ({ ...d, experience: d.experience.map(x => x.id === ex.id ? { ...x, company: v } : x) }))} editing={editing} style={{ fontSize: 11, color: A }} />
                    <E value={ex.period} onChange={v => setData(d => ({ ...d, experience: d.experience.map(x => x.id === ex.id ? { ...x, period: v } : x) }))} editing={editing} style={{ fontSize: 10, color: "#9ca3af", fontStyle: "italic" }} />
                  </div>
                  {ex.bullets.map((b, i) => <div key={i} style={{ fontSize: 11, color: "#6b7280", paddingLeft: 10, borderLeft: `2px solid ${A}44`, marginBottom: 2 }}>● {b}</div>)}
                </div>
              ))}
            </div>

            <div>
              <SecH title="Ausbildung" dark />
              {data.education.map(e => (
                <div key={e.id} style={{ marginBottom: 12 }}>
                  <E value={e.degree} onChange={v => setData(d => ({ ...d, education: d.education.map(x => x.id === e.id ? { ...x, degree: v } : x) }))} editing={editing} style={{ fontSize: 12, fontWeight: 700, color: SIDEBAR, display: "block" }} />
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <E value={e.institution} onChange={v => setData(d => ({ ...d, education: d.education.map(x => x.id === e.id ? { ...x, institution: v } : x) }))} editing={editing} style={{ fontSize: 11, color: A }} />
                    <E value={e.period} onChange={v => setData(d => ({ ...d, education: d.education.map(x => x.id === e.id ? { ...x, period: v } : x) }))} editing={editing} style={{ fontSize: 10, color: "#9ca3af", fontStyle: "italic" }} />
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 20 }}>
              <SecH title="Soft Skills" dark />
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                {data.softSkills.map((s, i) => <span key={i} style={{ border: `1px solid ${A}`, color: SIDEBAR, backgroundColor: "#dcfce7", borderRadius: 4, padding: "2px 8px", fontSize: 10 }}>{s}</span>)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
