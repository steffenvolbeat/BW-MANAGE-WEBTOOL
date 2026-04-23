"use client";
// ─── Anschreiben Template: Pixel (8-bit Retro Game) ─────────────────────────
import { useState, useContext, createContext } from "react";
import { PrinterIcon, PencilSquareIcon, CheckIcon, PlusIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { FONTS, FONT_SIZES, CLData, DEFAULT_CL_DATA, usePersistentCLState } from "./shared";

const DEFAULT_COLORS = { A:"#00e676", BG:"#0f0f23", HD:"#1a1a3a", S2:"#141428", CT:"#ffffff", CB:"#c0c0c0", CM:"#808080" };
const hex2rgba=(hex:string,a:number)=>{const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);return `rgba(${r},${g},${b},${a})`;};
const ColCtx=createContext(DEFAULT_COLORS);
const PFX="clpix";
const GREEN="#00e676"; const RED="#ff4444"; const BLUE="#4488ff"; const YELLOW="#ffcc00";

function E({value,onChange,editing,multiline=false,style={} as React.CSSProperties,placeholder="...",rows=4}:{value:string;onChange:(v:string)=>void;editing:boolean;multiline?:boolean;style?:React.CSSProperties;placeholder?:string;rows?:number;}){
  const {A}=useContext(ColCtx);
  const s:React.CSSProperties={...style,background:hex2rgba(A,0.08),border:`2px solid ${A}`,padding:"2px 6px",outline:"none",width:"100%",fontFamily:"inherit",fontSize:"inherit",color:"inherit",lineHeight:"inherit",fontWeight:"inherit",boxSizing:"border-box",imageRendering:"pixelated" as any};
  if(!editing)return <span style={style}>{value||<span style={{opacity:0.3}}>{placeholder}</span>}</span>;
  if(multiline)return <textarea style={{...s,resize:"vertical",display:"block"}} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={rows}/>;
  return <input style={s} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}/>;
}

