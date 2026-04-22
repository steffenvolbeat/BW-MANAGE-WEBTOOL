"use client";
// ─── Anschreiben Template: Typewriter (Retro Schreibmaschinen-Stil) ──────────
import { useState, useContext, createContext } from "react";
import { PrinterIcon, PencilSquareIcon, CheckIcon, PlusIcon, TrashIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { FONTS, FONT_SIZES, CLData, DEFAULT_CL_DATA, uid, usePersistentCLState } from "./shared";

const DEFAULT_COLORS = { A:"#8B4513", BG:"#f5f0e8", HD:"#2d1a00", S2:"#ede8dc", CT:"#1a0f00", CB:"#2c1a00", CM:"#7a6248" };
const hex2rgba = (hex:string,a:number) => { const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16); return `rgba(${r},${g},${b},${a})`; };
const ColCtx = createContext(DEFAULT_COLORS);

function E({ value, onChange, editing, multiline=false, style={} as React.CSSProperties, placeholder="...", rows=4 }: {
  value:string; onChange:(v:string)=>void; editing:boolean;
  multiline?:boolean; style?:React.CSSProperties; placeholder?:string; rows?:number;
}) {
  const {A}=useContext(ColCtx);
  const base: React.CSSProperties = { ...style, background: hex2rgba(A,0.06), border:`1px dashed ${A}77`, borderRadius:2, padding:"2px 4px", outline:"none", width:"100%", fontFamily:"inherit", fontSize:"inherit", color:"inherit", lineHeight:"inherit", fontWeight:"inherit", boxSizing:"border-box" };
  if (!editing) return <span style={style}>{value||<span style={{opacity:0.35,fontStyle:"italic"}}>{placeholder}</span>}</span>;
  if (multiline) return <textarea style={{...base,resize:"vertical",display:"block"}} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={rows}/>;
  return <input style={base} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}/>;
}

