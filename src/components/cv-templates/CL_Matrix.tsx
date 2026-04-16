"use client";
// ─── Anschreiben Template: Matrix (Neongrün/Schwarz) ─────────────────────────
import { useState } from "react";
import { PrinterIcon, PencilSquareIcon, CheckIcon, PlusIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { FONTS, FONT_SIZES, CLData, DEFAULT_CL_DATA } from "./shared";

const A = "#4ade80"; const BG = "#052e16";

function E({ value, onChange, editing, multiline = false, style = {} as React.CSSProperties, placeholder = "...", rows = 4, inv = false }: {
  value: string; onChange: (v: string) => void; editing: boolean; multiline?: boolean; style?: React.CSSProperties; placeholder?: string; rows?: number; inv?: boolean;
}) {
  const base: React.CSSProperties = { ...style, background: inv ? "rgba(74,222,128,0.08)" : "rgba(74,222,128,0.06)", border: `1px dashed ${A}55`, borderRadius: 3, padding: "2px 4px", outline: "none", width: "100%", fontFamily: "inherit", fontSize: "inherit", color: "inherit", lineHeight: "inherit", fontWeight: "inherit", boxSizing: "border-box" };
  if (!editing) return <span style={style}>{value || <span style={{ opacity: 0.3, fontStyle: "italic" }}>{placeholder}</span>}</span>;
  if (multiline) return <textarea style={{ ...base, resize: "vertical", display: "block" }} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows} />;
  return <input style={base} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />;
}

