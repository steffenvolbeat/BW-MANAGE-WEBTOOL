"use client";
// ─── CV Template: Pixel (8-bit Retro Game) ───────────────────────────────────
import { useState, useRef, useContext, createContext } from "react";
import { PrinterIcon, PencilSquareIcon, CheckIcon, PlusIcon, TrashIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { FONTS, FONT_SIZES, PHOTO_SHAPES, CVData, DEFAULT_CV_DATA, uid } from "./shared";
import { useCVStorage } from "./useCV";

const DEFAULT_COLORS = { A:"#00ff41", BG:"#0d0d0d", S2:"#111111", S3:"#1a1a1a", SBG:"#050505", CT:"#ffffff", CB:"#e0ffe0", CM:"#777777" };
const hex2rgba = (hex:string,a:number) => { const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16); return `rgba(${r},${g},${b},${a})`; };
const ColCtx = createContext(DEFAULT_COLORS);
const PFX = "pix";
const CYAN="#00d4ff"; const YEL="#ffe600"; const MAG="#ff00ff";

function PixelBorder({ color, children }:{ color:string; children:React.ReactNode }) {
  return (
    <div style={{position:"relative",padding:"8px",background:"transparent"}}>
      <div style={{position:"absolute",top:0,left:4,right:4,height:4,background:color}}/>
      <div style={{position:"absolute",bottom:0,left:4,right:4,height:4,background:color}}/>
      <div style={{position:"absolute",left:0,top:4,bottom:4,width:4,background:color}}/>
      <div style={{position:"absolute",right:0,top:4,bottom:4,width:4,background:color}}/>
      {children}
    </div>
  );
}

function E({ value, onChange, editing, multiline=false, style={} as React.CSSProperties, placeholder="...", rows=3 }:{ value:string; onChange:(v:string)=>void; editing:boolean; multiline?:boolean; style?:React.CSSProperties; placeholder?:string; rows?:number; }) {
  const {A}=useContext(ColCtx);
  const s:React.CSSProperties = { ...style, background:"#002200", border:`2px solid ${A}`, padding:"2px 4px", outline:"none", width:"100%", fontFamily:"inherit", fontSize:"inherit", color:"inherit", lineHeight:"inherit", fontWeight:"inherit", boxSizing:"border-box" };
  if (!editing) return <span style={style}>{value||<span style={{opacity:0.3}}>{placeholder}</span>}</span>;
  if (multiline) return <textarea style={{...s,resize:"vertical",display:"block"}} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={rows}/>;
  return <input style={s} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}/>;
}

function BulletList({ bullets, onChange, editing }:{ bullets:string[]; onChange:(b:string[])=>void; editing:boolean }) {
  const {A,CB}=useContext(ColCtx);
  return (
    <ul style={{listStyle:"none",margin:0,padding:0}}>
      {bullets.map((b,i)=>(
        <li key={i} style={{display:"flex",alignItems:"flex-start",gap:6,marginBottom:2}}>
          <span style={{color:YEL,fontSize:10,lineHeight:1.6,flexShrink:0}}>►</span>
          {editing?(<div style={{flex:1,display:"flex",gap:4}}><input value={b} onChange={e=>{const n=[...bullets];n[i]=e.target.value;onChange(n);}} style={{flex:1,fontSize:11,color:CB,background:"#002200",border:`2px solid ${A}55`,padding:"1px 4px",outline:"none",fontFamily:"inherit"}}/><button type="button" onClick={()=>onChange(bullets.filter((_,idx)=>idx!==i))} style={{background:"none",border:"none",cursor:"pointer",color:"#f87171",padding:0}}><XMarkIcon style={{width:11,height:11}}/></button></div>)
          :<span style={{fontSize:11,color:CB,lineHeight:1.6}}>{b}</span>}
        </li>
      ))}
      {editing&&<li><button type="button" onClick={()=>onChange([...bullets,""])} style={{display:"flex",alignItems:"center",gap:4,fontSize:11,color:A,background:"none",border:"none",cursor:"pointer",padding:"2px 0"}}><PlusIcon style={{width:11,height:11}}/>+ADD</button></li>}
    </ul>
  );
}

