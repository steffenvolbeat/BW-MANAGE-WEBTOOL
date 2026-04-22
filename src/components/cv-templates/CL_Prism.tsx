"use client";
// ─── Anschreiben Template: Prism (Holografisch/Regenbogen Stil) ──────────────
import { useState, useContext, createContext } from "react";
import { PrinterIcon, PencilSquareIcon, CheckIcon, PlusIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { FONTS, FONT_SIZES, CLData, DEFAULT_CL_DATA, uid, usePersistentCLState } from "./shared";

const DEFAULT_COLORS = { A:"#818cf8", BG:"#0f0f1a", HD:"#07070f", S2:"#13131f", CT:"#f0f0ff", CB:"#c8c8e8", CM:"#6060a0" };
const hex2rgba = (hex:string,a:number) => { const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16); return `rgba(${r},${g},${b},${a})`; };
const ColCtx = createContext(DEFAULT_COLORS);
const RAINBOW = "linear-gradient(90deg,#ff0000,#ff8800,#ffff00,#00ff88,#00ffff,#0088ff,#8800ff,#ff0088,#ff0000)";
const RAINBOW_TEXT = "linear-gradient(90deg,#ff5555,#ffaa55,#eeee55,#55ee99,#55eeee,#5599ff,#aa55ff,#ff55aa)";

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

