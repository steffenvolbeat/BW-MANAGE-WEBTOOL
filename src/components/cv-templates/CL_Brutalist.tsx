"use client";
// ─── Anschreiben Template: Brutalist (Bold, Raw, High-Impact) ────────────────
import { useState, useContext, createContext } from "react";
import { PrinterIcon, PencilSquareIcon, CheckIcon, PlusIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { FONTS, FONT_SIZES, CLData, DEFAULT_CL_DATA, usePersistentCLState } from "./shared";

const DEFAULT_COLORS = { A:"#ffdd00", BG:"#0a0a0a", HD:"#111111", S2:"#1a1a1a", CT:"#ffffff", CB:"#e0e0e0", CM:"#888888" };
const hex2rgba=(hex:string,a:number)=>{const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);return `rgba(${r},${g},${b},${a})`;};
const ColCtx=createContext(DEFAULT_COLORS);
const PFX="clbru";

function E({value,onChange,editing,multiline=false,style={} as React.CSSProperties,placeholder="...",rows=4}:{value:string;onChange:(v:string)=>void;editing:boolean;multiline?:boolean;style?:React.CSSProperties;placeholder?:string;rows?:number;}){
  const {A}=useContext(ColCtx);
  const s:React.CSSProperties={...style,background:hex2rgba(A,0.1),border:`2px solid ${A}`,padding:"2px 6px",outline:"none",width:"100%",fontFamily:"inherit",fontSize:"inherit",color:"inherit",lineHeight:"inherit",fontWeight:"inherit",boxSizing:"border-box"};
  if(!editing)return <span style={style}>{value||<span style={{opacity:0.3}}>{placeholder}</span>}</span>;
  if(multiline)return <textarea style={{...s,resize:"vertical",display:"block"}} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={rows}/>;
  return <input style={s} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}/>;
}

