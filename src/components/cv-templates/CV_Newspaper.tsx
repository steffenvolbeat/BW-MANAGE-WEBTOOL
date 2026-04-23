"use client";
// ─── CV Template: Newspaper (Broadsheet Typography) ──────────────────────────
import { useState, useRef, useContext, createContext } from "react";
import { PrinterIcon, PencilSquareIcon, CheckIcon, PlusIcon, TrashIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { FONTS, FONT_SIZES, PHOTO_SHAPES, CVData, DEFAULT_CV_DATA, uid } from "./shared";
import { useCVStorage } from "./useCV";

const DEFAULT_COLORS = { A:"#1a1a1a", BG:"#f5f0e8", S2:"#ede8d8", S3:"#e0d8c4", SBG:"#faf7f0", CT:"#111111", CB:"#2a2a2a", CM:"#666655" };
const hex2rgba = (hex:string,a:number) => { const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16); return `rgba(${r},${g},${b},${a})`; };
const ColCtx = createContext(DEFAULT_COLORS);
const PFX = "nws";
const RED="#c0392b";

function E({ value, onChange, editing, multiline=false, style={} as React.CSSProperties, placeholder="...", rows=3 }:{ value:string; onChange:(v:string)=>void; editing:boolean; multiline?:boolean; style?:React.CSSProperties; placeholder?:string; rows?:number; }) {
  const s:React.CSSProperties = { ...style, background:"#fdf8f0", border:`1px dashed #999`, padding:"2px 4px", outline:"none", width:"100%", fontFamily:"inherit", fontSize:"inherit", color:"inherit", lineHeight:"inherit", fontWeight:"inherit", boxSizing:"border-box" };
  if (!editing) return <span style={style}>{value||<span style={{opacity:0.3}}>{placeholder}</span>}</span>;
  if (multiline) return <textarea style={{...s,resize:"vertical",display:"block"}} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={rows}/>;
  return <input style={s} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}/>;
}

function BulletList({ bullets, onChange, editing }:{ bullets:string[]; onChange:(b:string[])=>void; editing:boolean }) {
  const {CB}=useContext(ColCtx);
  return (
    <ul style={{listStyle:"none",margin:0,padding:0}}>
      {bullets.map((b,i)=>(
        <li key={i} style={{display:"flex",alignItems:"flex-start",gap:6,marginBottom:3}}>
          <span style={{color:RED,fontWeight:900,fontSize:12,lineHeight:1.4,flexShrink:0}}>—</span>
          {editing?(<div style={{flex:1,display:"flex",gap:4}}><input value={b} onChange={e=>{const n=[...bullets];n[i]=e.target.value;onChange(n);}} style={{flex:1,fontSize:11,color:CB,background:"#fdf8f0",border:"1px dashed #ccc",padding:"1px 4px",outline:"none",fontFamily:"inherit"}}/><button type="button" onClick={()=>onChange(bullets.filter((_,idx)=>idx!==i))} style={{background:"none",border:"none",cursor:"pointer",color:"#f87171",padding:0}}><XMarkIcon style={{width:11,height:11}}/></button></div>)
          :<span style={{fontSize:11,color:CB,lineHeight:1.7,fontFamily:"Georgia, serif"}}>{b}</span>}
        </li>
      ))}
      {editing&&<li><button type="button" onClick={()=>onChange([...bullets,""])} style={{display:"flex",alignItems:"center",gap:4,fontSize:11,color:RED,background:"none",border:"none",cursor:"pointer",padding:"3px 0"}}><PlusIcon style={{width:11,height:11}}/>Hinzufügen</button></li>}
    </ul>
  );
}

