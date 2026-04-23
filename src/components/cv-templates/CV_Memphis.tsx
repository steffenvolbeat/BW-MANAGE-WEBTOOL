"use client";
// ─── CV Template: Memphis (80s Memphis Group Geometric) ───────────────────────
import { useState, useRef, useContext, createContext } from "react";
import { PrinterIcon, PencilSquareIcon, CheckIcon, PlusIcon, TrashIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { FONTS, FONT_SIZES, PHOTO_SHAPES, CVData, DEFAULT_CV_DATA, uid } from "./shared";
import { useCVStorage } from "./useCV";

const DEFAULT_COLORS = { A:"#ff3366", BG:"#fffef0", S2:"#fff5e0", S3:"#ffebb0", SBG:"#ffffff", CT:"#1a1a1a", CB:"#2a2a2a", CM:"#666666" };
const hex2rgba = (hex:string,a:number) => { const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16); return `rgba(${r},${g},${b},${a})`; };
const ColCtx = createContext(DEFAULT_COLORS);
const PFX = "mem";
const TEAL="#00b5a0"; const YELL="#ffd600"; const PURP="#9b30ff"; const ORNG="#ff6c1a";

function E({ value, onChange, editing, multiline=false, style={} as React.CSSProperties, placeholder="...", rows=3 }:{ value:string; onChange:(v:string)=>void; editing:boolean; multiline?:boolean; style?:React.CSSProperties; placeholder?:string; rows?:number; }) {
  const {A}=useContext(ColCtx);
  const s:React.CSSProperties = { ...style, background:hex2rgba(A,0.07), border:`2px dashed ${A}`, borderRadius:0, padding:"2px 4px", outline:"none", width:"100%", fontFamily:"inherit", fontSize:"inherit", color:"inherit", lineHeight:"inherit", fontWeight:"inherit", boxSizing:"border-box" };
  if (!editing) return <span style={style}>{value||<span style={{opacity:0.3}}>{placeholder}</span>}</span>;
  if (multiline) return <textarea style={{...s,resize:"vertical",display:"block"}} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={rows}/>;
  return <input style={s} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}/>;
}

function BulletList({ bullets, onChange, editing }:{ bullets:string[]; onChange:(b:string[])=>void; editing:boolean }) {
  const {A,CB}=useContext(ColCtx);
  const colors=[TEAL,A,PURP,ORNG,YELL];
  return (
    <ul style={{listStyle:"none",margin:0,padding:0}}>
      {bullets.map((b,i)=>(
        <li key={i} style={{display:"flex",alignItems:"flex-start",gap:7,marginBottom:4}}>
          <span style={{width:8,height:8,background:colors[i%colors.length],borderRadius:i%2===0?"50%":0,flexShrink:0,marginTop:3,display:"inline-block",transform:i%3===2?"rotate(45deg)":"none"}}/>
          {editing?(<div style={{flex:1,display:"flex",gap:4}}><input value={b} onChange={e=>{const n=[...bullets];n[i]=e.target.value;onChange(n);}} style={{flex:1,fontSize:11,color:CB,background:hex2rgba(colors[i%colors.length],0.08),border:`2px dashed ${colors[i%colors.length]}66`,padding:"1px 4px",outline:"none",fontFamily:"inherit"}}/><button type="button" onClick={()=>onChange(bullets.filter((_,idx)=>idx!==i))} style={{background:"none",border:"none",cursor:"pointer",color:"#f87171",padding:0}}><XMarkIcon style={{width:11,height:11}}/></button></div>)
          :<span style={{fontSize:11,color:CB,lineHeight:1.6}}>{b}</span>}
        </li>
      ))}
      {editing&&<li><button type="button" onClick={()=>onChange([...bullets,""])} style={{display:"flex",alignItems:"center",gap:4,fontSize:11,color:A,background:"none",border:"none",cursor:"pointer",padding:"3px 0"}}><PlusIcon style={{width:11,height:11}}/>Hinzufügen</button></li>}
    </ul>
  );
}

