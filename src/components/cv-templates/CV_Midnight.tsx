"use client";
// ─── CV Template: Midnight ─────────────────────────────────────────────────
// Schwarzes Papier, goldene Akzente, voller Name als großes typografisches Statement oben
import { useState, useRef } from "react";
import { PrinterIcon, PencilSquareIcon, CheckIcon, PlusIcon, TrashIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { FONTS, FONT_SIZES, PHOTO_SHAPES, CVData, DEFAULT_CV_DATA, uid } from "./shared";

const A = "#f59e0b";  // gold
const BG = "#0a0a0a";
const S2 = "#1a1a1a";
const S3 = "#2a2a2a";
const FNT = "'Nunito','Calibri',sans-serif";

function E({ value, onChange, editing, multiline = false, style = {} as React.CSSProperties, placeholder = "...", rows = 3 }: {
  value: string; onChange: (v: string) => void; editing: boolean;
  multiline?: boolean; style?: React.CSSProperties; placeholder?: string; rows?: number;
}) {
  const base: React.CSSProperties = { ...style, background: "rgba(245,158,11,0.1)", border: "1px dashed rgba(245,158,11,0.5)", borderRadius: 3, padding: "2px 4px", outline: "none", width: "100%", fontFamily: "inherit", fontSize: "inherit", color: "inherit", lineHeight: "inherit", fontWeight: "inherit", boxSizing: "border-box" };
  if (!editing) return <span style={style}>{value || <span style={{ opacity: 0.3, fontStyle: "italic" }}>{placeholder}</span>}</span>;
  if (multiline) return <textarea style={{ ...base, resize: "vertical", display: "block" }} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows} />;
  return <input style={base} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />;
}

function SecH({ title }: { title: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
      <div style={{ width: 3, height: 18, backgroundColor: A, borderRadius: 2 }} />
      <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.18em", textTransform: "uppercase" as const, color: A }}>{title}</span>
      <div style={{ flex: 1, height: 1, backgroundColor: S3 }} />
    </div>
  );
}

