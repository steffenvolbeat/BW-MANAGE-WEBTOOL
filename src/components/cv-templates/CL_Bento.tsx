"use client";
// ─── Anschreiben Template: Bento ─────────────────────────────────────────────
import { useState, useContext, createContext } from "react";
import { PrinterIcon, PencilSquareIcon, CheckIcon, PlusIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { FONTS, FONT_SIZES, CLData, DEFAULT_CL_DATA, usePersistentCLState } from "./shared";

const DEFAULT_COLORS = { A:"#6366f1", BG:"#f4f4f5", HD:"#e4e4e7", S2:"#d4d4d8", CT:"#18181b", CB:"#3f3f46", CM:"#a1a1aa" };
const hex2rgba=(hex:string,a:number)=>{const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);return `rgba(${r},${g},${b},${a})`;}
const ColCtx=createContext(DEFAULT_COLORS);
const PFX="clbento";

function E({value,onChange,editing,multiline=false,style={} as React.CSSProperties,placeholder="...",rows=4}:{value:string;onChange:(v:string)=>void;editing:boolean;multiline?:boolean;style?:React.CSSProperties;placeholder?:string;rows?:number;}){
  const {A}=useContext(ColCtx);
  const s:React.CSSProperties={...style,background:hex2rgba(A,0.06),border:`1px dashed ${A}55`,padding:"2px 4px",outline:"none",width:"100%",fontFamily:"inherit",fontSize:"inherit",color:"inherit",lineHeight:"inherit",fontWeight:"inherit",boxSizing:"border-box"};
  if(!editing)return <span style={style}>{value||<span style={{opacity:0.3}}>{placeholder}</span>}</span>;
  if(multiline)return <textarea style={{...s,resize:"vertical",display:"block"}} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={rows}/>;
  return <input style={s} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}/>;
}

