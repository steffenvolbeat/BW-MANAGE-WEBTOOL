"use client";
// ─── Anschreiben Template: Glassmorphism (Frosted Glass Stil) ────────────────
import { useState, useContext, createContext } from "react";
import { PrinterIcon, PencilSquareIcon, CheckIcon, PlusIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { FONTS, FONT_SIZES, CLData, DEFAULT_CL_DATA, uid, usePersistentCLState } from "./shared";

const DEFAULT_COLORS = { A:"#c084fc", BG:"#1a0a2e", HD:"#2d1b4e", S2:"#23104a", CT:"#f3e8ff", CB:"#ddd6fe", CM:"#a78bfa" };
const hex2rgba = (hex:string,a:number) => { const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16); return `rgba(${r},${g},${b},${a})`; };
const ColCtx = createContext(DEFAULT_COLORS);

function E({ value, onChange, editing, multiline=false, style={} as React.CSSProperties, placeholder="...", rows=4 }: {
  value:string; onChange:(v:string)=>void; editing:boolean;
  multiline?:boolean; style?:React.CSSProperties; placeholder?:string; rows?:number;
}) {
  const {A}=useContext(ColCtx);
  const base: React.CSSProperties = { ...style, background: hex2rgba(A,0.1), border:`1px solid ${A}44`, borderRadius:4, padding:"2px 8px", outline:"none", width:"100%", fontFamily:"inherit", fontSize:"inherit", color:"inherit", lineHeight:"inherit", fontWeight:"inherit", boxSizing:"border-box" };
  if (!editing) return <span style={style}>{value||<span style={{opacity:0.35,fontStyle:"italic"}}>{placeholder}</span>}</span>;
  if (multiline) return <textarea style={{...base,resize:"vertical",display:"block"}} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={rows}/>;
  return <input style={base} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}/>;
}