function TagList({ tags, onChange, editing }:{ tags:string[]; onChange:(t:string[])=>void; editing:boolean }) {
  const {A,CT}=useContext(ColCtx);
  const colors=[TEAL,A,PURP,ORNG,YELL];
  const [nv,setNv]=useState("");
  return (
    <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
      {tags.map((t,i)=>(
        <div key={i} style={{background:colors[i%colors.length],color:"white",padding:"3px 10px",fontSize:10,fontWeight:700,display:"flex",alignItems:"center",gap:3,borderRadius:i%2===0?12:0}}>
          {t}{editing&&<button type="button" onClick={()=>onChange(tags.filter((_,idx)=>idx!==i))} style={{background:"none",border:"none",cursor:"pointer",color:"rgba(255,255,255,0.7)",padding:0}}><XMarkIcon style={{width:9,height:9}}/></button>}
        </div>
      ))}
      {editing&&<input value={nv} onChange={e=>setNv(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&nv.trim()){onChange([...tags,nv.trim()]);setNv("");}}} style={{width:70,fontSize:10,border:`2px dashed ${A}`,padding:"2px 5px",background:hex2rgba(A,0.08),outline:"none",color:CT,fontFamily:"inherit"}} placeholder="+ Neu"/>}
    </div>
  );
}

function SecH({ title, color=TEAL }:{ title:string; color?:string }) {
  const {CT}=useContext(ColCtx);
  return (
    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10,borderBottom:`3px solid ${color}`,paddingBottom:4}}>
      <span style={{fontSize:11,fontWeight:800,letterSpacing:"0.1em",textTransform:"uppercase" as const,color:CT}}>{title}</span>
    </div>
  );
}