export default function CV_Midnight() {
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
    <div style={{ minHeight: "100vh", background: "#0d0d0d", padding: "24px 16px", fontFamily: FNT }}>
      <style>{`
        ${curFont.gf ? `@import url('https://fonts.googleapis.com/css2?family=${curFont.gf}&display=swap');` : ""}
        .mid-doc, .mid-doc * { font-family: ${fnt} !important; }
        @media print {
          @page { size: A4 portrait; margin: 0; }
          body * { visibility: hidden !important; }
          .mid-doc, .mid-doc * { visibility: visible !important; }
          .mid-doc { position: absolute !important; top: 0 !important; left: 0 !important; width: 210mm !important; box-shadow: none !important; margin: 0 !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .mid-zoom { zoom: 1 !important; width: 100% !important; }
          .mid-ctrl { display: none !important; }
        }
      `}</style>

      {/* Controls */}
      <div className="mid-ctrl" style={{ maxWidth: 850, margin: "0 auto 16px", display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button onClick={() => setEditing(e => !e)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", border: "none", backgroundColor: editing ? "#16a34a" : A, color: "black" }}>
          {editing ? <CheckIcon style={{ width: 16, height: 16 }} /> : <PencilSquareIcon style={{ width: 16, height: 16 }} />}
          {editing ? "Fertig" : "Bearbeiten"}
        </button>
        <button onClick={() => window.print()} style={{ padding: "7px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", border: "none", backgroundColor: S3, color: "white", display: "flex", alignItems: "center", gap: 6 }}>
          <PrinterIcon style={{ width: 16, height: 16 }} />Drucken
        </button>
        <button onClick={() => setShowDesign(v => !v)} style={{ padding: "7px 16px", borderRadius: 8, fontSize: 13, cursor: "pointer", border: `1px solid ${showDesign ? A : "#333"}`, backgroundColor: showDesign ? "rgba(245,158,11,0.1)" : "transparent", color: showDesign ? A : "#aaa" }}>
          🎨 Design
        </button>
        <button onClick={() => { if (window.confirm("Zurücksetzen?")) { setData(JSON.parse(JSON.stringify(DEFAULT_CV_DATA))); setFontKey("nunito"); setSizeKey("md"); setPhotoShapeKey("circle"); setShowDesign(false); } }} style={{ padding: "7px 16px", borderRadius: 8, fontSize: 13, cursor: "pointer", border: "1px solid #333", backgroundColor: "transparent", color: "#aaa", display: "flex", alignItems: "center", gap: 6 }}>
          <XMarkIcon style={{ width: 16, height: 16 }} />Reset
        </button>
        {showDesign && (
          <div style={{ width: "100%", background: S2, border: "1px solid #333", borderRadius: 10, padding: "14px 18px", display: "flex", gap: 24, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#666", marginBottom: 7, letterSpacing: "0.1em", textTransform: "uppercase" }}>Schriftart</div>
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                {FONTS.map(f => (
                  <button key={f.key} onClick={() => setFontKey(f.key)} style={{ padding: "3px 9px", borderRadius: 5, border: `1px solid ${fontKey === f.key ? A : "#444"}`, background: fontKey === f.key ? "rgba(245,158,11,0.15)" : "transparent", color: fontKey === f.key ? A : "#aaa", fontSize: 11, cursor: "pointer", fontFamily: f.family }}>
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#666", marginBottom: 7, letterSpacing: "0.1em", textTransform: "uppercase" }}>Schriftgröße</div>
              <div style={{ display: "flex", gap: 5 }}>
                {FONT_SIZES.map(s => (
                  <button key={s.key} onClick={() => setSizeKey(s.key)} style={{ padding: "3px 12px", borderRadius: 5, border: `1px solid ${sizeKey === s.key ? A : "#444"}`, background: sizeKey === s.key ? "rgba(245,158,11,0.15)" : "transparent", color: sizeKey === s.key ? A : "#aaa", fontSize: 11, cursor: "pointer" }}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#666", marginBottom: 7, letterSpacing: "0.1em", textTransform: "uppercase" }}>Foto-Form</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {PHOTO_SHAPES.map(s => (
                  <button key={s.key} onClick={() => setPhotoShapeKey(s.key)} title={s.label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "5px 7px", borderRadius: 7, border: `2px solid ${photoShapeKey === s.key ? A : "#444"}`, background: photoShapeKey === s.key ? "rgba(245,158,11,0.1)" : "transparent", cursor: "pointer" }}>
                    <div style={{ width: 20, height: s.key === "ellipse" ? 26 : 20, borderRadius: s.br, clipPath: s.clip ?? "", backgroundColor: photoShapeKey === s.key ? A : "#555" }} />
                    <span style={{ fontSize: 8, color: photoShapeKey === s.key ? A : "#666", whiteSpace: "nowrap" }}>{s.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Document */}
      <div className="mid-doc" style={{ width: 850, margin: "0 auto", backgroundColor: BG, boxShadow: "0 0 60px rgba(245,158,11,0.15)", overflow: "hidden", fontFamily: fnt }}>
        <div className="mid-zoom" style={{ width: Math.round(850 / scale), zoom: scale }}>

          {/* Gold accent top bar */}
          <div style={{ height: 4, background: `linear-gradient(90deg, ${A}, #d97706, ${A})` }} />

          {/* Header */}
          <div style={{ backgroundColor: BG, padding: "36px 40px 28px", borderBottom: `1px solid ${S3}`, display: "flex", gap: 28, alignItems: "flex-start" }}>
            {/* Photo */}
            <div style={{ width: curShape.w, height: curShape.h, borderRadius: curShape.br, clipPath: curShape.clip ?? "", overflow: "hidden", flexShrink: 0, backgroundColor: S3, border: `2px solid ${A}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: editing ? "pointer" : "default", boxShadow: curShape.shadow ?? "" }} onClick={() => editing && photoInputRef.current?.click()}>
              {photoSrc ? <img src={photoSrc} alt="Foto" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: 10, color: "#555", textAlign: "center" }}>{editing ? "📷" : "Foto"}</span>}
              <input ref={photoInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => { const f = e.target.files?.[0]; if (!f) return; const r = new FileReader(); r.onload = ev => setPhotoSrc((ev.target?.result as string) ?? ""); r.readAsDataURL(f); }} />
            </div>
            <div style={{ flex: 1 }}>
              {editing
                ? <input value={data.personal.name} onChange={e => setPersonal({ name: e.target.value })} style={{ display: "block", fontSize: 42, fontWeight: 900, color: "white", lineHeight: 1.05, marginBottom: 6, fontFamily: fnt, background: "rgba(245,158,11,0.08)", border: "1px dashed rgba(245,158,11,0.4)", borderRadius: 3, padding: "2px 6px", outline: "none", width: "100%", boxSizing: "border-box" }} />
                : <div style={{ fontSize: 42, fontWeight: 900, color: "white", lineHeight: 1.05, marginBottom: 6 }}>{data.personal.name}</div>
              }
              {editing
                ? <input value={data.personal.subtitle} onChange={e => setPersonal({ subtitle: e.target.value })} style={{ display: "block", fontSize: 14, fontWeight: 600, color: A, marginBottom: 14, fontFamily: fnt, background: "rgba(245,158,11,0.08)", border: "1px dashed rgba(245,158,11,0.4)", borderRadius: 3, padding: "2px 6px", outline: "none", width: "100%", boxSizing: "border-box" }} />
                : <div style={{ fontSize: 14, fontWeight: 600, color: A, marginBottom: 14, letterSpacing: "0.06em" }}>{data.personal.subtitle}</div>
              }
              <E value={data.personal.bio} onChange={v => setPersonal({ bio: v })} editing={editing} multiline rows={3} style={{ fontSize: 11, color: "#9ca3af", lineHeight: 1.6 }} />
              {/* Contact chips */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
                {[
                  { k: "email", v: data.personal.email },
                  { k: "phone", v: data.personal.phone },
                  { k: "location", v: data.personal.location },
                  { k: "github", v: data.personal.github },
                  { k: "linkedin", v: data.personal.linkedin },
                ].map(({ k, v }) => editing ? (
                  <input key={k} value={v} onChange={e => setPersonal({ [k]: e.target.value } as Partial<CVData["personal"]>)} style={{ fontSize: 10, color: "#bbb", background: S3, border: "1px dashed rgba(245,158,11,0.3)", borderRadius: 4, padding: "3px 8px", outline: "none", fontFamily: fnt }} />
                ) : (
                  <span key={k} style={{ fontSize: 10, color: "#bbb", backgroundColor: S3, borderRadius: 4, padding: "3px 8px" }}>{v}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Body: 2 columns */}
          <div style={{ display: "flex", gap: 0 }}>
            {/* Left */}
            <div style={{ flex: 1, padding: "28px 28px 40px 40px", minWidth: 0 }}>

              {/* PROJEKTE */}
              <div style={{ marginBottom: 24 }}>
                <SecH title="Projekte" />
                {data.projects.map(p => (
                  <div key={p.id} style={{ marginBottom: 16, paddingLeft: 10, borderLeft: `2px solid ${S3}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                      <E value={p.title} onChange={v => setData(d => ({ ...d, projects: d.projects.map(x => x.id === p.id ? { ...x, title: v } : x) }))} editing={editing} style={{ fontSize: 13, fontWeight: 700, color: "white" }} />
                      <E value={p.period} onChange={v => setData(d => ({ ...d, projects: d.projects.map(x => x.id === p.id ? { ...x, period: v } : x) }))} editing={editing} style={{ fontSize: 10, color: A, flexShrink: 0, fontStyle: "italic" }} />
                    </div>
                    {p.bullets.map((b, i) => (
                      <div key={i} style={{ display: "flex", gap: 6, alignItems: "flex-start", marginBottom: 2 }}>
                        <span style={{ color: A, fontSize: 10, marginTop: 3, flexShrink: 0 }}>◆</span>
                        {editing ? (
                          <input value={b} onChange={e => { const nb = [...p.bullets]; nb[i] = e.target.value; setData(d => ({ ...d, projects: d.projects.map(x => x.id === p.id ? { ...x, bullets: nb } : x) })); }} style={{ flex: 1, fontSize: 11, color: "#ccc", background: S3, border: "1px dashed rgba(245,158,11,0.3)", borderRadius: 3, padding: "1px 4px", outline: "none", fontFamily: fnt }} />
                        ) : (
                          <span style={{ fontSize: 11, color: "#9ca3af", lineHeight: 1.5 }}>{b}</span>
                        )}
                      </div>
                    ))}
                    {editing && <button type="button" onClick={() => setData(d => ({ ...d, projects: d.projects.filter(x => x.id !== p.id) }))} style={{ fontSize: 10, color: "#f87171", background: "none", border: "none", cursor: "pointer", marginTop: 4, display: "flex", alignItems: "center", gap: 3 }}><TrashIcon style={{ width: 10, height: 10 }} />Entfernen</button>}
                  </div>
                ))}
                {editing && <button type="button" onClick={() => setData(d => ({ ...d, projects: [...d.projects, { id: uid(), title: "Projekt", period: "", bullets: [] }] }))} style={{ fontSize: 11, color: A, background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}><PlusIcon style={{ width: 12, height: 12 }} />Hinzufügen</button>}
              </div>

              {/* BERUFSERFAHRUNG */}
              <div style={{ marginBottom: 24 }}>
                <SecH title="Berufserfahrung" />
                {data.experience.map(ex => (
                  <div key={ex.id} style={{ marginBottom: 18, paddingLeft: 10, borderLeft: `2px solid ${S3}` }}>
                    <E value={ex.position} onChange={v => setData(d => ({ ...d, experience: d.experience.map(x => x.id === ex.id ? { ...x, position: v } : x) }))} editing={editing} style={{ fontSize: 13, fontWeight: 700, color: "white", display: "block" }} />
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <E value={ex.company} onChange={v => setData(d => ({ ...d, experience: d.experience.map(x => x.id === ex.id ? { ...x, company: v } : x) }))} editing={editing} style={{ fontSize: 12, color: A }} />
                      <E value={ex.period} onChange={v => setData(d => ({ ...d, experience: d.experience.map(x => x.id === ex.id ? { ...x, period: v } : x) }))} editing={editing} style={{ fontSize: 10, color: "#666", fontStyle: "italic" }} />
                    </div>
                    {ex.bullets.map((b, i) => (
                      <div key={i} style={{ display: "flex", gap: 6, alignItems: "flex-start", marginBottom: 2 }}>
                        <span style={{ color: A, fontSize: 10, marginTop: 3 }}>◆</span>
                        {editing ? <input value={b} onChange={e => { const nb = [...ex.bullets]; nb[i] = e.target.value; setData(d => ({ ...d, experience: d.experience.map(x => x.id === ex.id ? { ...x, bullets: nb } : x) })); }} style={{ flex: 1, fontSize: 11, color: "#ccc", background: S3, border: "1px dashed rgba(245,158,11,0.3)", borderRadius: 3, padding: "1px 4px", outline: "none", fontFamily: fnt }} />
                          : <span style={{ fontSize: 11, color: "#9ca3af", lineHeight: 1.5 }}>{b}</span>}
                      </div>
                    ))}
                    {editing && <button type="button" onClick={() => setData(d => ({ ...d, experience: d.experience.filter(x => x.id !== ex.id) }))} style={{ fontSize: 10, color: "#f87171", background: "none", border: "none", cursor: "pointer", marginTop: 4, display: "flex", alignItems: "center", gap: 3 }}><TrashIcon style={{ width: 10, height: 10 }} />Entfernen</button>}
                  </div>
                ))}
              </div>

              {/* AUSBILDUNG */}
              <div>
                <SecH title="Ausbildung" />
                {data.education.map(e => (
                  <div key={e.id} style={{ marginBottom: 14, paddingLeft: 10, borderLeft: `2px solid ${S3}` }}>
                    <E value={e.degree} onChange={v => setData(d => ({ ...d, education: d.education.map(x => x.id === e.id ? { ...x, degree: v } : x) }))} editing={editing} style={{ fontSize: 13, fontWeight: 700, color: "white", display: "block" }} />
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <E value={e.institution} onChange={v => setData(d => ({ ...d, education: d.education.map(x => x.id === e.id ? { ...x, institution: v } : x) }))} editing={editing} style={{ fontSize: 12, color: A }} />
                      <E value={e.period} onChange={v => setData(d => ({ ...d, education: d.education.map(x => x.id === e.id ? { ...x, period: v } : x) }))} editing={editing} style={{ fontSize: 10, color: "#666", fontStyle: "italic" }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right sidebar */}
            <div style={{ width: 260, flexShrink: 0, backgroundColor: S2, padding: "28px 22px 40px", borderLeft: `1px solid ${S3}` }}>

              <div style={{ marginBottom: 20 }}>
                <SecH title="Fähigkeiten" />
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                  {data.skills.map((s, i) => (
                    <div key={i} style={{ backgroundColor: S3, border: `1px solid ${A}33`, color: "#ccc", borderRadius: 3, padding: "2px 8px", fontSize: 10 }}>{s}</div>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <SecH title="Technisch" />
                {data.technicalSkills.map(ts => (
                  <div key={ts.id} style={{ marginBottom: 8 }}>
                    <E value={ts.name} onChange={v => setData(d => ({ ...d, technicalSkills: d.technicalSkills.map(t => t.id === ts.id ? { ...t, name: v } : t) }))} editing={editing} style={{ fontSize: 12, fontWeight: 700, color: "white", display: "block" }} />
                    <E value={ts.description} onChange={v => setData(d => ({ ...d, technicalSkills: d.technicalSkills.map(t => t.id === ts.id ? { ...t, description: v } : t) }))} editing={editing} style={{ fontSize: 10, color: "#666", display: "block" }} />
                  </div>
                ))}
              </div>

              <div style={{ marginBottom: 20 }}>
                <SecH title="Soft Skills" />
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                  {data.softSkills.map((s, i) => <div key={i} style={{ border: `1px solid ${A}55`, color: A, borderRadius: 3, padding: "2px 8px", fontSize: 10 }}>{s}</div>)}
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <SecH title="Sprachen" />
                {data.languages.map(l => (
                  <div key={l.id} style={{ marginBottom: 8 }}>
                    <E value={l.language} onChange={v => setData(d => ({ ...d, languages: d.languages.map(x => x.id === l.id ? { ...x, language: v } : x) }))} editing={editing} style={{ fontSize: 12, fontWeight: 700, color: "white", display: "block" }} />
                    <E value={l.level} onChange={v => setData(d => ({ ...d, languages: d.languages.map(x => x.id === l.id ? { ...x, level: v } : x) }))} editing={editing} style={{ fontSize: 10, fontStyle: "italic", color: A, display: "block" }} />
                  </div>
                ))}
              </div>

              <div style={{ marginBottom: 20 }}>
                <SecH title="Zertifikate" />
                {data.certificates.map(c => (
                  <div key={c.id} style={{ marginBottom: 8 }}>
                    <E value={c.name} onChange={v => setData(d => ({ ...d, certificates: d.certificates.map(x => x.id === c.id ? { ...x, name: v } : x) }))} editing={editing} multiline rows={2} style={{ fontSize: 10, color: "#bbb", display: "block", lineHeight: 1.4 }} />
                    <E value={c.period} onChange={v => setData(d => ({ ...d, certificates: d.certificates.map(x => x.id === c.id ? { ...x, period: v } : x) }))} editing={editing} style={{ fontSize: 9, color: "#555", display: "block" }} />
                  </div>
                ))}
              </div>

              <div>
                <SecH title="Interessen" />
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                  {data.interests.map((s, i) => <span key={i} style={{ fontSize: 10, color: "#888" }}>• {s}</span>)}
                </div>
              </div>
            </div>
          </div>

          {/* Gold bottom bar */}
          <div style={{ height: 3, background: `linear-gradient(90deg, transparent, ${A}, transparent)` }} />
        </div>
      </div>
    </div>
  );
}
