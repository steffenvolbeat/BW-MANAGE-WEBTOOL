"use client";
// ─── Anschreiben Template: Cyberpunk (Neon/Cyber Stil) ───────────────────────
import { useState, useContext, createContext } from "react";
import { PrinterIcon, PencilSquareIcon, CheckIcon, PlusIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { FONTS, FONT_SIZES, CLData, DEFAULT_CL_DATA, uid, usePersistentCLState } from "./shared";

const DEFAULT_COLORS = { A:"#f900ff", BG:"#080015", HD:"#0f0020", S2:"#110020", CT:"#fff5fe", CB:"#e8d8ff", CM:"#00ffe7" };
const hex2rgba = (hex:string,a:number) => { const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16); return `rgba(${r},${g},${b},${a})`; };
const ColCtx = createContext(DEFAULT_COLORS);

function E({ value, onChange, editing, multiline=false, style={} as React.CSSProperties, placeholder="...", rows=4 }: {
  value:string; onChange:(v:string)=>void; editing:boolean;
  multiline?:boolean; style?:React.CSSProperties; placeholder?:string; rows?:number;
}) {
  const {A}=useContext(ColCtx);
  const base: React.CSSProperties = { ...style, background: hex2rgba(A,0.08), border:`1px solid ${A}66`, borderRadius:2, padding:"2px 6px", outline:"none", width:"100%", fontFamily:"inherit", fontSize:"inherit", color:"inherit", lineHeight:"inherit", fontWeight:"inherit", boxSizing:"border-box" };
  if (!editing) return <span style={style}>{value||<span style={{opacity:0.35,fontStyle:"italic"}}>{placeholder}</span>}</span>;
  if (multiline) return <textarea style={{...base,resize:"vertical",display:"block"}} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={rows}/>;
  return <input style={base} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}/>;
}

