"use client";
// ─── CV Template: Steampunk (Victorian Brass & Copper) ───────────────────────
import { useState, useRef, useContext, createContext } from "react";
import { PrinterIcon, PencilSquareIcon, CheckIcon, PlusIcon, TrashIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { FONTS, FONT_SIZES, PHOTO_SHAPES, CVData, DEFAULT_CV_DATA, uid } from "./shared";
import { useCVStorage } from "./useCV";

const DEFAULT_COLORS = { A:"#b87333", BG:"#1a1208", S2:"#241a0a", S3:"#2e2010", SBG:"#130e04", CT:"#f5e6cc", CB:"#e8d4b0", CM:"#8a6f4a" };
const hex2rgba = (hex:string,a:number) => { const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16); return `rgba(${r},${g},${b},${a})`; };
const ColCtx = createContext(DEFAULT_COLORS);
const PFX = "stmp";
const GOLD="#d4a843"; const RUST="#8b3d00"; const CREAM="#f5e6cc"; const COPPER="#b87333";

function E({ value, onChange, editing, multiline=false, style={} as React.CSSProperties, placeholder="...", rows=3 }:{ value:string; onChange:(v:string)=>void; editing:boolean; multiline?:boolean; style?:React.CSSProperties; placeholder?:string; rows?:number; }) {
  const {A}=useContext(ColCtx);
  const s:React.CSSProperties = { ...style, background:hex2rgba(A,0.1), border:`1.5px dashed ${A}88`, padding:"2px 5px", outline:"none", width:"100%", fontFamily:"inherit", fontSize:"inherit", color:"inherit", lineHeight:"inherit", fontWeight:"inherit", boxSizing:"border-box" };
  if (!editing) return <span style={style}>{value||<span style={{opacity:0.3}}>{placeholder}</span>}</span>;
  if (multiline) return <textarea style={{...s,resize:"vertical",display:"block"}} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={rows}/>;
  return <input style={s} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}/>;
}

function Gear({ size=20, top=0, left=0, opacity=0.15 }:{ size?:number; top?:number; left?:number; opacity?:number }) {
  return <div style={{position:"absolute",top,left,width:size,height:size,border:`${size/10}px solid ${GOLD}`,borderRadius:"50%",opacity,pointerEvents:"none",boxShadow:`0 0 ${size/4}px ${GOLD}44`}}/>;
}

function BulletList({ bullets, onChange, editing }:{ bullets:string[]; onChange:(b:string[])=>void; editing:boolean }) {
  const {CB}=useContext(ColCtx);
  return (
    <ul style={{listStyle:"none",margin:0,padding:0}}>
      {bullets.map((b,i)=>(
        <li key={i} style={{display:"flex",alignItems:"flex-start",gap:6,marginBottom:3}}>
          <span style={{color:GOLD,fontSize:10,lineHeight:1.6,flexShrink:0}}>⚙</span>
          {editing?(<div style={{flex:1,display:"flex",gap:4}}><input value={b} onChange={e=>{const n=[...bullets];n[i]=e.target.value;onChange(n);}} style={{flex:1,fontSize:11,color:CREAM,background:hex2rgba(GOLD,0.07),border:`1px dashed ${GOLD}55`,padding:"1px 4px",outline:"none",fontFamily:"inherit"}}/><button type="button" onClick={()=>onChange(bullets.filter((_,idx)=>idx!==i))} style={{background:"none",border:"none",cursor:"pointer",color:"#f87171",padding:0}}><XMarkIcon style={{width:11,height:11}}/></button></div>)
          :<span style={{fontSize:11,color:CB,lineHeight:1.7}}>{b}</span>}
        </li>
      ))}
      {editing&&<li><button type="button" onClick={()=>onChange([...bullets,""])} style={{display:"flex",alignItems:"center",gap:4,fontSize:11,color:GOLD,background:"none",border:"none",cursor:"pointer",padding:"2px 0"}}><PlusIcon style={{width:11,height:11}}/>Hinzufügen</button></li>}
    </ul>
  );
}