export default function CL_Glassmorphism() {
  const [data, setData] = usePersistentCLState<CLData>('cl_glassmorphism_data', JSON.parse(JSON.stringify(DEFAULT_CL_DATA)));
  const [editing, setEditing] = useState(false);
  const [fontKey, setFontKey] = usePersistentCLState('cl_glassmorphism_font', "poppins");
  const [sizeKey, setSizeKey] = usePersistentCLState('cl_glassmorphism_size', "md");
  const [showDesign, setShowDesign] = useState(false);
  const [clrs, setClrs] = usePersistentCLState('cl_glassmorphism_colors', DEFAULT_COLORS);
  const {A,BG,HD,S2,CT,CB,CM} = clrs;
  const curFont = FONTS.find(f=>f.key===fontKey)??FONTS[2];
  const curSize = FONT_SIZES.find(s=>s.key===sizeKey)??FONT_SIZES[2];
  const fnt = curFont.family; const scale = curSize.scale;
  const setP = (p:Partial<CLData["personal"]>)=>setData(d=>({...d,personal:{...d.personal,...p}}));
  const setR = (p:Partial<CLData["recipient"]>)=>setData(d=>({...d,recipient:{...d.recipient,...p}}));
  const doReset = ()=>{setData(JSON.parse(JSON.stringify(DEFAULT_CL_DATA)));setClrs(DEFAULT_COLORS);setFontKey("poppins");setSizeKey("md");};

  const glassBg = `radial-gradient(ellipse at 20% 20%,${hex2rgba(A,0.25)} 0%,transparent 50%),radial-gradient(ellipse at 80% 80%,${hex2rgba("#6366f1",0.2)} 0%,transparent 50%),${BG}`;
  const glassPanel = { background:`rgba(255,255,255,0.07)`, backdropFilter:"blur(16px)", WebkitBackdropFilter:"blur(16px)", border:`1px solid rgba(255,255,255,0.15)`, borderRadius:16 } as React.CSSProperties;

  return (
  <ColCtx.Provider value={clrs}>
    <div style={{minHeight:"100vh",background:"#0f0520",padding:"24px 16px",fontFamily:fnt}}>
      <style>{`
        ${curFont.gf?`@import url('https://fonts.googleapis.com/css2?family=${curFont.gf}&display=swap')`:""};
        .clgl-doc, .clgl-doc * { font-family: ${fnt} !important; }
        @media print {
          @page{size:A4 portrait;margin:0;}
          *,*::before,*::after{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;}
          body *{visibility:hidden!important;}
          .clgl-doc,.clgl-doc *{visibility:visible!important;}
          .clgl-doc{position:absolute!important;top:0!important;left:0!important;width:210mm!important;box-shadow:none!important;margin:0!important;}
          .clgl-zoom{zoom:1!important;width:100%!important;}
          .clgl-ctrl{display:none!important;}
        }
      `}</style>

      {/* Controls */}
      <div className="clgl-ctrl" style={{maxWidth:850,margin:"0 auto 16px",display:"flex",gap:8,flexWrap:"wrap"}}>
        <button onClick={()=>setEditing(e=>!e)} style={{padding:"7px 16px",borderRadius:8,fontSize:13,fontWeight:600,cursor:"pointer",border:"none",backgroundColor:editing?"#16a34a":A,color:editing?"white":"#1a0a2e",display:"flex",alignItems:"center",gap:6}}>
          {editing?<CheckIcon style={{width:16,height:16}}/>:<PencilSquareIcon style={{width:16,height:16}}/>}{editing?"Fertig":"Bearbeiten"}
        </button>
        <button onClick={()=>window.print()} style={{padding:"7px 16px",borderRadius:8,fontSize:13,fontWeight:600,cursor:"pointer",border:"none",backgroundColor:"#374151",color:"white",display:"flex",alignItems:"center",gap:6}}>
          <PrinterIcon style={{width:16,height:16}}/>Drucken
        </button>
        <button onClick={()=>setShowDesign(v=>!v)} style={{padding:"7px 16px",borderRadius:8,fontSize:13,cursor:"pointer",border:`1px solid ${showDesign?A:"#555"}`,backgroundColor:"transparent",color:showDesign?A:"#aaa"}}>🎨 Design</button>
        <button onClick={doReset} style={{padding:"7px 16px",borderRadius:8,fontSize:13,cursor:"pointer",border:"1px solid #555",backgroundColor:"transparent",color:"#aaa",display:"flex",alignItems:"center",gap:6}}>
          <XMarkIcon style={{width:16,height:16}}/>Reset
        </button>
        {showDesign&&(
          <div style={{width:"100%",background:"rgba(255,255,255,0.05)",backdropFilter:"blur(12px)",WebkitBackdropFilter:"blur(12px)",border:`1px solid ${A}33`,borderRadius:12,padding:"14px 18px",display:"flex",gap:24,flexWrap:"wrap"}}>
            <div><div style={{fontSize:10,fontWeight:700,color:"#666",marginBottom:7,textTransform:"uppercase",letterSpacing:"0.1em"}}>Schriftart</div>
              <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>{FONTS.map(f=><button key={f.key} onClick={()=>setFontKey(f.key)} style={{padding:"3px 9px",borderRadius:4,border:`1px solid ${fontKey===f.key?A:"#444"}`,background:fontKey===f.key?hex2rgba(A,0.15):"transparent",color:fontKey===f.key?A:"#888",fontSize:11,cursor:"pointer",fontFamily:f.family}}>{f.label}</button>)}</div>
            </div>
            <div><div style={{fontSize:10,fontWeight:700,color:"#666",marginBottom:7,textTransform:"uppercase",letterSpacing:"0.1em"}}>Schriftgröße</div>
              <div style={{display:"flex",gap:5}}>{FONT_SIZES.map(s=><button key={s.key} onClick={()=>setSizeKey(s.key)} style={{padding:"3px 12px",borderRadius:4,border:`1px solid ${sizeKey===s.key?A:"#444"}`,background:sizeKey===s.key?hex2rgba(A,0.15):"transparent",color:sizeKey===s.key?A:"#888",fontSize:11,cursor:"pointer"}}>{s.label}</button>)}</div>
            </div>
            <div style={{flex:1}}><div style={{fontSize:10,fontWeight:700,color:"#666",marginBottom:7,textTransform:"uppercase",letterSpacing:"0.1em"}}>Farben</div>
              <div style={{display:"flex",gap:10,flexWrap:"wrap",alignItems:"flex-end"}}>
                {([{k:"A" as const,l:"Glas"},{k:"BG" as const,l:"BG"},{k:"HD" as const,l:"Kopf"},{k:"S2" as const,l:"Panel"},{k:"CT" as const,l:"Titel"},{k:"CB" as const,l:"Text"},{k:"CM" as const,l:"Gedimmt"}]).map(({k,l})=>(
                  <label key={k} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3,cursor:"pointer"}}>
                    <input type="color" value={clrs[k]} onChange={e=>setClrs(c=>({...c,[k]:e.target.value}))} style={{width:32,height:32,padding:2,borderRadius:6,border:"1px solid #555",cursor:"pointer",background:"none"}}/>
                    <span style={{fontSize:9,color:"#777"}}>{l}</span>
                  </label>
                ))}
                <button onClick={()=>setClrs(DEFAULT_COLORS)} style={{padding:"4px 10px",borderRadius:5,fontSize:11,border:"1px solid #555",background:"transparent",color:"#888",cursor:"pointer",alignSelf:"center"}}>↺ Reset</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Document */}
      <div className="clgl-doc" style={{width:850,margin:"0 auto",background:glassBg,boxShadow:"0 20px 80px rgba(0,0,0,0.7)",overflow:"hidden",position:"relative"}}>
        <div className="clgl-zoom" style={{width:Math.round(850/scale),zoom:scale}}>
          {/* Floating orbs (decorative) */}
          <div style={{position:"absolute",top:"-60px",right:"-60px",width:280,height:280,borderRadius:"50%",background:`radial-gradient(${hex2rgba(A,0.35)},transparent 70%)`,filter:"blur(40px)",pointerEvents:"none",zIndex:0}}/>
          <div style={{position:"absolute",bottom:"-80px",left:"-40px",width:240,height:240,borderRadius:"50%",background:`radial-gradient(${hex2rgba("#6366f1",0.25)},transparent 70%)`,filter:"blur(40px)",pointerEvents:"none",zIndex:0}}/>

          {/* Header – glass card */}
          <div style={{...glassPanel,margin:"28px 32px 0",padding:"24px 28px",position:"relative",zIndex:1}}>
            <div style={{position:"absolute",inset:0,background:`linear-gradient(135deg,${hex2rgba(A,0.12)},transparent)`,borderRadius:16,pointerEvents:"none"}}/>
            <E value={data.personal.name} onChange={v=>setP({name:v})} editing={editing} style={{fontSize:32,fontWeight:700,color:CT,display:"block",letterSpacing:"0.02em"}}/>
            <E value={data.personal.subtitle} onChange={v=>setP({subtitle:v})} editing={editing} style={{fontSize:13,color:A,display:"block",marginTop:4,fontWeight:500,letterSpacing:"0.06em"}}/>
            <div style={{marginTop:14,display:"flex",gap:20,flexWrap:"wrap"}}>
              {[data.personal.email,data.personal.phone,data.personal.location,data.personal.website,data.personal.linkedin,data.personal.github].map((v,i)=>(
                <E key={i} value={v} onChange={nv=>setP([{email:nv},{phone:nv},{location:nv},{website:nv},{linkedin:nv},{github:nv}][i])} editing={editing} style={{fontSize:11,color:CM}}/>
              ))}
            </div>
          </div>

          {/* Body */}
          <div style={{padding:"24px 32px 40px",position:"relative",zIndex:1}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:20,gap:16,alignItems:"flex-start"}}>
              <div style={{...glassPanel,padding:"14px 18px",flex:1}}>
                {[data.recipient.company,data.recipient.street,data.recipient.cityZip,data.recipient.country].map((v,i)=>(
                  <E key={i} value={v} onChange={nv=>setR([{company:nv},{street:nv},{cityZip:nv},{country:nv}][i])} editing={editing} style={{fontSize:11,color:CB,display:"block",lineHeight:1.7}}/>
                ))}
              </div>
              <div style={{paddingTop:4}}>
                <E value={data.date} onChange={v=>setData(d=>({...d,date:v}))} editing={editing} style={{fontSize:11,color:CM}}/>
              </div>
            </div>

            <div style={{...glassPanel,padding:"10px 16px",marginBottom:20}}>
              <E value={data.subject} onChange={v=>setData(d=>({...d,subject:v}))} editing={editing} style={{fontSize:13,fontWeight:600,color:CT}}/>
            </div>

            <E value={data.salutation} onChange={v=>setData(d=>({...d,salutation:v}))} editing={editing} style={{fontSize:12,color:CB,display:"block",marginBottom:18}}/>

            {data.bodyParagraphs.map((p,i)=>(
              <div key={i} style={{marginBottom:14,display:"flex",gap:8,alignItems:"flex-start"}}>
                {editing&&<button type="button" onClick={()=>setData(d=>({...d,bodyParagraphs:d.bodyParagraphs.filter((_,j)=>j!==i)}))} style={{padding:"2px 4px",fontSize:10,color:"#f87171",background:"none",border:"none",cursor:"pointer",marginTop:2,flexShrink:0}}>✕</button>}
                <E value={p} onChange={v=>setData(d=>({...d,bodyParagraphs:d.bodyParagraphs.map((x,j)=>j===i?v:x)}))} editing={editing} multiline rows={4} style={{fontSize:11.5,color:CB,lineHeight:1.8,display:"block"}}/>
              </div>
            ))}
            {editing&&<button type="button" onClick={()=>setData(d=>({...d,bodyParagraphs:[...d.bodyParagraphs,"Neuer Absatz..."]}))} style={{fontSize:11,color:A,background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:4,marginBottom:16}}><PlusIcon style={{width:12,height:12}}/>Absatz hinzufügen</button>}

            <div style={{marginTop:28,...glassPanel,padding:"20px 24px"}}>
              <E value={data.closing} onChange={v=>setData(d=>({...d,closing:v}))} editing={editing} style={{fontSize:11,color:CB,display:"block",marginBottom:32}}/>
              <div style={{width:"40%",borderBottom:`1px solid ${A}66`,marginBottom:6}}/>
              <E value={data.signatureName} onChange={v=>setData(d=>({...d,signatureName:v}))} editing={editing} style={{fontSize:15,fontWeight:700,color:CT,display:"block"}}/>
            </div>
          </div>
        </div>
      </div>
    </div>
  </ColCtx.Provider>
  );
}
