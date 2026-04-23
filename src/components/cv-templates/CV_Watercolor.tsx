"use client";
// ─── CV Template: Watercolor (Soft Pastel Painted Feel) ──────────────────────
import { useState, useRef, useContext, createContext } from "react";
import { PrinterIcon, PencilSquareIcon, CheckIcon, PlusIcon, TrashIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { FONTS, FONT_SIZES, PHOTO_SHAPES, CVData, DEFAULT_CV_DATA, uid } from "./shared";
import { useCVStorage } from "./useCV";

const DEFAULT_COLORS = { A:"#6b88c9", BG:"#fdfbf8", S2:"#f0eaf7", S3:"#e8e0f2", SBG:"#f8f5fc", CT:"#2a2040", CB:"#3a2d5a", CM:"#9988bb" };
const hex2rgba = (hex:string,a:number) => { const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16); return `rgba(${r},${g},${b},${a})`; };
const ColCtx = createContext(DEFAULT_COLORS);
const PFX = "wclr";
const ROSE="#d98fa0"; const MINT="#82c4b8"; const PEACH="#e8a882"; const LAV="#a888cc";

function E({ value, onChange, editing, multiline=false, style={} as React.CSSProperties, placeholder="...", rows=3 }:{ value:string; onChange:(v:string)=>void; editing:boolean; multiline?:boolean; style?:React.CSSProperties; placeholder?:string; rows?:number; }) {
  const {A}=useContext(ColCtx);
  const s:React.CSSProperties = { ...style, background:hex2rgba(A,0.06), border:`1.5px dashed ${A}88`, borderRadius:6, padding:"2px 6px", outline:"none", width:"100%", fontFamily:"inherit", fontSize:"inherit", color:"inherit", lineHeight:"inherit", fontWeight:"inherit", boxSizing:"border-box" };
  if (!editing) return <span style={style}>{value||<span style={{opacity:0.3}}>{placeholder}</span>}</span>;
  if (multiline) return <textarea style={{...s,resize:"vertical",display:"block"}} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={rows}/>;
  return <input style={s} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}/>;
}

function BulletList({ bullets, onChange, editing }:{ bullets:string[]; onChange:(b:string[])=>void; editing:boolean }) {
  const {A,CB}=useContext(ColCtx);
  const cols=[A,ROSE,MINT,LAV,PEACH];
  return (
    <ul style={{listStyle:"none",margin:0,padding:0}}>
      {bullets.map((b,i)=>(
        <li key={i} style={{display:"flex",alignItems:"flex-start",gap:6,marginBottom:3}}>
          <span style={{width:7,height:7,background:cols[i%cols.length],borderRadius:"50%",opacity:0.7,flexShrink:0,marginTop:4}}/>
          {editing?(<div style={{flex:1,display:"flex",gap:4}}><input value={b} onChange={e=>{const n=[...bullets];n[i]=e.target.value;onChange(n);}} style={{flex:1,fontSize:11,color:CB,background:hex2rgba(cols[i%cols.length],0.08),border:`1.5px dashed ${cols[i%cols.length]}88`,borderRadius:4,padding:"1px 4px",outline:"none",fontFamily:"inherit"}}/><button type="button" onClick={()=>onChange(bullets.filter((_,idx)=>idx!==i))} style={{background:"none",border:"none",cursor:"pointer",color:"#f87171",padding:0}}><XMarkIcon style={{width:11,height:11}}/></button></div>)
          :<span style={{fontSize:11,color:CB,lineHeight:1.7}}>{b}</span>}
        </li>
      ))}
      {editing&&<li><button type="button" onClick={()=>onChange([...bullets,""])} style={{display:"flex",alignItems:"center",gap:4,fontSize:11,color:A,background:"none",border:"none",cursor:"pointer",padding:"2px 0"}}><PlusIcon style={{width:11,height:11}}/>Hinzufügen</button></li>}
    </ul>
  );
}