function TagList({ tags, onChange, editing }:{ tags:string[]; onChange:(t:string[])=>void; editing:boolean }) {
  const {A,CT}=useContext(ColCtx);
  const [nv,setNv]=useState("");
  const colors=[A,CYAN,YEL,MAG];
  return (
    <div style={{display:"flex",flexWrap:"wrap",gap:3}}>
      {tags.map((t,i)=>(
        <div key={i} style={{background:"#002200",border:`2px solid ${colors[i%colors.length]}`,color:colors[i%colors.length],padding:"1px 8px",fontSize:10,fontWeight:700,display:"flex",alignItems:"center",gap:3}}>
          {t}{editing&&<button type="button" onClick={()=>onChange(tags.filter((_,idx)=>idx!==i))} style={{background:"none",border:"none",cursor:"pointer",color:"#f87171",padding:0}}><XMarkIcon style={{width:9,height:9}}/></button>}
        </div>
      ))}
      {editing&&<input value={nv} onChange={e=>setNv(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&nv.trim()){onChange([...tags,nv.trim()]);setNv("");}}} style={{width:70,fontSize:10,border:`2px solid ${A}`,padding:"1px 5px",background:"#002200",outline:"none",color:A,fontFamily:"inherit"}} placeholder="+NEW"/>}
    </div>
  );
}

function SecH({ title, color }:{ title:string; color?:string }) {
  const {A}=useContext(ColCtx);
  const c=color??A;
  return (
    <div style={{marginBottom:8,display:"flex",alignItems:"center",gap:8}}>
      <span style={{color:c,fontSize:14,fontWeight:900}}>■</span>
      <span style={{fontSize:11,fontWeight:700,letterSpacing:"0.15em",textTransform:"uppercase" as const,color:c}}>{title}</span>
      <div style={{flex:1,height:2,background:`${c}44`}}/>
    </div>
  );
}

