"use client";
// ─── Anschreiben Template: Memphis (80s Pop Art, Geometric Shapes) ────────────
import { useState, useContext, createContext } from "react";
import { PrinterIcon, PencilSquareIcon, CheckIcon, PlusIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { FONTS, FONT_SIZES, CLData, DEFAULT_CL_DATA, usePersistentCLState } from "./shared";

const DEFAULT_COLORS = { A:"#ff4499", BG:"#fffde8", HD:"#fff8c0", S2:"#fff0e0", CT:"#1a1a1a", CB:"#2a2a2a", CM:"#777777" };
const hex2rgba=(hex:string,a:number)=>{const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);return `rgba(${r},${g},${b},${a})`;};
const ColCtx=createContext(DEFAULT_COLORS);
const PFX="clmem";
const TEAL="#00c8a0"; const ORANGE="#ff7a20"; const YELLOW="#ffd400"; const PURPLE="#8040cc";

function E({value,onChange,editing,multiline=false,style={} as React.CSSProperties,placeholder="...",rows=4}:{value:string;onChange:(v:string)=>void;editing:boolean;multiline?:boolean;style?:React.CSSProperties;placeholder?:string;rows?:number;}){
  const {A}=useContext(ColCtx);
  const s:React.CSSProperties={...style,background:hex2rgba(A,0.06),border:`1px dashed ${A}55`,padding:"2px 4px",outline:"none",width:"100%",fontFamily:"inherit",fontSize:"inherit",color:"inherit",lineHeight:"inherit",fontWeight:"inherit",boxSizing:"border-box"};
  if(!editing)return <span style={style}>{value||<span style={{opacity:0.3}}>{placeholder}</span>}</span>;
  if(multiline)return <textarea style={{...s,resize:"vertical",display:"block"}} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={rows}/>;
  return <input style={s} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}/>;
}

