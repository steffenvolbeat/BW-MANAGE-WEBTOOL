"use client";
// ─── CV Template: Swiss (International Typographic Style) ─────────────────────
import { useState, useRef, useContext, createContext } from "react";
import { PrinterIcon, PencilSquareIcon, CheckIcon, PlusIcon, TrashIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { FONTS, FONT_SIZES, PHOTO_SHAPES, CVData, DEFAULT_CV_DATA, uid } from "./shared";
import { useCVStorage } from "./useCV";

const DEFAULT_COLORS = { A:"#d62929", BG:"#ffffff", S2:"#f2f2f2", S3:"#e5e5e5", SBG:"#fafafa", CT:"#111111", CB:"#222222", CM:"#777777" };
const hex2rgba = (hex:string,a:number) => { const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16); return `rgba(${r},${g},${b},${a})`; };
const ColCtx = createContext(DEFAULT_COLORS);
const PFX = "swi";

function E({ value, onChange, editing, multiline=false, style={} as React.CSSProperties, placeholder="...", rows=3 }:{ value:string; onChange:(v:string)=>void; editing:boolean; multiline?:boolean; style?:React.CSSProperties; placeholder?:string; rows?:number; }) {
  const {A}=useContext(ColCtx);
  const s:React.CSSProperties = { ...style, background:hex2rgba(A,0.05), border:`1px dashed ${A}`, padding:"1px 4px", outline:"none", width:"100%", fontFamily:"inherit", fontSize:"inherit", color:"inherit", lineHeight:"inherit", fontWeight:"inherit", boxSizing:"border-box" };
  if (!editing) return <span style={style}>{value||<span style={{opacity:0.3}}>{placeholder}</span>}</span>;
  if (multiline) return <textarea style={{...s,resize:"vertical",display:"block"}} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={rows}/>;
  return <input style={s} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}/>;
}

function BulletList({ bullets, onChange, editing }:{ bullets:string[]; onChange:(b:string[])=>void; editing:boolean }) {
  const {A,CB}=useContext(ColCtx);
  return (
    <ul style={{listStyle:"none",margin:0,padding:0}}>
      {bullets.map((b,i)=>(
        <li key={i} style={{display:"flex",alignItems:"flex-start",gap:8,marginBottom:3}}>
          <span style={{width:4,height:4,background:A,borderRadius:0,flexShrink:0,marginTop:5,display:"inline-block"}}/>
          {editing?(<div style={{flex:1,display:"flex",gap:4}}><input value={b} onChange={e=>{const n=[...bullets];n[i]=e.target.value;onChange(n);}} style={{flex:1,fontSize:11,color:CB,background:hex2rgba(A,0.04),border:`1px dashed ${A}44`,padding:"1px 4px",outline:"none",fontFamily:"inherit"}}/><button type="button" onClick={()=>onChange(bullets.filter((_,idx)=>idx!==i))} style={{background:"none",border:"none",cursor:"pointer",color:"#f87171",padding:0}}><XMarkIcon style={{width:11,height:11}}/></button></div>)
          :<span style={{fontSize:11,color:CB,lineHeight:1.6}}>{b}</span>}
        </li>
      ))}
      {editing&&<li><button type="button" onClick={()=>onChange([...bullets,""])} style={{display:"flex",alignItems:"center",gap:4,fontSize:11,color:A,background:"none",border:"none",cursor:"pointer",padding:"3px 0"}}><PlusIcon style={{width:11,height:11}}/>Hinzufügen</button></li>}
    </ul>
  );
}