export default function CL_Bento(){
  const [data,setData]=usePersistentCLState<CLData>('cl_clbento_data',JSON.parse(JSON.stringify(DEFAULT_CL_DATA)));
  const [editing,setEditing]=useState(false);
  const [fontKey,setFontKey]=usePersistentCLState('cl_clbento_font',"nunito");
  const [sizeKey,setSizeKey]=usePersistentCLState('cl_clbento_size',"md");
  const [clrs,setClrs]=usePersistentCLState('cl_clbento_colors',DEFAULT_COLORS);
  const [showDesign,setShowDesign]=useState(false);
  const {A,BG,HD,S2,CT,CB,CM}=clrs;
  const curFont=FONTS.find(f=>f.key===fontKey)??FONTS[0];
  const curSize=FONT_SIZES.find(s=>s.key===sizeKey)??FONT_SIZES[2];
  const fnt=curFont.family;const scale=curSize.scale;
  const setP=(p:Partial<CLData["personal"]>)=>setData(d=>({...d,personal:{...d.personal,...p}}));
  const setR=(p:Partial<CLData["recipient"]>)=>setData(d=>({...d,recipient:{...d.recipient,...p}}));

  return(
  <ColCtx.Provider value={clrs}>
    <div style={{minHeight:"100vh",background:"#e8e8ec",padding:"24px 16px",fontFamily:fnt}}>
      <style>{`
        ${curFont.gf?`@import url('https://fonts.googleapis.com/css2?family=${curFont.gf}&display=swap');`:""}
        .${PFX}-doc,.${PFX}-doc *{font-family:${fnt}!important;}
        @media print{@page{size:A4 portrait;margin:0;}*,*::before,*::after{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;}body *{visibility:hidden!important;}.${PFX}-doc,.${PFX}-doc *{visibility:visible!important;}.${PFX}-doc{position:fixed!important;top:0!important;left:0!important;width:850px!important;min-height:1202px!important;overflow:visible!important;zoom:0.934!important;box-shadow:none!important;margin:0!important;}.${PFX}-zoom{zoom:1!important;width:100%!important;}.${PFX}-ctrl{display:none!important;}}
      `}</style>
      <div className={`${PFX}-ctrl`} style={{maxWidth:850,margin:"0 auto 16px",display:"flex",gap:8,flexWrap:"wrap"}}>
        <button onClick={()=>setEditing(e=>!e)} style={{padding:"7px 16px",fontSize:13,cursor:"pointer",border:`2px solid ${A}`,background:editing?A:"transparent",color:editing?"white":A,display:"flex",alignItems:"center",gap:6}}>{editing?<CheckIcon style={{width:16,height:16}}/>:<PencilSquareIcon style={{width:16,height:16}}/>}{editing?"Fertig":"Bearbeiten"}</button>
        <button onClick={()=>window.print()} style={{padding:"7px 16px",fontSize:13,cursor:"pointer",border:"2px solid #555",background:"transparent",color:"#555",display:"flex",alignItems:"center",gap:6}}><PrinterIcon style={{width:16,height:16}}/>Drucken</button>
        <button onClick={()=>setShowDesign((v:boolean)=>!v)} style={{padding:"7px 16px",fontSize:13,cursor:"pointer",border:`2px solid ${showDesign?A:"#ccc"}`,background:"transparent",color:showDesign?A:"#888"}}>🎨 Design</button>
        <button onClick={()=>{setData(JSON.parse(JSON.stringify(DEFAULT_CL_DATA)));setClrs(DEFAULT_COLORS);setShowDesign(false);}} style={{padding:"7px 16px",fontSize:13,cursor:"pointer",border:"2px solid #aaa",background:"transparent",color:"#777",display:"flex",alignItems:"center",gap:6}}><XMarkIcon style={{width:14,height:14}}/>Reset</button>
        {showDesign&&(<div style={{width:"100%",background:"#f9f9f9",border:"1px solid #ddd",padding:"14px 18px",display:"flex",gap:20,flexWrap:"wrap"}}>
          <div><div style={{fontSize:10,fontWeight:700,color:"#999",marginBottom:6,textTransform:"uppercase"}}>Font</div><div style={{display:"flex",gap:4,flexWrap:"wrap"}}>{FONTS.map(f=><button key={f.key} onClick={()=>setFontKey(f.key)} style={{padding:"2px 8px",border:`1px solid ${fontKey===f.key?A:"#ddd"}`,background:fontKey===f.key?hex2rgba(A,0.1):"transparent",color:fontKey===f.key?A:"#666",fontSize:10,cursor:"pointer",fontFamily:f.family}}>{f.label}</button>)}</div></div>
          <div><div style={{fontSize:10,fontWeight:700,color:"#999",marginBottom:6,textTransform:"uppercase"}}>Größe</div><div style={{display:"flex",gap:4}}>{FONT_SIZES.map(s=><button key={s.key} onClick={()=>setSizeKey(s.key)} style={{padding:"2px 10px",border:`1px solid ${sizeKey===s.key?A:"#ddd"}`,background:sizeKey===s.key?hex2rgba(A,0.1):"transparent",color:sizeKey===s.key?A:"#666",fontSize:10,cursor:"pointer"}}>{s.label}</button>)}</div></div>
          <div><div style={{fontSize:10,fontWeight:700,color:"#999",marginBottom:6,textTransform:"uppercase"}}>Farben</div><div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"flex-end"}}>{([{k:"A" as const,l:"Akzent"},{k:"BG" as const,l:"BG"},{k:"HD" as const,l:"Header"},{k:"S2" as const,l:"Sub"},{k:"CT" as const,l:"Titel"},{k:"CB" as const,l:"Text"},{k:"CM" as const,l:"Gedimmt"}]).map(({k,l})=>(<label key={k} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2,cursor:"pointer"}}><input type="color" value={clrs[k]} onChange={e=>setClrs((c:typeof DEFAULT_COLORS)=>({...c,[k]:e.target.value}))} style={{width:28,height:28,padding:1,border:"1px solid #ddd",cursor:"pointer",background:"none"}}/><span style={{fontSize:9,color:"#999"}}>{l}</span></label>))}<button onClick={()=>setClrs(DEFAULT_COLORS)} style={{padding:"3px 8px",fontSize:10,border:"1px solid #ddd",background:"transparent",color:"#888",cursor:"pointer",alignSelf:"center"}}>↺</button></div></div>
        </div>)}
      </div>

      <div className={`${PFX}-doc`} style={{width:850,minHeight:1202,margin:"0 auto",backgroundColor:BG,boxShadow:"0 4px 24px rgba(0,0,0,0.1)",overflow:"visible",position:"relative"}}>
        <div className={`${PFX}-zoom`} style={{width:Math.round(850/scale),zoom:scale}}>
          <div style={{background:`linear-gradient(135deg, ${HD} 0%, ${S2} 100%)`,padding:"36px 48px 28px",borderBottom:`3px solid ${A}`}}>
            <E value={data.personal.name} onChange={v=>setP({name:v})} editing={editing} style={{fontSize:26,fontWeight:900,color:CT,display:"block",marginBottom:3}}/>
            <E value={data.personal.subtitle} onChange={v=>setP({subtitle:v})} editing={editing} style={{fontSize:11,color:A,letterSpacing:"0.08em",display:"block",marginBottom:8}}/>
            <div style={{display:"flex",gap:20,flexWrap:"wrap"}}>
              {(["email","phone","location"] as const).map(k=><E key={k} value={data.personal[k]} onChange={v=>setP({[k]:v})} editing={editing} style={{fontSize:9,color:CM}}/>)}
            </div>
          </div>
          <div style={{padding:"32px 48px 48px"}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:24}}>
              <div>{(["company","street","cityZip"] as const).map(k=><E key={k} value={data.recipient[k]} onChange={v=>setR({[k]:v})} editing={editing} style={{fontSize:11,color:CB,display:"block",lineHeight:1.6}}/>)}</div>
              <E value={data.date} onChange={v=>setData(d=>({...d,date:v}))} editing={editing} style={{fontSize:11,color:CM,fontStyle:"italic"}}/>
            </div>
            <div style={{marginBottom:20,paddingLeft:14,borderLeft:`4px solid ${A}`}}>
              <E value={data.subject} onChange={v=>setData(d=>({...d,subject:v}))} editing={editing} style={{fontSize:13,fontWeight:800,color:CT}}/>
            </div>
            <E value={data.salutation} onChange={v=>setData(d=>({...d,salutation:v}))} editing={editing} style={{fontSize:11,color:CB,display:"block",marginBottom:14}}/>
            {data.bodyParagraphs.map((p,i)=>(
              <div key={i} style={{marginBottom:12,display:"flex",gap:8}}>
                {editing&&<button type="button" onClick={()=>setData(d=>({...d,bodyParagraphs:d.bodyParagraphs.filter((_,j)=>j!==i)}))} style={{color:"#f87171",background:"none",border:"none",cursor:"pointer",fontSize:10,padding:0,marginTop:4,flexShrink:0}}>✕</button>}
                <E value={p} onChange={v=>setData(d=>({...d,bodyParagraphs:d.bodyParagraphs.map((x,j)=>j===i?v:x)}))} editing={editing} multiline rows={4} style={{fontSize:11,color:CM,lineHeight:1.75,display:"block"}}/>
              </div>
            ))}
            {editing&&<button type="button" onClick={()=>setData(d=>({...d,bodyParagraphs:[...d.bodyParagraphs,""]}))} style={{fontSize:11,color:A,background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:4,marginBottom:14}}><PlusIcon style={{width:12,height:12}}/>Absatz</button>}
            <div style={{marginTop:20}}>
              <E value={data.closing} onChange={v=>setData(d=>({...d,closing:v}))} editing={editing} style={{fontSize:11,color:CB,display:"block",marginBottom:24}}/>
              <div style={{width:80,height:2,background:A,marginBottom:8}}/>
              <E value={data.signatureName} onChange={v=>setData(d=>({...d,signatureName:v}))} editing={editing} style={{fontSize:13,fontWeight:700,color:CT}}/>
            </div>
          </div>
        </div>
      </div>
    </div>
  </ColCtx.Provider>
  );
}
