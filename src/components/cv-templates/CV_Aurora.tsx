"use client";
// ─── CV Template: Aurora ──────────────────────────────────────────────────────
// Großer Lila→Pink Gradient-Header, weißes Papier, kompaktes 3-Spalten-Layout
import { useState, useRef } from "react";
import { PrinterIcon, PencilSquareIcon, CheckIcon, PlusIcon, TrashIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { FONTS, FONT_SIZES, PHOTO_SHAPES, CVData, DEFAULT_CV_DATA, uid } from "./shared";

const A1 = "#a855f7";
const A2 = "#ec4899";
const BG_HEADER = "linear-gradient(135deg,#1e1b4b 0%,#6d28d9 45%,#be185d 100%)";
const FNT = "'Nunito','Calibri',sans-serif";

function E({ value, onChange, editing, multiline = false, style = {} as React.CSSProperties, placeholder = "...", rows = 3 }: {
  value: string; onChange: (v: string) => void; editing: boolean;
  multiline?: boolean; style?: React.CSSProperties; placeholder?: string; rows?: number;
}) {
  const base: React.CSSProperties = { ...style, background: "rgba(168,85,247,0.08)", border: "1px dashed rgba(168,85,247,0.5)", borderRadius: 3, padding: "2px 4px", outline: "none", width: "100%", fontFamily: "inherit", fontSize: "inherit", color: "inherit", lineHeight: "inherit", fontWeight: "inherit", boxSizing: "border-box" };
  if (!editing) return <span style={style}>{value || <span style={{ opacity: 0.3, fontStyle: "italic" }}>{placeholder}</span>}</span>;
  if (multiline) return <textarea style={{ ...base, resize: "vertical", display: "block" }} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows} />;
  return <input style={base} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />;
}

function SecH({ title }: { title: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
      <div style={{ width: 14, height: 14, borderRadius: "50%", background: BG_HEADER, flexShrink: 0 }} />
      <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase" as const, background: BG_HEADER, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{title}</span>
      <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg,#a855f7,transparent)" }} />
    </div>
  );
}