export default function CV_Memphis() {
  const {data,setData,fontKey,setFontKey,sizeKey,setSizeKey,photoShapeKey,setPhotoShapeKey,photoSrc,setPhotoSrc,clrs,setClrs,resetStorage}=useCVStorage("memphis",DEFAULT_COLORS);
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
    <div style={{minHeight:"100vh",background:"#f0f0e8",padding:"24px 16px",fontFamily:fnt}}>
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
        <button onClick={()=>setEditing(e=>!e)} style={{display:"flex",alignItems:"center",gap:6,padding:"7px 16px",fontSize:13,fontWeight:700,cursor:"pointer",border:`3px solid ${editing?"#16a34a":A}`,backgroundColor:editing?"#16a34a":hex2rgba(A,0.1),color:editing?"white":A}}>
          {editing?<CheckIcon style={{width:16,height:16}}/>:<PencilSquareIcon style={{width:16,height:16}}/>}{editing?"Fertig":"Bearbeiten"}
        </button>
        <button onClick={()=>{ const el=docRef.current; if(el){const h=el.scrollHeight;el.style.zoom=(h>1202?(0.934*1202/h):0.934).toFixed(5);} requestAnimationFrame(()=>requestAnimationFrame(()=>window.print())); }} style={{padding:"7px 16px",fontSize:13,cursor:"pointer",border:`3px solid ${TEAL}`,backgroundColor:TEAL,color:"white",display:"flex",alignItems:"center",gap:6,fontWeight:700}}>
          <PrinterIcon style={{width:16,height:16}}/>Drucken
        </button>
        <button onClick={()=>setShowDesign(v=>!v)} style={{padding:"7px 16px",fontSize:13,cursor:"pointer",border:`3px solid ${showDesign?PURP:"#ccc"}`,backgroundColor:"transparent",color:showDesign?PURP:"#888",fontWeight:700}}>🎨</button>
        <button onClick={()=>{resetStorage();setData(JSON.parse(JSON.stringify(DEFAULT_CV_DATA)));setPhotoSrc("");setFontKey("nunito");setSizeKey("md");setPhotoShapeKey("circle");setClrs(DEFAULT_COLORS);setShowDesign(false);}} style={{padding:"7px 16px",fontSize:13,cursor:"pointer",border:"3px solid #ccc",backgroundColor:"transparent",color:"#888",display:"flex",alignItems:"center",gap:6}}><XMarkIcon style={{width:16,height:16}}/>Reset</button>
        {showDesign&&(
          <div style={{width:"100%",background:BG,border:`3px solid ${A}`,padding:"14px 18px",display:"flex",gap:24,flexWrap:"wrap"}}>
            <div><div style={{fontSize:10,fontWeight:700,color:CM,marginBottom:7,textTransform:"uppercase"}}>Font</div><div style={{display:"flex",gap:5,flexWrap:"wrap"}}>{FONTS.map(f=><button key={f.key} onClick={()=>setFontKey(f.key)} style={{padding:"3px 9px",border:`2px solid ${fontKey===f.key?A:"#ddd"}`,background:fontKey===f.key?A:"transparent",color:fontKey===f.key?"white":CT,fontSize:11,cursor:"pointer",fontFamily:f.family}}>{f.label}</button>)}</div></div>
            <div><div style={{fontSize:10,fontWeight:700,color:CM,marginBottom:7,textTransform:"uppercase"}}>Größe</div><div style={{display:"flex",gap:5}}>{FONT_SIZES.map(s=><button key={s.key} onClick={()=>setSizeKey(s.key)} style={{padding:"3px 12px",border:`2px solid ${sizeKey===s.key?TEAL:"#ddd"}`,background:sizeKey===s.key?TEAL:"transparent",color:sizeKey===s.key?"white":CT,fontSize:11,cursor:"pointer"}}>{s.label}</button>)}</div></div>
            <div><div style={{fontSize:10,fontWeight:700,color:CM,marginBottom:7,textTransform:"uppercase"}}>Farben</div><div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"flex-end"}}>{([{k:"A" as const,l:"Pink"},{k:"BG" as const,l:"BG"},{k:"S2" as const,l:"S2"},{k:"CT" as const,l:"Text"}]).map(({k,l})=>(<label key={k} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3,cursor:"pointer"}}><input type="color" value={clrs[k]} onChange={e=>setClrs(c=>({...c,[k]:e.target.value}))} style={{width:30,height:30,padding:2,border:`2px solid ${A}`,cursor:"pointer",background:"none"}}/><span style={{fontSize:9,color:CM}}>{l}</span></label>))}<button onClick={()=>setClrs(DEFAULT_COLORS)} style={{padding:"4px 10px",fontSize:11,border:`2px solid #ccc`,background:"transparent",color:"#888",cursor:"pointer"}}>↺</button></div></div>
          </div>
        )}
      </div>

      <div ref={docRef} className={`${PFX}-doc`} style={{width:850,minHeight:1202,margin:"0 auto",backgroundColor:BG,overflow:"visible",fontFamily:fnt,position:"relative",boxShadow:"0 4px 30px rgba(0,0,0,0.1)"}}>
        <div className={`${PFX}-zoom`} style={{width:Math.round(850/scale),zoom:scale,position:"relative"}}>
          {/* Memphis geometric decorations */}
          <div style={{position:"absolute",top:20,right:20,width:30,height:30,background:YELL,borderRadius:"50%",opacity:0.7,pointerEvents:"none"}}/>
          <div style={{position:"absolute",top:50,right:60,width:16,height:16,background:TEAL,transform:"rotate(45deg)",opacity:0.7,pointerEvents:"none"}}/>
          <div style={{position:"absolute",top:16,right:100,width:0,height:0,borderLeft:"12px solid transparent",borderRight:"12px solid transparent",borderBottom:`20px solid ${PURP}`,opacity:0.6,pointerEvents:"none"}}/>
          <div style={{position:"absolute",top:80,right:10,width:3,height:40,background:A,opacity:0.5,pointerEvents:"none"}}/>
          {/* Header */}
          <div style={{padding:"30px 40px 22px",borderBottom:`5px solid ${CT}`,background:S2,position:"relative"}}>
            <div style={{display:"flex",gap:24,alignItems:"center"}}>
              <div style={{position:"relative",flexShrink:0}}>
                <div style={{width:curShape.w,height:curShape.h,borderRadius:curShape.br,overflow:"hidden",backgroundColor:S3,border:`4px solid ${CT}`,cursor:editing?"pointer":"default",display:"flex",alignItems:"center",justifyContent:"center"}} onClick={()=>editing&&photoInputRef.current?.click()}>
                  {photoSrc?<img src={photoSrc} alt="Foto" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<span style={{fontSize:10,color:CM}}>{editing?"📷":"FOTO"}</span>}
                </div>
                <div style={{position:"absolute",bottom:-6,right:-6,width:20,height:20,background:TEAL,borderRadius:"50%",border:`3px solid ${BG}`}}/>
                <input ref={photoInputRef} type="file" accept="image/*" style={{display:"none"}} onChange={e=>{const f=e.target.files?.[0];if(!f)return;const r=new FileReader();r.onload=ev=>setPhotoSrc((ev.target?.result as string)??"");r.readAsDataURL(f);}}/>
              </div>
              <div style={{flex:1}}>
                <div style={{background:A,display:"inline-block",padding:"4px 14px",marginBottom:8}}>
                  {editing?<input value={data.personal.name} onChange={e=>setP({name:e.target.value})} style={{fontSize:28,fontWeight:900,color:"white",fontFamily:"inherit",background:"transparent",border:"none",outline:"none",letterSpacing:"-0.5px"}}/>
                    :<span style={{fontSize:28,fontWeight:900,color:"white",letterSpacing:"-0.5px"}}>{data.personal.name}</span>}
                </div>
                <div style={{marginBottom:6}}>
                  {editing?<input value={data.personal.subtitle} onChange={e=>setP({subtitle:e.target.value})} style={{display:"block",fontSize:13,color:CT,fontFamily:"inherit",background:hex2rgba(TEAL,0.1),border:`2px dashed ${TEAL}`,padding:"2px 6px",outline:"none",width:"100%",boxSizing:"border-box",fontWeight:600}}/>
                    :<div style={{fontSize:13,fontWeight:600,color:CT}}>{data.personal.subtitle}</div>}
                </div>
                <E value={data.personal.bio} onChange={v=>setP({bio:v})} editing={editing} multiline rows={2} style={{fontSize:11,color:CM,lineHeight:1.6}}/>
                <div style={{display:"flex",flexWrap:"wrap",gap:6,marginTop:8}}>
                  {(["email","phone","location","linkedin","github"] as const).map((k,i)=>data.personal[k]?<span key={k} style={{fontSize:10,color:"white",background:[TEAL,PURP,ORNG][i%3],padding:"2px 8px"}}>{data.personal[k]}</span>:null)}
                </div>
              </div>
            </div>
          </div>

          <div style={{display:"flex"}}>
            <div style={{flex:1,padding:"20px 26px"}}>
              <div style={{marginBottom:18}}><SecH title="Berufserfahrung" color={A}/>
                {data.experience.map(ex=>(
                  <div key={ex.id} style={{marginBottom:14,paddingLeft:10,borderLeft:`3px solid ${TEAL}`}}>
                    <E value={ex.position} onChange={v=>updExp(ex.id,{position:v})} editing={editing} style={{fontSize:13,fontWeight:800,color:CT,display:"block"}}/>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                      <E value={ex.company} onChange={v=>updExp(ex.id,{company:v})} editing={editing} style={{fontSize:11,color:TEAL,fontWeight:600}}/>
                      <E value={ex.period} onChange={v=>updExp(ex.id,{period:v})} editing={editing} style={{fontSize:10,color:CM}}/>
                    </div>
                    <BulletList bullets={ex.bullets} onChange={b=>updExp(ex.id,{bullets:b})} editing={editing}/>
                    {editing&&<button type="button" onClick={()=>setData(d=>({...d,experience:d.experience.filter(x=>x.id!==ex.id)}))} style={{fontSize:10,color:"#f87171",background:"none",border:"none",cursor:"pointer"}}><TrashIcon style={{width:10,height:10}}/>Entfernen</button>}
                  </div>
                ))}
                {editing&&<button type="button" onClick={()=>setData(d=>({...d,experience:[...d.experience,{id:uid(),position:"",company:"",period:"",location:"",description:"",type:"",bullets:[],contact:""}]}))} style={{fontSize:11,color:A,background:"none",border:`3px solid ${A}`,cursor:"pointer",padding:"3px 10px"}}><PlusIcon style={{width:12,height:12,display:"inline"}}/>Hinzufügen</button>}
              </div>
              <div><SecH title="Projekte" color={PURP}/>
                {data.projects.map(p=>(
                  <div key={p.id} style={{marginBottom:12,paddingLeft:10,borderLeft:`3px solid ${PURP}`}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}>
                      <E value={p.title} onChange={v=>updProj(p.id,{title:v})} editing={editing} style={{fontSize:12,fontWeight:700,color:CT}}/>
                      <E value={p.period} onChange={v=>updProj(p.id,{period:v})} editing={editing} style={{fontSize:10,color:CM}}/>
                    </div>
                    <BulletList bullets={p.bullets} onChange={b=>updProj(p.id,{bullets:b})} editing={editing}/>
                    {editing&&<button type="button" onClick={()=>setData(d=>({...d,projects:d.projects.filter(x=>x.id!==p.id)}))} style={{fontSize:10,color:"#f87171",background:"none",border:"none",cursor:"pointer"}}><TrashIcon style={{width:10,height:10}}/>Entfernen</button>}
                  </div>
                ))}
                {editing&&<button type="button" onClick={()=>setData(d=>({...d,projects:[...d.projects,{id:uid(),title:"",period:"",bullets:[],link:""}]}))} style={{fontSize:11,color:PURP,background:"none",border:`3px solid ${PURP}`,cursor:"pointer",padding:"3px 10px"}}><PlusIcon style={{width:12,height:12,display:"inline"}}/>Hinzufügen</button>}
              </div>
            </div>
            <div style={{width:210,background:S2,borderLeft:`3px solid ${CT}`,padding:"20px 14px"}}>
              <div style={{marginBottom:16}}><SecH title="Skills" color={ORNG}/><TagList tags={data.skills} onChange={s=>setData(d=>({...d,skills:s}))} editing={editing}/></div>
              <div style={{marginBottom:16}}>
                <SecH title="Ausbildung" color={YELL}/>
                {data.education.map(e=>(
                  <div key={e.id} style={{marginBottom:8,padding:"6px 8px",background:hex2rgba(YELL,0.2),border:`2px solid ${YELL}`}}>
                    <E value={e.degree} onChange={v=>updEdu(e.id,{degree:v})} editing={editing} style={{fontSize:11,fontWeight:700,color:CT,display:"block"}}/>
                    <E value={e.institution} onChange={v=>updEdu(e.id,{institution:v})} editing={editing} style={{fontSize:10,color:ORNG,display:"block"}}/>
                    <E value={e.period} onChange={v=>updEdu(e.id,{period:v})} editing={editing} style={{fontSize:9,color:CM}}/>
                    {editing&&<button type="button" onClick={()=>setData(d=>({...d,education:d.education.filter(x=>x.id!==e.id)}))} style={{fontSize:10,color:"#f87171",background:"none",border:"none",cursor:"pointer"}}><TrashIcon style={{width:10,height:10}}/></button>}
                  </div>
                ))}
                {editing&&<button type="button" onClick={()=>setData(d=>({...d,education:[...d.education,{id:uid(),degree:"",institution:"",period:"",location:"",type:"Kurse / Inhalte",bullets:[]}] }))} style={{fontSize:11,color:TEAL,background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:3}}><PlusIcon style={{width:12,height:12}}/>+</button>}
              </div>
              <div>
                <SecH title="Sprachen" color={TEAL}/>
                {data.languages.map((l,i)=>(
                  <div key={i} style={{marginBottom:8,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <E value={l.language} onChange={v=>{const n=[...data.languages];n[i]={...n[i],language:v};setData(d=>({...d,languages:n}));}} editing={editing} style={{fontSize:11,fontWeight:700,color:CT}}/>
                    <span style={{fontSize:9,background:[TEAL,A,PURP,ORNG][i%4],color:"white",padding:"1px 6px"}}>{l.level}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </ColCtx.Provider>
  );
}