export default function CL_Prism() {
  const [data, setData] = usePersistentCLState<CLData>('cl_prism_data', JSON.parse(JSON.stringify(DEFAULT_CL_DATA)));
  const [editing, setEditing] = useState(false);
  const [fontKey, setFontKey] = usePersistentCLState('cl_prism_font', "poppins");
  const [sizeKey, setSizeKey] = usePersistentCLState('cl_prism_size', "md");
  const [showDesign, setShowDesign] = useState(false);
  const [clrs, setClrs] = usePersistentCLState('cl_prism_colors', DEFAULT_COLORS);
  const {A,BG,HD,S2,CT,CB,CM} = clrs;
  const curFont = FONTS.find(f=>f.key===fontKey)??FONTS[2];
  const curSize = FONT_SIZES.find(s=>s.key===sizeKey)??FONT_SIZES[2];
  const fnt = curFont.family; const scale = curSize.scale;
  const setP = (p:Partial<CLData["personal"]>)=>setData(d=>({...d,personal:{...d.personal,...p}}));
  const setR = (p:Partial<CLData["recipient"]>)=>setData(d=>({...d,recipient:{...d.recipient,...p}}));
  const doReset = ()=>{setData(JSON.parse(JSON.stringify(DEFAULT_CL_DATA)));setClrs(DEFAULT_COLORS);setFontKey("poppins");setSizeKey("md");};

  return (
  <ColCtx.Provider value={clrs}>
    <div style={{minHeight:"100vh",background:"#05050f",padding:"24px 16px",fontFamily:fnt}}>
      <style>{`
        ${curFont.gf?`@import url('https://fonts.googleapis.com/css2?family=${curFont.gf}&display=swap')`:""};
        .clpr-doc, .clpr-doc * { font-family: ${fnt} !important; }
        .prism-name-text {
          background: ${RAINBOW_TEXT};
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          background-size: 200% auto;
        }
        @media print {
          @page{size:A4 portrait;margin:0;}html,body{height:0!important;overflow:visible!important;margin:0!important;padding:0!important;}
          *,*::before,*::after{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;}
          body *{visibility:hidden!important;}
          .clpr-doc,.clpr-doc *{visibility:visible!important;}
          .clpr-doc{position:absolute!important;top:0!important;left:0!important;width:210mm!important;box-shadow:none!important;margin:0!important;}
          .clpr-zoom{zoom:1!important;width:100%!important;}
          .clpr-ctrl{display:none!important;}
          .prism-name-text{-webkit-text-fill-color:${CT}!important;background:none!important;}
        }
      `}</style>

      {/* Controls */}
      <div className="clpr-ctrl" style={{maxWidth:850,margin:"0 auto 16px",display:"flex",gap:8,flexWrap:"wrap"}}>
        <button onClick={()=>setEditing(e=>!e)} style={{padding:"7px 16px",borderRadius:6,fontSize:13,fontWeight:600,cursor:"pointer",border:"none",backgroundColor:editing?"#16a34a":A,color:editing?"white":"#0f0f1a",display:"flex",alignItems:"center",gap:6}}>
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
          <div style={{width:"100%",background:HD,border:`1px solid ${A}33`,borderRadius:10,padding:"14px 18px",display:"flex",gap:24,flexWrap:"wrap"}}>
            <div><div style={{fontSize:10,fontWeight:700,color:"#666",marginBottom:7,textTransform:"uppercase",letterSpacing:"0.1em"}}>Schriftart</div>
              <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>{FONTS.map(f=><button key={f.key} onClick={()=>setFontKey(f.key)} style={{padding:"3px 9px",borderRadius:4,border:`1px solid ${fontKey===f.key?A:"#444"}`,background:fontKey===f.key?hex2rgba(A,0.15):"transparent",color:fontKey===f.key?A:"#888",fontSize:11,cursor:"pointer",fontFamily:f.family}}>{f.label}</button>)}</div>
            </div>
            <div><div style={{fontSize:10,fontWeight:700,color:"#666",marginBottom:7,textTransform:"uppercase",letterSpacing:"0.1em"}}>Schriftgröße</div>
              <div style={{display:"flex",gap:5}}>{FONT_SIZES.map(s=><button key={s.key} onClick={()=>setSizeKey(s.key)} style={{padding:"3px 12px",borderRadius:4,border:`1px solid ${sizeKey===s.key?A:"#444"}`,background:sizeKey===s.key?hex2rgba(A,0.15):"transparent",color:sizeKey===s.key?A:"#888",fontSize:11,cursor:"pointer"}}>{s.label}</button>)}</div>
            </div>
            <div style={{flex:1}}><div style={{fontSize:10,fontWeight:700,color:"#666",marginBottom:7,textTransform:"uppercase",letterSpacing:"0.1em"}}>Farben</div>
              <div style={{display:"flex",gap:10,flexWrap:"wrap",alignItems:"flex-end"}}>
                {([{k:"A" as const,l:"Akzent"},{k:"BG" as const,l:"BG"},{k:"HD" as const,l:"Kopf"},{k:"S2" as const,l:"Panel"},{k:"CT" as const,l:"Titel"},{k:"CB" as const,l:"Text"},{k:"CM" as const,l:"Gedimmt"}]).map(({k,l})=>(
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
      <div className="clpr-doc" style={{width:850,margin:"0 auto",backgroundColor:BG,boxShadow:`0 8px 60px ${hex2rgba(A,0.25)}`,overflow:"hidden",position:"relative"}}>
        <div className="clpr-zoom" style={{width:Math.round(850/scale),zoom:scale}}>
          {/* Rainbow band — top */}
          <div style={{height:6,background:RAINBOW,backgroundSize:"200% auto"}}/>

          {/* Header */}
          <div style={{background:HD,padding:"28px 48px 24px",position:"relative"}}>
            <div style={{position:"absolute",top:6,left:0,right:0,height:1,background:`${A}44`}}/>
            <div className="prism-name-text">
              <span style={{fontSize:32,fontWeight:800,display:"block",letterSpacing:"0.03em"}}>
                {data.personal.name||"Dein Name"}
              </span>
            </div>
            <E value={data.personal.subtitle} onChange={v=>setP({subtitle:v})} editing={editing} style={{fontSize:12,color:A,display:"block",marginTop:4,fontWeight:500,letterSpacing:"0.06em"}}/>
            <div style={{display:"flex",gap:20,flexWrap:"wrap",marginTop:14,paddingTop:12,borderTop:`1px solid ${A}22`}}>
              {[data.personal.email,data.personal.phone,data.personal.location,data.personal.website].map((v,i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",gap:5}}>
                  <span style={{fontSize:12,display:"inline-block",background:RAINBOW,backgroundSize:"400% auto",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>◆</span>
                  <E value={v} onChange={nv=>setP([{email:nv},{phone:nv},{location:nv},{website:nv}][i])} editing={editing} style={{fontSize:11,color:CM}}/>
                </div>
              ))}
            </div>
          </div>

          {/* Thin divider */}
          <div style={{height:2,background:`linear-gradient(90deg,${hex2rgba(A,0)},${A},${hex2rgba(A,0)})`}}/>

          {/* Body */}
          <div style={{padding:"28px 48px 44px",color:CB}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:22,gap:16,alignItems:"flex-start"}}>
              <div style={{background:S2,padding:"14px 18px",flex:1,border:`1px solid ${A}22`,borderLeft:`3px solid transparent`,backgroundImage:`linear-gradient(${S2},${S2}),${RAINBOW}`,backgroundOrigin:"border-box",backgroundClip:"padding-box,border-box",borderLeftWidth:3}}>
                {[data.recipient.company,data.recipient.street,data.recipient.cityZip,data.recipient.country].map((v,i)=>(
                  <E key={i} value={v} onChange={nv=>setR([{company:nv},{street:nv},{cityZip:nv},{country:nv}][i])} editing={editing} style={{fontSize:11,color:CB,display:"block",lineHeight:1.7}}/>
                ))}
              </div>
              <div style={{textAlign:"right",paddingTop:4}}>
                <E value={data.date} onChange={v=>setData(d=>({...d,date:v}))} editing={editing} style={{fontSize:11,color:CM}}/>
              </div>
            </div>

            <div style={{marginBottom:20,padding:"10px 16px",background:S2,borderLeft:`3px solid ${A}`}}>
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

            <div style={{marginTop:28,paddingTop:20,borderTop:`1px solid ${A}33`}}>
              <E value={data.closing} onChange={v=>setData(d=>({...d,closing:v}))} editing={editing} style={{fontSize:11,color:CB,display:"block",marginBottom:36}}/>
              <div style={{height:2,width:"50%",background:RAINBOW,backgroundSize:"200% auto",marginBottom:12}}/>
              <E value={data.signatureName} onChange={v=>setData(d=>({...d,signatureName:v}))} editing={editing} style={{fontSize:17,fontWeight:700,color:CT,display:"block"}}/>
            </div>
          </div>

          {/* Rainbow band — bottom */}
          <div style={{height:6,background:RAINBOW,backgroundSize:"200% auto"}}/>
        </div>
      </div>
    </div>
  </ColCtx.Provider>
  );
}