export default function CL_Cyberpunk() {
  const [data, setData] = usePersistentCLState<CLData>('cl_cyberpunk_data', JSON.parse(JSON.stringify(DEFAULT_CL_DATA)));
  const [editing, setEditing] = useState(false);
  const [fontKey, setFontKey] = usePersistentCLState('cl_cyberpunk_font', "roboto");
  const [sizeKey, setSizeKey] = usePersistentCLState('cl_cyberpunk_size', "md");
  const [showDesign, setShowDesign] = useState(false);
  const [clrs, setClrs] = usePersistentCLState('cl_cyberpunk_colors', DEFAULT_COLORS);
  const {A,BG,HD,S2,CT,CB,CM} = clrs;
  const curFont = FONTS.find(f=>f.key===fontKey)??FONTS[0];
  const curSize = FONT_SIZES.find(s=>s.key===sizeKey)??FONT_SIZES[2];
  const fnt = curFont.family; const scale = curSize.scale;
  const setP = (p:Partial<CLData["personal"]>)=>setData(d=>({...d,personal:{...d.personal,...p}}));
  const setR = (p:Partial<CLData["recipient"]>)=>setData(d=>({...d,recipient:{...d.recipient,...p}}));
  const doReset = ()=>{setData(JSON.parse(JSON.stringify(DEFAULT_CL_DATA)));setClrs(DEFAULT_COLORS);setFontKey("roboto");setSizeKey("md");};

  const scanlines = `repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.15) 2px,rgba(0,0,0,0.15) 4px)`;

  return (
  <ColCtx.Provider value={clrs}>
    <div style={{minHeight:"100vh",background:"#030010",padding:"24px 16px",fontFamily:fnt}}>
      <style>{`
        ${curFont.gf?`@import url('https://fonts.googleapis.com/css2?family=${curFont.gf}&display=swap')`:""};
        .clcy-doc, .clcy-doc * { font-family: ${fnt} !important; }
        .cyber-glow-pink { text-shadow: 0 0 10px ${A}, 0 0 20px ${A}, 0 0 40px ${A}; }
        .cyber-glow-cyan { text-shadow: 0 0 10px ${CM}, 0 0 20px ${CM}; }
        @media print {
          @page{size:A4 portrait;margin:0;}
          *,*::before,*::after{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;}
          body *{visibility:hidden!important;}
          .clcy-doc,.clcy-doc *{visibility:visible!important;}
          .clcy-doc{position:absolute!important;top:0!important;left:0!important;width:210mm!important;box-shadow:none!important;margin:0!important;}
          .clcy-zoom{zoom:1!important;width:100%!important;}
          .clcy-ctrl{display:none!important;}
          .cyber-glow-pink,.cyber-glow-cyan{text-shadow:none!important;}
        }
      `}</style>

      {/* Controls */}
      <div className="clcy-ctrl" style={{maxWidth:850,margin:"0 auto 16px",display:"flex",gap:8,flexWrap:"wrap"}}>
        <button onClick={()=>setEditing(e=>!e)} style={{padding:"7px 16px",borderRadius:4,fontSize:13,fontWeight:600,cursor:"pointer",border:`1px solid ${A}`,backgroundColor:editing?"#16a34a":hex2rgba(A,0.15),color:editing?"white":A,display:"flex",alignItems:"center",gap:6}}>
          {editing?<CheckIcon style={{width:16,height:16}}/>:<PencilSquareIcon style={{width:16,height:16}}/>}{editing?"Fertig":"Bearbeiten"}
        </button>
        <button onClick={()=>window.print()} style={{padding:"7px 16px",borderRadius:4,fontSize:13,fontWeight:600,cursor:"pointer",border:"1px solid #555",backgroundColor:"transparent",color:"#aaa",display:"flex",alignItems:"center",gap:6}}>
          <PrinterIcon style={{width:16,height:16}}/>Drucken
        </button>
        <button onClick={()=>setShowDesign(v=>!v)} style={{padding:"7px 16px",borderRadius:4,fontSize:13,cursor:"pointer",border:`1px solid ${showDesign?CM:"#555"}`,backgroundColor:"transparent",color:showDesign?CM:"#aaa"}}>🎨 Design</button>
        <button onClick={doReset} style={{padding:"7px 16px",borderRadius:4,fontSize:13,cursor:"pointer",border:"1px solid #555",backgroundColor:"transparent",color:"#aaa",display:"flex",alignItems:"center",gap:6}}>
          <XMarkIcon style={{width:16,height:16}}/>Reset
        </button>
        {showDesign&&(
          <div style={{width:"100%",background:hex2rgba(A,0.06),border:`1px solid ${A}44`,borderRadius:8,padding:"14px 18px",display:"flex",gap:24,flexWrap:"wrap"}}>
            <div><div style={{fontSize:10,fontWeight:700,color:"#666",marginBottom:7,textTransform:"uppercase",letterSpacing:"0.1em"}}>Schriftart</div>
              <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>{FONTS.map(f=><button key={f.key} onClick={()=>setFontKey(f.key)} style={{padding:"3px 9px",borderRadius:4,border:`1px solid ${fontKey===f.key?A:"#444"}`,background:fontKey===f.key?hex2rgba(A,0.15):"transparent",color:fontKey===f.key?A:"#888",fontSize:11,cursor:"pointer",fontFamily:f.family}}>{f.label}</button>)}</div>
            </div>
            <div><div style={{fontSize:10,fontWeight:700,color:"#666",marginBottom:7,textTransform:"uppercase",letterSpacing:"0.1em"}}>Schriftgröße</div>
              <div style={{display:"flex",gap:5}}>{FONT_SIZES.map(s=><button key={s.key} onClick={()=>setSizeKey(s.key)} style={{padding:"3px 12px",borderRadius:4,border:`1px solid ${sizeKey===s.key?A:"#444"}`,background:sizeKey===s.key?hex2rgba(A,0.15):"transparent",color:sizeKey===s.key?A:"#888",fontSize:11,cursor:"pointer"}}>{s.label}</button>)}</div>
            </div>
            <div style={{flex:1}}><div style={{fontSize:10,fontWeight:700,color:"#666",marginBottom:7,textTransform:"uppercase",letterSpacing:"0.1em"}}>Farben</div>
              <div style={{display:"flex",gap:10,flexWrap:"wrap",alignItems:"flex-end"}}>
                {([{k:"A" as const,l:"Pink"},{k:"CM" as const,l:"Cyan"},{k:"BG" as const,l:"BG"},{k:"HD" as const,l:"Kopf"},{k:"S2" as const,l:"Panel"},{k:"CT" as const,l:"Titel"},{k:"CB" as const,l:"Text"}]).map(({k,l})=>(
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
      <div className="clcy-doc" style={{width:850,margin:"0 auto",backgroundColor:BG,boxShadow:`0 0 60px ${hex2rgba(A,0.2)}, 0 0 120px ${hex2rgba(CM,0.1)}`,overflow:"hidden",position:"relative",border:`1px solid ${A}33`}}>
        {/* Scanlines overlay */}
        <div style={{position:"absolute",inset:0,backgroundImage:scanlines,pointerEvents:"none",zIndex:10,opacity:0.4}}/>

        <div className="clcy-zoom" style={{width:Math.round(850/scale),zoom:scale}}>
          {/* Header */}
          <div style={{background:`linear-gradient(135deg,${HD},${S2})`,padding:"28px 48px 24px",borderBottom:`2px solid ${A}`,position:"relative",overflow:"hidden",zIndex:1}}>
            <div style={{position:"absolute",top:0,left:0,width:4,bottom:0,background:`linear-gradient(${A},${CM})`}}/>
            <div style={{position:"absolute",top:0,right:0,width:4,bottom:0,background:`linear-gradient(${CM},${A})`}}/>
            <div style={{fontSize:9,fontFamily:"monospace",color:CM,letterSpacing:"0.3em",marginBottom:10,textTransform:"uppercase"}}>
              &gt; SYS.INIT // BEWERBUNGSSCHREIBEN.EXE
            </div>
            <E value={data.personal.name} onChange={v=>setP({name:v})} editing={editing} style={{fontSize:32,fontWeight:900,color:CT,display:"block",letterSpacing:"0.06em",textTransform:"uppercase"}} placeholder="NAME"/>
            <E value={data.personal.subtitle} onChange={v=>setP({subtitle:v})} editing={editing} style={{fontSize:12,color:A,display:"block",marginTop:6,fontWeight:600,letterSpacing:"0.12em",textTransform:"uppercase"}}/>
            <div style={{display:"flex",gap:20,flexWrap:"wrap",marginTop:16,paddingTop:14,borderTop:`1px solid ${A}33`}}>
              {[data.personal.email,data.personal.phone,data.personal.location,data.personal.website].map((v,i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",gap:5}}>
                  <span style={{color:CM,fontFamily:"monospace",fontSize:9}}>▸</span>
                  <E value={v} onChange={nv=>setP([{email:nv},{phone:nv},{location:nv},{website:nv}][i])} editing={editing} style={{fontSize:11,color:CM}}/>
                </div>
              ))}
            </div>
          </div>

          {/* Body */}
          <div style={{padding:"32px 48px 48px",color:CB,position:"relative",zIndex:1}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:24,gap:16,alignItems:"flex-start"}}>
              <div style={{background:hex2rgba(A,0.06),border:`1px solid ${A}44`,padding:"14px 18px",flex:1}}>
                <div style={{fontSize:8,fontFamily:"monospace",color:A,marginBottom:8,textTransform:"uppercase",letterSpacing:"0.2em"}}>// RECIPIENT</div>
                {[data.recipient.company,data.recipient.street,data.recipient.cityZip,data.recipient.country].map((v,i)=>(
                  <E key={i} value={v} onChange={nv=>setR([{company:nv},{street:nv},{cityZip:nv},{country:nv}][i])} editing={editing} style={{fontSize:11,color:CB,display:"block",lineHeight:1.7}}/>
                ))}
              </div>
              <div style={{textAlign:"right",paddingTop:4}}>
                <div style={{fontSize:8,fontFamily:"monospace",color:`${CM}aa`,marginBottom:4}}>&gt; TIMESTAMP</div>
                <E value={data.date} onChange={v=>setData(d=>({...d,date:v}))} editing={editing} style={{fontSize:11,color:CM,fontFamily:"monospace"}}/>
              </div>
            </div>

            <div style={{borderLeft:`3px solid ${A}`,borderRight:`3px solid ${CM}`,padding:"10px 16px",marginBottom:20,background:`linear-gradient(90deg,${hex2rgba(A,0.06)},${hex2rgba(CM,0.04)})`}}>
              <div style={{fontSize:8,fontFamily:"monospace",color:`${A}aa`,marginBottom:4,textTransform:"uppercase",letterSpacing:"0.2em"}}>&gt; SUBJECT</div>
              <E value={data.subject} onChange={v=>setData(d=>({...d,subject:v}))} editing={editing} style={{fontSize:13,fontWeight:700,color:CT}}/>
            </div>

            <E value={data.salutation} onChange={v=>setData(d=>({...d,salutation:v}))} editing={editing} style={{fontSize:12,color:CB,display:"block",marginBottom:18}}/>

            {data.bodyParagraphs.map((p,i)=>(
              <div key={i} style={{marginBottom:14,display:"flex",gap:8,alignItems:"flex-start"}}>
                {editing&&<button type="button" onClick={()=>setData(d=>({...d,bodyParagraphs:d.bodyParagraphs.filter((_,j)=>j!==i)}))} style={{padding:"2px 4px",fontSize:10,color:"#f87171",background:"none",border:"none",cursor:"pointer",marginTop:2,flexShrink:0}}>✕</button>}
                <E value={p} onChange={v=>setData(d=>({...d,bodyParagraphs:d.bodyParagraphs.map((x,j)=>j===i?v:x)}))} editing={editing} multiline rows={4} style={{fontSize:11.5,color:CB,lineHeight:1.8,display:"block"}}/>
              </div>
            ))}
            {editing&&<button type="button" onClick={()=>setData(d=>({...d,bodyParagraphs:[...d.bodyParagraphs,"Neuer Absatz..."]}))} style={{fontSize:11,color:A,background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:4,marginBottom:16}}><PlusIcon style={{width:12,height:12}}/>Absatz hinzufügen</button>}

            <div style={{marginTop:28,paddingTop:20,borderTop:`1px solid ${A}44`}}>
              <E value={data.closing} onChange={v=>setData(d=>({...d,closing:v}))} editing={editing} style={{fontSize:11,color:CB,display:"block",marginBottom:36}}/>
              <div style={{display:"flex",alignItems:"center",gap:0}}>
                <div style={{width:40,height:2,background:`linear-gradient(90deg,transparent,${A})`}}/>
                <div style={{flex:1,height:1,background:`linear-gradient(90deg,${A},${CM})`}}/>
                <div style={{width:40,height:2,background:`linear-gradient(90deg,${CM},transparent)`}}/>
              </div>
              <div style={{marginTop:10}}>
                <E value={data.signatureName} onChange={v=>setData(d=>({...d,signatureName:v}))} editing={editing} style={{fontSize:17,fontWeight:800,color:CT,letterSpacing:"0.06em",textTransform:"uppercase",display:"inline-block"}}/>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </ColCtx.Provider>
  );
}