export default function CL_Memphis(){
  const [data,setData]=usePersistentCLState<CLData>('cl_clmem_data',JSON.parse(JSON.stringify(DEFAULT_CL_DATA)));
  const [editing,setEditing]=useState(false);
  const [fontKey]=usePersistentCLState('cl_clmem_font',"nunito");
  const [sizeKey]=usePersistentCLState('cl_clmem_size',"md");
  const [clrs,setClrs]=usePersistentCLState('cl_clmem_colors',DEFAULT_COLORS);
  const {A,BG,HD,S2,CT,CB,CM}=clrs;
  const curFont=FONTS.find(f=>f.key===fontKey)??FONTS[0];
  const curSize=FONT_SIZES.find(s=>s.key===sizeKey)??FONT_SIZES[2];
  const fnt=curFont.family;const scale=curSize.scale;
  const setP=(p:Partial<CLData["personal"]>)=>setData(d=>({...d,personal:{...d.personal,...p}}));
  const setR=(p:Partial<CLData["recipient"]>)=>setData(d=>({...d,recipient:{...d.recipient,...p}}));

  return(
  <ColCtx.Provider value={clrs}>
    <div style={{minHeight:"100vh",background:"#f0e0e8",padding:"24px 16px",fontFamily:fnt}}>
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
        <button onClick={()=>window.print()} style={{padding:"7px 16px",fontSize:13,cursor:"pointer",border:`2px solid ${TEAL}`,background:"transparent",color:TEAL,display:"flex",alignItems:"center",gap:6}}><PrinterIcon style={{width:16,height:16}}/>Drucken</button>
        <button onClick={()=>{setData(JSON.parse(JSON.stringify(DEFAULT_CL_DATA)));setClrs(DEFAULT_COLORS);}} style={{padding:"7px 16px",fontSize:13,cursor:"pointer",border:"2px solid #bbb",background:"transparent",color:"#888",display:"flex",alignItems:"center",gap:6}}><XMarkIcon style={{width:14,height:14}}/>Reset</button>
      </div>

      <div className={`${PFX}-doc`} style={{width:850,minHeight:1202,margin:"0 auto",backgroundColor:BG,boxShadow:"0 4px 20px rgba(255,68,153,0.15)",overflow:"visible",position:"relative"}}>
        <div className={`${PFX}-zoom`} style={{width:Math.round(850/scale),zoom:scale}}>
          {/* Memphis decorative top */}
          <div style={{height:16,background:`repeating-linear-gradient(45deg, ${A} 0px, ${A} 8px, ${YELLOW} 8px, ${YELLOW} 16px, ${TEAL} 16px, ${TEAL} 24px, ${ORANGE} 24px, ${ORANGE} 32px)`}}/>
          <div style={{background:HD,padding:"30px 48px 22px",position:"relative",overflow:"hidden"}}>
            {/* Geometric decorators */}
            <div style={{position:"absolute",top:10,right:40,width:40,height:40,background:TEAL,borderRadius:"50%",opacity:0.6}}/>
            <div style={{position:"absolute",top:20,right:90,width:20,height:20,background:ORANGE,opacity:0.5}}/>
            <div style={{position:"absolute",bottom:8,right:20,width:0,height:0,borderLeft:"15px solid transparent",borderRight:"15px solid transparent",borderBottom:`25px solid ${PURPLE}`,opacity:0.4}}/>
            <E value={data.personal.name} onChange={v=>setP({name:v})} editing={editing} style={{fontSize:28,fontWeight:900,color:CT,display:"block",position:"relative"}}/>
            <E value={data.personal.subtitle} onChange={v=>setP({subtitle:v})} editing={editing} style={{fontSize:11,color:A,fontWeight:700,letterSpacing:"0.08em",display:"block",marginTop:4,position:"relative"}}/>
            <div style={{marginTop:10,display:"flex",gap:20,position:"relative"}}>
              {(["email","phone","location"] as const).map(k=><E key={k} value={data.personal[k]} onChange={v=>setP({[k]:v})} editing={editing} style={{fontSize:9,color:CM}}/>)}
            </div>
          </div>

          <div style={{padding:"28px 48px 48px"}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:24}}>
              <div>
                {(["company","street","cityZip"] as const).map(k=><E key={k} value={data.recipient[k]} onChange={v=>setR({[k]:v})} editing={editing} style={{fontSize:11,color:CB,display:"block",lineHeight:1.6}}/>)}
              </div>
              <E value={data.date} onChange={v=>setData(d=>({...d,date:v}))} editing={editing} style={{fontSize:11,color:CM,fontStyle:"italic"}}/>
            </div>
            <div style={{marginBottom:20,display:"flex",gap:8,alignItems:"center"}}>
              <div style={{width:12,height:12,background:A,transform:"rotate(45deg)",flexShrink:0}}/>
              <E value={data.subject} onChange={v=>setData(d=>({...d,subject:v}))} editing={editing} style={{fontSize:13,fontWeight:800,color:CT}}/>
            </div>
            <E value={data.salutation} onChange={v=>setData(d=>({...d,salutation:v}))} editing={editing} style={{fontSize:11,color:CB,display:"block",marginBottom:14}}/>
            {data.bodyParagraphs.map((p,i)=>(
              <div key={i} style={{marginBottom:12,display:"flex",gap:8}}>
                {editing&&<button type="button" onClick={()=>setData(d=>({...d,bodyParagraphs:d.bodyParagraphs.filter((_,j)=>j!==i)}))} style={{color:"#f87171",background:"none",border:"none",cursor:"pointer",fontSize:10,padding:0,flexShrink:0}}>✕</button>}
                <E value={p} onChange={v=>setData(d=>({...d,bodyParagraphs:d.bodyParagraphs.map((x,j)=>j===i?v:x)}))} editing={editing} multiline rows={4} style={{fontSize:11,color:CM,lineHeight:1.75,display:"block"}}/>
              </div>
            ))}
            {editing&&<button type="button" onClick={()=>setData(d=>({...d,bodyParagraphs:[...d.bodyParagraphs,""]}))} style={{fontSize:11,color:A,background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:4,marginBottom:14}}><PlusIcon style={{width:12,height:12}}/>Absatz</button>}
            <div style={{marginTop:20}}>
              <E value={data.closing} onChange={v=>setData(d=>({...d,closing:v}))} editing={editing} style={{fontSize:11,color:CB,display:"block",marginBottom:24}}/>
              <div style={{display:"flex",gap:4,marginBottom:8}}>{[A,TEAL,ORANGE,YELLOW,PURPLE].map((c,i)=><div key={i} style={{width:16,height:4,background:c}}/>)}</div>
              <E value={data.signatureName} onChange={v=>setData(d=>({...d,signatureName:v}))} editing={editing} style={{fontSize:13,fontWeight:800,color:CT}}/>
            </div>
          </div>
          <div style={{height:12,background:`repeating-linear-gradient(135deg, ${TEAL} 0px, ${TEAL} 6px, ${YELLOW} 6px, ${YELLOW} 12px, ${A} 12px, ${A} 18px, ${PURPLE} 18px, ${PURPLE} 24px)`}}/>
        </div>
      </div>
    </div>
  </ColCtx.Provider>
  );
}