export default function CL_Brutalist(){
  const [data,setData]=usePersistentCLState<CLData>('cl_clbru_data',JSON.parse(JSON.stringify(DEFAULT_CL_DATA)));
  const [editing,setEditing]=useState(false);
  const [fontKey]=usePersistentCLState('cl_clbru_font',"nunito");
  const [sizeKey]=usePersistentCLState('cl_clbru_size',"md");
  const [clrs,setClrs]=usePersistentCLState('cl_clbru_colors',DEFAULT_COLORS);
  const {A,BG,HD,S2,CT,CB,CM}=clrs;
  const curFont=FONTS.find(f=>f.key===fontKey)??FONTS[0];
  const curSize=FONT_SIZES.find(s=>s.key===sizeKey)??FONT_SIZES[2];
  const fnt=curFont.family;const scale=curSize.scale;
  const setP=(p:Partial<CLData["personal"]>)=>setData(d=>({...d,personal:{...d.personal,...p}}));
  const setR=(p:Partial<CLData["recipient"]>)=>setData(d=>({...d,recipient:{...d.recipient,...p}}));

  return(
  <ColCtx.Provider value={clrs}>
    <div style={{minHeight:"100vh",background:"#050505",padding:"24px 16px",fontFamily:fnt}}>
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
      <div className={`${PFX}-ctrl`} style={{maxWidth:850,margin:"0 auto 16px",display:"flex",gap:8,flexWrap:"wrap"}}>
        <button onClick={()=>setEditing(e=>!e)} style={{padding:"7px 16px",fontSize:13,cursor:"pointer",border:`3px solid ${A}`,background:editing?A:"transparent",color:editing?"#000":A,fontWeight:800,display:"flex",alignItems:"center",gap:6}}>{editing?<CheckIcon style={{width:16,height:16}}/>:<PencilSquareIcon style={{width:16,height:16}}/>}{editing?"FERTIG":"BEARBEITEN"}</button>
        <button onClick={()=>window.print()} style={{padding:"7px 16px",fontSize:13,cursor:"pointer",border:"3px solid #555",background:"transparent",color:"#aaa",fontWeight:700,display:"flex",alignItems:"center",gap:6}}><PrinterIcon style={{width:16,height:16}}/>DRUCKEN</button>
        <button onClick={()=>{setData(JSON.parse(JSON.stringify(DEFAULT_CL_DATA)));setClrs(DEFAULT_COLORS);}} style={{padding:"7px 16px",fontSize:13,cursor:"pointer",border:"3px solid #333",background:"transparent",color:"#666",display:"flex",alignItems:"center",gap:6}}><XMarkIcon style={{width:14,height:14}}/>RESET</button>
      </div>

      <div className={`${PFX}-doc`} style={{width:850,minHeight:1202,margin:"0 auto",backgroundColor:BG,overflow:"visible"}}>
        <div className={`${PFX}-zoom`} style={{width:Math.round(850/scale),zoom:scale}}>
          {/* Brutal yellow top bar */}
          <div style={{height:12,background:A}}/>
          <div style={{padding:"32px 48px 24px",borderBottom:`4px solid ${A}`}}>
            <E value={data.personal.name} onChange={v=>setP({name:v})} editing={editing} style={{fontSize:42,fontWeight:900,color:CT,display:"block",letterSpacing:"-0.02em",lineHeight:1.1}}/>
            <E value={data.personal.subtitle} onChange={v=>setP({subtitle:v})} editing={editing} style={{fontSize:12,color:A,letterSpacing:"0.2em",textTransform:"uppercase" as const,display:"block",marginTop:6,fontWeight:800}}/>
            <div style={{marginTop:12,display:"flex",gap:24}}>
              {(["email","phone","location"] as const).map(k=><E key={k} value={data.personal[k]} onChange={v=>setP({[k]:v})} editing={editing} style={{fontSize:9,color:CM,fontWeight:700,letterSpacing:"0.1em"}}/>)}
            </div>
          </div>

          <div style={{padding:"32px 48px 48px"}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:24}}>
              <div>
                {(["company","street","cityZip"] as const).map(k=><E key={k} value={data.recipient[k]} onChange={v=>setR({[k]:v})} editing={editing} style={{fontSize:11,color:CB,display:"block",lineHeight:1.6,fontWeight:k==="company"?700:400}}/>)}
              </div>
              <E value={data.date} onChange={v=>setData(d=>({...d,date:v}))} editing={editing} style={{fontSize:11,color:CM,fontWeight:700}}/>
            </div>
            <div style={{marginBottom:20,background:A,padding:"8px 14px",display:"inline-block"}}>
              <E value={data.subject} onChange={v=>setData(d=>({...d,subject:v}))} editing={editing} style={{fontSize:14,fontWeight:900,color:"#000"}}/>
            </div>
            <div style={{marginBottom:14}}><E value={data.salutation} onChange={v=>setData(d=>({...d,salutation:v}))} editing={editing} style={{fontSize:11,color:CB,fontWeight:700}}/></div>
            {data.bodyParagraphs.map((p,i)=>(
              <div key={i} style={{marginBottom:12,display:"flex",gap:8}}>
                {editing&&<button type="button" onClick={()=>setData(d=>({...d,bodyParagraphs:d.bodyParagraphs.filter((_,j)=>j!==i)}))} style={{color:"#f87171",background:"none",border:"none",cursor:"pointer",fontSize:10,padding:0,flexShrink:0}}>✕</button>}
                <E value={p} onChange={v=>setData(d=>({...d,bodyParagraphs:d.bodyParagraphs.map((x,j)=>j===i?v:x)}))} editing={editing} multiline rows={4} style={{fontSize:11,color:CM,lineHeight:1.75,display:"block"}}/>
              </div>
            ))}
            {editing&&<button type="button" onClick={()=>setData(d=>({...d,bodyParagraphs:[...d.bodyParagraphs,""]}))} style={{fontSize:11,color:A,background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:4,marginBottom:14,fontWeight:700}}><PlusIcon style={{width:12,height:12}}/>+ABSATZ</button>}
            <div style={{marginTop:20}}>
              <E value={data.closing} onChange={v=>setData(d=>({...d,closing:v}))} editing={editing} style={{fontSize:11,color:CB,display:"block",marginBottom:24}}/>
              <div style={{width:60,height:4,background:A,marginBottom:8}}/>
              <E value={data.signatureName} onChange={v=>setData(d=>({...d,signatureName:v}))} editing={editing} style={{fontSize:14,fontWeight:900,color:CT}}/>
            </div>
          </div>
          <div style={{height:8,background:`repeating-linear-gradient(90deg, ${A} 0px, ${A} 20px, #000 20px, #000 40px)`}}/>
        </div>
      </div>
    </div>
  </ColCtx.Provider>
  );
}