function TagList({ tags, onChange, editing }:{ tags:string[]; onChange:(t:string[])=>void; editing:boolean }) {
  const {A}=useContext(ColCtx);
  const cols=[hex2rgba(A,0.12),hex2rgba(ROSE,0.15),hex2rgba(MINT,0.15),hex2rgba(LAV,0.15),hex2rgba(PEACH,0.15)];
  const tcols=[A,ROSE,MINT,LAV,PEACH];
  const [nv,setNv]=useState("");
  return (
    <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
      {tags.map((t,i)=>(
        <div key={i} style={{background:cols[i%cols.length],border:`1.5px solid ${tcols[i%tcols.length]}55`,color:tcols[i%tcols.length],padding:"2px 10px",fontSize:10,fontWeight:600,display:"flex",alignItems:"center",gap:3,borderRadius:20}}>
          {t}{editing&&<button type="button" onClick={()=>onChange(tags.filter((_,idx)=>idx!==i))} style={{background:"none",border:"none",cursor:"pointer",color:"#f87171",padding:0}}><XMarkIcon style={{width:9,height:9}}/></button>}
        </div>
      ))}
      {editing&&<input value={nv} onChange={e=>setNv(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&nv.trim()){onChange([...tags,nv.trim()]);setNv("");}}} style={{width:70,fontSize:10,border:`1.5px dashed ${A}`,borderRadius:20,padding:"2px 8px",background:hex2rgba(A,0.05),outline:"none",color:A,fontFamily:"inherit"}} placeholder="+ Neu"/>}
    </div>
  );
}

