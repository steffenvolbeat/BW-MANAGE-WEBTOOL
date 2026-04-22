"use client";
// ─── CV Template: Cyberpunk ──────────────────────────────────────────────────
import { useState, useRef, useContext, createContext } from "react";
import { PrinterIcon, PencilSquareIcon, CheckIcon, PlusIcon, TrashIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { FONTS, FONT_SIZES, PHOTO_SHAPES, CVData, DEFAULT_CV_DATA, uid } from "./shared";
import { useCVStorage } from "./useCV";

const DEFAULT_COLORS = { A:"#f900ff", BG:"#080015", S2:"#0d001f", S3:"#120026", SBG:"#060010", CT:"#ffffff", CB:"#00ffe7", CM:"#b800ff" };
const hex2rgba = (hex:string,a:number) => { const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16); return `rgba(${r},${g},${b},${a})`; };
const ColCtx = createContext(DEFAULT_COLORS);
const PFX = "ccy";

function E({ value, onChange, editing, multiline=false, style={} as React.CSSProperties, placeholder="...", rows=3 }:{ value:string; onChange:(v:string)=>void; editing:boolean; multiline?:boolean; style?:React.CSSProperties; placeholder?:string; rows?:number; }) {
  const {A}=useContext(ColCtx);
  const s: React.CSSProperties = { ...style, background: "rgba(249,0,255,0.08)", border:`1px solid rgba(249,0,255,0.4)`, borderRadius:2, padding:"2px 4px", outline:"none", width:"100%", fontFamily:"'Courier New',monospace", fontSize:"inherit", color:"inherit", lineHeight:"inherit", fontWeight:"inherit", boxSizing:"border-box" };
  if (!editing) return <span style={style}>{value||<span style={{opacity:0.3,fontStyle:"italic"}}>{placeholder}</span>}</span>;
  if (multiline) return <textarea style={{...s,resize:"vertical",display:"block"}} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={rows}/>;
  return <input style={s} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}/>;
}

function BulletList({ bullets, onChange, editing }:{ bullets:string[]; onChange:(b:string[])=>void; editing:boolean }) {
  const {A,CB,CT,S3}=useContext(ColCtx);
  return (
    <ul style={{listStyle:"none",margin:0,padding:0}}>
      {bullets.map((b,i)=>(
        <li key={i} style={{display:"flex",alignItems:"flex-start",gap:6,marginBottom:3}}>
          <span style={{color:"#00ffe7",fontSize:9,marginTop:2,flexShrink:0,fontFamily:"monospace"}}>›</span>
          {editing?(
            <div style={{flex:1,display:"flex",gap:4}}>
              <input value={b} onChange={e=>{const n=[...bullets];n[i]=e.target.value;onChange(n);}} style={{flex:1,fontSize:11,color:CT,background:"rgba(0,255,231,0.07)",border:"1px solid rgba(0,255,231,0.3)",borderRadius:2,padding:"1px 4px",outline:"none",fontFamily:"'Courier New',monospace"}}/>
              <button type="button" onClick={()=>onChange(bullets.filter((_,idx)=>idx!==i))} style={{background:"none",border:"none",cursor:"pointer",color:"#f87171",padding:0,display:"flex"}}><XMarkIcon style={{width:11,height:11}}/></button>
            </div>
          ):<span style={{fontSize:11,color:CB,lineHeight:1.5,fontFamily:"'Courier New',monospace"}}>{b}</span>}
        </li>
      ))}
      {editing&&<li><button type="button" onClick={()=>onChange([...bullets,""])} style={{display:"flex",alignItems:"center",gap:4,fontSize:11,color:"#00ffe7",background:"none",border:"none",cursor:"pointer",padding:"3px 0",fontFamily:"'Courier New',monospace"}}><PlusIcon style={{width:11,height:11}}/>Hinzufügen</button></li>}
    </ul>
  );
}