function TagList({ tags, onChange, editing }:{ tags:string[]; onChange:(t:string[])=>void; editing:boolean }) {
  const [nv,setNv]=useState("");
  return (
    <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
      {tags.map((t,i)=>(
        <div key={i} style={{background:hex2rgba(GOLD,0.1),border:`1px solid ${GOLD}55`,color:GOLD,padding:"2px 9px",fontSize:10,fontWeight:600,display:"flex",alignItems:"center",gap:3}}>
          ⚙ {t}{editing&&<button type="button" onClick={()=>onChange(tags.filter((_,idx)=>idx!==i))} style={{background:"none",border:"none",cursor:"pointer",color:"#f87171",padding:0}}><XMarkIcon style={{width:9,height:9}}/></button>}
        </div>
      ))}
      {editing&&<input value={nv} onChange={e=>setNv(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&nv.trim()){onChange([...tags,nv.trim()]);setNv("");}}} style={{width:70,fontSize:10,border:`1px dashed ${GOLD}`,padding:"2px 6px",background:hex2rgba(GOLD,0.05),outline:"none",color:GOLD,fontFamily:"inherit"}} placeholder="+ Neu"/>}
    </div>
  );
}

function SecH({ title }:{ title:string }) {
  return (
    <div style={{marginBottom:10,borderBottom:`1px solid ${GOLD}55`,paddingBottom:5,display:"flex",alignItems:"center",gap:6}}>
      <span style={{color:GOLD,fontSize:10}}>⚙</span>
      <span style={{fontSize:11,fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase" as const,color:GOLD}}>{title}</span>
      <span style={{color:GOLD,fontSize:8}}>⚙</span>
    </div>
  );
}

export default function CV_Steampunk() {
  const {data,setData,fontKey,setFontKey,sizeKey,setSizeKey,photoShapeKey,setPhotoShapeKey,photoSrc,setPhotoSrc,clrs,setClrs,resetStorage}=useCVStorage("steampunk",DEFAULT_COLORS);
  const [editing,setEditing]=useState(false);
  const [showDesign,setShowDesign]=useState(false);
  const {A,BG,S2,S3,CT,CB,CM}=clrs;
  const curFont=FONTS.find(f=>f.key===fontKey)??FONTS[0];
  const curSize=FONT_SIZES.find(s=>s.key===sizeKey)??FONT_SIZES[2];
  const curShape=PHOTO_SHAPES.find(s=>s.key===photoShapeKey)??PHOTO_SHAPES[4];
  const fnt=curFont.family; const scale=curSize.scale;
  const photoInputRef=useRef<HTMLInputElement>(null);
  const docRef=useRef<HTMLDivElement>(null);
  const setP=(p:Partial<CVData["personal"]>)=>setData(d=>({...d,personal:{...d.personal,...p}}));
  const updProj=(id:string,p:Partial<typeof data.projects[0]>)=>setData(d=>({...d,projects:d.projects.map(x=>x.id===id?{...x,...p}:x)}));
  const updEdu=(id:string,p:Partial<typeof data.education[0]>)=>setData(d=>({...d,education:d.education.map(x=>x.id===id?{...x,...p}:x)}));
  const updExp=(id:string,p:Partial<typeof data.experience[0]>)=>setData(d=>({...d,experience:d.experience.map(x=>x.id===id?{...x,...p}:x)}));

  return (
  <ColCtx.Provider value={clrs}>
    <div style={{minHeight:"100vh",background:"#0d0800",padding:"24px 16px",fontFamily:fnt}}>
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
        <button onClick={()=>setEditing(e=>!e)} style={{display:"flex",alignItems:"center",gap:6,padding:"7px 16px",fontSize:13,cursor:"pointer",border:`2px solid ${editing?"#16a34a":GOLD}`,backgroundColor:editing?"#16a34a":hex2rgba(GOLD,0.08),color:editing?"white":GOLD}}>
          {editing?<CheckIcon style={{width:16,height:16}}/>:<PencilSquareIcon style={{width:16,height:16}}/>}{editing?"Fertig":"Bearbeiten"}
        </button>
        <button onClick={()=>{ const el=docRef.current; if(el){const h=el.scrollHeight;el.style.zoom=(h>1202?(0.934*1202/h):0.934).toFixed(5);} requestAnimationFrame(()=>requestAnimationFrame(()=>window.print())); }} style={{padding:"7px 16px",fontSize:13,cursor:"pointer",border:`2px solid ${COPPER}`,backgroundColor:hex2rgba(COPPER,0.1),color:COPPER,display:"flex",alignItems:"center",gap:6}}>
          <PrinterIcon style={{width:16,height:16}}/>Drucken
        </button>
        <button onClick={()=>setShowDesign(v=>!v)} style={{padding:"7px 16px",fontSize:13,cursor:"pointer",border:`2px solid ${showDesign?GOLD:"#333"}`,backgroundColor:"transparent",color:showDesign?GOLD:"#555"}}>🎨</button>
        <button onClick={()=>{resetStorage();setData(JSON.parse(JSON.stringify(DEFAULT_CV_DATA)));setPhotoSrc("");setFontKey("nunito");setSizeKey("md");setPhotoShapeKey("circle");setClrs(DEFAULT_COLORS);setShowDesign(false);}} style={{padding:"7px 16px",fontSize:13,cursor:"pointer",border:"2px solid #333",backgroundColor:"transparent",color:"#555",display:"flex",alignItems:"center",gap:6}}><XMarkIcon style={{width:16,height:16}}/>Reset</button>
        {showDesign&&(
          <div style={{width:"100%",background:S2,border:`2px solid ${GOLD}55`,padding:"14px 18px",display:"flex",gap:24,flexWrap:"wrap"}}>
            <div><div style={{fontSize:10,color:CM,marginBottom:7,textTransform:"uppercase"}}>Font</div><div style={{display:"flex",gap:5,flexWrap:"wrap"}}>{FONTS.map(f=><button key={f.key} onClick={()=>setFontKey(f.key)} style={{padding:"3px 9px",border:`1.5px solid ${fontKey===f.key?GOLD:"#333"}`,background:fontKey===f.key?hex2rgba(GOLD,0.1):"transparent",color:fontKey===f.key?GOLD:CM,fontSize:11,cursor:"pointer",fontFamily:f.family}}>{f.label}</button>)}</div></div>
            <div><div style={{fontSize:10,color:CM,marginBottom:7,textTransform:"uppercase"}}>Größe</div><div style={{display:"flex",gap:5}}>{FONT_SIZES.map(s=><button key={s.key} onClick={()=>setSizeKey(s.key)} style={{padding:"3px 12px",border:`1.5px solid ${sizeKey===s.key?GOLD:"#333"}`,background:"transparent",color:sizeKey===s.key?GOLD:CM,fontSize:11,cursor:"pointer"}}>{s.label}</button>)}</div></div>
          </div>
        )}
      </div>

      <div ref={docRef} className={`${PFX}-doc`} style={{width:850,minHeight:1202,margin:"0 auto",backgroundColor:BG,overflow:"visible",fontFamily:fnt,boxShadow:`0 0 40px ${hex2rgba(GOLD,0.2)},0 4px 30px rgba(0,0,0,0.7)`}}>
        <div className={`${PFX}-zoom`} style={{width:Math.round(850/scale),zoom:scale,position:"relative"}}>
          <Gear size={60} top={-30} left={820} opacity={0.08}/>
          <Gear size={40} top={20} left={800} opacity={0.06}/>
          {/* Ornate top border */}
          <div style={{height:6,background:`linear-gradient(90deg, ${RUST}, ${GOLD}, ${COPPER}, ${GOLD}, ${RUST})`}}/>
          <div style={{height:2,background:BG,margin:"2px 0"}}/>
          <div style={{height:2,background:`${GOLD}88`}}/>
          {/* Header */}
          <div style={{padding:"22px 36px 18px",background:`linear-gradient(180deg, ${hex2rgba(GOLD,0.05)} 0%, transparent 100%)`}}>
            <div style={{display:"flex",gap:24,alignItems:"center"}}>
              <div style={{flexShrink:0}}>
                <div style={{width:curShape.w,height:curShape.h,borderRadius:curShape.br,overflow:"hidden",backgroundColor:S2,border:`3px solid ${GOLD}`,cursor:editing?"pointer":"default",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 0 10px ${GOLD}44,inset 0 0 10px rgba(0,0,0,0.5)`}} onClick={()=>editing&&photoInputRef.current?.click()}>
                  {photoSrc?<img src={photoSrc} alt="Foto" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<span style={{fontSize:10,color:GOLD,textAlign:"center"}}>{editing?"📷":"Foto"}</span>}
                </div>
                <input ref={photoInputRef} type="file" accept="image/*" style={{display:"none"}} onChange={e=>{const f=e.target.files?.[0];if(!f)return;const r=new FileReader();r.onload=ev=>setPhotoSrc((ev.target?.result as string)??"");r.readAsDataURL(f);}}/>
              </div>
              <div style={{flex:1}}>
                <div style={{marginBottom:4}}>{editing?<input value={data.personal.name} onChange={e=>setP({name:e.target.value})} style={{fontSize:28,fontWeight:700,color:CREAM,fontFamily:"inherit",background:hex2rgba(GOLD,0.06),border:`1.5px dashed ${GOLD}88`,padding:"2px 8px",outline:"none",width:"100%",boxSizing:"border-box"}}/>
                  :<span style={{fontSize:28,fontWeight:700,color:CREAM}}>{data.personal.name}</span>}</div>
                <div style={{marginBottom:4,height:1,background:`linear-gradient(90deg, ${GOLD}88, transparent)`}}/>
                <div style={{marginBottom:6}}>{editing?<input value={data.personal.subtitle} onChange={e=>setP({subtitle:e.target.value})} style={{display:"block",fontSize:13,color:GOLD,fontFamily:"inherit",background:hex2rgba(GOLD,0.06),border:`1.5px dashed ${GOLD}88`,padding:"2px 6px",outline:"none",width:"100%",boxSizing:"border-box",fontStyle:"italic"}}/>
                  :<div style={{fontSize:13,color:GOLD,fontStyle:"italic"}}>{data.personal.subtitle}</div>}</div>
                <E value={data.personal.bio} onChange={v=>setP({bio:v})} editing={editing} multiline rows={2} style={{fontSize:11,color:CM,lineHeight:1.7,display:"block",marginBottom:8}}/>
                <div style={{display:"flex",flexWrap:"wrap",gap:10}}>
                  {(["email","phone","location","linkedin","github"] as const).map(k=>data.personal[k]?<span key={k} style={{fontSize:10,color:COPPER}}>{data.personal[k]}</span>:null)}
                </div>
              </div>
            </div>
          </div>
          <div style={{height:1,background:`${GOLD}55`,margin:"0 20px"}}/>

          <div style={{display:"flex"}}>
            <div style={{flex:1,padding:"18px 22px"}}>
              <div style={{marginBottom:16}}><SecH title="Berufserfahrung"/>
                {data.experience.map(ex=>(
                  <div key={ex.id} style={{marginBottom:14,padding:"8px 10px",background:S2,borderLeft:`3px solid ${GOLD}55`}}>
                    <E value={ex.position} onChange={v=>updExp(ex.id,{position:v})} editing={editing} style={{fontSize:13,fontWeight:700,color:CREAM,display:"block"}}/>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                      <E value={ex.company} onChange={v=>updExp(ex.id,{company:v})} editing={editing} style={{fontSize:11,color:GOLD}}/>
                      <E value={ex.period} onChange={v=>updExp(ex.id,{period:v})} editing={editing} style={{fontSize:10,color:CM}}/>
                    </div>
                    <BulletList bullets={ex.bullets} onChange={b=>updExp(ex.id,{bullets:b})} editing={editing}/>
                    {editing&&<button type="button" onClick={()=>setData(d=>({...d,experience:d.experience.filter(x=>x.id!==ex.id)}))} style={{fontSize:10,color:"#f87171",background:"none",border:"none",cursor:"pointer",marginTop:3}}><TrashIcon style={{width:10,height:10}}/>Entfernen</button>}
                  </div>
                ))}
                {editing&&<button type="button" onClick={()=>setData(d=>({...d,experience:[...d.experience,{id:uid(),position:"",company:"",period:"",location:"",description:"",type:"",bullets:[],contact:""}]}))} style={{fontSize:11,color:GOLD,background:"none",border:`1.5px solid ${GOLD}55`,cursor:"pointer",padding:"3px 10px",display:"flex",alignItems:"center",gap:4}}><PlusIcon style={{width:12,height:12}}/>Hinzufügen</button>}
              </div>
              <div><SecH title="Projekte"/>
                {data.projects.map(p=>(
                  <div key={p.id} style={{marginBottom:10,padding:"8px 10px",background:S2}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}>
                      <E value={p.title} onChange={v=>updProj(p.id,{title:v})} editing={editing} style={{fontSize:12,fontWeight:700,color:COPPER}}/>
                      <E value={p.period} onChange={v=>updProj(p.id,{period:v})} editing={editing} style={{fontSize:10,color:CM}}/>
                    </div>
                    <BulletList bullets={p.bullets} onChange={b=>updProj(p.id,{bullets:b})} editing={editing}/>
                    {editing&&<button type="button" onClick={()=>setData(d=>({...d,projects:d.projects.filter(x=>x.id!==p.id)}))} style={{fontSize:10,color:"#f87171",background:"none",border:"none",cursor:"pointer"}}><TrashIcon style={{width:10,height:10}}/></button>}
                  </div>
                ))}
                {editing&&<button type="button" onClick={()=>setData(d=>({...d,projects:[...d.projects,{id:uid(),title:"",period:"",bullets:[],link:""}]}))} style={{fontSize:11,color:COPPER,background:"none",border:`1.5px solid ${COPPER}55`,cursor:"pointer",padding:"3px 10px",display:"flex",alignItems:"center",gap:4}}><PlusIcon style={{width:12,height:12}}/>Hinzufügen</button>}
              </div>
            </div>
            <div style={{width:210,background:S2,borderLeft:`1px solid ${GOLD}33`,padding:"18px 14px"}}>
              <div style={{marginBottom:14}}><SecH title="Skills"/><TagList tags={data.skills} onChange={s=>setData(d=>({...d,skills:s}))} editing={editing}/></div>
              <div style={{marginBottom:14}}>
                <SecH title="Ausbildung"/>
                {data.education.map(e=>(
                  <div key={e.id} style={{marginBottom:10,padding:"6px",background:BG,border:`1px solid ${GOLD}33`}}>
                    <E value={e.degree} onChange={v=>updEdu(e.id,{degree:v})} editing={editing} style={{fontSize:11,fontWeight:700,color:CREAM,display:"block"}}/>
                    <E value={e.institution} onChange={v=>updEdu(e.id,{institution:v})} editing={editing} style={{fontSize:10,color:GOLD,display:"block"}}/>
                    <E value={e.period} onChange={v=>updEdu(e.id,{period:v})} editing={editing} style={{fontSize:9,color:CM}}/>
                    {editing&&<button type="button" onClick={()=>setData(d=>({...d,education:d.education.filter(x=>x.id!==e.id)}))} style={{fontSize:10,color:"#f87171",background:"none",border:"none",cursor:"pointer"}}><TrashIcon style={{width:10,height:10}}/></button>}
                  </div>
                ))}
                {editing&&<button type="button" onClick={()=>setData(d=>({...d,education:[...d.education,{id:uid(),degree:"",institution:"",period:"",location:"",type:"Kurse / Inhalte",bullets:[]}] }))} style={{fontSize:11,color:GOLD,background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:3}}><PlusIcon style={{width:12,height:12}}/>+</button>}
              </div>
              <div><SecH title="Sprachen"/>
                {data.languages.map((l,i)=>(
                  <div key={i} style={{marginBottom:6,display:"flex",justifyContent:"space-between"}}>
                    <E value={l.language} onChange={v=>{const n=[...data.languages];n[i]={...n[i],language:v};setData(d=>({...d,languages:n}));}} editing={editing} style={{fontSize:11,color:CREAM,fontWeight:600}}/>
                    <span style={{fontSize:9,background:hex2rgba(GOLD,0.15),color:GOLD,padding:"1px 6px"}}>{l.level}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div style={{height:2,background:`${GOLD}88`}}/>
          <div style={{height:2,background:BG,margin:"2px 0"}}/>
          <div style={{height:6,background:`linear-gradient(90deg, ${RUST}, ${GOLD}, ${COPPER}, ${GOLD}, ${RUST})`}}/>
        </div>
      </div>
    </div>
  </ColCtx.Provider>
  );
}