function TagList({ tags, onChange, editing }:{ tags:string[]; onChange:(t:string[])=>void; editing:boolean }) {
  const {A,CT,CM}=useContext(ColCtx);
  const [nv,setNv]=useState("");
  return (
    <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
      {tags.map((t,i)=>(
        <div key={i} style={{background:"transparent",border:`1.5px solid ${CT}`,color:CT,padding:"1px 7px",fontSize:10,fontWeight:500,display:"flex",alignItems:"center",gap:3}}>
          {t}{editing&&<button type="button" onClick={()=>onChange(tags.filter((_,idx)=>idx!==i))} style={{background:"none",border:"none",cursor:"pointer",color:"#f87171",padding:0}}><XMarkIcon style={{width:9,height:9}}/></button>}
        </div>
      ))}
      {editing&&<input value={nv} onChange={e=>setNv(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&nv.trim()){onChange([...tags,nv.trim()]);setNv("");}}} style={{width:70,fontSize:10,border:`1.5px solid ${CT}44`,padding:"1px 5px",background:"transparent",outline:"none",color:CT,fontFamily:"inherit"}} placeholder="+ Neu"/>}
    </div>
  );
}

function SecH({ title }:{ title:string }) {
  const {A,CT}=useContext(ColCtx);
  return (
    <div style={{display:"flex",alignItems:"baseline",gap:10,marginBottom:8}}>
      <div style={{width:16,height:16,background:A,flexShrink:0}}/>
      <span style={{fontSize:10,fontWeight:700,letterSpacing:"0.18em",textTransform:"uppercase" as const,color:CT}}>{title}</span>
      <div style={{flex:1,height:1.5,background:CT}}/>
    </div>
  );
}