function TagList({ tags, onChange, editing }:{ tags:string[]; onChange:(t:string[])=>void; editing:boolean }) {
  const {A,CT,CB}=useContext(ColCtx);
  const [nv,setNv]=useState("");
  return (
    <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
      {tags.map((t,i)=>(
        <div key={i} style={{backgroundColor:"rgba(0,255,231,0.07)",border:"1px solid rgba(0,255,231,0.4)",color:CB,borderRadius:2,padding:"1px 8px",fontSize:10,display:"flex",alignItems:"center",gap:3,fontFamily:"'Courier New',monospace"}}>
          {t}
          {editing&&<button type="button" onClick={()=>onChange(tags.filter((_,idx)=>idx!==i))} style={{background:"none",border:"none",cursor:"pointer",color:"#f87171",padding:0,display:"flex"}}><XMarkIcon style={{width:9,height:9}}/></button>}
        </div>
      ))}
      {editing&&<input value={nv} onChange={e=>setNv(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&nv.trim()){onChange([...tags,nv.trim()]);setNv("");}}} style={{width:70,fontSize:10,border:"1px solid rgba(0,255,231,0.4)",borderRadius:2,padding:"1px 5px",background:"rgba(0,255,231,0.07)",outline:"none",color:CT,fontFamily:"'Courier New',monospace"}} placeholder="+ Neu"/>}
    </div>
  );
}

function SecH({ title }:{ title:string }) {
  const {A}=useContext(ColCtx);
  return (
    <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:10}}>
      <span style={{color:"#f900ff",fontFamily:"'Courier New',monospace",fontSize:10}}>▎</span>
      <span style={{fontSize:10,fontWeight:700,letterSpacing:"0.16em",textTransform:"uppercase" as const,color:"#00ffe7",fontFamily:"'Courier New',monospace",textShadow:"0 0 8px rgba(0,255,231,0.6)"}}>{title}</span>
      <div style={{flex:1,height:1,background:"linear-gradient(90deg,rgba(249,0,255,0.5),transparent)"}}/>
    </div>
  );
}