export default function CL_Typewriter() {
  const [data, setData] = usePersistentCLState<CLData>('cl_typewriter_data', JSON.parse(JSON.stringify(DEFAULT_CL_DATA)));
  const [editing, setEditing] = useState(false);
  const [fontKey, setFontKey] = usePersistentCLState('cl_typewriter_font', "georgia");
  const [sizeKey, setSizeKey] = usePersistentCLState('cl_typewriter_size', "md");
  const [showDesign, setShowDesign] = useState(false);
  const [clrs, setClrs] = usePersistentCLState('cl_typewriter_colors', DEFAULT_COLORS);
  const {A,BG,HD,S2,CT,CB,CM} = clrs;
  const curFont = FONTS.find(f=>f.key===fontKey)??FONTS[7];
  const curSize = FONT_SIZES.find(s=>s.key===sizeKey)??FONT_SIZES[2];
  const fnt = curFont.family; const scale = curSize.scale;
  const setP = (p:Partial<CLData["personal"]>)=>setData(d=>({...d,personal:{...d.personal,...p}}));
  const setR = (p:Partial<CLData["recipient"]>)=>setData(d=>({...d,recipient:{...d.recipient,...p}}));
  const doReset = ()=>{setData(JSON.parse(JSON.stringify(DEFAULT_CL_DATA)));setClrs(DEFAULT_COLORS);setFontKey("georgia");setSizeKey("md");};

  const monoFamily = "'Courier New', Courier, 'Courier', monospace";

  return (
  <ColCtx.Provider value={clrs}>
    <div style={{minHeight:"100vh",background:"#2a1a0a",padding:"24px 16px",fontFamily:fnt}}>
      <style>{`
        ${curFont.gf?`@import url('https://fonts.googleapis.com/css2?family=${curFont.gf}&display=swap')`:""};
        .cltw-doc, .cltw-doc * { font-family: ${fnt} !important; }
        @media print {
          @page{size:A4 portrait;margin:0;}
          *,*::before,*::after{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;}
          body *{visibility:hidden!important;}
          .cltw-doc,.cltw-doc *{visibility:visible!important;}
          .cltw-doc{position:absolute!important;top:0!important;left:0!important;width:210mm!important;box-shadow:none!important;margin:0!important;}
          .cltw-zoom{zoom:1!important;width:100%!important;}
          .cltw-ctrl{display:none!important;}
        }
      `}</style>

      {/* Controls */}
      <div className="cltw-ctrl" style={{maxWidth:850,margin:"0 auto 16px",display:"flex",gap:8,flexWrap:"wrap"}}>
        <button onClick={()=>setEditing(e=>!e)} style={{padding:"7px 16px",borderRadius:6,fontSize:13,fontWeight:600,cursor:"pointer",border:"none",backgroundColor:editing?"#16a34a":A,color:editing?"white":"white",display:"flex",alignItems:"center",gap:6}}>
          {editing?<CheckIcon style={{width:16,height:16}}/>:<PencilSquareIcon style={{width:16,height:16}}/>}{editing?"Fertig":"Bearbeiten"}
        </button>
        <button onClick={()=>window.print()} style={{padding:"7px 16px",borderRadius:6,fontSize:13,fontWeight:600,cursor:"pointer",border:"none",backgroundColor:"#374151",color:"white",display:"flex",alignItems:"center",gap:6}}>
          <PrinterIcon style={{width:16,height:16}}/>Drucken
        </button>
        <button onClick={()=>setShowDesign(v=>!v)} style={{padding:"7px 16px",borderRadius:6,fontSize:13,cursor:"pointer",border:`1px solid ${showDesign?A:"#555"}`,backgroundColor:"transparent",color:showDesign?A:"#aaa"}}>🎨 Design</button>
        <button onClick={doReset} style={{padding:"7px 16px",borderRadius:6,fontSize:13,cursor:"pointer",border:"1px solid #555",backgroundColor:"transparent",color:"#aaa",display:"flex",alignItems:"center",gap:6}}>
          <XMarkIcon style={{width:16,height:16}}/>Reset
        </button>
        {showDesign&&(
          <div style={{width:"100%",background:"#1a0f00",border:`1px solid ${A}55`,borderRadius:10,padding:"14px 18px",display:"flex",gap:24,flexWrap:"wrap"}}>
            <div><div style={{fontSize:10,fontWeight:700,color:"#666",marginBottom:7,textTransform:"uppercase",letterSpacing:"0.1em"}}>Schriftart</div>
              <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>{FONTS.map(f=><button key={f.key} onClick={()=>setFontKey(f.key)} style={{padding:"3px 9px",borderRadius:4,border:`1px solid ${fontKey===f.key?A:"#444"}`,background:fontKey===f.key?hex2rgba(A,0.15):"transparent",color:fontKey===f.key?A:"#888",fontSize:11,cursor:"pointer",fontFamily:f.family}}>{f.label}</button>)}</div>
            </div>
            <div><div style={{fontSize:10,fontWeight:700,color:"#666",marginBottom:7,textTransform:"uppercase",letterSpacing:"0.1em"}}>Schriftgröße</div>
              <div style={{display:"flex",gap:5}}>{FONT_SIZES.map(s=><button key={s.key} onClick={()=>setSizeKey(s.key)} style={{padding:"3px 12px",borderRadius:4,border:`1px solid ${sizeKey===s.key?A:"#444"}`,background:sizeKey===s.key?hex2rgba(A,0.15):"transparent",color:sizeKey===s.key?A:"#888",fontSize:11,cursor:"pointer"}}>{s.label}</button>)}</div>
            </div>
            <div style={{flex:1}}><div style={{fontSize:10,fontWeight:700,color:"#666",marginBottom:7,textTransform:"uppercase",letterSpacing:"0.1em"}}>Farben</div>
              <div style={{display:"flex",gap:10,flexWrap:"wrap",alignItems:"flex-end"}}>
                {([{k:"A" as const,l:"Akzent"},{k:"BG" as const,l:"Papier"},{k:"HD" as const,l:"Briefkopf"},{k:"S2" as const,l:"Sektion"},{k:"CT" as const,l:"Titel"},{k:"CB" as const,l:"Fließtext"},{k:"CM" as const,l:"Gedimmt"}]).map(({k,l})=>(
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
      <div className="cltw-doc" style={{width:850,margin:"0 auto",backgroundColor:BG,boxShadow:"0 8px 48px rgba(0,0,0,0.5)",overflow:"hidden",position:"relative"}}>
        <div className="cltw-zoom" style={{width:Math.round(850/scale),zoom:scale}}>
          {/* Paper texture overlay */}
          <div style={{position:"absolute",top:0,left:0,right:0,bottom:0,backgroundImage:`repeating-linear-gradient(0deg,transparent,transparent 27px,${hex2rgba(A,0.04)} 27px,${hex2rgba(A,0.04)} 28px)`,pointerEvents:"none",zIndex:0}}/>

          {/* Letterhead */}
          <div style={{background:HD,padding:"28px 48px 20px",borderBottom:`4px solid ${A}`,position:"relative",zIndex:1}}>
            <div style={{textAlign:"center",marginBottom:8}}>
              <div style={{fontFamily:monoFamily,fontSize:9,color:`${A}aa`,letterSpacing:"0.4em",textTransform:"uppercase",marginBottom:4}}>— Bewerbungsschreiben —</div>
              <E value={data.personal.name} onChange={v=>setP({name:v})} editing={editing} style={{fontFamily:monoFamily,fontSize:28,fontWeight:900,color:CT,display:"block",letterSpacing:"0.08em",textAlign:"center"}}/>
              <E value={data.personal.subtitle} onChange={v=>setP({subtitle:v})} editing={editing} style={{fontFamily:monoFamily,fontSize:11,color:A,display:"block",textAlign:"center",marginTop:4,letterSpacing:"0.12em"}}/>
            </div>
            <div style={{borderTop:`1px solid ${A}66`,borderBottom:`1px solid ${A}66`,padding:"8px 0",marginTop:12,display:"flex",justifyContent:"center",gap:24,flexWrap:"wrap"}}>
              {[data.personal.email,data.personal.phone,data.personal.location,data.personal.website].map((v,i)=>(
                <E key={i} value={v} onChange={nv=>setP([{email:nv},{phone:nv},{location:nv},{website:nv}][i])} editing={editing} style={{fontFamily:monoFamily,fontSize:10,color:CM,textAlign:"center"}}/>
              ))}
            </div>
          </div>

          {/* Body */}
          <div style={{padding:"36px 48px 48px",color:CB,position:"relative",zIndex:1}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:28,alignItems:"flex-start"}}>
              <div style={{background:S2,padding:"12px 16px",borderLeft:`3px solid ${A}`}}>
                {[data.recipient.company,data.recipient.street,data.recipient.cityZip,data.recipient.country].map((v,i)=>(
                  <E key={i} value={v} onChange={nv=>setR([{company:nv},{street:nv},{cityZip:nv},{country:nv}][i])} editing={editing} style={{fontFamily:monoFamily,fontSize:11,color:CB,display:"block",lineHeight:1.7}}/>
                ))}
              </div>
              <div style={{textAlign:"right"}}>
                <E value={data.date} onChange={v=>setData(d=>({...d,date:v}))} editing={editing} style={{fontFamily:monoFamily,fontSize:11,color:CM,fontStyle:"italic"}}/>
              </div>
            </div>

            {/* Decorative divider */}
            <div style={{textAlign:"center",marginBottom:18,fontFamily:monoFamily,color:A,fontSize:12,letterSpacing:"0.2em"}}>
              ✦ ─── ✦ ─── ✦
            </div>

            <div style={{marginBottom:18,paddingBottom:12,borderBottom:`1px dashed ${A}88`}}>
              <E value={data.subject} onChange={v=>setData(d=>({...d,subject:v}))} editing={editing} style={{fontFamily:monoFamily,fontSize:13,fontWeight:700,color:CT,letterSpacing:"0.03em"}}/>
            </div>

            <E value={data.salutation} onChange={v=>setData(d=>({...d,salutation:v}))} editing={editing} style={{fontFamily:monoFamily,fontSize:12,color:CB,display:"block",marginBottom:18}}/>

            {data.bodyParagraphs.map((p,i)=>(
              <div key={i} style={{marginBottom:14,display:"flex",gap:8,alignItems:"flex-start"}}>
                {editing&&<button type="button" onClick={()=>setData(d=>({...d,bodyParagraphs:d.bodyParagraphs.filter((_,j)=>j!==i)}))} style={{padding:"2px 4px",fontSize:10,color:"#f87171",background:"none",border:"none",cursor:"pointer",marginTop:2,flexShrink:0}}>✕</button>}
                <E value={p} onChange={v=>setData(d=>({...d,bodyParagraphs:d.bodyParagraphs.map((x,j)=>j===i?v:x)}))} editing={editing} multiline rows={4} style={{fontFamily:monoFamily,fontSize:11,color:CB,lineHeight:1.85,display:"block"}}/>
              </div>
            ))}
            {editing&&<button type="button" onClick={()=>setData(d=>({...d,bodyParagraphs:[...d.bodyParagraphs,"Neuer Absatz..."]}))} style={{fontSize:11,color:A,background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:4,marginBottom:16}}><PlusIcon style={{width:12,height:12}}/>Absatz hinzufügen</button>}

            <div style={{marginTop:28}}>
              <E value={data.closing} onChange={v=>setData(d=>({...d,closing:v}))} editing={editing} style={{fontFamily:monoFamily,fontSize:11,color:CB,display:"block",marginBottom:32}}/>
              <div style={{width:"100%",borderBottom:`1px dashed ${A}66`,marginBottom:6}}/>
              <div style={{textAlign:"center",fontFamily:monoFamily,color:`${A}88`,fontSize:10,marginBottom:6,letterSpacing:"0.15em"}}>~ Unterschrift ~</div>
              <div style={{textAlign:"center"}}>
                <E value={data.signatureName} onChange={v=>setData(d=>({...d,signatureName:v}))} editing={editing} style={{fontFamily:monoFamily,fontSize:14,fontWeight:700,color:CT,letterSpacing:"0.06em",display:"inline-block"}}/>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </ColCtx.Provider>
  );
}
