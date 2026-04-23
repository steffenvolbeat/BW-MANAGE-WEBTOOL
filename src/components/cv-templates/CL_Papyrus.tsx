"use client";
// ─── Anschreiben Template: Papyrus (Ancient Scroll, Parchment, Ornate) ───────
import { useState, useContext, createContext } from "react";
import { PrinterIcon, PencilSquareIcon, CheckIcon, PlusIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { FONTS, FONT_SIZES, CLData, DEFAULT_CL_DATA, usePersistentCLState } from "./shared";

const DEFAULT_COLORS = { A:"#8b5a20", BG:"#f5edd0", HD:"#ede4c4", S2:"#e4d8b0", CT:"#2a1a05", CB:"#3a2a10", CM:"#7a6040" };
const hex2rgba=(hex:string,a:number)=>{const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);return `rgba(${r},${g},${b},${a})`;};
const ColCtx=createContext(DEFAULT_COLORS);
const PFX="clppy";
const GOLD="#b89030"; const INK="#2a1a05";

function E({value,onChange,editing,multiline=false,style={} as React.CSSProperties,placeholder="...",rows=4}:{value:string;onChange:(v:string)=>void;editing:boolean;multiline?:boolean;style?:React.CSSProperties;placeholder?:string;rows?:number;}){
  const {A}=useContext(ColCtx);
  const s:React.CSSProperties={...style,background:hex2rgba(A,0.07),border:`1px dashed ${A}55`,padding:"2px 5px",outline:"none",width:"100%",fontFamily:"inherit",fontSize:"inherit",color:"inherit",lineHeight:"inherit",fontWeight:"inherit",boxSizing:"border-box"};
  if(!editing)return <span style={style}>{value||<span style={{opacity:0.3}}>{placeholder}</span>}</span>;
  if(multiline)return <textarea style={{...s,resize:"vertical",display:"block"}} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={rows}/>;
  return <input style={s} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}/>;
}

