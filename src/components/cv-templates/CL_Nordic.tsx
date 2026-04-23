"use client";
// ─── Anschreiben Template: Nordic (Skandinavischer Minimalismus) ─────────────
import { useState, useContext, createContext } from "react";
import { PrinterIcon, PencilSquareIcon, CheckIcon, PlusIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { FONTS, FONT_SIZES, CLData, DEFAULT_CL_DATA, uid, usePersistentCLState } from "./shared";

const DEFAULT_COLORS = { A:"#2563eb", BG:"#fafafa", HD:"#f0f2f5", S2:"#f5f7fa", CT:"#111827", CB:"#374151", CM:"#9ca3af" };
const hex2rgba = (hex:string,a:number) => { const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16); return `rgba(${r},${g},${b},${a})`; };
const ColCtx = createContext(DEFAULT_COLORS);

function E({ value, onChange, editing, multiline=false, style={} as React.CSSProperties, placeholder="...", rows=4 }: {
  value:string; onChange:(v:string)=>void; editing:boolean;
  multiline?:boolean; style?:React.CSSProperties; placeholder?:string; rows?:number;
}) {
  const {A}=useContext(ColCtx);
  const base: React.CSSProperties = { ...style, background: hex2rgba(A,0.06), border:`1px solid ${A}44`, borderRadius:4, padding:"2px 8px", outline:"none", width:"100%", fontFamily:"inherit", fontSize:"inherit", color:"inherit", lineHeight:"inherit", fontWeight:"inherit", boxSizing:"border-box" };
  if (!editing) return <span style={style}>{value||<span style={{opacity:0.35,fontStyle:"italic"}}>{placeholder}</span>}</span>;
  if (multiline) return <textarea style={{...base,resize:"vertical",display:"block"}} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={rows}/>;
  return <input style={base} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}/>;
}