function SecH({ title, color }:{ title:string; color?:string }) {
  const {A,CT}=useContext(ColCtx);
  const c=color??A;
  return (
    <div style={{marginBottom:10,position:"relative"}}>
      <div style={{position:"absolute",bottom:2,left:0,right:0,height:6,background:hex2rgba(c,0.25),borderRadius:3}}/>
      <div style={{fontSize:11,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase" as const,color:CT,position:"relative"}}>{title}</div>
    </div>
  );
}

export default function CV_Watercolor() {
  const {data,setData,fontKey,setFontKey,sizeKey,setSizeKey,photoShapeKey,setPhotoShapeKey,photoSrc,setPhotoSrc,clrs,setClrs,resetStorage}=useCVStorage("watercolor",DEFAULT_COLORS);
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
    <div style={{minHeight:"100vh",background:"#e8e0ee",padding:"24px 16px",fontFamily:fnt}}>
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
        <button onClick={()=>setEditing(e=>!e)} style={{display:"flex",alignItems:"center",gap:6,padding:"7px 16px",fontSize:13,cursor:"pointer",border:`2px solid ${editing?"#16a34a":A}`,backgroundColor:editing?"#16a34a":hex2rgba(A,0.1),color:editing?"white":A,borderRadius:20}}>
          {editing?<CheckIcon style={{width:16,height:16}}/>:<PencilSquareIcon style={{width:16,height:16}}/>}{editing?"Fertig":"Bearbeiten"}
        </button>
        <button onClick={()=>{ const el=docRef.current; if(el){const h=el.scrollHeight;el.style.zoom=(h>1202?(0.934*1202/h):0.934).toFixed(5);} requestAnimationFrame(()=>requestAnimationFrame(()=>window.print())); }} style={{padding:"7px 16px",fontSize:13,cursor:"pointer",border:`2px solid ${A}`,backgroundColor:A,color:"white",display:"flex",alignItems:"center",gap:6,borderRadius:20}}>
          <PrinterIcon style={{width:16,height:16}}/>Drucken
        </button>
        <button onClick={()=>setShowDesign(v=>!v)} style={{padding:"7px 16px",fontSize:13,cursor:"pointer",border:`2px solid ${showDesign?LAV:"#ccc"}`,backgroundColor:"transparent",color:showDesign?LAV:"#888",borderRadius:20}}>🎨</button>
        <button onClick={()=>{resetStorage();setData(JSON.parse(JSON.stringify(DEFAULT_CV_DATA)));setPhotoSrc("");setFontKey("nunito");setSizeKey("md");setPhotoShapeKey("circle");setClrs(DEFAULT_COLORS);setShowDesign(false);}} style={{padding:"7px 16px",fontSize:13,cursor:"pointer",border:"2px solid #ccc",backgroundColor:"transparent",color:"#888",display:"flex",alignItems:"center",gap:6,borderRadius:20}}><XMarkIcon style={{width:16,height:16}}/>Reset</button>
        {showDesign&&(
          <div style={{width:"100%",background:BG,border:`2px solid ${A}44`,borderRadius:12,padding:"14px 18px",display:"flex",gap:24,flexWrap:"wrap"}}>
            <div><div style={{fontSize:10,fontWeight:700,color:CM,marginBottom:7,textTransform:"uppercase"}}>Font</div><div style={{display:"flex",gap:5,flexWrap:"wrap"}}>{FONTS.map(f=><button key={f.key} onClick={()=>setFontKey(f.key)} style={{padding:"3px 9px",border:`1.5px solid ${fontKey===f.key?A:"#ddd"}`,background:fontKey===f.key?hex2rgba(A,0.1):"transparent",color:fontKey===f.key?A:CT,fontSize:11,cursor:"pointer",fontFamily:f.family,borderRadius:16}}>{f.label}</button>)}</div></div>
            <div><div style={{fontSize:10,fontWeight:700,color:CM,marginBottom:7,textTransform:"uppercase"}}>Größe</div><div style={{display:"flex",gap:5}}>{FONT_SIZES.map(s=><button key={s.key} onClick={()=>setSizeKey(s.key)} style={{padding:"3px 12px",border:`1.5px solid ${sizeKey===s.key?A:"#ddd"}`,background:sizeKey===s.key?hex2rgba(A,0.1):"transparent",color:sizeKey===s.key?A:CT,fontSize:11,cursor:"pointer",borderRadius:16}}>{s.label}</button>)}</div></div>
            <div><div style={{fontSize:10,fontWeight:700,color:CM,marginBottom:7,textTransform:"uppercase"}}>Farben</div><div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"flex-end"}}>{([{k:"A" as const,l:"Blau"},{k:"BG" as const,l:"BG"},{k:"S2" as const,l:"Lila"},{k:"CT" as const,l:"Text"}]).map(({k,l})=>(<label key={k} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3,cursor:"pointer"}}><input type="color" value={clrs[k]} onChange={e=>setClrs(c=>({...c,[k]:e.target.value}))} style={{width:28,height:28,padding:2,border:`2px solid ${A}66`,cursor:"pointer",background:"none",borderRadius:"50%"}}/><span style={{fontSize:9,color:CM}}>{l}</span></label>))}<button onClick={()=>setClrs(DEFAULT_COLORS)} style={{padding:"4px 10px",fontSize:11,border:`1.5px solid #ccc`,background:"transparent",color:"#888",cursor:"pointer",borderRadius:16}}>↺</button></div></div>
          </div>
        )}
      </div>

      <div ref={docRef} className={`${PFX}-doc`} style={{width:850,minHeight:1202,margin:"0 auto",backgroundColor:BG,overflow:"visible",fontFamily:fnt,boxShadow:"0 8px 40px rgba(100,80,150,0.15)"}}>
        <div className={`${PFX}-zoom`} style={{width:Math.round(850/scale),zoom:scale}}>
          {/* Watercolor splash header */}
          <div style={{position:"relative",padding:"30px 36px 24px",background:`linear-gradient(135deg, ${hex2rgba(A,0.08)} 0%, ${hex2rgba(ROSE,0.1)} 40%, ${hex2rgba(MINT,0.08)} 100%)`}}>
            <div style={{position:"absolute",top:0,right:0,width:200,height:200,background:`radial-gradient(circle at 80% 20%, ${hex2rgba(LAV,0.25)} 0%, transparent 60%)`,pointerEvents:"none"}}/>
            <div style={{position:"absolute",bottom:0,left:0,width:150,height:80,background:`radial-gradient(circle at 20% 80%, ${hex2rgba(PEACH,0.2)} 0%, transparent 60%)`,pointerEvents:"none"}}/>
            <div style={{display:"flex",gap:24,alignItems:"center",position:"relative"}}>
              <div style={{flexShrink:0}}>
                <div style={{width:curShape.w,height:curShape.h,borderRadius:curShape.br,overflow:"hidden",backgroundColor:S2,border:`3px solid ${hex2rgba(A,0.3)}`,cursor:editing?"pointer":"default",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 4px 16px ${hex2rgba(A,0.2)}`}} onClick={()=>editing&&photoInputRef.current?.click()}>
                  {photoSrc?<img src={photoSrc} alt="Foto" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<span style={{fontSize:10,color:CM}}>{editing?"📷":"Foto"}</span>}
                </div>
                <input ref={photoInputRef} type="file" accept="image/*" style={{display:"none"}} onChange={e=>{const f=e.target.files?.[0];if(!f)return;const r=new FileReader();r.onload=ev=>setPhotoSrc((ev.target?.result as string)??"");r.readAsDataURL(f);}}/>
              </div>
              <div style={{flex:1}}>
                <div style={{marginBottom:4}}>{editing?<input value={data.personal.name} onChange={e=>setP({name:e.target.value})} style={{fontSize:28,fontWeight:700,color:CT,fontFamily:"inherit",background:hex2rgba(A,0.06),border:`1.5px dashed ${A}88`,borderRadius:6,padding:"2px 8px",outline:"none",width:"100%",boxSizing:"border-box"}}/>
                  :<span style={{fontSize:28,fontWeight:700,color:CT}}>{data.personal.name}</span>}</div>
                <div style={{marginBottom:8}}>{editing?<input value={data.personal.subtitle} onChange={e=>setP({subtitle:e.target.value})} style={{display:"block",fontSize:13,color:A,fontFamily:"inherit",background:hex2rgba(A,0.06),border:`1.5px dashed ${A}88`,borderRadius:6,padding:"2px 6px",outline:"none",width:"100%",boxSizing:"border-box",fontStyle:"italic"}}/>
                  :<div style={{fontSize:13,color:A,fontStyle:"italic"}}>{data.personal.subtitle}</div>}</div>
                <E value={data.personal.bio} onChange={v=>setP({bio:v})} editing={editing} multiline rows={2} style={{fontSize:11,color:CM,lineHeight:1.7,display:"block",marginBottom:8}}/>
                <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                  {(["email","phone","location","linkedin","github"] as const).map((k,i)=>data.personal[k]?<span key={k} style={{fontSize:10,color:[A,ROSE,MINT][i%3],background:hex2rgba([A,ROSE,MINT][i%3],0.1),padding:"2px 10px",borderRadius:20}}>{data.personal[k]}</span>:null)}
                </div>
              </div>
            </div>
          </div>

          <div style={{display:"flex"}}>
            <div style={{flex:1,padding:"18px 22px"}}>
              <div style={{marginBottom:18}}><SecH title="Berufserfahrung" color={A}/>
                {data.experience.map(ex=>(
                  <div key={ex.id} style={{marginBottom:14,paddingLeft:12,borderLeft:`3px solid ${hex2rgba(A,0.3)}`}}>
                    <E value={ex.position} onChange={v=>updExp(ex.id,{position:v})} editing={editing} style={{fontSize:13,fontWeight:700,color:CT,display:"block"}}/>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                      <E value={ex.company} onChange={v=>updExp(ex.id,{company:v})} editing={editing} style={{fontSize:11,color:A,fontStyle:"italic"}}/>
                      <E value={ex.period} onChange={v=>updExp(ex.id,{period:v})} editing={editing} style={{fontSize:10,color:CM}}/>
                    </div>
                    <BulletList bullets={ex.bullets} onChange={b=>updExp(ex.id,{bullets:b})} editing={editing}/>
                    {editing&&<button type="button" onClick={()=>setData(d=>({...d,experience:d.experience.filter(x=>x.id!==ex.id)}))} style={{fontSize:10,color:"#f87171",background:"none",border:"none",cursor:"pointer",marginTop:4}}><TrashIcon style={{width:10,height:10}}/>Entfernen</button>}
                  </div>
                ))}
                {editing&&<button type="button" onClick={()=>setData(d=>({...d,experience:[...d.experience,{id:uid(),position:"",company:"",period:"",location:"",description:"",type:"",bullets:[],contact:""}]}))} style={{fontSize:11,color:A,background:hex2rgba(A,0.06),border:`1.5px dashed ${A}`,borderRadius:8,cursor:"pointer",padding:"4px 14px",display:"flex",alignItems:"center",gap:4}}><PlusIcon style={{width:12,height:12}}/>Hinzufügen</button>}
              </div>
              <div><SecH title="Projekte" color={ROSE}/>
                {data.projects.map(p=>(
                  <div key={p.id} style={{marginBottom:12,paddingLeft:12,borderLeft:`3px solid ${hex2rgba(ROSE,0.3)}`}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}>
                      <E value={p.title} onChange={v=>updProj(p.id,{title:v})} editing={editing} style={{fontSize:12,fontWeight:700,color:CT}}/>
                      <E value={p.period} onChange={v=>updProj(p.id,{period:v})} editing={editing} style={{fontSize:10,color:CM}}/>
                    </div>
                    <BulletList bullets={p.bullets} onChange={b=>updProj(p.id,{bullets:b})} editing={editing}/>
                    {editing&&<button type="button" onClick={()=>setData(d=>({...d,projects:d.projects.filter(x=>x.id!==p.id)}))} style={{fontSize:10,color:"#f87171",background:"none",border:"none",cursor:"pointer"}}><TrashIcon style={{width:10,height:10}}/></button>}
                  </div>
                ))}
                {editing&&<button type="button" onClick={()=>setData(d=>({...d,projects:[...d.projects,{id:uid(),title:"",period:"",bullets:[],link:""}]}))} style={{fontSize:11,color:ROSE,background:hex2rgba(ROSE,0.06),border:`1.5px dashed ${ROSE}`,borderRadius:8,cursor:"pointer",padding:"4px 14px",display:"flex",alignItems:"center",gap:4}}><PlusIcon style={{width:12,height:12}}/>Hinzufügen</button>}
              </div>
            </div>
            <div style={{width:210,background:`linear-gradient(180deg, ${hex2rgba(LAV,0.08)} 0%, ${hex2rgba(MINT,0.06)} 100%)`,borderLeft:`1px solid ${hex2rgba(A,0.15)}`,padding:"18px 14px"}}>
              <div style={{marginBottom:14}}><SecH title="Kompetenzen" color={LAV}/><TagList tags={data.skills} onChange={s=>setData(d=>({...d,skills:s}))} editing={editing}/></div>
              <div style={{marginBottom:14}}>
                <SecH title="Ausbildung" color={MINT}/>
                {data.education.map(e=>(
                  <div key={e.id} style={{marginBottom:10,padding:"8px",background:hex2rgba(MINT,0.08),borderRadius:8}}>
                    <E value={e.degree} onChange={v=>updEdu(e.id,{degree:v})} editing={editing} style={{fontSize:11,fontWeight:700,color:CT,display:"block"}}/>
                    <E value={e.institution} onChange={v=>updEdu(e.id,{institution:v})} editing={editing} style={{fontSize:10,color:MINT,display:"block",fontStyle:"italic"}}/>
                    <E value={e.period} onChange={v=>updEdu(e.id,{period:v})} editing={editing} style={{fontSize:9,color:CM}}/>
                    {editing&&<button type="button" onClick={()=>setData(d=>({...d,education:d.education.filter(x=>x.id!==e.id)}))} style={{fontSize:10,color:"#f87171",background:"none",border:"none",cursor:"pointer"}}><TrashIcon style={{width:10,height:10}}/></button>}
                  </div>
                ))}
                {editing&&<button type="button" onClick={()=>setData(d=>({...d,education:[...d.education,{id:uid(),degree:"",institution:"",period:"",location:"",type:"Kurse / Inhalte",bullets:[]}] }))} style={{fontSize:11,color:MINT,background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:3}}><PlusIcon style={{width:12,height:12}}/>+</button>}
              </div>
              <div><SecH title="Sprachen" color={PEACH}/>
                {data.languages.map((l,i)=>(
                  <div key={i} style={{marginBottom:6,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <E value={l.language} onChange={v=>{const n=[...data.languages];n[i]={...n[i],language:v};setData(d=>({...d,languages:n}));}} editing={editing} style={{fontSize:11,fontWeight:600,color:CT}}/>
                    <span style={{fontSize:9,background:hex2rgba(PEACH,0.2),color:PEACH,padding:"1px 7px",borderRadius:10,fontWeight:600}}>{l.level}</span>
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