function TagList({ tags, onChange, editing }:{ tags:string[]; onChange:(t:string[])=>void; editing:boolean }) {
  const {CT}=useContext(ColCtx);
  const [nv,setNv]=useState("");
  return (
    <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
      {tags.map((t,i)=>(
        <div key={i} style={{border:`1px solid ${CT}`,color:CT,padding:"1px 8px",fontSize:10,display:"flex",alignItems:"center",gap:3,fontFamily:"Georgia, serif"}}>
          {t}{editing&&<button type="button" onClick={()=>onChange(tags.filter((_,idx)=>idx!==i))} style={{background:"none",border:"none",cursor:"pointer",color:"#f87171",padding:0}}><XMarkIcon style={{width:9,height:9}}/></button>}
        </div>
      ))}
      {editing&&<input value={nv} onChange={e=>setNv(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&nv.trim()){onChange([...tags,nv.trim()]);setNv("");}}} style={{width:70,fontSize:10,border:"1px dashed #999",padding:"1px 5px",background:"#fdf8f0",outline:"none",color:CT,fontFamily:"inherit"}} placeholder="+ Neu"/>}
    </div>
  );
}

function SecH({ title }:{ title:string }) {
  return (
    <div style={{marginBottom:8,textAlign:"center" as const}}>
      <div style={{fontSize:11,fontWeight:700,letterSpacing:"0.18em",textTransform:"uppercase" as const,color:"#111",fontFamily:"Georgia, serif",borderTop:"2px solid #111",borderBottom:"1px solid #111",padding:"3px 0"}}>{title}</div>
    </div>
  );
}

