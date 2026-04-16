"use client";
// ─── Anschreiben Template: Violet ────────────────────────────────────────────
import { useState } from "react";
import { PrinterIcon, PencilSquareIcon, CheckIcon, PlusIcon, TrashIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { FONTS, FONT_SIZES, CLData, DEFAULT_CL_DATA, uid } from "./shared";

const A = "#7c3aed";
const BG = "#1e0e3c";
const S2 = "#28124f";

function E({ value, onChange, editing, multiline = false, style = {} as React.CSSProperties, placeholder = "...", rows = 4, inv = false }: {
  value: string; onChange: (v: string) => void; editing: boolean;
  multiline?: boolean; style?: React.CSSProperties; placeholder?: string; rows?: number; inv?: boolean;
}) {
  const base: React.CSSProperties = { ...style, background: inv ? "rgba(124,58,237,0.08)" : "rgba(124,58,237,0.06)", border: `1px dashed ${A}55`, borderRadius: 3, padding: "2px 4px", outline: "none", width: "100%", fontFamily: "inherit", fontSize: "inherit", color: "inherit", lineHeight: "inherit", fontWeight: "inherit", boxSizing: "border-box" };
  if (!editing) return <span style={style}>{value || <span style={{ opacity: 0.3, fontStyle: "italic" }}>{placeholder}</span>}</span>;
  if (multiline) return <textarea style={{ ...base, resize: "vertical", display: "block" }} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows} />;
  return <input style={base} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />;
}