export default function CL_Papyrus(){
  const [data,setData]=usePersistentCLState<CLData>('cl_clppy_data',JSON.parse(JSON.stringify(DEFAULT_CL_DATA)));
  const [editing,setEditing]=useState(false);
  const [fontKey]=usePersistentCLState('cl_clppy_font',"nunito");
  const [sizeKey]=usePersistentCLState('cl_clppy_size',"md");
  const [clrs,setClrs]=usePersistentCLState('cl_clppy_colors',DEFAULT_COLORS);
  const {A,BG,HD,S2,CT,CB,CM}=clrs;
  const curFont=FONTS.find(f=>f.key===fontKey)??FONTS[0];
  const curSize=FONT_SIZES.find(s=>s.key===sizeKey)??FONT_SIZES[2];
  const fnt=curFont.family;const scale=curSize.scale;
  const setP=(p:Partial<CLData["personal"]>)=>setData(d=>({...d,personal:{...d.personal,...p}}));
  const setR=(p:Partial<CLData["recipient"]>)=>setData(d=>({...d,recipient:{...d.recipient,...p}}));

  return(
  <ColCtx.Provider value={clrs}>
    <div style={{minHeight:"100vh",background:"#d8c898",padding:"24px 16px",fontFamily:fnt}}>
      <style>{`
        ${curFont.gf?`@import url('https://fonts.googleapis.com/css2?family=${curFont.gf}&display=swap');`:""}
        .${PFX}-doc,.${PFX}-doc * { font-family:${fnt}!important; }
        @media print {
          @page { size:A4 portrait; margin:0; }
          *,*::before,*::after { -webkit-print-color-adjust:exact!important; print-color-adjust:exact!important; }
          body * { visibility:hidden!important; }
          .${PFX}-doc,.${PFX}-doc * { visibility:visible!important; }
          .${PFX}-doc { position:fixed!important; top:0!important; left:0!important; width:850px!important; min-height:1202px!important; overflow:visible!important; zoom:0.934!important; box-shadow:none!important; margin:0!important; }
          .${PFX}-zoom { zoom:1!important; width:100%!important; }
          .${PFX}-ctrl { display:none!important; }
        }
      `}</style>
      <div className={`${PFX}-ctrl`} style={{maxWidth:850,margin:"0 auto 16px",display:"flex",gap:8}}>
        <button onClick={()=>setEditing(e=>!e)} style={{padding:"7px 16px",fontSize:13,cursor:"pointer",border:`2px solid ${A}`,background:editing?A:"transparent",color:editing?"white":A,display:"flex",alignItems:"center",gap:6}}>{editing?<CheckIcon style={{width:16,height:16}}/>:<PencilSquareIcon style={{width:16,height:16}}/>}{editing?"Fertig":"Bearbeiten"}</button>
        <button onClick={()=>window.print()} style={{padding:"7px 16px",fontSize:13,cursor:"pointer",border:`2px solid ${GOLD}`,background:"transparent",color:GOLD,display:"flex",alignItems:"center",gap:6}}><PrinterIcon style={{width:16,height:16}}/>Drucken</button>
        <button onClick={()=>{setData(JSON.parse(JSON.stringify(DEFAULT_CL_DATA)));setClrs(DEFAULT_COLORS);}} style={{padding:"7px 16px",fontSize:13,cursor:"pointer",border:"2px solid #bbb",background:"transparent",color:"#888",display:"flex",alignItems:"center",gap:6}}><XMarkIcon style={{width:14,height:14}}/>Reset</button>
      </div>

      <div className={`${PFX}-doc`} style={{width:850,minHeight:1202,margin:"0 auto",backgroundColor:BG,boxShadow:"0 6px 24px rgba(80,50,10,0.2)",overflow:"visible",border:`2px solid ${hex2rgba(A,0.3)}`}}>
        <div className={`${PFX}-zoom`} style={{width:Math.round(850/scale),zoom:scale}}>
          {/* Papyrus decorative top border */}
          <div style={{height:8,background:`repeating-linear-gradient(90deg, ${A} 0, ${A} 3px, ${GOLD} 3px, ${GOLD} 6px, ${A} 6px, ${A} 8px, transparent 8px, transparent 12px)`}}/>
          <div style={{background:HD,padding:"28px 48px 18px",textAlign:"center" as const,borderBottom:`2px solid ${hex2rgba(A,0.4)}`}}>
            <div style={{color:GOLD,fontSize:10,letterSpacing:"0.2em",marginBottom:8}}>✦ ❧ ✦</div>
            <E value={data.personal.name} onChange={v=>setP({name:v})} editing={editing} style={{fontSize:26,fontWeight:800,color:CT,display:"block",letterSpacing:"0.04em"}}/>
            <E value={data.personal.subtitle} onChange={v=>setP({subtitle:v})} editing={editing} style={{fontSize:11,color:A,display:"block",marginTop:4,fontStyle:"italic"}}/>
            <div style={{marginTop:10,display:"flex",gap:20,justifyContent:"center",flexWrap:"wrap"}}>
              {(["email","phone","location"] as const).map(k=><E key={k} value={data.personal[k]} onChange={v=>setP({[k]:v})} editing={editing} style={{fontSize:9,color:CM}}/>)}
            </div>
          </div>

          <div style={{padding:"24px 48px 48px"}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:20}}>
              <div>
                {(["company","street","cityZip"] as const).map(k=><E key={k} value={data.recipient[k]} onChange={v=>setR({[k]:v})} editing={editing} style={{fontSize:11,color:CB,display:"block",lineHeight:1.6}}/>)}
              </div>
              <E value={data.date} onChange={v=>setData(d=>({...d,date:v}))} editing={editing} style={{fontSize:11,color:CM,fontStyle:"italic"}}/>
            </div>
            <div style={{marginBottom:14,textAlign:"center" as const}}>
              <div style={{color:A,fontSize:9,letterSpacing:"0.15em",marginBottom:4}}>— Betreff —</div>
              <E value={data.subject} onChange={v=>setData(d=>({...d,subject:v}))} editing={editing} style={{fontSize:13,fontWeight:700,color:CT}}/>
            </div>
            <div style={{height:1,background:`linear-gradient(90deg, transparent, ${A}88, transparent)`,marginBottom:14}}/>
            <E value={data.salutation} onChange={v=>setData(d=>({...d,salutation:v}))} editing={editing} style={{fontSize:11,color:CB,display:"block",marginBottom:12}}/>
            {data.bodyParagraphs.map((p,i)=>(
              <div key={i} style={{marginBottom:12,display:"flex",gap:8}}>
                {editing&&<button type="button" onClick={()=>setData(d=>({...d,bodyParagraphs:d.bodyParagraphs.filter((_,j)=>j!==i)}))} style={{color:"#c87050",background:"none",border:"none",cursor:"pointer",fontSize:10,padding:0,flexShrink:0}}>✕</button>}
                <E value={p} onChange={v=>setData(d=>({...d,bodyParagraphs:d.bodyParagraphs.map((x,j)=>j===i?v:x)}))} editing={editing} multiline rows={4} style={{fontSize:11,color:CM,lineHeight:1.8,display:"block"}}/>
              </div>
            ))}
            {editing&&<button type="button" onClick={()=>setData(d=>({...d,bodyParagraphs:[...d.bodyParagraphs,""]}))} style={{fontSize:11,color:A,background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:4,marginBottom:12}}><PlusIcon style={{width:12,height:12}}/>Absatz</button>}
            <div style={{marginTop:16}}>
              <E value={data.closing} onChange={v=>setData(d=>({...d,closing:v}))} editing={editing} style={{fontSize:11,color:CB,display:"block",marginBottom:20}}/>
              <div style={{height:1,background:`linear-gradient(90deg, transparent, ${A}66, transparent)`,marginBottom:8}}/>
              <div style={{textAlign:"center" as const}}>
                <E value={data.signatureName} onChange={v=>setData(d=>({...d,signatureName:v}))} editing={editing} style={{fontSize:13,fontWeight:700,color:CT}}/>
              </div>
              <div style={{textAlign:"center" as const,color:GOLD,fontSize:9,marginTop:8}}>✦ ❧ ✦</div>
            </div>
          </div>
          <div style={{height:8,background:`repeating-linear-gradient(90deg, ${A} 0, ${A} 3px, ${GOLD} 3px, ${GOLD} 6px, ${A} 6px, ${A} 8px, transparent 8px, transparent 12px)`}}/>
        </div>
      </div>
    </div>
  </ColCtx.Provider>
  );
}