export default function CL_Matrix() {
  const [data, setData] = useState<CLData>(JSON.parse(JSON.stringify(DEFAULT_CL_DATA)));
  const [editing, setEditing] = useState(false);
  const [fontKey, setFontKey] = useState("mono"); const [sizeKey, setSizeKey] = useState("md"); const [showDesign, setShowDesign] = useState(false);
  const curFont = FONTS.find(f => f.key === fontKey) ?? FONTS[7]; const curSize = FONT_SIZES.find(s => s.key === sizeKey) ?? FONT_SIZES[2];
  const fnt = curFont.family; const scale = curSize.scale;
  const setP = (p: Partial<CLData["personal"]>) => setData(d => ({ ...d, personal: { ...d.personal, ...p } }));
  const setR = (p: Partial<CLData["recipient"]>) => setData(d => ({ ...d, recipient: { ...d.recipient, ...p } }));

  return (
    <div style={{ minHeight: "100vh", background: "#000", padding: "24px 16px" }}>
      <style>{`${curFont.gf ? `@import url('https://fonts.googleapis.com/css2?family=${curFont.gf}&display=swap');` : ""} .clmat-doc,.clmat-doc * { font-family: ${fnt} !important; } @media print { @page{size:A4 portrait;margin:0} body *{visibility:hidden!important} .clmat-doc,.clmat-doc *{visibility:visible!important} .clmat-doc{position:absolute!important;top:0!important;left:0!important;width:210mm!important;box-shadow:none!important;margin:0!important;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important} .clmat-zoom{zoom:1!important;width:100%!important} .clmat-ctrl{display:none!important} }`}</style>
      <div className="clmat-ctrl" style={{ maxWidth: 850, margin: "0 auto 16px", display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button onClick={() => setEditing(e => !e)} style={{ padding: "7px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", border: `1px solid ${A}`, backgroundColor: editing ? "#16a34a" : BG, color: A, display: "flex", alignItems: "center", gap: 6 }}>{editing ? <CheckIcon style={{ width: 16, height: 16 }} /> : <PencilSquareIcon style={{ width: 16, height: 16 }} />}{editing ? "Fertig" : "Bearbeiten"}</button>
        <button onClick={() => window.print()} style={{ padding: "7px 16px", borderRadius: 8, fontSize: 13, cursor: "pointer", border: "1px solid #374151", backgroundColor: "#111827", color: "#9ca3af", display: "flex", alignItems: "center", gap: 6 }}><PrinterIcon style={{ width: 16, height: 16 }} />Drucken</button>
        <button onClick={() => setShowDesign(v => !v)} style={{ padding: "7px 16px", borderRadius: 8, fontSize: 13, cursor: "pointer", border: `1px solid ${showDesign ? A : "#374151"}`, backgroundColor: "transparent", color: showDesign ? A : "#888" }}>🎨 Design</button>
        <button onClick={() => { if (window.confirm("Zurücksetzen?")) setData(JSON.parse(JSON.stringify(DEFAULT_CL_DATA))); }} style={{ padding: "7px 16px", borderRadius: 8, fontSize: 13, cursor: "pointer", border: "1px solid #374151", backgroundColor: "transparent", color: "#888", display: "flex", alignItems: "center", gap: 6 }}><XMarkIcon style={{ width: 16, height: 16 }} />Reset</button>
        {showDesign && <div style={{ width: "100%", background: BG, border: `1px solid ${A}44`, borderRadius: 10, padding: "14px 18px", display: "flex", gap: 24, flexWrap: "wrap" }}>
          <div><div style={{ fontSize: 10, fontWeight: 700, color: A, marginBottom: 7, textTransform: "uppercase", letterSpacing: "0.1em" }}>Schriftart</div><div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>{FONTS.map(f => <button key={f.key} onClick={() => setFontKey(f.key)} style={{ padding: "3px 9px", borderRadius: 5, border: `1px solid ${fontKey === f.key ? A : "#166534"}`, background: fontKey === f.key ? "rgba(74,222,128,0.1)" : "transparent", color: fontKey === f.key ? A : "#6b7280", fontSize: 11, cursor: "pointer", fontFamily: f.family }}>{f.label}</button>)}</div></div>
          <div><div style={{ fontSize: 10, fontWeight: 700, color: A, marginBottom: 7, textTransform: "uppercase", letterSpacing: "0.1em" }}>Größe</div><div style={{ display: "flex", gap: 5 }}>{FONT_SIZES.map(s => <button key={s.key} onClick={() => setSizeKey(s.key)} style={{ padding: "3px 12px", borderRadius: 5, border: `1px solid ${sizeKey === s.key ? A : "#166534"}`, background: sizeKey === s.key ? "rgba(74,222,128,0.1)" : "transparent", color: sizeKey === s.key ? A : "#6b7280", fontSize: 11, cursor: "pointer" }}>{s.label}</button>)}</div></div>
        </div>}
      </div>
      <div className="clmat-doc" style={{ width: 850, margin: "0 auto", backgroundColor: "#000", boxShadow: `0 0 60px rgba(74,222,128,0.2), 0 0 0 1px ${A}33`, overflow: "hidden" }}>
        <div className="clmat-zoom" style={{ width: Math.round(850 / scale), zoom: scale }}>
          <div style={{ background: BG, borderBottom: `2px solid ${A}`, padding: "28px 48px 22px", position: "relative", overflow: "hidden" }}>
            {/* Binary decoration */}
            <div style={{ position: "absolute", top: 8, right: 12, fontSize: 9, color: `${A}22`, letterSpacing: "0.05em", fontFamily: "monospace", userSelect: "none", pointerEvents: "none" }}>01001100 01000101 01000010 01000101 01001110 01010011</div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", position: "relative" }}>
              <div>
                <div style={{ fontSize: 9, color: `${A}88`, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 4, fontFamily: "monospace" }}>&gt;_ Bewerbungsschreiben</div>
                <E value={data.personal.name} onChange={v => setP({ name: v })} editing={editing} inv style={{ fontSize: 26, fontWeight: 900, color: A, display: "block", letterSpacing: "0.06em", marginBottom: 3, textShadow: `0 0 20px ${A}66` }} />
                <E value={data.personal.subtitle} onChange={v => setP({ subtitle: v })} editing={editing} inv style={{ fontSize: 10, color: `${A}99`, display: "block", fontFamily: "monospace", letterSpacing: "0.1em" }} />
              </div>
              <div style={{ textAlign: "right" }}>{[data.personal.email, data.personal.phone, data.personal.location].map((v, i) => <E key={i} value={v} onChange={nv => setP([{ email: nv }, { phone: nv }, { location: nv }][i])} editing={editing} inv style={{ fontSize: 10, color: `${A}88`, display: "block", marginBottom: 2, fontFamily: "monospace" }} />)}</div>
            </div>
          </div>
          <div style={{ padding: "32px 48px 48px", background: "#050505", color: "#d1d5db" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 24 }}>
              <div style={{ borderLeft: `2px solid ${A}55`, paddingLeft: 10 }}>{[data.recipient.company, data.recipient.street, data.recipient.cityZip].map((v, i) => <E key={i} value={v} onChange={nv => setR([{ company: nv }, { street: nv }, { cityZip: nv }][i])} editing={editing} style={{ fontSize: 11, color: "#9ca3af", display: "block", lineHeight: 1.6 }} />)}</div>
              <E value={data.date} onChange={v => setData(d => ({ ...d, date: v }))} editing={editing} style={{ fontSize: 11, color: `${A}88`, fontFamily: "monospace" }} />
            </div>
            <div style={{ marginBottom: 20, paddingBottom: 12, borderBottom: `1px solid ${A}33` }}>
              <span style={{ fontSize: 10, color: `${A}77`, fontFamily: "monospace", marginRight: 6 }}>&gt;_</span>
              <E value={data.subject} onChange={v => setData(d => ({ ...d, subject: v }))} editing={editing} style={{ fontSize: 12, fontWeight: 700, color: A }} />
            </div>
            <E value={data.salutation} onChange={v => setData(d => ({ ...d, salutation: v }))} editing={editing} style={{ fontSize: 12, display: "block", marginBottom: 14, color: "#d1d5db" }} />
            {data.bodyParagraphs.map((p, i) => (
              <div key={i} style={{ marginBottom: 12, display: "flex", gap: 8 }}>
                {editing && <button type="button" onClick={() => setData(d => ({ ...d, bodyParagraphs: d.bodyParagraphs.filter((_, j) => j !== i) }))} style={{ padding: "2px 4px", fontSize: 10, color: "#f87171", background: "none", border: "none", cursor: "pointer", flexShrink: 0 }}>✕</button>}
                <div style={{ display: "flex", gap: 6, flex: 1 }}><span style={{ color: `${A}55`, fontSize: 11, fontFamily: "monospace", flexShrink: 0 }}>▸</span><E value={p} onChange={v => setData(d => ({ ...d, bodyParagraphs: d.bodyParagraphs.map((x, j) => j === i ? v : x) }))} editing={editing} multiline rows={4} style={{ fontSize: 11, color: "#9ca3af", lineHeight: 1.75, display: "block", flex: 1 }} /></div>
              </div>
            ))}
            {editing && <button type="button" onClick={() => setData(d => ({ ...d, bodyParagraphs: [...d.bodyParagraphs, "Neuer Absatz..."] }))} style={{ fontSize: 11, color: A, background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, marginBottom: 16 }}><PlusIcon style={{ width: 12, height: 12 }} />Absatz hinzufügen</button>}
            <div style={{ marginTop: 20 }}>
              <E value={data.closing} onChange={v => setData(d => ({ ...d, closing: v }))} editing={editing} style={{ fontSize: 11, display: "block", marginBottom: 24, color: "#9ca3af" }} />
              <div style={{ width: 80, height: 1, backgroundColor: A, marginBottom: 8, boxShadow: `0 0 8px ${A}99` }} />
              <E value={data.signatureName} onChange={v => setData(d => ({ ...d, signatureName: v }))} editing={editing} style={{ fontSize: 12, fontWeight: 700, color: A, textShadow: `0 0 12px ${A}66` }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