export default function CV_Aurora() {
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
    <div style={{ minHeight: "100vh", background: "#f5f3ff", padding: "24px 16px", fontFamily: FNT }}>
      <style>{`
        ${curFont.gf ? `@import url('https://fonts.googleapis.com/css2?family=${curFont.gf}&display=swap');` : ""}
        .aur-doc, .aur-doc * { font-family: ${fnt} !important; }
        @media print {
          @page { size: A4 portrait; margin: 0; }
          body * { visibility: hidden !important; }
          .aur-doc, .aur-doc * { visibility: visible !important; }
          .aur-doc { position: absolute !important; top: 0 !important; left: 0 !important; width: 210mm !important; box-shadow: none !important; margin: 0 !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .aur-zoom { zoom: 1 !important; width: 100% !important; }
          .aur-ctrl { display: none !important; }
        }
      `}</style>

      {/* Controls */}
      <div className="aur-ctrl" style={{ maxWidth: 850, margin: "0 auto 16px", display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button onClick={() => setEditing(e => !e)} style={{ padding: "7px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", border: "none", background: editing ? "#16a34a" : BG_HEADER, color: "white", display: "flex", alignItems: "center", gap: 6 }}>
          {editing ? <CheckIcon style={{ width: 16, height: 16 }} /> : <PencilSquareIcon style={{ width: 16, height: 16 }} />}
          {editing ? "Fertig" : "Bearbeiten"}
        </button>
        <button onClick={() => window.print()} style={{ padding: "7px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", border: "none", backgroundColor: "#374151", color: "white", display: "flex", alignItems: "center", gap: 6 }}>
          <PrinterIcon style={{ width: 16, height: 16 }} />Drucken
        </button>
        <button onClick={() => setShowDesign(v => !v)} style={{ padding: "7px 16px", borderRadius: 8, fontSize: 13, cursor: "pointer", border: `1px solid ${showDesign ? A1 : "#e5e7eb"}`, backgroundColor: showDesign ? "#f5f3ff" : "white", color: showDesign ? A1 : "#374151" }}>
          🎨 Design
        </button>
        <button onClick={() => { if (window.confirm("Zurücksetzen?")) { setData(JSON.parse(JSON.stringify(DEFAULT_CV_DATA))); setFontKey("nunito"); setSizeKey("md"); setPhotoShapeKey("circle"); setShowDesign(false); } }} style={{ padding: "7px 16px", borderRadius: 8, fontSize: 13, cursor: "pointer", border: "1px solid #e5e7eb", backgroundColor: "white", color: "#374151", display: "flex", alignItems: "center", gap: 6 }}>
          <XMarkIcon style={{ width: 16, height: 16 }} />Reset
        </button>
        {showDesign && (
          <div style={{ width: "100%", background: "white", border: "1px solid #e5e7eb", borderRadius: 10, padding: "14px 18px", display: "flex", gap: 24, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", marginBottom: 7, letterSpacing: "0.1em", textTransform: "uppercase" }}>Schriftart</div>
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                {FONTS.map(f => <button key={f.key} onClick={() => setFontKey(f.key)} style={{ padding: "3px 9px", borderRadius: 5, border: `1px solid ${fontKey === f.key ? A1 : "#e5e7eb"}`, background: fontKey === f.key ? "#f5f3ff" : "white", color: fontKey === f.key ? A1 : "#374151", fontSize: 11, cursor: "pointer", fontFamily: f.family }}>{f.label}</button>)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", marginBottom: 7, letterSpacing: "0.1em", textTransform: "uppercase" }}>Schriftgröße</div>
              <div style={{ display: "flex", gap: 5 }}>
                {FONT_SIZES.map(s => <button key={s.key} onClick={() => setSizeKey(s.key)} style={{ padding: "3px 12px", borderRadius: 5, border: `1px solid ${sizeKey === s.key ? A1 : "#e5e7eb"}`, background: sizeKey === s.key ? "#f5f3ff" : "white", color: sizeKey === s.key ? A1 : "#374151", fontSize: 11, cursor: "pointer" }}>{s.label}</button>)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", marginBottom: 7, letterSpacing: "0.1em", textTransform: "uppercase" }}>Foto-Form</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {PHOTO_SHAPES.map(s => <button key={s.key} onClick={() => setPhotoShapeKey(s.key)} title={s.label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "5px 7px", borderRadius: 7, border: `2px solid ${photoShapeKey === s.key ? A1 : "#e5e7eb"}`, background: photoShapeKey === s.key ? "#f5f3ff" : "white", cursor: "pointer" }}>
                  <div style={{ width: 20, height: s.key === "ellipse" ? 26 : 20, borderRadius: s.br, clipPath: s.clip ?? "", background: photoShapeKey === s.key ? BG_HEADER : "#d1d5db" }} />
                  <span style={{ fontSize: 8, color: photoShapeKey === s.key ? A1 : "#9ca3af", whiteSpace: "nowrap" }}>{s.label}</span>
                </button>)}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Document */}
      <div className="aur-doc" style={{ width: 850, margin: "0 auto", backgroundColor: "white", boxShadow: "0 8px 40px rgba(168,85,247,0.2)", overflow: "hidden", fontFamily: fnt }}>
        <div className="aur-zoom" style={{ width: Math.round(850 / scale), zoom: scale }}>

          {/* Gradient header */}
          <div style={{ background: BG_HEADER, padding: "32px 40px 40px", position: "relative" }}>
            {/* Decorative circles */}
            <div style={{ position: "absolute", top: -30, right: -30, width: 150, height: 150, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />
            <div style={{ position: "absolute", bottom: -50, left: 60, width: 200, height: 200, borderRadius: "50%", background: "rgba(255,255,255,0.04)" }} />

            <div style={{ display: "flex", gap: 24, alignItems: "flex-end", position: "relative", zIndex: 1 }}>
              {/* Photo */}
              <div style={{ width: curShape.w, height: curShape.h, borderRadius: curShape.br, clipPath: curShape.clip ?? "", overflow: "hidden", flexShrink: 0, backgroundColor: "rgba(255,255,255,0.15)", border: "3px solid rgba(255,255,255,0.6)", display: "flex", alignItems: "center", justifyContent: "center", cursor: editing ? "pointer" : "default", boxShadow: curShape.shadow ?? "" }} onClick={() => editing && photoInputRef.current?.click()}>
                {photoSrc ? <img src={photoSrc} alt="Foto" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", textAlign: "center" }}>{editing ? "📷" : "Foto"}</span>}
                <input ref={photoInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => { const f = e.target.files?.[0]; if (!f) return; const r = new FileReader(); r.onload = ev => setPhotoSrc((ev.target?.result as string) ?? ""); r.readAsDataURL(f); }} />
              </div>
              <div style={{ flex: 1 }}>
                {editing
                  ? <input value={data.personal.name} onChange={e => setPersonal({ name: e.target.value })} style={{ display: "block", fontSize: 40, fontWeight: 900, color: "white", lineHeight: 1.1, marginBottom: 4, fontFamily: fnt, background: "rgba(255,255,255,0.1)", border: "1px dashed rgba(255,255,255,0.4)", borderRadius: 3, padding: "2px 6px", outline: "none", width: "100%", boxSizing: "border-box" }} />
                  : <div style={{ fontSize: 40, fontWeight: 900, color: "white", lineHeight: 1.1, marginBottom: 4 }}>{data.personal.name}</div>
                }
                {editing
                  ? <input value={data.personal.subtitle} onChange={e => setPersonal({ subtitle: e.target.value })} style={{ display: "block", fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.8)", marginBottom: 10, fontFamily: fnt, background: "rgba(255,255,255,0.1)", border: "1px dashed rgba(255,255,255,0.4)", borderRadius: 3, padding: "2px 6px", outline: "none", width: "100%", boxSizing: "border-box" }} />
                  : <div style={{ fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.85)", marginBottom: 10 }}>{data.personal.subtitle}</div>
                }
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {[data.personal.email, data.personal.phone, data.personal.location].map((v, i) => (
                    <span key={i} style={{ fontSize: 10, color: "rgba(255,255,255,0.75)", backgroundColor: "rgba(255,255,255,0.12)", borderRadius: 20, padding: "2px 10px" }}>{v}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Wave separator */}
          <svg viewBox="0 0 850 30" style={{ display: "block", marginTop: -1 }} preserveAspectRatio="none" width="850" height="30">
            <path d="M0,0 C200,30 650,0 850,20 L850,0 Z" fill="#1e1b4b" opacity="0.08" />
          </svg>

          {/* Body: 2-column */}
          <div style={{ display: "flex" }}>
            {/* Left main */}
            <div style={{ flex: 1, padding: "24px 24px 40px 36px", minWidth: 0 }}>
              <div style={{ marginBottom: 4 }}>
                <SecH title="Profil" />
                <E value={data.personal.bio} onChange={v => setPersonal({ bio: v })} editing={editing} multiline rows={3} style={{ fontSize: 11, color: "#6b7280", lineHeight: 1.6, display: "block" }} />
              </div>
              <div style={{ height: 16 }} />
              <SecH title="Projekte" />
              {data.projects.map(p => (
                <div key={p.id} style={{ marginBottom: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                    <E value={p.title} onChange={v => setData(d => ({ ...d, projects: d.projects.map(x => x.id === p.id ? { ...x, title: v } : x) }))} editing={editing} style={{ fontSize: 12, fontWeight: 700, color: "#1e1b4b" }} />
                    <E value={p.period} onChange={v => setData(d => ({ ...d, projects: d.projects.map(x => x.id === p.id ? { ...x, period: v } : x) }))} editing={editing} style={{ fontSize: 10, color: A1, fontStyle: "italic", flexShrink: 0 }} />
                  </div>
                  {p.bullets.map((b, i) => <div key={i} style={{ fontSize: 11, color: "#6b7280", paddingLeft: 12, borderLeft: `2px solid ${A2}44`, marginBottom: 2, lineHeight: 1.5 }}>{b}</div>)}
                  {editing && <button type="button" onClick={() => setData(d => ({ ...d, projects: d.projects.filter(x => x.id !== p.id) }))} style={{ fontSize: 10, color: "#f87171", background: "none", border: "none", cursor: "pointer", marginTop: 4, display: "flex", alignItems: "center", gap: 3 }}><TrashIcon style={{ width: 10, height: 10 }} />Entfernen</button>}
                </div>
              ))}
              {editing && <button type="button" onClick={() => setData(d => ({ ...d, projects: [...d.projects, { id: uid(), title: "Projekt", period: "", bullets: [] }] }))} style={{ fontSize: 11, color: A1, background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}><PlusIcon style={{ width: 12, height: 12 }} />Hinzufügen</button>}
              <div style={{ height: 16 }} />
              <SecH title="Berufserfahrung" />
              {data.experience.map(ex => (
                <div key={ex.id} style={{ marginBottom: 14, position: "relative", paddingLeft: 14 }}>
                  <div style={{ position: "absolute", left: 0, top: 4, width: 6, height: 6, borderRadius: "50%", background: BG_HEADER }} />
                  <E value={ex.position} onChange={v => setData(d => ({ ...d, experience: d.experience.map(x => x.id === ex.id ? { ...x, position: v } : x) }))} editing={editing} style={{ fontSize: 12, fontWeight: 700, color: "#1e1b4b", display: "block" }} />
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <E value={ex.company} onChange={v => setData(d => ({ ...d, experience: d.experience.map(x => x.id === ex.id ? { ...x, company: v } : x) }))} editing={editing} style={{ fontSize: 11, color: A1 }} />
                    <E value={ex.period} onChange={v => setData(d => ({ ...d, experience: d.experience.map(x => x.id === ex.id ? { ...x, period: v } : x) }))} editing={editing} style={{ fontSize: 10, color: "#9ca3af", fontStyle: "italic" }} />
                  </div>
                </div>
              ))}
              <div style={{ height: 16 }} />
              <SecH title="Ausbildung" />
              {data.education.map(e => (
                <div key={e.id} style={{ marginBottom: 12, paddingLeft: 14, position: "relative" }}>
                  <div style={{ position: "absolute", left: 0, top: 4, width: 6, height: 6, borderRadius: "50%", background: BG_HEADER }} />
                  <E value={e.degree} onChange={v => setData(d => ({ ...d, education: d.education.map(x => x.id === e.id ? { ...x, degree: v } : x) }))} editing={editing} style={{ fontSize: 12, fontWeight: 700, color: "#1e1b4b", display: "block" }} />
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <E value={e.institution} onChange={v => setData(d => ({ ...d, education: d.education.map(x => x.id === e.id ? { ...x, institution: v } : x) }))} editing={editing} style={{ fontSize: 11, color: A1 }} />
                    <E value={e.period} onChange={v => setData(d => ({ ...d, education: d.education.map(x => x.id === e.id ? { ...x, period: v } : x) }))} editing={editing} style={{ fontSize: 10, color: "#9ca3af", fontStyle: "italic" }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Right sidebar */}
            <div style={{ width: 250, flexShrink: 0, background: "linear-gradient(180deg,#f5f3ff,#fdf4ff)", padding: "24px 20px 40px", borderLeft: "1px solid #ede9fe" }}>
              <SecH title="Skills" />
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 20 }}>
                {data.skills.map((s, i) => <span key={i} style={{ background: BG_HEADER, color: "white", borderRadius: 20, padding: "2px 9px", fontSize: 10 }}>{s}</span>)}
              </div>
              <SecH title="Soft Skills" />
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 20 }}>
                {data.softSkills.map((s, i) => <span key={i} style={{ border: `1px solid ${A1}`, color: A1, borderRadius: 20, padding: "2px 9px", fontSize: 10 }}>{s}</span>)}
              </div>
              <SecH title="Sprachen" />
              {data.languages.map(l => <div key={l.id} style={{ marginBottom: 8 }}>
                <E value={l.language} onChange={v => setData(d => ({ ...d, languages: d.languages.map(x => x.id === l.id ? { ...x, language: v } : x) }))} editing={editing} style={{ fontSize: 11, fontWeight: 700, color: "#1e1b4b", display: "block" }} />
                <E value={l.level} onChange={v => setData(d => ({ ...d, languages: d.languages.map(x => x.id === l.id ? { ...x, level: v } : x) }))} editing={editing} style={{ fontSize: 10, color: A1, fontStyle: "italic", display: "block" }} />
              </div>)}
              <div style={{ height: 14 }} />
              <SecH title="Zertifikate" />
              {data.certificates.map(c => <div key={c.id} style={{ marginBottom: 7 }}>
                <E value={c.name} onChange={v => setData(d => ({ ...d, certificates: d.certificates.map(x => x.id === c.id ? { ...x, name: v } : x) }))} editing={editing} multiline rows={2} style={{ fontSize: 10, color: "#4b5563", display: "block", lineHeight: 1.4 }} />
              </div>)}
              <div style={{ height: 14 }} />
              <SecH title="Interessen" />
              {data.interests.map((s, i) => <div key={i} style={{ fontSize: 10, color: "#6b7280", marginBottom: 4 }}>✦ {s}</div>)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