export default function CL_Violet() {
  const [data, setData] = useState<CLData>(JSON.parse(JSON.stringify(DEFAULT_CL_DATA)));
  const [editing, setEditing] = useState(false);
  const [fontKey, setFontKey] = useState("nunito");
  const [sizeKey, setSizeKey] = useState("md");
  const [showDesign, setShowDesign] = useState(false);
  const curFont = FONTS.find(f => f.key === fontKey) ?? FONTS[0];
  const curSize = FONT_SIZES.find(s => s.key === sizeKey) ?? FONT_SIZES[2];
  const fnt = curFont.family; const scale = curSize.scale;
  const setP = (p: Partial<CLData["personal"]>) => setData(d => ({ ...d, personal: { ...d.personal, ...p } }));
  const setR = (p: Partial<CLData["recipient"]>) => setData(d => ({ ...d, recipient: { ...d.recipient, ...p } }));

  return (
    <div style={{ minHeight: "100vh", background: "#1e0e3c", padding: "24px 16px", fontFamily: fnt }}>
      <style>{`
        ${curFont.gf ? `@import url('https://fonts.googleapis.com/css2?family=${curFont.gf}&display=swap');` : ""}
        .clvio-doc, .clvio-doc * { font-family: ${fnt} !important; }
        @media print {
          @page { size: A4 portrait; margin: 0; }
          body * { visibility: hidden !important; }
          .clvio-doc, .clvio-doc * { visibility: visible !important; }
          .clvio-doc { position: absolute !important; top: 0 !important; left: 0 !important; width: 210mm !important; box-shadow: none !important; margin: 0 !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .clvio-zoom { zoom: 1 !important; width: 100% !important; }
          .clvio-ctrl { display: none !important; }
        }
      `}</style>
      <div className="clvio-ctrl" style={{ maxWidth: 850, margin: "0 auto 16px", display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button onClick={() => setEditing(e => !e)} style={{ padding: "7px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", border: "none", backgroundColor: editing ? "#16a34a" : A, color: editing ? "white" : "#000", display: "flex", alignItems: "center", gap: 6 }}>
          {editing ? <CheckIcon style={{ width: 16, height: 16 }} /> : <PencilSquareIcon style={{ width: 16, height: 16 }} />}{editing ? "Fertig" : "Bearbeiten"}
        </button>
        <button onClick={() => window.print()} style={{ padding: "7px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", border: "none", backgroundColor: "#374151", color: "white", display: "flex", alignItems: "center", gap: 6 }}>
          <PrinterIcon style={{ width: 16, height: 16 }} />Drucken
        </button>
        <button onClick={() => setShowDesign(v => !v)} style={{ padding: "7px 16px", borderRadius: 8, fontSize: 13, cursor: "pointer", border: `1px solid ${showDesign ? A : "#333"}`, backgroundColor: "transparent", color: showDesign ? A : "#888" }}>🎨 Design</button>
        <button onClick={() => { if (window.confirm("Zurücksetzen?")) setData(JSON.parse(JSON.stringify(DEFAULT_CL_DATA))); }} style={{ padding: "7px 16px", borderRadius: 8, fontSize: 13, cursor: "pointer", border: "1px solid #333", backgroundColor: "transparent", color: "#888", display: "flex", alignItems: "center", gap: 6 }}>
          <XMarkIcon style={{ width: 16, height: 16 }} />Reset
        </button>
        {showDesign && (
          <div style={{ width: "100%", background: S2, border: "1px solid #333", borderRadius: 10, padding: "14px 18px", display: "flex", gap: 24, flexWrap: "wrap" }}>
            <div><div style={{ fontSize: 10, fontWeight: 700, color: "#555", marginBottom: 7, textTransform: "uppercase", letterSpacing: "0.1em" }}>Schriftart</div>
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>{FONTS.map(f => <button key={f.key} onClick={() => setFontKey(f.key)} style={{ padding: "3px 9px", borderRadius: 5, border: `1px solid ${fontKey === f.key ? A : "#333"}`, background: fontKey === f.key ? "rgba(124,58,237,0.1)" : "transparent", color: fontKey === f.key ? A : "#888", fontSize: 11, cursor: "pointer", fontFamily: f.family }}>{f.label}</button>)}</div>
            </div>
            <div><div style={{ fontSize: 10, fontWeight: 700, color: "#555", marginBottom: 7, textTransform: "uppercase", letterSpacing: "0.1em" }}>Schriftgröße</div>
              <div style={{ display: "flex", gap: 5 }}>{FONT_SIZES.map(s => <button key={s.key} onClick={() => setSizeKey(s.key)} style={{ padding: "3px 12px", borderRadius: 5, border: `1px solid ${sizeKey === s.key ? A : "#333"}`, background: sizeKey === s.key ? "rgba(124,58,237,0.1)" : "transparent", color: sizeKey === s.key ? A : "#888", fontSize: 11, cursor: "pointer" }}>{s.label}</button>)}</div>
            </div>
          </div>
        )}
      </div>

      <div className="clvio-doc" style={{ width: 850, margin: "0 auto", backgroundColor: BG, boxShadow: `0 0 60px rgba(124,58,237,0.15)`, overflow: "hidden" }}>
        <div className="clvio-zoom" style={{ width: Math.round(850 / scale), zoom: scale }}>
          {/* Header */}
          <div style={{ background: `linear-gradient(135deg, ${BG}, #1a1a1a)`, padding: "32px 48px 24px", borderBottom: `2px solid ${A}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <E value={data.personal.name} onChange={v => setP({ name: v })} editing={editing} style={{ fontSize: 30, fontWeight: 900, color: "white", display: "block", marginBottom: 4 }} />
                <E value={data.personal.subtitle} onChange={v => setP({ subtitle: v })} editing={editing} style={{ fontSize: 12, color: A, letterSpacing: "0.06em", display: "block" }} />
              </div>
              <div style={{ textAlign: "right" }}>
                {[data.personal.email, data.personal.phone, data.personal.location, data.personal.website].map((v, i) => <E key={i} value={v} onChange={nv => setP([{ email: nv }, { phone: nv }, { location: nv }, { website: nv }][i])} editing={editing} style={{ fontSize: 10, color: "#9ca3af", display: "block", marginBottom: 2 }} />)}
              </div>
            </div>
          </div>

          {/* Body */}
          <div style={{ padding: "36px 48px 48px", color: "#d1d5db" }}>
            {/* Recipient + date */}
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 28 }}>
              <div>
                {[data.recipient.company, data.recipient.street, data.recipient.cityZip, data.recipient.country].map((v, i) => <E key={i} value={v} onChange={nv => setR([{ company: nv }, { street: nv }, { cityZip: nv }, { country: nv }][i])} editing={editing} style={{ fontSize: 11, color: "#d1d5db", display: "block", lineHeight: 1.6 }} />)}
              </div>
              <E value={data.date} onChange={v => setData(d => ({ ...d, date: v }))} editing={editing} style={{ fontSize: 11, color: "#9ca3af", fontStyle: "italic" }} />
            </div>

            {/* Subject */}
            <div style={{ marginBottom: 22, paddingBottom: 14, borderBottom: `1px solid ${A}44` }}>
              <E value={data.subject} onChange={v => setData(d => ({ ...d, subject: v }))} editing={editing} style={{ fontSize: 13, fontWeight: 700, color: A }} />
            </div>

            <E value={data.salutation} onChange={v => setData(d => ({ ...d, salutation: v }))} editing={editing} style={{ fontSize: 12, color: "#d1d5db", display: "block", marginBottom: 16 }} />

            {data.bodyParagraphs.map((p, i) => (
              <div key={i} style={{ marginBottom: 12, display: "flex", gap: 8, alignItems: "flex-start" }}>
                {editing && <button type="button" onClick={() => setData(d => ({ ...d, bodyParagraphs: d.bodyParagraphs.filter((_, j) => j !== i) }))} style={{ padding: "2px 4px", fontSize: 10, color: "#f87171", background: "none", border: "none", cursor: "pointer", marginTop: 2, flexShrink: 0 }}>✕</button>}
                <E value={p} onChange={v => setData(d => ({ ...d, bodyParagraphs: d.bodyParagraphs.map((x, j) => j === i ? v : x) }))} editing={editing} multiline rows={4} style={{ fontSize: 11, color: "#9ca3af", lineHeight: 1.75, display: "block" }} />
              </div>
            ))}
            {editing && <button type="button" onClick={() => setData(d => ({ ...d, bodyParagraphs: [...d.bodyParagraphs, "Neuer Absatz..."] }))} style={{ fontSize: 11, color: A, background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, marginBottom: 16 }}><PlusIcon style={{ width: 12, height: 12 }} />Absatz hinzufügen</button>}

            <div style={{ marginTop: 24 }}>
              <E value={data.closing} onChange={v => setData(d => ({ ...d, closing: v }))} editing={editing} style={{ fontSize: 11, color: "#d1d5db", display: "block", marginBottom: 28 }} />
              <div style={{ width: 120, height: 1, backgroundColor: `${A}66`, marginBottom: 8 }} />
              <E value={data.signatureName} onChange={v => setData(d => ({ ...d, signatureName: v }))} editing={editing} style={{ fontSize: 12, fontWeight: 700, color: "white" }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