export default function CL_Nordic() {
  const [data, setData] = usePersistentCLState<CLData>('cl_nordic_data', JSON.parse(JSON.stringify(DEFAULT_CL_DATA)));
  const [editing, setEditing] = useState(false);
  const [fontKey, setFontKey] = usePersistentCLState('cl_nordic_font', "poppins");
  const [sizeKey, setSizeKey] = usePersistentCLState('cl_nordic_size', "md");
  const [showDesign, setShowDesign] = useState(false);
  const [clrs, setClrs] = usePersistentCLState('cl_nordic_colors', DEFAULT_COLORS);
  const {A,BG,HD,S2,CT,CB,CM} = clrs;
  const curFont = FONTS.find(f=>f.key===fontKey)??FONTS[2];
  const curSize = FONT_SIZES.find(s=>s.key===sizeKey)??FONT_SIZES[2];
  const fnt = curFont.family; const scale = curSize.scale;
  const setP = (p:Partial<CLData["personal"]>)=>setData(d=>({...d,personal:{...d.personal,...p}}));
  const setR = (p:Partial<CLData["recipient"]>)=>setData(d=>({...d,recipient:{...d.recipient,...p}}));
  const doReset = ()=>{setData(JSON.parse(JSON.stringify(DEFAULT_CL_DATA)));setClrs(DEFAULT_COLORS);setFontKey("poppins");setSizeKey("md");};

  return (
  <ColCtx.Provider value={clrs}>
    <div style={{minHeight:"100vh",background:"#e8ecf0",padding:"24px 16px",fontFamily:fnt}}>
      <style>{`
        ${curFont.gf?`@import url('https://fonts.googleapis.com/css2?family=${curFont.gf}&display=swap')`:""};
        .clnord-doc, .clnord-doc * { font-family: ${fnt} !important; }
        @media print {
          @page{size:A4 portrait;margin:0;}
          *,*::before,*::after{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;}
          body *{visibility:hidden!important;}
          .clnord-doc,.clnord-doc *{visibility:visible!important;}
          .clnord-doc{position:absolute!important;top:0!important;left:0!important;width:210mm!important;box-shadow:none!important;margin:0!important;}
          .clnord-zoom{zoom:1!important;width:100%!important;}
          .clnord-ctrl{display:none!important;}
        }
      `}</style>

      {/* Controls */}
      <div className="clnord-ctrl" style={{maxWidth:850,margin:"0 auto 16px",display:"flex",gap:8,flexWrap:"wrap"}}>
        <button onClick={()=>setEditing(e=>!e)} style={{padding:"7px 16px",borderRadius:6,fontSize:13,fontWeight:600,cursor:"pointer",border:"none",backgroundColor:editing?"#16a34a":A,color:"white",display:"flex",alignItems:"center",gap:6}}>
          {editing?<CheckIcon style={{width:16,height:16}}/>:<PencilSquareIcon style={{width:16,height:16}}/>}{editing?"Fertig":"Bearbeiten"}
        </button>
        <button onClick={()=>window.print()} style={{padding:"7px 16px",borderRadius:6,fontSize:13,fontWeight:600,cursor:"pointer",border:"none",backgroundColor:"#374151",color:"white",display:"flex",alignItems:"center",gap:6}}>
          <PrinterIcon style={{width:16,height:16}}/>Drucken
        </button>
        <button onClick={()=>setShowDesign(v=>!v)} style={{padding:"7px 16px",borderRadius:6,fontSize:13,cursor:"pointer",border:`1px solid ${showDesign?A:"#ccc"}`,backgroundColor:"transparent",color:showDesign?A:"#555"}}>🎨 Design</button>
        <button onClick={doReset} style={{padding:"7px 16px",borderRadius:6,fontSize:13,cursor:"pointer",border:"1px solid #ccc",backgroundColor:"transparent",color:"#555",display:"flex",alignItems:"center",gap:6}}>
          <XMarkIcon style={{width:16,height:16}}/>Reset
        </button>
        {showDesign&&(
          <div style={{width:"100%",background:"white",border:"1px solid #ddd",borderRadius:10,padding:"14px 18px",display:"flex",gap:24,flexWrap:"wrap"}}>
            <div><div style={{fontSize:10,fontWeight:700,color:"#bbb",marginBottom:7,textTransform:"uppercase",letterSpacing:"0.1em"}}>Schriftart</div>
              <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>{FONTS.map(f=><button key={f.key} onClick={()=>setFontKey(f.key)} style={{padding:"3px 9px",borderRadius:4,border:`1px solid ${fontKey===f.key?A:"#ddd"}`,background:fontKey===f.key?hex2rgba(A,0.1):"transparent",color:fontKey===f.key?A:"#aaa",fontSize:11,cursor:"pointer",fontFamily:f.family}}>{f.label}</button>)}</div>
            </div>
            <div><div style={{fontSize:10,fontWeight:700,color:"#bbb",marginBottom:7,textTransform:"uppercase",letterSpacing:"0.1em"}}>Schriftgröße</div>
              <div style={{display:"flex",gap:5}}>{FONT_SIZES.map(s=><button key={s.key} onClick={()=>setSizeKey(s.key)} style={{padding:"3px 12px",borderRadius:4,border:`1px solid ${sizeKey===s.key?A:"#ddd"}`,background:sizeKey===s.key?hex2rgba(A,0.1):"transparent",color:sizeKey===s.key?A:"#aaa",fontSize:11,cursor:"pointer"}}>{s.label}</button>)}</div>
            </div>
            <div style={{flex:1}}><div style={{fontSize:10,fontWeight:700,color:"#bbb",marginBottom:7,textTransform:"uppercase",letterSpacing:"0.1em"}}>Farben</div>
              <div style={{display:"flex",gap:10,flexWrap:"wrap",alignItems:"flex-end"}}>
                {([{k:"A" as const,l:"Blau"},{k:"BG" as const,l:"BG"},{k:"HD" as const,l:"Kopf"},{k:"S2" as const,l:"Zeile"},{k:"CT" as const,l:"Titel"},{k:"CB" as const,l:"Text"},{k:"CM" as const,l:"Meta"}]).map(({k,l})=>(
                  <label key={k} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3,cursor:"pointer"}}>
                    <input type="color" value={clrs[k]} onChange={e=>setClrs(c=>({...c,[k]:e.target.value}))} style={{width:32,height:32,padding:2,borderRadius:6,border:"1px solid #ddd",cursor:"pointer",background:"none"}}/>
                    <span style={{fontSize:9,color:"#bbb"}}>{l}</span>
                  </label>
                ))}
                <button onClick={()=>setClrs(DEFAULT_COLORS)} style={{padding:"4px 10px",borderRadius:5,fontSize:11,border:"1px solid #ddd",background:"transparent",color:"#aaa",cursor:"pointer",alignSelf:"center"}}>↺ Reset</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Document */}
      <div className="clnord-doc" style={{width:850,margin:"0 auto",backgroundColor:BG,boxShadow:"0 2px 24px rgba(0,0,0,0.08)",overflow:"hidden"}}>
        <div className="clnord-zoom" style={{width:Math.round(850/scale),zoom:scale}}>
          {/* Thin top accent */}
          <div style={{height:4,backgroundColor:A}}/>

          {/* Header */}
          <div style={{backgroundColor:HD,padding:"40px 56px 32px"}}>
            <E value={data.personal.name} onChange={v=>setP({name:v})} editing={editing} style={{fontSize:34,fontWeight:300,color:CT,display:"block",letterSpacing:"-0.01em"}}/>
            <div style={{width:48,height:2,backgroundColor:A,margin:"12px 0 10px"}}/>
            <E value={data.personal.subtitle} onChange={v=>setP({subtitle:v})} editing={editing} style={{fontSize:12,color:CM,display:"block",fontWeight:400,letterSpacing:"0.04em"}}/>
            <div style={{display:"flex",gap:24,flexWrap:"wrap",marginTop:20}}>
              {[data.personal.email,data.personal.phone,data.personal.location,data.personal.website,data.personal.linkedin,data.personal.github].map((v,i)=>(
                <E key={i} value={v} onChange={nv=>setP([{email:nv},{phone:nv},{location:nv},{website:nv},{linkedin:nv},{github:nv}][i])} editing={editing} style={{fontSize:11,color:CM}}/>
              ))}
            </div>
          </div>

          {/* Body */}
          <div style={{padding:"40px 56px 60px",color:CB}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:36,gap:16,alignItems:"flex-start"}}>
              <div style={{flex:1}}>
                {[data.recipient.company,data.recipient.street,data.recipient.cityZip,data.recipient.country].map((v,i)=>(
                  <E key={i} value={v} onChange={nv=>setR([{company:nv},{street:nv},{cityZip:nv},{country:nv}][i])} editing={editing} style={{fontSize:12,color:CB,display:"block",lineHeight:1.8}}/>
                ))}
              </div>
              <div style={{textAlign:"right",paddingTop:2}}>
                <E value={data.date} onChange={v=>setData(d=>({...d,date:v}))} editing={editing} style={{fontSize:11,color:CM}}/>
              </div>
            </div>

            <div style={{marginBottom:28,paddingBottom:16,borderBottom:`1px solid #e5e7eb`}}>
              <E value={data.subject} onChange={v=>setData(d=>({...d,subject:v}))} editing={editing} style={{fontSize:15,fontWeight:600,color:CT}}/>
            </div>

            <E value={data.salutation} onChange={v=>setData(d=>({...d,salutation:v}))} editing={editing} style={{fontSize:12,color:CB,display:"block",marginBottom:20}}/>

            {data.bodyParagraphs.map((p,i)=>(
              <div key={i} style={{marginBottom:18,display:"flex",gap:8,alignItems:"flex-start"}}>
                {editing&&<button type="button" onClick={()=>setData(d=>({...d,bodyParagraphs:d.bodyParagraphs.filter((_,j)=>j!==i)}))} style={{padding:"2px 4px",fontSize:10,color:"#f87171",background:"none",border:"none",cursor:"pointer",marginTop:2,flexShrink:0}}>✕</button>}
                <E value={p} onChange={v=>setData(d=>({...d,bodyParagraphs:d.bodyParagraphs.map((x,j)=>j===i?v:x)}))} editing={editing} multiline rows={4} style={{fontSize:12,color:CB,lineHeight:1.9,display:"block"}}/>
              </div>
            ))}
            {editing&&<button type="button" onClick={()=>setData(d=>({...d,bodyParagraphs:[...d.bodyParagraphs,"Neuer Absatz..."]}))} style={{fontSize:11,color:A,background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:4,marginBottom:16}}><PlusIcon style={{width:12,height:12}}/>Absatz hinzufügen</button>}

            <div style={{marginTop:40}}>
              <E value={data.closing} onChange={v=>setData(d=>({...d,closing:v}))} editing={editing} style={{fontSize:12,color:CB,display:"block",marginBottom:44}}/>
              <div style={{width:120,height:1,backgroundColor:"#d1d5db",marginBottom:12}}/>
              <E value={data.signatureName} onChange={v=>setData(d=>({...d,signatureName:v}))} editing={editing} style={{fontSize:15,fontWeight:600,color:CT,display:"block"}}/>
            </div>
          </div>
        </div>
      </div>
    </div>
  </ColCtx.Provider>
  );
}