export default function CV_Newspaper() {
  const {data,setData,fontKey,setFontKey,sizeKey,setSizeKey,photoShapeKey,setPhotoShapeKey,photoSrc,setPhotoSrc,clrs,setClrs,resetStorage}=useCVStorage("newspaper",DEFAULT_COLORS);
  const [editing,setEditing]=useState(false);
  const [showDesign,setShowDesign]=useState(false);
  const {A,BG,S2,S3,CT,CB,CM}=clrs;
  const curFont=FONTS.find(f=>f.key===fontKey)??FONTS[0];
  const curSize=FONT_SIZES.find(s=>s.key===sizeKey)??FONT_SIZES[2];
  const curShape=PHOTO_SHAPES.find(s=>s.key===photoShapeKey)??PHOTO_SHAPES[0];
  const fnt=curFont.family; const scale=curSize.scale;
  const photoInputRef=useRef<HTMLInputElement>(null);
  const docRef=useRef<HTMLDivElement>(null);
  const setP=(p:Partial<CVData["personal"]>)=>setData(d=>({...d,personal:{...d.personal,...p}}));
  const updProj=(id:string,p:Partial<typeof data.projects[0]>)=>setData(d=>({...d,projects:d.projects.map(x=>x.id===id?{...x,...p}:x)}));
  const updEdu=(id:string,p:Partial<typeof data.education[0]>)=>setData(d=>({...d,education:d.education.map(x=>x.id===id?{...x,...p}:x)}));
  const updExp=(id:string,p:Partial<typeof data.experience[0]>)=>setData(d=>({...d,experience:d.experience.map(x=>x.id===id?{...x,...p}:x)}));

  return (
  <ColCtx.Provider value={clrs}>
    <div style={{minHeight:"100vh",background:"#d8d0be",padding:"24px 16px",fontFamily:fnt}}>
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
        <button onClick={()=>setEditing(e=>!e)} style={{display:"flex",alignItems:"center",gap:6,padding:"7px 16px",fontSize:13,cursor:"pointer",border:`2px solid ${editing?"#16a34a":CT}`,backgroundColor:editing?"#16a34a":"transparent",color:editing?"white":CT,fontFamily:"Georgia, serif"}}>
          {editing?<CheckIcon style={{width:16,height:16}}/>:<PencilSquareIcon style={{width:16,height:16}}/>}{editing?"Fertig":"Bearbeiten"}
        </button>
        <button onClick={()=>{ const el=docRef.current; if(el){const h=el.scrollHeight;el.style.zoom=(h>1202?(0.934*1202/h):0.934).toFixed(5);} requestAnimationFrame(()=>requestAnimationFrame(()=>window.print())); }} style={{padding:"7px 16px",fontSize:13,cursor:"pointer",border:`2px solid ${CT}`,backgroundColor:CT,color:BG,display:"flex",alignItems:"center",gap:6,fontFamily:"Georgia, serif"}}>
          <PrinterIcon style={{width:16,height:16}}/>Drucken
        </button>
        <button onClick={()=>setShowDesign(v=>!v)} style={{padding:"7px 16px",fontSize:13,cursor:"pointer",border:`2px solid ${showDesign?RED:CT}`,backgroundColor:"transparent",color:showDesign?RED:CT}}>🎨</button>
        <button onClick={()=>{resetStorage();setData(JSON.parse(JSON.stringify(DEFAULT_CV_DATA)));setPhotoSrc("");setFontKey("nunito");setSizeKey("md");setPhotoShapeKey("square");setClrs(DEFAULT_COLORS);setShowDesign(false);}} style={{padding:"7px 16px",fontSize:13,cursor:"pointer",border:"2px solid #999",backgroundColor:"transparent",color:"#888",display:"flex",alignItems:"center",gap:6}}><XMarkIcon style={{width:16,height:16}}/>Reset</button>
        {showDesign&&(
          <div style={{width:"100%",background:BG,border:`2px solid ${CT}`,padding:"14px 18px",display:"flex",gap:24,flexWrap:"wrap"}}>
            <div><div style={{fontSize:10,fontWeight:700,color:CM,marginBottom:7,textTransform:"uppercase"}}>Font</div><div style={{display:"flex",gap:5,flexWrap:"wrap"}}>{FONTS.map(f=><button key={f.key} onClick={()=>setFontKey(f.key)} style={{padding:"3px 9px",border:`1.5px solid ${fontKey===f.key?RED:CT}`,background:fontKey===f.key?RED:"transparent",color:fontKey===f.key?"white":CT,fontSize:11,cursor:"pointer",fontFamily:f.family}}>{f.label}</button>)}</div></div>
            <div><div style={{fontSize:10,fontWeight:700,color:CM,marginBottom:7,textTransform:"uppercase"}}>Größe</div><div style={{display:"flex",gap:5}}>{FONT_SIZES.map(s=><button key={s.key} onClick={()=>setSizeKey(s.key)} style={{padding:"3px 12px",border:`1.5px solid ${sizeKey===s.key?CT:"#ccc"}`,background:sizeKey===s.key?CT:"transparent",color:sizeKey===s.key?BG:CT,fontSize:11,cursor:"pointer"}}>{s.label}</button>)}</div></div>
          </div>
        )}
      </div>

      <div ref={docRef} className={`${PFX}-doc`} style={{width:850,minHeight:1202,margin:"0 auto",backgroundColor:BG,overflow:"visible",fontFamily:"Georgia, serif",boxShadow:"0 4px 30px rgba(0,0,0,0.2)"}}>
        <div className={`${PFX}-zoom`} style={{width:Math.round(850/scale),zoom:scale}}>
          {/* Newspaper masthead */}
          <div style={{padding:"12px 30px 8px",borderBottom:"3px double #111",textAlign:"center"}}>
            <div style={{fontSize:9,color:CM,letterSpacing:"0.3em",textTransform:"uppercase",marginBottom:6}}>{new Date().toLocaleDateString("de-DE",{day:"2-digit",month:"long",year:"numeric"})}</div>
            <div style={{fontSize:10,color:RED,letterSpacing:"0.2em",textTransform:"uppercase",marginBottom:6,borderTop:"1px solid #999",borderBottom:"1px solid #999",padding:"3px 0"}}>Curriculum Vitae</div>
            <div style={{fontSize:42,fontWeight:900,color:CT,letterSpacing:"-1px",lineHeight:1}}>{editing?<input value={data.personal.name} onChange={e=>setP({name:e.target.value})} style={{fontSize:42,fontWeight:900,color:CT,textAlign:"center",fontFamily:"Georgia, serif",background:"#fdf8f0",border:"1px dashed #999",padding:"2px 8px",outline:"none",width:"100%",boxSizing:"border-box",letterSpacing:"-1px"}}/>:<span>{data.personal.name}</span>}</div>
            <div style={{marginTop:4,marginBottom:6}}>
              {editing?<input value={data.personal.subtitle} onChange={e=>setP({subtitle:e.target.value})} style={{display:"block",fontSize:14,color:CM,textAlign:"center",fontFamily:"Georgia, serif",background:"#fdf8f0",border:"1px dashed #ccc",padding:"2px 8px",outline:"none",width:"100%",boxSizing:"border-box",fontStyle:"italic"}}/>
                :<div style={{fontSize:14,color:CM,fontStyle:"italic"}}>{data.personal.subtitle}</div>}
            </div>
            <div style={{height:1,background:"#111",marginBottom:4}}/>
            <div style={{display:"flex",justifyContent:"center",gap:16,flexWrap:"wrap"}}>
              {(["email","phone","location","website","linkedin","github"] as const).map(k=>data.personal[k]?<span key={k} style={{fontSize:10,color:CM}}>{data.personal[k]}</span>:null)}
            </div>
          </div>

          {/* 3-column content */}
          <div style={{display:"flex",gap:0,padding:"16px 0"}}>
            {/* Column 1: Bio + Skills */}
            <div style={{width:230,padding:"0 18px",borderRight:"1px solid #aaa"}}>
              <SecH title="Profil"/>
              <E value={data.personal.bio} onChange={v=>setP({bio:v})} editing={editing} multiline rows={4} style={{fontSize:11,color:CB,lineHeight:1.8,fontFamily:"Georgia, serif",display:"block",marginBottom:14}}/>
              <SecH title="Kompetenzen"/>
              <TagList tags={data.skills} onChange={s=>setData(d=>({...d,skills:s}))} editing={editing}/>
              <div style={{marginTop:14}}>
                <SecH title="Sprachen"/>
                {data.languages.map((l,i)=>(
                  <div key={i} style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                    <E value={l.language} onChange={v=>{const n=[...data.languages];n[i]={...n[i],language:v};setData(d=>({...d,languages:n}));}} editing={editing} style={{fontSize:11,fontWeight:700,color:CT,fontFamily:"Georgia, serif"}}/>
                    <E value={l.level} onChange={v=>{const n=[...data.languages];n[i]={...n[i],level:v};setData(d=>({...d,languages:n}));}} editing={editing} style={{fontSize:10,color:CM,fontStyle:"italic"}}/>
                  </div>
                ))}
              </div>
              <div style={{marginTop:14}}>
                <SecH title="Ausbildung"/>
                {data.education.map(e=>(
                  <div key={e.id} style={{marginBottom:10}}>
                    <E value={e.degree} onChange={v=>updEdu(e.id,{degree:v})} editing={editing} style={{fontSize:11,fontWeight:700,color:CT,display:"block",fontFamily:"Georgia, serif"}}/>
                    <E value={e.institution} onChange={v=>updEdu(e.id,{institution:v})} editing={editing} style={{fontSize:10,color:RED,display:"block",fontStyle:"italic"}}/>
                    <E value={e.period} onChange={v=>updEdu(e.id,{period:v})} editing={editing} style={{fontSize:9,color:CM}}/>
                    {editing&&<button type="button" onClick={()=>setData(d=>({...d,education:d.education.filter(x=>x.id!==e.id)}))} style={{fontSize:10,color:"#f87171",background:"none",border:"none",cursor:"pointer"}}><TrashIcon style={{width:10,height:10}}/></button>}
                  </div>
                ))}
                {editing&&<button type="button" onClick={()=>setData(d=>({...d,education:[...d.education,{id:uid(),degree:"",institution:"",period:"",location:"",type:"Kurse / Inhalte",bullets:[]}] }))} style={{fontSize:11,color:RED,background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:3}}><PlusIcon style={{width:12,height:12}}/>+</button>}
              </div>
            </div>
            {/* Column 2: Experience */}
            <div style={{flex:1,padding:"0 18px",borderRight:"1px solid #aaa"}}>
              <SecH title="Berufserfahrung"/>
              {data.experience.map(ex=>(
                <div key={ex.id} style={{marginBottom:14,paddingBottom:10,borderBottom:"1px solid #ddd"}}>
                  <div style={{display:"flex",justifyContent:"space-between"}}>
                    <E value={ex.position} onChange={v=>updExp(ex.id,{position:v})} editing={editing} style={{fontSize:13,fontWeight:700,color:CT,fontFamily:"Georgia, serif"}}/>
                    <E value={ex.period} onChange={v=>updExp(ex.id,{period:v})} editing={editing} style={{fontSize:10,color:CM,fontStyle:"italic"}}/>
                  </div>
                  <E value={ex.company} onChange={v=>updExp(ex.id,{company:v})} editing={editing} style={{fontSize:11,color:RED,display:"block",marginBottom:4,fontStyle:"italic"}}/>
                  <BulletList bullets={ex.bullets} onChange={b=>updExp(ex.id,{bullets:b})} editing={editing}/>
                  {editing&&<button type="button" onClick={()=>setData(d=>({...d,experience:d.experience.filter(x=>x.id!==ex.id)}))} style={{fontSize:10,color:"#f87171",background:"none",border:"none",cursor:"pointer",marginTop:3}}><TrashIcon style={{width:10,height:10}}/>Entfernen</button>}
                </div>
              ))}
              {editing&&<button type="button" onClick={()=>setData(d=>({...d,experience:[...d.experience,{id:uid(),position:"",company:"",period:"",location:"",description:"",type:"",bullets:[],contact:""}]}))} style={{fontSize:11,color:RED,background:"none",border:"1px solid #999",cursor:"pointer",padding:"3px 10px",fontFamily:"Georgia, serif",display:"flex",alignItems:"center",gap:4}}><PlusIcon style={{width:12,height:12}}/>Hinzufügen</button>}
            </div>
            {/* Column 3: Projects + Photo */}
            <div style={{width:230,padding:"0 18px"}}>
              <div style={{width:curShape.w,height:curShape.h,borderRadius:curShape.br,overflow:"hidden",backgroundColor:S2,border:`2px solid ${CT}`,cursor:editing?"pointer":"default",marginBottom:14,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={()=>editing&&photoInputRef.current?.click()}>
                {photoSrc?<img src={photoSrc} alt="Foto" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<div style={{textAlign:"center",color:CM,fontSize:10}}>{editing?"📷":"FOTO"}</div>}
              </div>
              <input ref={photoInputRef} type="file" accept="image/*" style={{display:"none"}} onChange={e=>{const f=e.target.files?.[0];if(!f)return;const r=new FileReader();r.onload=ev=>setPhotoSrc((ev.target?.result as string)??"");r.readAsDataURL(f);}}/>
              <SecH title="Projekte"/>
              {data.projects.map(p=>(
                <div key={p.id} style={{marginBottom:12,paddingBottom:8,borderBottom:"1px solid #ddd"}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}>
                    <E value={p.title} onChange={v=>updProj(p.id,{title:v})} editing={editing} style={{fontSize:12,fontWeight:700,color:CT,fontFamily:"Georgia, serif"}}/>
                    <E value={p.period} onChange={v=>updProj(p.id,{period:v})} editing={editing} style={{fontSize:9,color:CM,fontStyle:"italic"}}/>
                  </div>
                  <BulletList bullets={p.bullets} onChange={b=>updProj(p.id,{bullets:b})} editing={editing}/>
                  {editing&&<button type="button" onClick={()=>setData(d=>({...d,projects:d.projects.filter(x=>x.id!==p.id)}))} style={{fontSize:10,color:"#f87171",background:"none",border:"none",cursor:"pointer"}}><TrashIcon style={{width:10,height:10}}/></button>}
                </div>
              ))}
              {editing&&<button type="button" onClick={()=>setData(d=>({...d,projects:[...d.projects,{id:uid(),title:"",period:"",bullets:[],link:""}]}))} style={{fontSize:11,color:RED,background:"none",border:"1px solid #999",cursor:"pointer",padding:"3px 8px",fontFamily:"Georgia, serif",display:"flex",alignItems:"center",gap:3}}><PlusIcon style={{width:12,height:12}}/>+</button>}
            </div>
          </div>
          <div style={{borderTop:"3px double #111",padding:"6px 30px",textAlign:"center",fontSize:9,color:CM,fontFamily:"Georgia, serif",letterSpacing:"0.1em"}}>—  Lebenslauf  —</div>
        </div>
      </div>
    </div>
  </ColCtx.Provider>
  );
}