export default function CV_Swiss() {
  const {data,setData,fontKey,setFontKey,sizeKey,setSizeKey,photoShapeKey,setPhotoShapeKey,photoSrc,setPhotoSrc,clrs,setClrs,resetStorage}=useCVStorage("swiss",DEFAULT_COLORS);
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
    <div style={{minHeight:"100vh",background:"#e5e5e5",padding:"24px 16px",fontFamily:fnt}}>
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
        <button onClick={()=>setEditing(e=>!e)} style={{display:"flex",alignItems:"center",gap:6,padding:"7px 16px",fontSize:13,fontWeight:600,cursor:"pointer",border:`2px solid ${editing?"#16a34a":CT}`,backgroundColor:editing?"#16a34a":"transparent",color:editing?"white":CT}}>
          {editing?<CheckIcon style={{width:16,height:16}}/>:<PencilSquareIcon style={{width:16,height:16}}/>}{editing?"Fertig":"Bearbeiten"}
        </button>
        <button onClick={()=>{ const el=docRef.current; if(el){const h=el.scrollHeight;el.style.zoom=(h>1202?(0.934*1202/h):0.934).toFixed(5);} requestAnimationFrame(()=>requestAnimationFrame(()=>window.print())); }} style={{padding:"7px 16px",fontSize:13,cursor:"pointer",border:`2px solid ${A}`,backgroundColor:A,color:"white",display:"flex",alignItems:"center",gap:6}}>
          <PrinterIcon style={{width:16,height:16}}/>Drucken
        </button>
        <button onClick={()=>setShowDesign(v=>!v)} style={{padding:"7px 16px",fontSize:13,cursor:"pointer",border:`2px solid ${showDesign?A:CT}`,backgroundColor:"transparent",color:showDesign?A:CT}}>🎨 Design</button>
        <button onClick={()=>{resetStorage();setData(JSON.parse(JSON.stringify(DEFAULT_CV_DATA)));setPhotoSrc("");setFontKey("nunito");setSizeKey("md");setPhotoShapeKey("square");setClrs(DEFAULT_COLORS);setShowDesign(false);}} style={{padding:"7px 16px",fontSize:13,cursor:"pointer",border:`2px solid #ccc`,backgroundColor:"transparent",color:"#888",display:"flex",alignItems:"center",gap:6}}><XMarkIcon style={{width:16,height:16}}/>Reset</button>
        {showDesign&&(
          <div style={{width:"100%",background:"white",border:`2px solid ${CT}`,padding:"14px 18px",display:"flex",gap:24,flexWrap:"wrap"}}>
            <div><div style={{fontSize:10,fontWeight:700,color:CM,marginBottom:7,textTransform:"uppercase",letterSpacing:"0.1em"}}>Font</div><div style={{display:"flex",gap:5,flexWrap:"wrap"}}>{FONTS.map(f=><button key={f.key} onClick={()=>setFontKey(f.key)} style={{padding:"3px 9px",border:`1.5px solid ${fontKey===f.key?A:CT}`,background:fontKey===f.key?A:"transparent",color:fontKey===f.key?"white":CT,fontSize:11,cursor:"pointer",fontFamily:f.family}}>{f.label}</button>)}</div></div>
            <div><div style={{fontSize:10,fontWeight:700,color:CM,marginBottom:7,textTransform:"uppercase",letterSpacing:"0.1em"}}>Größe</div><div style={{display:"flex",gap:5}}>{FONT_SIZES.map(s=><button key={s.key} onClick={()=>setSizeKey(s.key)} style={{padding:"3px 12px",border:`1.5px solid ${sizeKey===s.key?A:CT}`,background:sizeKey===s.key?A:"transparent",color:sizeKey===s.key?"white":CT,fontSize:11,cursor:"pointer"}}>{s.label}</button>)}</div></div>
            <div><div style={{fontSize:10,fontWeight:700,color:CM,marginBottom:7,textTransform:"uppercase",letterSpacing:"0.1em"}}>Farben</div><div style={{display:"flex",gap:10,flexWrap:"wrap",alignItems:"flex-end"}}>{([{k:"A" as const,l:"Rot"},{k:"BG" as const,l:"BG"},{k:"S2" as const,l:"S2"},{k:"CT" as const,l:"Text"}]).map(({k,l})=>(<label key={k} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3,cursor:"pointer"}}><input type="color" value={clrs[k]} onChange={e=>setClrs(c=>({...c,[k]:e.target.value}))} style={{width:32,height:32,padding:2,border:`1.5px solid ${CT}`,cursor:"pointer",background:"none"}}/><span style={{fontSize:9,color:CM}}>{l}</span></label>))}<button onClick={()=>setClrs(DEFAULT_COLORS)} style={{padding:"4px 10px",fontSize:11,border:`1.5px solid ${CT}`,background:"transparent",color:CT,cursor:"pointer"}}>↺</button></div></div>
          </div>
        )}
      </div>

      <div ref={docRef} className={`${PFX}-doc`} style={{width:850,minHeight:1202,margin:"0 auto",backgroundColor:BG,overflow:"visible",fontFamily:fnt,boxShadow:"0 2px 20px rgba(0,0,0,0.12)"}}>
        <div className={`${PFX}-zoom`} style={{width:Math.round(850/scale),zoom:scale}}>
          {/* Swiss red top bar */}
          <div style={{height:8,background:A}}/>
          {/* Header grid */}
          <div style={{padding:"28px 40px 20px",borderBottom:`2px solid ${CT}`}}>
            <div style={{display:"flex",gap:30,alignItems:"flex-start"}}>
              <div style={{flex:1}}>
                {editing?<input value={data.personal.name} onChange={e=>setP({name:e.target.value})} style={{display:"block",fontSize:40,fontWeight:900,color:CT,marginBottom:2,fontFamily:"inherit",background:hex2rgba(A,0.05),border:`1px dashed ${A}`,padding:"2px 6px",outline:"none",width:"100%",boxSizing:"border-box",letterSpacing:"-1px"}}/>
                  :<div style={{fontSize:40,fontWeight:900,color:CT,marginBottom:2,letterSpacing:"-1.5px",lineHeight:1}}>{data.personal.name}</div>}
                {editing?<input value={data.personal.subtitle} onChange={e=>setP({subtitle:e.target.value})} style={{display:"block",fontSize:15,color:A,marginBottom:10,fontFamily:"inherit",background:hex2rgba(A,0.05),border:`1px dashed ${A}44`,padding:"2px 6px",outline:"none",width:"100%",boxSizing:"border-box",fontWeight:400}}/>
                  :<div style={{fontSize:15,color:A,marginBottom:10,fontWeight:400,letterSpacing:"0"}}>{data.personal.subtitle}</div>}
                <E value={data.personal.bio} onChange={v=>setP({bio:v})} editing={editing} multiline rows={2} style={{fontSize:11,color:CM,lineHeight:1.7,maxWidth:500,display:"block"}}/>
              </div>
              <div style={{width:180,flexShrink:0}}>
                <div style={{width:curShape.w,height:curShape.h,borderRadius:curShape.br,overflow:"hidden",backgroundColor:S2,border:`2px solid ${CT}`,cursor:editing?"pointer":"default"}} onClick={()=>editing&&photoInputRef.current?.click()}>
                  {photoSrc?<img src={photoSrc} alt="Foto" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",color:CM,fontSize:10}}>{editing?"📷":"FOTO"}</div>}
                </div>
                <input ref={photoInputRef} type="file" accept="image/*" style={{display:"none"}} onChange={e=>{const f=e.target.files?.[0];if(!f)return;const r=new FileReader();r.onload=ev=>setPhotoSrc((ev.target?.result as string)??"");r.readAsDataURL(f);}}/>
                <div style={{marginTop:10,display:"flex",flexDirection:"column",gap:3}}>
                  {(["email","phone","location","website"] as const).map(k=>data.personal[k]?<span key={k} style={{fontSize:9,color:CM,borderBottom:`1px solid ${S3}`,paddingBottom:2}}>{data.personal[k]}</span>:null)}
                </div>
              </div>
            </div>
          </div>

          <div style={{display:"flex"}}>
            <div style={{flex:1,padding:"22px 28px"}}>
              <div style={{marginBottom:18}}>
                <SecH title="Berufserfahrung"/>
                {data.experience.map(ex=>(
                  <div key={ex.id} style={{display:"flex",gap:16,marginBottom:14}}>
                    <div style={{width:90,flexShrink:0}}>
                      <E value={ex.period} onChange={v=>updExp(ex.id,{period:v})} editing={editing} style={{fontSize:10,color:CM,fontWeight:400,lineHeight:1.4}}/>
                    </div>
                    <div style={{flex:1,paddingLeft:14,borderLeft:`1.5px solid ${S3}`}}>
                      <E value={ex.position} onChange={v=>updExp(ex.id,{position:v})} editing={editing} style={{fontSize:13,fontWeight:700,color:CT,display:"block",marginBottom:1}}/>
                      <E value={ex.company} onChange={v=>updExp(ex.id,{company:v})} editing={editing} style={{fontSize:11,color:A,display:"block",marginBottom:4}}/>
                      <BulletList bullets={ex.bullets} onChange={b=>updExp(ex.id,{bullets:b})} editing={editing}/>
                      {editing&&<button type="button" onClick={()=>setData(d=>({...d,experience:d.experience.filter(x=>x.id!==ex.id)}))} style={{fontSize:10,color:"#f87171",background:"none",border:"none",cursor:"pointer",marginTop:3}}><TrashIcon style={{width:10,height:10}}/>Entfernen</button>}
                    </div>
                  </div>
                ))}
                {editing&&<button type="button" onClick={()=>setData(d=>({...d,experience:[...d.experience,{id:uid(),position:"",company:"",period:"",location:"",description:"",type:"",bullets:[],contact:""}]}))} style={{fontSize:11,color:A,background:"none",border:`1.5px solid ${A}`,cursor:"pointer",padding:"3px 10px",display:"flex",alignItems:"center",gap:4}}><PlusIcon style={{width:12,height:12}}/>Hinzufügen</button>}
              </div>
              <div style={{marginBottom:18}}>
                <SecH title="Projekte"/>
                {data.projects.map(p=>(
                  <div key={p.id} style={{display:"flex",gap:16,marginBottom:12}}>
                    <div style={{width:90,flexShrink:0}}>
                      <E value={p.period} onChange={v=>updProj(p.id,{period:v})} editing={editing} style={{fontSize:10,color:CM}}/>
                    </div>
                    <div style={{flex:1,paddingLeft:14,borderLeft:`1.5px solid ${S3}`}}>
                      <E value={p.title} onChange={v=>updProj(p.id,{title:v})} editing={editing} style={{fontSize:12,fontWeight:700,color:CT,display:"block",marginBottom:3}}/>
                      <BulletList bullets={p.bullets} onChange={b=>updProj(p.id,{bullets:b})} editing={editing}/>
                      {editing&&<button type="button" onClick={()=>setData(d=>({...d,projects:d.projects.filter(x=>x.id!==p.id)}))} style={{fontSize:10,color:"#f87171",background:"none",border:"none",cursor:"pointer",marginTop:2}}><TrashIcon style={{width:10,height:10}}/>Entfernen</button>}
                    </div>
                  </div>
                ))}
                {editing&&<button type="button" onClick={()=>setData(d=>({...d,projects:[...d.projects,{id:uid(),title:"",period:"",bullets:[],link:""}]}))} style={{fontSize:11,color:A,background:"none",border:`1.5px solid ${A}`,cursor:"pointer",padding:"3px 10px",display:"flex",alignItems:"center",gap:4}}><PlusIcon style={{width:12,height:12}}/>Hinzufügen</button>}
              </div>
            </div>
            <div style={{width:200,background:S2,borderLeft:`1.5px solid ${CT}`,padding:"22px 16px"}}>
              <div style={{marginBottom:16}}><SecH title="Skills"/><TagList tags={data.skills} onChange={s=>setData(d=>({...d,skills:s}))} editing={editing}/></div>
              <div style={{marginBottom:16}}>
                <SecH title="Ausbildung"/>
                {data.education.map(e=>(
                  <div key={e.id} style={{marginBottom:10}}>
                    <E value={e.degree} onChange={v=>updEdu(e.id,{degree:v})} editing={editing} style={{fontSize:11,fontWeight:700,color:CT,display:"block"}}/>
                    <E value={e.institution} onChange={v=>updEdu(e.id,{institution:v})} editing={editing} style={{fontSize:10,color:A,display:"block"}}/>
                    <E value={e.period} onChange={v=>updEdu(e.id,{period:v})} editing={editing} style={{fontSize:9,color:CM}}/>
                    {editing&&<button type="button" onClick={()=>setData(d=>({...d,education:d.education.filter(x=>x.id!==e.id)}))} style={{fontSize:10,color:"#f87171",background:"none",border:"none",cursor:"pointer"}}><TrashIcon style={{width:10,height:10}}/></button>}
                  </div>
                ))}
                {editing&&<button type="button" onClick={()=>setData(d=>({...d,education:[...d.education,{id:uid(),degree:"",institution:"",period:"",location:"",type:"Kurse / Inhalte",bullets:[]}] }))} style={{fontSize:11,color:A,background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:3}}><PlusIcon style={{width:12,height:12}}/>+</button>}
              </div>
              <div>
                <SecH title="Sprachen"/>
                {data.languages.map((l,i)=>(
                  <div key={i} style={{display:"flex",justifyContent:"space-between",marginBottom:5,paddingBottom:5,borderBottom:`1px solid ${S3}`}}>
                    <E value={l.language} onChange={v=>{const n=[...data.languages];n[i]={...n[i],language:v};setData(d=>({...d,languages:n}));}} editing={editing} style={{fontSize:11,fontWeight:600,color:CT}}/>
                    <E value={l.level} onChange={v=>{const n=[...data.languages];n[i]={...n[i],level:v};setData(d=>({...d,languages:n}));}} editing={editing} style={{fontSize:9,color:CM,textAlign:"right"}}/>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div style={{height:4,background:`linear-gradient(90deg,${A} 0%,${A} 40%,${CT} 40%,${CT} 100%)`}}/>
        </div>
      </div>
    </div>
  </ColCtx.Provider>
  );
}