export default function CL_Pixel(){
  const [data,setData]=usePersistentCLState<CLData>('cl_clpix_data',JSON.parse(JSON.stringify(DEFAULT_CL_DATA)));
  const [editing,setEditing]=useState(false);
  const [fontKey]=usePersistentCLState('cl_clpix_font',"nunito");
  const [sizeKey]=usePersistentCLState('cl_clpix_size',"md");
  const [clrs,setClrs]=usePersistentCLState('cl_clpix_colors',DEFAULT_COLORS);
  const {A,BG,HD,S2,CT,CB,CM}=clrs;
  const curFont=FONTS.find(f=>f.key===fontKey)??FONTS[0];
  const curSize=FONT_SIZES.find(s=>s.key===sizeKey)??FONT_SIZES[2];
  const fnt=curFont.family;const scale=curSize.scale;
  const setP=(p:Partial<CLData["personal"]>)=>setData(d=>({...d,personal:{...d.personal,...p}}));
  const setR=(p:Partial<CLData["recipient"]>)=>setData(d=>({...d,recipient:{...d.recipient,...p}}));

  return(
  <ColCtx.Provider value={clrs}>
    <div style={{minHeight:"100vh",background:"#050510",padding:"24px 16px",fontFamily:fnt}}>
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
        <button onClick={()=>setEditing(e=>!e)} style={{padding:"7px 16px",fontSize:13,cursor:"pointer",border:`2px solid ${GREEN}`,background:editing?GREEN:"transparent",color:editing?"#000":GREEN,display:"flex",alignItems:"center",gap:6,fontFamily:"monospace"}}>{editing?<CheckIcon style={{width:16,height:16}}/>:<PencilSquareIcon style={{width:16,height:16}}/>}{editing?"[DONE]":"[EDIT]"}</button>
        <button onClick={()=>window.print()} style={{padding:"7px 16px",fontSize:13,cursor:"pointer",border:`2px solid ${BLUE}`,background:"transparent",color:BLUE,display:"flex",alignItems:"center",gap:6,fontFamily:"monospace"}}><PrinterIcon style={{width:16,height:16}}/>PRINT</button>
        <button onClick={()=>{setData(JSON.parse(JSON.stringify(DEFAULT_CL_DATA)));setClrs(DEFAULT_COLORS);}} style={{padding:"7px 16px",fontSize:13,cursor:"pointer",border:"2px solid #444",background:"transparent",color:"#666",fontFamily:"monospace"}}>[RST]</button>
      </div>

      <div className={`${PFX}-doc`} style={{width:850,minHeight:1202,margin:"0 auto",backgroundColor:BG,boxShadow:`0 0 40px ${hex2rgba(GREEN,0.2)}`,overflow:"visible",border:`2px solid ${GREEN}33`}}>
        <div className={`${PFX}-zoom`} style={{width:Math.round(850/scale),zoom:scale}}>
          {/* Pixel header */}
          <div style={{background:HD,padding:"28px 48px 20px",borderBottom:`4px solid ${GREEN}`}}>
            <div style={{fontSize:7,color:GREEN,fontFamily:"monospace",marginBottom:8,opacity:0.6}}>{'>>> COVER LETTER SYSTEM v1.0 <<<'}</div>
            <E value={data.personal.name} onChange={v=>setP({name:v})} editing={editing} style={{fontSize:26,fontWeight:900,color:GREEN,display:"block",fontFamily:"monospace",textShadow:`0 0 12px ${GREEN}`,letterSpacing:"0.04em"}}/>
            <E value={data.personal.subtitle} onChange={v=>setP({subtitle:v})} editing={editing} style={{fontSize:10,color:YELLOW,fontFamily:"monospace",display:"block",marginTop:4}}/>
            <div style={{marginTop:10,display:"flex",gap:20}}>
              {(["email","phone","location","linkedin","github"] as const).map(k=><E key={k} value={data.personal[k]} onChange={v=>setP({[k]:v})} editing={editing} style={{fontSize:8,color:CM,fontFamily:"monospace"}}/>)}
            </div>
          </div>

          <div style={{padding:"28px 48px 48px"}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:20,padding:"10px 14px",background:hex2rgba(BLUE,0.08),border:`1px solid ${BLUE}44`}}>
              <div>
                {(["company","street","cityZip"] as const).map(k=><E key={k} value={data.recipient[k]} onChange={v=>setR({[k]:v})} editing={editing} style={{fontSize:10,color:CB,display:"block",lineHeight:1.6,fontFamily:"monospace"}}/>)}
              </div>
              <E value={data.date} onChange={v=>setData(d=>({...d,date:v}))} editing={editing} style={{fontSize:10,color:CM,fontFamily:"monospace"}}/>
            </div>
            <div style={{marginBottom:18,display:"flex",gap:8,alignItems:"center"}}>
              <span style={{color:GREEN,fontFamily:"monospace",fontSize:11}}>►</span>
              <E value={data.subject} onChange={v=>setData(d=>({...d,subject:v}))} editing={editing} style={{fontSize:12,fontWeight:700,color:YELLOW,fontFamily:"monospace"}}/>
            </div>
            <E value={data.salutation} onChange={v=>setData(d=>({...d,salutation:v}))} editing={editing} style={{fontSize:11,color:CB,display:"block",marginBottom:14}}/>
            {data.bodyParagraphs.map((p,i)=>(
              <div key={i} style={{marginBottom:12,display:"flex",gap:8}}>
                {editing&&<button type="button" onClick={()=>setData(d=>({...d,bodyParagraphs:d.bodyParagraphs.filter((_,j)=>j!==i)}))} style={{color:RED,background:"none",border:"none",cursor:"pointer",fontSize:10,padding:0,flexShrink:0,fontFamily:"monospace"}}>✕</button>}
                <E value={p} onChange={v=>setData(d=>({...d,bodyParagraphs:d.bodyParagraphs.map((x,j)=>j===i?v:x)}))} editing={editing} multiline rows={4} style={{fontSize:11,color:CM,lineHeight:1.75,display:"block"}}/>
              </div>
            ))}
            {editing&&<button type="button" onClick={()=>setData(d=>({...d,bodyParagraphs:[...d.bodyParagraphs,""]}))} style={{fontSize:11,color:GREEN,background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:4,marginBottom:14,fontFamily:"monospace"}}><PlusIcon style={{width:12,height:12}}/>+BLOCK</button>}
            <div style={{marginTop:20}}>
              <E value={data.closing} onChange={v=>setData(d=>({...d,closing:v}))} editing={editing} style={{fontSize:11,color:CB,display:"block",marginBottom:20}}/>
              <div style={{display:"flex",gap:2,marginBottom:8}}>{Array.from({length:20}).map((_,i)=><div key={i} style={{width:4,height:4,background:i<10?GREEN:"#222"}}/>)}</div>
              <E value={data.signatureName} onChange={v=>setData(d=>({...d,signatureName:v}))} editing={editing} style={{fontSize:13,fontWeight:700,color:GREEN,fontFamily:"monospace",textShadow:`0 0 8px ${GREEN}`}}/>
            </div>
          </div>
        </div>
      </div>
    </div>
  </ColCtx.Provider>
  );
}