export default function CV_Cyberpunk() {
  const {data,setData,fontKey,setFontKey,sizeKey,setSizeKey,photoShapeKey,setPhotoShapeKey,photoSrc,setPhotoSrc,clrs,setClrs,resetStorage}=useCVStorage("cyberpunk",DEFAULT_COLORS);
  const [editing,setEditing]=useState(false);
  const [showDesign,setShowDesign]=useState(false);
  const {A,BG,S2,S3,SBG,CT,CB,CM}=clrs;
  const curFont=FONTS.find(f=>f.key===fontKey)??FONTS[0];
  const curSize=FONT_SIZES.find(s=>s.key===sizeKey)??FONT_SIZES[2];
  const curShape=PHOTO_SHAPES.find(s=>s.key===photoShapeKey)??PHOTO_SHAPES[4];
  const fnt="'Courier New', monospace";
  const scale=curSize.scale;
  const photoInputRef=useRef<HTMLInputElement>(null);
  const setP=(p:Partial<CVData["personal"]>)=>setData(d=>({...d,personal:{...d.personal,...p}}));
  const updProj=(id:string,p:Partial<typeof data.projects[0]>)=>setData(d=>({...d,projects:d.projects.map(x=>x.id===id?{...x,...p}:x)}));
  const updEdu=(id:string,p:Partial<typeof data.education[0]>)=>setData(d=>({...d,education:d.education.map(x=>x.id===id?{...x,...p}:x)}));
  const updExp=(id:string,p:Partial<typeof data.experience[0]>)=>setData(d=>({...d,experience:d.experience.map(x=>x.id===id?{...x,...p}:x)}));

  return (
  <ColCtx.Provider value={clrs}>
    <div style={{minHeight:"100vh",background:BG,padding:"24px 16px",fontFamily:fnt,position:"relative"}}>
      <style>{`
        .${PFX}-doc, .${PFX}-doc * { font-family: 'Courier New', monospace !important; }
        .${PFX}-scanlines { background: repeating-linear-gradient(0deg, rgba(0,255,231,0.015) 0px, rgba(0,255,231,0.015) 1px, transparent 1px, transparent 3px); pointer-events: none; }
        @media print {
          @page { size: A4 portrait; margin: 0; }html,body{height:0!important;overflow:visible!important;margin:0!important;padding:0!important;}
          *, *::before, *::after { -webkit-print-color-adjust:exact!important; print-color-adjust:exact!important; }
          body * { visibility:hidden!important; }
          .${PFX}-doc, .${PFX}-doc * { visibility:visible!important; }
          .${PFX}-doc { position:absolute!important; top:0!important; left:0!important; width:850px!important; min-height:1202px!important; overflow:visible!important; zoom:0.934!important; box-shadow:none!important; margin:0!important; }
          .${PFX}-zoom { zoom:1!important; width:100%!important; }
          .${PFX}-ctrl { display:none!important; }
        }
      `}</style>

      <div className={`${PFX}-ctrl`} style={{maxWidth:850,margin:"0 auto 16px",display:"flex",gap:8,flexWrap:"wrap"}}>
        <button onClick={()=>setEditing(e=>!e)} style={{display:"flex",alignItems:"center",gap:6,padding:"7px 16px",borderRadius:2,fontSize:13,fontWeight:600,cursor:"pointer",border:`1px solid ${editing?"#16a34a":"#f900ff"}`,backgroundColor:editing?"#16a34a":"rgba(249,0,255,0.15)",color:editing?"white":"#f900ff",textShadow:editing?"none":"0 0 8px rgba(249,0,255,0.8)",fontFamily:"'Courier New',monospace"}}>
          {editing?<CheckIcon style={{width:16,height:16}}/>:<PencilSquareIcon style={{width:16,height:16}}/>}{editing?"DONE":"EDIT"}
        </button>
        <button onClick={()=>window.print()} style={{padding:"7px 16px",borderRadius:2,fontSize:13,cursor:"pointer",border:"1px solid rgba(0,255,231,0.6)",backgroundColor:"rgba(0,255,231,0.07)",color:"#00ffe7",display:"flex",alignItems:"center",gap:6,fontFamily:"'Courier New',monospace",textShadow:"0 0 8px rgba(0,255,231,0.6)"}}>
          <PrinterIcon style={{width:16,height:16}}/>PRINT
        </button>
        <button onClick={()=>setShowDesign(v=>!v)} style={{padding:"7px 16px",borderRadius:2,fontSize:13,cursor:"pointer",border:`1px solid ${showDesign?"rgba(249,0,255,0.6)":"rgba(255,255,255,0.1)"}`,backgroundColor:showDesign?"rgba(249,0,255,0.1)":"transparent",color:showDesign?"#f900ff":"#555",fontFamily:"'Courier New',monospace"}}>
          [DESIGN]
        </button>
        <button onClick={()=>{resetStorage();setData(JSON.parse(JSON.stringify(DEFAULT_CV_DATA)));setPhotoSrc("");setFontKey("nunito");setSizeKey("md");setPhotoShapeKey("circle");setClrs(DEFAULT_COLORS);setShowDesign(false);}} style={{padding:"7px 16px",borderRadius:2,fontSize:13,cursor:"pointer",border:"1px solid rgba(255,255,255,0.1)",backgroundColor:"transparent",color:"#444",display:"flex",alignItems:"center",gap:6,fontFamily:"'Courier New',monospace"}}>
          <XMarkIcon style={{width:16,height:16}}/>RESET
        </button>
        {showDesign&&(
          <div style={{width:"100%",background:S2,border:"1px solid rgba(249,0,255,0.3)",borderRadius:4,padding:"14px 18px",display:"flex",gap:24,flexWrap:"wrap"}}>
            <div><div style={{fontSize:10,fontWeight:700,color:"#555",marginBottom:7,letterSpacing:"0.1em",textTransform:"uppercase",fontFamily:"'Courier New',monospace"}}>Font</div><div style={{display:"flex",gap:5,flexWrap:"wrap"}}>{FONTS.map(f=><button key={f.key} onClick={()=>setFontKey(f.key)} style={{padding:"3px 9px",borderRadius:2,border:`1px solid ${fontKey===f.key?"rgba(0,255,231,0.6)":"rgba(255,255,255,0.1)"}`,background:fontKey===f.key?"rgba(0,255,231,0.1)":"transparent",color:fontKey===f.key?"#00ffe7":"#555",fontSize:11,cursor:"pointer",fontFamily:f.family}}>{f.label}</button>)}</div></div>
            <div><div style={{fontSize:10,fontWeight:700,color:"#555",marginBottom:7,letterSpacing:"0.1em",textTransform:"uppercase",fontFamily:"'Courier New',monospace"}}>Size</div><div style={{display:"flex",gap:5}}>{FONT_SIZES.map(s=><button key={s.key} onClick={()=>setSizeKey(s.key)} style={{padding:"3px 12px",borderRadius:2,border:`1px solid ${sizeKey===s.key?"rgba(0,255,231,0.6)":"rgba(255,255,255,0.1)"}`,background:sizeKey===s.key?"rgba(0,255,231,0.1)":"transparent",color:sizeKey===s.key?"#00ffe7":"#555",fontSize:11,cursor:"pointer"}}>{s.label}</button>)}</div></div>
            <div><div style={{fontSize:10,fontWeight:700,color:"#555",marginBottom:7,letterSpacing:"0.1em",textTransform:"uppercase",fontFamily:"'Courier New',monospace"}}>Foto</div><div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{PHOTO_SHAPES.map(s=><button key={s.key} onClick={()=>setPhotoShapeKey(s.key)} title={s.label} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3,padding:"5px 7px",borderRadius:2,border:`2px solid ${photoShapeKey===s.key?"rgba(0,255,231,0.6)":"rgba(255,255,255,0.1)"}`,background:photoShapeKey===s.key?"rgba(0,255,231,0.1)":"transparent",cursor:"pointer"}}><div style={{width:20,height:s.key==="ellipse"?26:20,borderRadius:s.br,clipPath:s.clip??"",backgroundColor:photoShapeKey===s.key?"#00ffe7":"#333"}}/><span style={{fontSize:8,color:photoShapeKey===s.key?"#00ffe7":"#444",whiteSpace:"nowrap"}}>{s.label}</span></button>)}</div></div>
            <div><div style={{fontSize:10,fontWeight:700,color:"#555",marginBottom:7,letterSpacing:"0.1em",textTransform:"uppercase",fontFamily:"'Courier New',monospace"}}>Colors</div><div style={{display:"flex",gap:10,flexWrap:"wrap",alignItems:"flex-end"}}>{([{k:"A" as const,l:"Akzent"},{k:"BG" as const,l:"BG"},{k:"S2" as const,l:"S2"},{k:"S3" as const,l:"S3"},{k:"SBG" as const,l:"SBG"},{k:"CT" as const,l:"Titel"},{k:"CB" as const,l:"Text"},{k:"CM" as const,l:"Cyan"}]).map(({k,l})=>(<label key={k} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3,cursor:"pointer"}}><input type="color" value={clrs[k]} onChange={e=>setClrs(c=>({...c,[k]:e.target.value}))} style={{width:32,height:32,padding:2,borderRadius:2,border:"1px solid rgba(0,255,231,0.3)",cursor:"pointer",background:"none"}}/><span style={{fontSize:9,color:"#555",fontFamily:"monospace"}}>{l}</span></label>))}<button onClick={()=>setClrs(DEFAULT_COLORS)} style={{padding:"4px 10px",borderRadius:2,fontSize:11,border:"1px solid rgba(255,255,255,0.1)",background:"transparent",color:"#555",cursor:"pointer",alignSelf:"center",fontFamily:"monospace"}}>↺</button></div></div>
          </div>
        )}
      </div>

      <div className={`${PFX}-doc`} style={{width:850, minHeight: 1202,margin:"0 auto",backgroundColor:"#080015",boxShadow:"0 0 40px rgba(249,0,255,0.3), 0 0 80px rgba(0,255,231,0.1), inset 0 0 40px rgba(249,0,255,0.03)",overflow: "visible",fontFamily:fnt,border:"1px solid rgba(249,0,255,0.3)",position:"relative"}}>
        <div className={`${PFX}-scanlines`} style={{position:"absolute",top:0,left:0,right:0,bottom:0,zIndex:1,pointerEvents:"none"}}/>
        <div className={`${PFX}-zoom`} style={{width:Math.round(850/scale),zoom:scale,position:"relative",zIndex:2}}>
          <div style={{height:2,background:"linear-gradient(90deg,#f900ff,#00ffe7,#f900ff)"}}/>
          {/* Cyberpunk header */}
          <div style={{background:"linear-gradient(135deg,#0d001f,#120026)",padding:"28px 40px 22px",borderBottom:"1px solid rgba(249,0,255,0.3)"}}>
            <div style={{display:"flex",gap:24,alignItems:"flex-start"}}>
              <div style={{position:"relative",width:curShape.w,height:curShape.h,flexShrink:0}}>
                <div style={{width:"100%",height:"100%",borderRadius:curShape.br,clipPath:curShape.clip??"",overflow:"hidden",backgroundColor:"#120026",border:"1px solid rgba(249,0,255,0.5)",display:"flex",alignItems:"center",justifyContent:"center",cursor:editing?"pointer":"default",boxShadow:"0 0 20px rgba(249,0,255,0.4)"}} onClick={()=>editing&&photoInputRef.current?.click()}>
                  {photoSrc?<img src={photoSrc} alt="Foto" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<span style={{fontSize:10,color:"#b800ff",textAlign:"center"}}>{editing?"📷":"FOTO"}</span>}
                  <input ref={photoInputRef} type="file" accept="image/*" style={{display:"none"}} onChange={e=>{const f=e.target.files?.[0];if(!f)return;const r=new FileReader();r.onload=ev=>setPhotoSrc((ev.target?.result as string)??"");r.readAsDataURL(f);}}/>
                </div>
              </div>
              <div style={{flex:1}}>
                {editing?<input value={data.personal.name} onChange={e=>setP({name:e.target.value})} style={{display:"block",fontSize:36,fontWeight:900,color:"#ffffff",lineHeight:1.05,marginBottom:4,fontFamily:"'Courier New',monospace",background:"rgba(249,0,255,0.08)",border:"1px solid rgba(249,0,255,0.4)",borderRadius:2,padding:"2px 6px",outline:"none",width:"100%",boxSizing:"border-box"}}/>
                  :<div style={{fontSize:36,fontWeight:900,color:"#ffffff",lineHeight:1.05,marginBottom:4,textShadow:"0 0 30px rgba(249,0,255,0.5)"}}>{data.personal.name}</div>}
                {editing?<input value={data.personal.subtitle} onChange={e=>setP({subtitle:e.target.value})} style={{display:"block",fontSize:13,color:"#00ffe7",marginBottom:10,fontFamily:"'Courier New',monospace",background:"rgba(0,255,231,0.07)",border:"1px solid rgba(0,255,231,0.4)",borderRadius:2,padding:"2px 6px",outline:"none",width:"100%",boxSizing:"border-box"}}/>
                  :<div style={{fontSize:13,color:"#00ffe7",marginBottom:10,textShadow:"0 0 12px rgba(0,255,231,0.7)",letterSpacing:"0.1em"}}>{data.personal.subtitle}</div>}
                <E value={data.personal.bio} onChange={v=>setP({bio:v})} editing={editing} multiline rows={2} style={{fontSize:11,color:"#b800ff",lineHeight:1.6}}/>
                <div style={{display:"flex",flexWrap:"wrap",gap:6,marginTop:8}}>
                  {(["email","phone","location","github","linkedin","website"] as const).map(k=>editing
                    ?<input key={k} value={data.personal[k]??""} onChange={e=>setP({[k]:e.target.value} as Partial<CVData["personal"]>)} style={{fontSize:10,color:"#00ffe7",background:"rgba(0,255,231,0.07)",border:"1px solid rgba(0,255,231,0.3)",borderRadius:2,padding:"2px 8px",outline:"none",fontFamily:"'Courier New',monospace"}}/>
                    :data.personal[k]?<span key={k} style={{fontSize:10,color:"#00ffe7",backgroundColor:"rgba(0,255,231,0.05)",border:"1px solid rgba(0,255,231,0.25)",borderRadius:2,padding:"2px 8px",fontFamily:"'Courier New',monospace"}}>{data.personal[k]}</span>:null
                  )}
                </div>
              </div>
            </div>
          </div>

          <div style={{display:"flex"}}>
            <div style={{flex:1,padding:"24px 28px 40px 40px",minWidth:0}}>
              <div style={{marginBottom:22}}>
                <SecH title="Projekte"/>
                {data.projects.map(p=>(
                  <div key={p.id} style={{marginBottom:12,paddingLeft:10,borderLeft:"2px solid rgba(249,0,255,0.5)"}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:2,gap:8}}>
                      <E value={p.title} onChange={v=>updProj(p.id,{title:v})} editing={editing} style={{fontSize:13,fontWeight:700,color:CT}}/>
                      <E value={p.period} onChange={v=>updProj(p.id,{period:v})} editing={editing} style={{fontSize:10,color:"#00ffe7",flexShrink:0}}/>
                    </div>
                    <E value={p.link??""} onChange={v=>updProj(p.id,{link:v})} editing={editing} style={{fontSize:10,color:"#f900ff",display:"block",marginBottom:3}} placeholder="Link..."/>
                    <BulletList bullets={p.bullets} onChange={b=>updProj(p.id,{bullets:b})} editing={editing}/>
                    {editing&&<button type="button" onClick={()=>setData(d=>({...d,projects:d.projects.filter(x=>x.id!==p.id)}))} style={{fontSize:10,color:"#f87171",background:"none",border:"none",cursor:"pointer",marginTop:3,display:"flex",alignItems:"center",gap:3}}><TrashIcon style={{width:10,height:10}}/>Entfernen</button>}
                  </div>
                ))}
                {editing&&<button type="button" onClick={()=>setData(d=>({...d,projects:[...d.projects,{id:uid(),title:"PROJ_001",period:"",bullets:[],link:""}]}))} style={{fontSize:11,color:"#00ffe7",background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:4,fontFamily:"'Courier New',monospace"}}><PlusIcon style={{width:12,height:12}}/>+ NEW</button>}
              </div>
              <div style={{marginBottom:22}}>
                <SecH title="Erfahrung"/>
                {data.experience.map(ex=>(
                  <div key={ex.id} style={{marginBottom:14,paddingLeft:10,borderLeft:"2px solid rgba(0,255,231,0.4)"}}>
                    <E value={ex.position} onChange={v=>updExp(ex.id,{position:v})} editing={editing} style={{fontSize:13,fontWeight:700,color:CT,display:"block",marginBottom:1}}/>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:2,gap:8}}>
                      <E value={ex.company} onChange={v=>updExp(ex.id,{company:v})} editing={editing} style={{fontSize:12,color:"#00ffe7"}}/>
                      <E value={ex.period} onChange={v=>updExp(ex.id,{period:v})} editing={editing} style={{fontSize:10,color:"#b800ff",fontStyle:"italic"}}/>
                    </div>
                    <E value={ex.description??""} onChange={v=>updExp(ex.id,{description:v})} editing={editing} style={{fontSize:11,color:"#b800ff",display:"block",marginBottom:3}} placeholder="Beschreibung..."/>
                    <BulletList bullets={ex.bullets} onChange={b=>updExp(ex.id,{bullets:b})} editing={editing}/>
                    {editing&&<button type="button" onClick={()=>setData(d=>({...d,experience:d.experience.filter(x=>x.id!==ex.id)}))} style={{fontSize:10,color:"#f87171",background:"none",border:"none",cursor:"pointer",marginTop:3,display:"flex",alignItems:"center",gap:3}}><TrashIcon style={{width:10,height:10}}/>Entfernen</button>}
                  </div>
                ))}
                {editing&&<button type="button" onClick={()=>setData(d=>({...d,experience:[...d.experience,{id:uid(),position:"ROLE_001",company:"CORP_001",period:"",location:"",description:"",type:"",bullets:[],contact:""}]}))} style={{fontSize:11,color:"#00ffe7",background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:4,fontFamily:"'Courier New',monospace"}}><PlusIcon style={{width:12,height:12}}/>+ NEW</button>}
              </div>
              <div>
                <SecH title="Ausbildung"/>
                {data.education.map(e=>(
                  <div key={e.id} style={{marginBottom:12,paddingLeft:10,borderLeft:"2px solid rgba(249,0,255,0.4)"}}>
                    <E value={e.degree} onChange={v=>updEdu(e.id,{degree:v})} editing={editing} style={{fontSize:13,fontWeight:700,color:CT,display:"block",marginBottom:1}}/>
                    <E value={e.institution} onChange={v=>updEdu(e.id,{institution:v})} editing={editing} style={{fontSize:12,color:"#00ffe7",display:"block",marginBottom:2}}/>
                    <div style={{display:"flex",justifyContent:"space-between",gap:8}}>
                      <E value={e.period} onChange={v=>updEdu(e.id,{period:v})} editing={editing} style={{fontSize:10,color:"#b800ff",fontStyle:"italic"}}/>
                      <E value={e.location} onChange={v=>updEdu(e.id,{location:v})} editing={editing} style={{fontSize:10,color:"#b800ff",fontStyle:"italic"}}/>
                    </div>
                    <BulletList bullets={e.bullets} onChange={b=>updEdu(e.id,{bullets:b})} editing={editing}/>
                    {editing&&<button type="button" onClick={()=>setData(d=>({...d,education:d.education.filter(x=>x.id!==e.id)}))} style={{fontSize:10,color:"#f87171",background:"none",border:"none",cursor:"pointer",marginTop:3,display:"flex",alignItems:"center",gap:3}}><TrashIcon style={{width:10,height:10}}/>Entfernen</button>}
                  </div>
                ))}
                {editing&&<button type="button" onClick={()=>setData(d=>({...d,education:[...d.education,{id:uid(),degree:"EDU_001",institution:"INST_001",period:"",location:"",type:"",bullets:[]}]}))} style={{fontSize:11,color:"#00ffe7",background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:4,fontFamily:"'Courier New',monospace"}}><PlusIcon style={{width:12,height:12}}/>+ NEW</button>}
              </div>
            </div>
            <div style={{width:250,flexShrink:0,backgroundColor:"#060010",padding:"24px 18px 40px",borderLeft:"1px solid rgba(249,0,255,0.3)"}}>
              {[
                {title:"Skills",c:<TagList tags={data.skills} onChange={t=>setData(d=>({...d,skills:t}))} editing={editing}/>},
                {title:"Tech",c:<div>{data.technicalSkills.map(ts=>(<div key={ts.id} style={{marginBottom:7}}><E value={ts.name} onChange={v=>setData(d=>({...d,technicalSkills:d.technicalSkills.map(t=>t.id===ts.id?{...t,name:v}:t)}))} editing={editing} style={{fontSize:12,fontWeight:700,color:"#00ffe7",display:"block"}}/><E value={ts.description} onChange={v=>setData(d=>({...d,technicalSkills:d.technicalSkills.map(t=>t.id===ts.id?{...t,description:v}:t)}))} editing={editing} style={{fontSize:10,color:"#b800ff",display:"block"}}/>{editing&&<button type="button" onClick={()=>setData(d=>({...d,technicalSkills:d.technicalSkills.filter(t=>t.id!==ts.id)}))} style={{fontSize:10,color:"#f87171",background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:2}}><XMarkIcon style={{width:10,height:10}}/>Del</button>}</div>))}{editing&&<button type="button" onClick={()=>setData(d=>({...d,technicalSkills:[...d.technicalSkills,{id:uid(),name:"TECH",description:"v1.0"}]}))} style={{fontSize:11,color:"#00ffe7",background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:4,fontFamily:"monospace"}}><PlusIcon style={{width:11,height:11}}/>+ ADD</button>}</div>},
                {title:"Soft Skills",c:<TagList tags={data.softSkills} onChange={t=>setData(d=>({...d,softSkills:t}))} editing={editing}/>},
                {title:"Referenzen",c:<div>{data.references.map(r=>(<div key={r.id} style={{marginBottom:7}}><E value={r.company} onChange={v=>setData(d=>({...d,references:d.references.map(x=>x.id===r.id?{...x,company:v}:x)}))} editing={editing} style={{fontSize:12,fontWeight:600,color:"#00ffe7",display:"block"}}/><E value={r.person??""} onChange={v=>setData(d=>({...d,references:d.references.map(x=>x.id===r.id?{...x,person:v}:x)}))} editing={editing} style={{fontSize:10,fontStyle:"italic",color:"#b800ff",display:"block"}}/>{editing&&<button type="button" onClick={()=>setData(d=>({...d,references:d.references.filter(x=>x.id!==r.id)}))} style={{fontSize:10,color:"#f87171",background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:2}}><XMarkIcon style={{width:10,height:10}}/>Del</button>}</div>))}{editing&&<button type="button" onClick={()=>setData(d=>({...d,references:[...d.references,{id:uid(),company:"CORP",person:""}]}))} style={{fontSize:11,color:"#00ffe7",background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:4,fontFamily:"monospace"}}><PlusIcon style={{width:11,height:11}}/>+ ADD</button>}</div>},
                {title:"Certs",c:<div>{data.certificates.map(c=>(<div key={c.id} style={{marginBottom:7}}><E value={c.name} onChange={v=>setData(d=>({...d,certificates:d.certificates.map(x=>x.id===c.id?{...x,name:v}:x)}))} editing={editing} multiline rows={2} style={{fontSize:10,color:"#00ffe7",display:"block",lineHeight:1.4}}/><E value={c.period} onChange={v=>setData(d=>({...d,certificates:d.certificates.map(x=>x.id===c.id?{...x,period:v}:x)}))} editing={editing} style={{fontSize:9,color:"#b800ff",display:"block"}}/>{editing&&<button type="button" onClick={()=>setData(d=>({...d,certificates:d.certificates.filter(x=>x.id!==c.id)}))} style={{fontSize:10,color:"#f87171",background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:2}}><XMarkIcon style={{width:10,height:10}}/>Del</button>}</div>))}{editing&&<button type="button" onClick={()=>setData(d=>({...d,certificates:[...d.certificates,{id:uid(),name:"CERT_001",period:""}]}))} style={{fontSize:11,color:"#00ffe7",background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:4,fontFamily:"monospace"}}><PlusIcon style={{width:11,height:11}}/>+ ADD</button>}</div>},
                {title:"Lang",c:<div>{data.languages.map(l=>(<div key={l.id} style={{marginBottom:7}}><E value={l.language} onChange={v=>setData(d=>({...d,languages:d.languages.map(x=>x.id===l.id?{...x,language:v}:x)}))} editing={editing} style={{fontSize:12,fontWeight:700,color:"#00ffe7",display:"block"}}/><E value={l.level} onChange={v=>setData(d=>({...d,languages:d.languages.map(x=>x.id===l.id?{...x,level:v}:x)}))} editing={editing} style={{fontSize:10,fontStyle:"italic",color:"#f900ff",display:"block"}}/>{editing&&<button type="button" onClick={()=>setData(d=>({...d,languages:d.languages.filter(x=>x.id!==l.id)}))} style={{fontSize:10,color:"#f87171",background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:2}}><XMarkIcon style={{width:10,height:10}}/>Del</button>}</div>))}{editing&&<button type="button" onClick={()=>setData(d=>({...d,languages:[...d.languages,{id:uid(),language:"LANG",level:"LVL"}]}))} style={{fontSize:11,color:"#00ffe7",background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:4,fontFamily:"monospace"}}><PlusIcon style={{width:11,height:11}}/>+ ADD</button>}</div>},
                {title:"Interests",c:<TagList tags={data.interests} onChange={t=>setData(d=>({...d,interests:t}))} editing={editing}/>},
              ].map(({title,c})=><div key={title} style={{marginBottom:18}}><SecH title={title}/>{c}</div>)}
            </div>
          </div>
          <div style={{height:2,background:"linear-gradient(90deg,#00ffe7,#f900ff,#00ffe7)"}}/>
        </div>
      </div>
    </div>
  </ColCtx.Provider>
  );
}