export default function CV_Pixel() {
  const {data,setData,fontKey,setFontKey,sizeKey,setSizeKey,photoShapeKey,setPhotoShapeKey,photoSrc,setPhotoSrc,clrs,setClrs,resetStorage}=useCVStorage("pixel",DEFAULT_COLORS);
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
    <div style={{minHeight:"100vh",background:"#070707",padding:"24px 16px",fontFamily:"monospace"}}>
      <style>{`
        ${curFont.gf?`@import url('https://fonts.googleapis.com/css2?family=${curFont.gf}&display=swap');`:""}
        .${PFX}-doc,.${PFX}-doc * { font-family:monospace!important; }
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
        <button onClick={()=>setEditing(e=>!e)} style={{display:"flex",alignItems:"center",gap:6,padding:"7px 16px",fontSize:13,cursor:"pointer",border:`2px solid ${editing?"#16a34a":A}`,backgroundColor:editing?"#16a34a":"#001100",color:editing?"white":A,fontFamily:"monospace"}}>
          {editing?<CheckIcon style={{width:16,height:16}}/>:<PencilSquareIcon style={{width:16,height:16}}/>}[{editing?"SAVE":"EDIT"}]
        </button>
        <button onClick={()=>{ const el=docRef.current; if(el){const h=el.scrollHeight;el.style.zoom=(h>1202?(0.934*1202/h):0.934).toFixed(5);} requestAnimationFrame(()=>requestAnimationFrame(()=>window.print())); }} style={{padding:"7px 16px",fontSize:13,cursor:"pointer",border:`2px solid ${CYAN}`,backgroundColor:"#001a22",color:CYAN,display:"flex",alignItems:"center",gap:6,fontFamily:"monospace"}}>
          <PrinterIcon style={{width:16,height:16}}/>PRINT
        </button>
        <button onClick={()=>setShowDesign(v=>!v)} style={{padding:"7px 16px",fontSize:13,cursor:"pointer",border:`2px solid ${YEL}`,backgroundColor:"#110f00",color:YEL}}>COLORS</button>
        <button onClick={()=>{resetStorage();setData(JSON.parse(JSON.stringify(DEFAULT_CV_DATA)));setPhotoSrc("");setFontKey("nunito");setSizeKey("md");setPhotoShapeKey("square");setClrs(DEFAULT_COLORS);setShowDesign(false);}} style={{padding:"7px 16px",fontSize:13,cursor:"pointer",border:"2px solid #333",backgroundColor:"transparent",color:"#555",display:"flex",alignItems:"center",gap:6,fontFamily:"monospace"}}><XMarkIcon style={{width:16,height:16}}/>RESET</button>
        {showDesign&&(
          <div style={{width:"100%",background:BG,border:`2px solid ${A}`,padding:"14px 18px",display:"flex",gap:24,flexWrap:"wrap"}}>
            <div><div style={{fontSize:10,fontWeight:700,color:CM,marginBottom:7,textTransform:"uppercase"}}>Size</div><div style={{display:"flex",gap:5}}>{FONT_SIZES.map(s=><button key={s.key} onClick={()=>setSizeKey(s.key)} style={{padding:"3px 12px",border:`2px solid ${sizeKey===s.key?A:"#333"}`,background:sizeKey===s.key?A:"transparent",color:sizeKey===s.key?BG:CM,fontSize:11,cursor:"pointer",fontFamily:"monospace"}}>{s.label}</button>)}</div></div>
            <div><div style={{fontSize:10,fontWeight:700,color:CM,marginBottom:7,textTransform:"uppercase"}}>Color</div><div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"flex-end"}}>{([{k:"A" as const,l:"Accent"},{k:"BG" as const,l:"BG"},{k:"CT" as const,l:"Text"}]).map(({k,l})=>(<label key={k} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3,cursor:"pointer"}}><input type="color" value={clrs[k]} onChange={e=>setClrs(c=>({...c,[k]:e.target.value}))} style={{width:30,height:30,padding:2,border:`2px solid ${A}`,cursor:"pointer",background:"none"}}/><span style={{fontSize:9,color:CM}}>{l}</span></label>))}<button onClick={()=>setClrs(DEFAULT_COLORS)} style={{padding:"4px 10px",fontSize:11,border:`2px solid #333`,background:"transparent",color:"#555",cursor:"pointer"}}>↺</button></div></div>
          </div>
        )}
      </div>

      <div ref={docRef} className={`${PFX}-doc`} style={{width:850,minHeight:1202,margin:"0 auto",backgroundColor:BG,overflow:"visible",fontFamily:"monospace",boxShadow:`0 0 40px ${A}33`}}>
        <div className={`${PFX}-zoom`} style={{width:Math.round(850/scale),zoom:scale}}>
          {/* Pixel art header */}
          <PixelBorder color={A}>
            <div style={{background:S2,padding:"18px 28px"}}>
              <div style={{display:"flex",gap:24,alignItems:"center"}}>
                <div style={{position:"relative",flexShrink:0}}>
                  <div style={{width:curShape.w,height:curShape.h,borderRadius:0,overflow:"hidden",backgroundColor:S3,border:`4px solid ${CYAN}`,cursor:editing?"pointer":"default",display:"flex",alignItems:"center",justifyContent:"center"}} onClick={()=>editing&&photoInputRef.current?.click()}>
                    {photoSrc?<img src={photoSrc} alt="Foto" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<span style={{fontSize:10,color:A,fontFamily:"monospace"}}>{editing?"[📷]":"[IMG]"}</span>}
                  </div>
                  <input ref={photoInputRef} type="file" accept="image/*" style={{display:"none"}} onChange={e=>{const f=e.target.files?.[0];if(!f)return;const r=new FileReader();r.onload=ev=>setPhotoSrc((ev.target?.result as string)??"");r.readAsDataURL(f);}}/>
                </div>
                <div style={{flex:1}}>
                  <div style={{marginBottom:4}}>{editing?<input value={data.personal.name} onChange={e=>setP({name:e.target.value})} style={{fontSize:26,fontWeight:900,color:A,fontFamily:"monospace",background:"#001100",border:`2px solid ${A}`,padding:"2px 8px",outline:"none",width:"100%",boxSizing:"border-box",letterSpacing:"2px",textShadow:`0 0 10px ${A}`}}/>
                    :<span style={{fontSize:26,fontWeight:900,color:A,letterSpacing:"2px",textShadow:`0 0 10px ${A}`}}>{data.personal.name}</span>}</div>
                  <div style={{marginBottom:4}}>{editing?<input value={data.personal.subtitle} onChange={e=>setP({subtitle:e.target.value})} style={{display:"block",fontSize:12,color:CYAN,fontFamily:"monospace",background:"#001a22",border:`2px solid ${CYAN}`,padding:"2px 6px",outline:"none",width:"100%",boxSizing:"border-box",letterSpacing:"1px"}}/>
                    :<div style={{fontSize:12,color:CYAN,letterSpacing:"1px"}}>&gt; {data.personal.subtitle}</div>}</div>
                  <E value={data.personal.bio} onChange={v=>setP({bio:v})} editing={editing} multiline rows={2} style={{fontSize:11,color:CM,lineHeight:1.6,fontFamily:"monospace"}}/>
                  <div style={{display:"flex",flexWrap:"wrap",gap:6,marginTop:6}}>
                    {(["email","phone","location","linkedin","github"] as const).map(k=>data.personal[k]?<span key={k} style={{fontSize:10,color:YEL,fontFamily:"monospace"}}>{`[${data.personal[k]}]`}</span>:null)}
                  </div>
                </div>
              </div>
            </div>
          </PixelBorder>

          <div style={{display:"flex",gap:0}}>
            <div style={{flex:1,padding:"18px 22px"}}>
              <div style={{marginBottom:16}}><SecH title="EXPERIENCE" color={A}/>
                {data.experience.map(ex=>(
                  <div key={ex.id} style={{marginBottom:12,padding:"8px",background:S2,border:`2px solid ${A}22`}}>
                    <E value={ex.position} onChange={v=>updExp(ex.id,{position:v})} editing={editing} style={{fontSize:12,fontWeight:700,color:CYAN,display:"block",fontFamily:"monospace"}}/>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                      <E value={ex.company} onChange={v=>updExp(ex.id,{company:v})} editing={editing} style={{fontSize:10,color:YEL,fontFamily:"monospace"}}/>
                      <E value={ex.period} onChange={v=>updExp(ex.id,{period:v})} editing={editing} style={{fontSize:10,color:CM,fontFamily:"monospace"}}/>
                    </div>
                    <BulletList bullets={ex.bullets} onChange={b=>updExp(ex.id,{bullets:b})} editing={editing}/>
                    {editing&&<button type="button" onClick={()=>setData(d=>({...d,experience:d.experience.filter(x=>x.id!==ex.id)}))} style={{fontSize:10,color:"#f87171",background:"none",border:"none",cursor:"pointer",fontFamily:"monospace"}}>[DEL]</button>}
                  </div>
                ))}
                {editing&&<button type="button" onClick={()=>setData(d=>({...d,experience:[...d.experience,{id:uid(),position:"",company:"",period:"",location:"",description:"",type:"",bullets:[],contact:""}]}))} style={{fontSize:11,color:A,background:"#001100",border:`2px solid ${A}`,cursor:"pointer",padding:"3px 10px",fontFamily:"monospace"}}>+ADD_EXP</button>}
              </div>
              <div><SecH title="PROJECTS" color={MAG}/>
                {data.projects.map(p=>(
                  <div key={p.id} style={{marginBottom:10,padding:"8px",background:S2,border:`2px solid ${MAG}22`}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}>
                      <E value={p.title} onChange={v=>updProj(p.id,{title:v})} editing={editing} style={{fontSize:12,fontWeight:700,color:MAG,fontFamily:"monospace"}}/>
                      <E value={p.period} onChange={v=>updProj(p.id,{period:v})} editing={editing} style={{fontSize:9,color:CM,fontFamily:"monospace"}}/>
                    </div>
                    <BulletList bullets={p.bullets} onChange={b=>updProj(p.id,{bullets:b})} editing={editing}/>
                    {editing&&<button type="button" onClick={()=>setData(d=>({...d,projects:d.projects.filter(x=>x.id!==p.id)}))} style={{fontSize:10,color:"#f87171",background:"none",border:"none",cursor:"pointer",fontFamily:"monospace"}}>[DEL]</button>}
                  </div>
                ))}
                {editing&&<button type="button" onClick={()=>setData(d=>({...d,projects:[...d.projects,{id:uid(),title:"",period:"",bullets:[],link:""}]}))} style={{fontSize:11,color:MAG,background:"#0d0022",border:`2px solid ${MAG}`,cursor:"pointer",padding:"3px 10px",fontFamily:"monospace"}}>+ADD_PROJ</button>}
              </div>
            </div>
            <div style={{width:200,background:S2,borderLeft:`4px solid ${A}22`,padding:"18px 14px"}}>
              <div style={{marginBottom:14}}><SecH title="SKILLS" color={YEL}/><TagList tags={data.skills} onChange={s=>setData(d=>({...d,skills:s}))} editing={editing}/></div>
              <div style={{marginBottom:14}}>
                <SecH title="EDUCATION" color={CYAN}/>
                {data.education.map(e=>(
                  <div key={e.id} style={{marginBottom:10,padding:"6px",background:BG,border:`2px solid ${CYAN}33`}}>
                    <E value={e.degree} onChange={v=>updEdu(e.id,{degree:v})} editing={editing} style={{fontSize:11,fontWeight:700,color:CYAN,display:"block",fontFamily:"monospace"}}/>
                    <E value={e.institution} onChange={v=>updEdu(e.id,{institution:v})} editing={editing} style={{fontSize:9,color:YEL,display:"block",fontFamily:"monospace"}}/>
                    <E value={e.period} onChange={v=>updEdu(e.id,{period:v})} editing={editing} style={{fontSize:9,color:CM,fontFamily:"monospace"}}/>
                    {editing&&<button type="button" onClick={()=>setData(d=>({...d,education:d.education.filter(x=>x.id!==e.id)}))} style={{fontSize:10,color:"#f87171",background:"none",border:"none",cursor:"pointer",fontFamily:"monospace"}}>[X]</button>}
                  </div>
                ))}
                {editing&&<button type="button" onClick={()=>setData(d=>({...d,education:[...d.education,{id:uid(),degree:"",institution:"",period:"",location:"",type:"Kurse / Inhalte",bullets:[]}] }))} style={{fontSize:11,color:CYAN,background:"#001a22",border:`2px solid ${CYAN}`,cursor:"pointer",padding:"3px 8px",fontFamily:"monospace"}}>+</button>}
              </div>
              <div><SecH title="LANGUAGES" color={A}/>
                {data.languages.map((l,i)=>(
                  <div key={i} style={{marginBottom:6,display:"flex",justifyContent:"space-between"}}>
                    <E value={l.language} onChange={v=>{const n=[...data.languages];n[i]={...n[i],language:v};setData(d=>({...d,languages:n}));}} editing={editing} style={{fontSize:11,fontWeight:700,color:CT,fontFamily:"monospace"}}/>
                    <span style={{fontSize:9,background:A,color:"#000",padding:"1px 5px",fontFamily:"monospace"}}>{l.level}</span>
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
