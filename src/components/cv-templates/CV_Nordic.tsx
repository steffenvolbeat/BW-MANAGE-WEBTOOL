"use client";
// ─── CV Template: Nordic ─────────────────────────────────────────────────────
import { useState, useRef, useContext, createContext } from "react";
import { PrinterIcon, PencilSquareIcon, CheckIcon, PlusIcon, TrashIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { FONTS, FONT_SIZES, PHOTO_SHAPES, CVData, DEFAULT_CV_DATA, uid } from "./shared";
import { useCVStorage } from "./useCV";

const DEFAULT_COLORS = { A:"#2563eb", BG:"#fafafa", S2:"#f0f2f5", S3:"#e5e8ed", SBG:"#f0f2f5", CT:"#0f172a", CB:"#1e293b", CM:"#64748b" };
const hex2rgba = (hex:string,a:number) => { const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16); return `rgba(${r},${g},${b},${a})`; };
const ColCtx = createContext(DEFAULT_COLORS);
const PFX = "cnd";

function E({ value, onChange, editing, multiline=false, style={} as React.CSSProperties, placeholder="...", rows=3 }:{ value:string; onChange:(v:string)=>void; editing:boolean; multiline?:boolean; style?:React.CSSProperties; placeholder?:string; rows?:number; }) {
  const {A}=useContext(ColCtx);
  const s: React.CSSProperties = { ...style, background: hex2rgba(A,0.05), border:`1px solid ${hex2rgba(A,0.3)}`, borderRadius:3, padding:"2px 4px", outline:"none", width:"100%", fontFamily:"inherit", fontSize:"inherit", color:"inherit", lineHeight:"inherit", fontWeight:"inherit", boxSizing:"border-box" };
  if (!editing) return <span style={style}>{value||<span style={{opacity:0.3,fontStyle:"italic"}}>{placeholder}</span>}</span>;
  if (multiline) return <textarea style={{...s,resize:"vertical",display:"block"}} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={rows}/>;
  return <input style={s} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}/>;
}

function BulletList({ bullets, onChange, editing }:{ bullets:string[]; onChange:(b:string[])=>void; editing:boolean }) {
  const {A,CB,CT,S3}=useContext(ColCtx);
  return (
    <ul style={{listStyle:"none",margin:0,padding:0}}>
      {bullets.map((b,i)=>(
        <li key={i} style={{display:"flex",alignItems:"flex-start",gap:8,marginBottom:3}}>
          <span style={{width:4,height:4,borderRadius:"50%",backgroundColor:A,marginTop:5,flexShrink:0}}/>
          {editing?(
            <div style={{flex:1,display:"flex",gap:4}}>
              <input value={b} onChange={e=>{const n=[...bullets];n[i]=e.target.value;onChange(n);}} style={{flex:1,fontSize:11,color:CT,background:S3,border:`1px solid ${hex2rgba(A,0.25)}`,borderRadius:2,padding:"1px 4px",outline:"none",fontFamily:"inherit"}}/>
              <button type="button" onClick={()=>onChange(bullets.filter((_,idx)=>idx!==i))} style={{background:"none",border:"none",cursor:"pointer",color:"#ef4444",padding:0,display:"flex"}}><XMarkIcon style={{width:11,height:11}}/></button>
            </div>
          ):<span style={{fontSize:11,color:CB,lineHeight:1.7}}>{b}</span>}
        </li>
      ))}
      {editing&&<li><button type="button" onClick={()=>onChange([...bullets,""])} style={{display:"flex",alignItems:"center",gap:4,fontSize:11,color:A,background:"none",border:"none",cursor:"pointer",padding:"3px 0",fontFamily:"inherit"}}><PlusIcon style={{width:11,height:11}}/>Hinzufügen</button></li>}
    </ul>
  );
}

function TagList({ tags, onChange, editing }:{ tags:string[]; onChange:(t:string[])=>void; editing:boolean }) {
  const {A,CT,CB,S3}=useContext(ColCtx);
  const [nv,setNv]=useState("");
  return (
    <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
      {tags.map((t,i)=>(
        <div key={i} style={{backgroundColor:S3,border:`1px solid ${hex2rgba(A,0.15)}`,color:CB,borderRadius:3,padding:"2px 9px",fontSize:10,display:"flex",alignItems:"center",gap:3}}>
          {t}
          {editing&&<button type="button" onClick={()=>onChange(tags.filter((_,idx)=>idx!==i))} style={{background:"none",border:"none",cursor:"pointer",color:"#ef4444",padding:0,display:"flex"}}><XMarkIcon style={{width:9,height:9}}/></button>}
        </div>
      ))}
      {editing&&<input value={nv} onChange={e=>setNv(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&nv.trim()){onChange([...tags,nv.trim()]);setNv("");}}} style={{width:70,fontSize:10,border:`1px solid ${hex2rgba(A,0.3)}`,borderRadius:3,padding:"2px 8px",background:hex2rgba(A,0.04),outline:"none",color:CT,fontFamily:"inherit"}} placeholder="+ Neu"/>}
    </div>
  );
}

function SecH({ title }:{ title:string }) {
  const {A,CT}=useContext(ColCtx);
  return (
    <div style={{marginBottom:12}}>
      <span style={{fontSize:10,fontWeight:700,letterSpacing:"0.16em",textTransform:"uppercase" as const,color:CT}}>{title}</span>
      <div style={{height:1,backgroundColor:hex2rgba(A,0.3),marginTop:4}}/>
    </div>
  );
}

export default function CV_Nordic() {
  const {data,setData,fontKey,setFontKey,sizeKey,setSizeKey,photoShapeKey,setPhotoShapeKey,photoSrc,setPhotoSrc,clrs,setClrs,resetStorage}=useCVStorage("nordic",DEFAULT_COLORS);
  const [editing,setEditing]=useState(false);
  const [showDesign,setShowDesign]=useState(false);
  const {A,BG,S2,S3,SBG,CT,CB,CM}=clrs;
  const curFont=FONTS.find(f=>f.key===fontKey)??FONTS[0];
  const curSize=FONT_SIZES.find(s=>s.key===sizeKey)??FONT_SIZES[2];
  const curShape=PHOTO_SHAPES.find(s=>s.key===photoShapeKey)??PHOTO_SHAPES[4];
  const fnt=curFont.family;
  const scale=curSize.scale;
  const photoInputRef=useRef<HTMLInputElement>(null);
  const setP=(p:Partial<CVData["personal"]>)=>setData(d=>({...d,personal:{...d.personal,...p}}));
  const updProj=(id:string,p:Partial<typeof data.projects[0]>)=>setData(d=>({...d,projects:d.projects.map(x=>x.id===id?{...x,...p}:x)}));
  const updEdu=(id:string,p:Partial<typeof data.education[0]>)=>setData(d=>({...d,education:d.education.map(x=>x.id===id?{...x,...p}:x)}));
  const updExp=(id:string,p:Partial<typeof data.experience[0]>)=>setData(d=>({...d,experience:d.experience.map(x=>x.id===id?{...x,...p}:x)}));

  return (
  <ColCtx.Provider value={clrs}>
    <div style={{minHeight:"100vh",background:"#e8eaed",padding:"24px 16px",fontFamily:fnt}}>
      <style>{`
        ${curFont.gf?`@import url('https://fonts.googleapis.com/css2?family=${curFont.gf}&display=swap');`:""}
        .${PFX}-doc, .${PFX}-doc * { font-family: ${fnt} !important; }
        @media print {
          @page { size: A4 portrait; margin: 0; }
          *, *::before, *::after { -webkit-print-color-adjust:exact!important; print-color-adjust:exact!important; }
          body * { visibility:hidden!important; }
          .${PFX}-doc, .${PFX}-doc * { visibility:visible!important; }
          .${PFX}-doc { position:absolute!important; top:0!important; left:0!important; width:850px!important; min-height:1202px!important; overflow:visible!important; zoom:0.934!important; box-shadow:none!important; margin:0!important; }
          .${PFX}-zoom { zoom:1!important; width:100%!important; }
          .${PFX}-ctrl { display:none!important; }
        }
      `}</style>

      <div className={`${PFX}-ctrl`} style={{maxWidth:850,margin:"0 auto 16px",display:"flex",gap:8,flexWrap:"wrap"}}>
        <button onClick={()=>setEditing(e=>!e)} style={{display:"flex",alignItems:"center",gap:6,padding:"7px 16px",borderRadius:3,fontSize:13,fontWeight:600,cursor:"pointer",border:`1px solid ${editing?"#16a34a":A}`,backgroundColor:editing?"#16a34a":"white",color:editing?"white":A}}>
          {editing?<CheckIcon style={{width:16,height:16}}/>:<PencilSquareIcon style={{width:16,height:16}}/>}{editing?"Fertig":"Bearbeiten"}
        </button>
        <button onClick={()=>window.print()} style={{padding:"7px 16px",borderRadius:3,fontSize:13,fontWeight:600,cursor:"pointer",border:`1px solid ${A}`,backgroundColor:"white",color:A,display:"flex",alignItems:"center",gap:6}}>
          <PrinterIcon style={{width:16,height:16}}/>Drucken
        </button>
        <button onClick={()=>setShowDesign(v=>!v)} style={{padding:"7px 16px",borderRadius:3,fontSize:13,fontWeight:600,cursor:"pointer",border:`1px solid ${showDesign?A:"#ccc"}`,backgroundColor:"white",color:showDesign?A:"#777"}}>
          🎨 Design
        </button>
        <button onClick={()=>{resetStorage();setData(JSON.parse(JSON.stringify(DEFAULT_CV_DATA)));setPhotoSrc("");setFontKey("nunito");setSizeKey("md");setPhotoShapeKey("circle");setClrs(DEFAULT_COLORS);setShowDesign(false);}} style={{padding:"7px 16px",borderRadius:3,fontSize:13,fontWeight:600,cursor:"pointer",border:"1px solid #ccc",backgroundColor:"white",color:"#aaa",display:"flex",alignItems:"center",gap:6}}>
          <XMarkIcon style={{width:16,height:16}}/>Reset
        </button>
        {showDesign&&(
          <div style={{width:"100%",background:"white",border:"1px solid #e5e8ed",borderRadius:4,padding:"14px 18px",display:"flex",gap:24,flexWrap:"wrap"}}>
            <div><div style={{fontSize:10,fontWeight:700,color:CM,marginBottom:7,letterSpacing:"0.12em",textTransform:"uppercase"}}>Schriftart</div><div style={{display:"flex",gap:5,flexWrap:"wrap"}}>{FONTS.map(f=><button key={f.key} onClick={()=>setFontKey(f.key)} style={{padding:"3px 9px",borderRadius:3,border:`1px solid ${fontKey===f.key?A:"#ddd"}`,background:fontKey===f.key?hex2rgba(A,0.06):"transparent",color:fontKey===f.key?A:CM,fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:f.family}}>{f.label}</button>)}</div></div>
            <div><div style={{fontSize:10,fontWeight:700,color:CM,marginBottom:7,letterSpacing:"0.12em",textTransform:"uppercase"}}>Schriftgröße</div><div style={{display:"flex",gap:5}}>{FONT_SIZES.map(s=><button key={s.key} onClick={()=>setSizeKey(s.key)} style={{padding:"3px 12px",borderRadius:3,border:`1px solid ${sizeKey===s.key?A:"#ddd"}`,background:sizeKey===s.key?hex2rgba(A,0.06):"transparent",color:sizeKey===s.key?A:CM,fontSize:11,fontWeight:600,cursor:"pointer"}}>{s.label}</button>)}</div></div>
            <div><div style={{fontSize:10,fontWeight:700,color:CM,marginBottom:7,letterSpacing:"0.12em",textTransform:"uppercase"}}>Foto-Form</div><div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{PHOTO_SHAPES.map(s=><button key={s.key} onClick={()=>setPhotoShapeKey(s.key)} title={s.label} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3,padding:"5px 7px",borderRadius:3,border:`1px solid ${photoShapeKey===s.key?A:"#ddd"}`,background:photoShapeKey===s.key?hex2rgba(A,0.05):"transparent",cursor:"pointer"}}><div style={{width:20,height:s.key==="ellipse"?26:20,borderRadius:s.br,clipPath:s.clip??"",backgroundColor:photoShapeKey===s.key?A:S3}}/><span style={{fontSize:8,color:photoShapeKey===s.key?A:CM,whiteSpace:"nowrap"}}>{s.label}</span></button>)}</div></div>
            <div><div style={{fontSize:10,fontWeight:700,color:CM,marginBottom:7,letterSpacing:"0.12em",textTransform:"uppercase"}}>Farben</div><div style={{display:"flex",gap:10,flexWrap:"wrap",alignItems:"flex-end"}}>{([{k:"A" as const,l:"Akzent"},{k:"BG" as const,l:"Hintergrund"},{k:"S2" as const,l:"Header"},{k:"S3" as const,l:"Karte"},{k:"SBG" as const,l:"Sidebar"},{k:"CT" as const,l:"Titel"},{k:"CB" as const,l:"Text"},{k:"CM" as const,l:"Gedimmt"}]).map(({k,l})=>(<label key={k} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3,cursor:"pointer"}}><input type="color" value={clrs[k]} onChange={e=>setClrs(c=>({...c,[k]:e.target.value}))} style={{width:32,height:32,padding:2,borderRadius:3,border:"1px solid #ddd",cursor:"pointer",background:"none"}}/><span style={{fontSize:9,color:CM,fontWeight:600}}>{l}</span></label>))}<button onClick={()=>setClrs(DEFAULT_COLORS)} style={{padding:"4px 10px",borderRadius:3,fontSize:11,fontWeight:600,border:"1px solid #ddd",background:"transparent",color:CM,cursor:"pointer",alignSelf:"center"}}>↺ Reset</button></div></div>
          </div>
        )}
      </div>

      <div className={`${PFX}-doc`} style={{width:850, minHeight: 1202,margin:"0 auto",backgroundColor:BG,boxShadow:"0 1px 8px rgba(0,0,0,0.08)",overflow: "visible",fontFamily:fnt}}>
        <div className={`${PFX}-zoom`} style={{width:Math.round(850/scale),zoom:scale}}>
          {/* Header */}
          <div style={{background:S2,padding:"36px 48px 28px",borderBottom:`1px solid ${S3}`}}>
            <div style={{display:"flex",gap:28,alignItems:"flex-start"}}>
              <div style={{width:curShape.w,height:curShape.h,borderRadius:curShape.br,clipPath:curShape.clip??"",overflow:"hidden",flexShrink:0,backgroundColor:S3,border:`1px solid ${S3}`,display:"flex",alignItems:"center",justifyContent:"center",cursor:editing?"pointer":"default"}} onClick={()=>editing&&photoInputRef.current?.click()}>
                {photoSrc?<img src={photoSrc} alt="Foto" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<span style={{fontSize:10,color:CM,textAlign:"center"}}>{editing?"📷":"Foto"}</span>}
                <input ref={photoInputRef} type="file" accept="image/*" style={{display:"none"}} onChange={e=>{const f=e.target.files?.[0];if(!f)return;const r=new FileReader();r.onload=ev=>setPhotoSrc((ev.target?.result as string)??"");r.readAsDataURL(f);}}/>
              </div>
              <div style={{flex:1}}>
                {editing?<input value={data.personal.name} onChange={e=>setP({name:e.target.value})} style={{display:"block",fontSize:36,fontWeight:700,color:CT,lineHeight:1.1,marginBottom:4,fontFamily:fnt,background:hex2rgba(A,0.05),border:`1px solid ${hex2rgba(A,0.3)}`,borderRadius:3,padding:"2px 6px",outline:"none",width:"100%",boxSizing:"border-box"}}/>
                  :<div style={{fontSize:36,fontWeight:700,color:CT,lineHeight:1.1,marginBottom:4}}>{data.personal.name}</div>}
                {editing?<input value={data.personal.subtitle} onChange={e=>setP({subtitle:e.target.value})} style={{display:"block",fontSize:13,color:A,fontWeight:600,marginBottom:10,letterSpacing:"0.04em",fontFamily:fnt,background:hex2rgba(A,0.04),border:`1px solid ${hex2rgba(A,0.25)}`,borderRadius:3,padding:"2px 6px",outline:"none",width:"100%",boxSizing:"border-box"}}/>
                  :<div style={{fontSize:13,color:A,fontWeight:600,marginBottom:10,letterSpacing:"0.04em"}}>{data.personal.subtitle}</div>}
                <E value={data.personal.bio} onChange={v=>setP({bio:v})} editing={editing} multiline rows={2} style={{fontSize:11,color:CM,lineHeight:1.7}}/>
                <div style={{display:"flex",flexWrap:"wrap",gap:14,marginTop:12}}>
                  {(["email","phone","location","github","linkedin","website"] as const).map(k=>
                    data.personal[k]||editing
                    ?editing
                      ?<input key={k} value={data.personal[k]??""} onChange={e=>setP({[k]:e.target.value} as Partial<CVData["personal"]>)} style={{fontSize:10,color:CM,background:hex2rgba(A,0.04),border:`1px solid ${hex2rgba(A,0.2)}`,borderRadius:2,padding:"2px 8px",outline:"none",fontFamily:"inherit"}}/>
                      :<span key={k} style={{fontSize:10,color:CM,letterSpacing:"0.02em"}}>{data.personal[k]}</span>
                    :null
                  )}
                </div>
              </div>
            </div>
          </div>

          <div style={{display:"flex"}}>
            <div style={{flex:1,padding:"28px 28px 48px 48px",minWidth:0}}>
              <div style={{marginBottom:26}}>
                <SecH title="Projekte"/>
                {data.projects.map(p=>(
                  <div key={p.id} style={{marginBottom:16,paddingBottom:14,borderBottom:`1px solid ${S3}`}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:2,gap:8}}>
                      <E value={p.title} onChange={v=>updProj(p.id,{title:v})} editing={editing} style={{fontSize:13,fontWeight:700,color:CT}}/>
                      <E value={p.period} onChange={v=>updProj(p.id,{period:v})} editing={editing} style={{fontSize:10,color:CM,flexShrink:0}}/>
                    </div>
                    <BulletList bullets={p.bullets} onChange={b=>updProj(p.id,{bullets:b})} editing={editing}/>
                    {editing&&<button type="button" onClick={()=>setData(d=>({...d,projects:d.projects.filter(x=>x.id!==p.id)}))} style={{fontSize:10,color:"#ef4444",background:"none",border:"none",cursor:"pointer",marginTop:3,display:"flex",alignItems:"center",gap:3}}><TrashIcon style={{width:10,height:10}}/>Entfernen</button>}
                  </div>
                ))}
                {editing&&<button type="button" onClick={()=>setData(d=>({...d,projects:[...d.projects,{id:uid(),title:"Neues Projekt",period:"",bullets:[],link:""}]}))} style={{fontSize:11,color:A,background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:4,fontWeight:600}}><PlusIcon style={{width:12,height:12}}/>Projekt hinzufügen</button>}
              </div>
              <div style={{marginBottom:26}}>
                <SecH title="Berufserfahrung"/>
                {data.experience.map(ex=>(
                  <div key={ex.id} style={{marginBottom:16,paddingBottom:14,borderBottom:`1px solid ${S3}`}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:2,gap:8,alignItems:"flex-start"}}>
                      <div>
                        <E value={ex.position} onChange={v=>updExp(ex.id,{position:v})} editing={editing} style={{fontSize:13,fontWeight:700,color:CT,display:"block",marginBottom:1}}/>
                        <E value={ex.company} onChange={v=>updExp(ex.id,{company:v})} editing={editing} style={{fontSize:12,color:A,fontWeight:600}}/>
                      </div>
                      <E value={ex.period} onChange={v=>updExp(ex.id,{period:v})} editing={editing} style={{fontSize:10,color:CM,fontStyle:"italic",flexShrink:0}}/>
                    </div>
                    <BulletList bullets={ex.bullets} onChange={b=>updExp(ex.id,{bullets:b})} editing={editing}/>
                    {editing&&<button type="button" onClick={()=>setData(d=>({...d,experience:d.experience.filter(x=>x.id!==ex.id)}))} style={{fontSize:10,color:"#ef4444",background:"none",border:"none",cursor:"pointer",marginTop:3,display:"flex",alignItems:"center",gap:3}}><TrashIcon style={{width:10,height:10}}/>Entfernen</button>}
                  </div>
                ))}
                {editing&&<button type="button" onClick={()=>setData(d=>({...d,experience:[...d.experience,{id:uid(),position:"Position",company:"Unternehmen",period:"",location:"",description:"",type:"",bullets:[],contact:""}]}))} style={{fontSize:11,color:A,background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:4,fontWeight:600}}><PlusIcon style={{width:12,height:12}}/>Erfahrung hinzufügen</button>}
              </div>
              <div>
                <SecH title="Ausbildung"/>
                {data.education.map(e=>(
                  <div key={e.id} style={{marginBottom:14,paddingBottom:12,borderBottom:`1px solid ${S3}`}}>
                    <E value={e.degree} onChange={v=>updEdu(e.id,{degree:v})} editing={editing} style={{fontSize:13,fontWeight:700,color:CT,display:"block",marginBottom:1}}/>
                    <E value={e.institution} onChange={v=>updEdu(e.id,{institution:v})} editing={editing} style={{fontSize:12,color:A,fontWeight:600,display:"block",marginBottom:2}}/>
                    <div style={{display:"flex",justifyContent:"space-between",gap:8}}>
                      <E value={e.period} onChange={v=>updEdu(e.id,{period:v})} editing={editing} style={{fontSize:10,color:CM,fontStyle:"italic"}}/>
                      <E value={e.location} onChange={v=>updEdu(e.id,{location:v})} editing={editing} style={{fontSize:10,color:CM,fontStyle:"italic"}}/>
                    </div>
                    {editing&&<button type="button" onClick={()=>setData(d=>({...d,education:d.education.filter(x=>x.id!==e.id)}))} style={{fontSize:10,color:"#ef4444",background:"none",border:"none",cursor:"pointer",marginTop:3,display:"flex",alignItems:"center",gap:3}}><TrashIcon style={{width:10,height:10}}/>Entfernen</button>}
                  </div>
                ))}
                {editing&&<button type="button" onClick={()=>setData(d=>({...d,education:[...d.education,{id:uid(),degree:"Abschluss",institution:"Institut",period:"",location:"",type:"",bullets:[]}]}))} style={{fontSize:11,color:A,background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:4,fontWeight:600}}><PlusIcon style={{width:12,height:12}}/>Ausbildung hinzufügen</button>}
              </div>
            </div>
            <div style={{width:250,flexShrink:0,backgroundColor:SBG,padding:"28px 20px 48px",borderLeft:`1px solid ${S3}`}}>
              {[
                {title:"Fähigkeiten",c:<TagList tags={data.skills} onChange={t=>setData(d=>({...d,skills:t}))} editing={editing}/>},
                {title:"Technisch",c:<div>{data.technicalSkills.map(ts=>(<div key={ts.id} style={{marginBottom:7}}><E value={ts.name} onChange={v=>setData(d=>({...d,technicalSkills:d.technicalSkills.map(t=>t.id===ts.id?{...t,name:v}:t)}))} editing={editing} style={{fontSize:12,fontWeight:700,color:CT,display:"block"}}/><E value={ts.description} onChange={v=>setData(d=>({...d,technicalSkills:d.technicalSkills.map(t=>t.id===ts.id?{...t,description:v}:t)}))} editing={editing} style={{fontSize:10,color:CM,display:"block"}}/>{editing&&<button type="button" onClick={()=>setData(d=>({...d,technicalSkills:d.technicalSkills.filter(t=>t.id!==ts.id)}))} style={{fontSize:10,color:"#ef4444",background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:2}}><XMarkIcon style={{width:10,height:10}}/>Entfernen</button>}</div>))}{editing&&<button type="button" onClick={()=>setData(d=>({...d,technicalSkills:[...d.technicalSkills,{id:uid(),name:"Technologie",description:"Beschreibung"}]}))} style={{fontSize:11,color:A,background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:4,fontWeight:600}}><PlusIcon style={{width:11,height:11}}/>Hinzufügen</button>}</div>},
                {title:"Soft Skills",c:<TagList tags={data.softSkills} onChange={t=>setData(d=>({...d,softSkills:t}))} editing={editing}/>},
                {title:"Referenzen",c:<div>{data.references.map(r=>(<div key={r.id} style={{marginBottom:7}}><E value={r.company} onChange={v=>setData(d=>({...d,references:d.references.map(x=>x.id===r.id?{...x,company:v}:x)}))} editing={editing} style={{fontSize:11,fontWeight:700,color:CT,display:"block"}}/><E value={r.person??""} onChange={v=>setData(d=>({...d,references:d.references.map(x=>x.id===r.id?{...x,person:v}:x)}))} editing={editing} style={{fontSize:10,fontStyle:"italic",color:CM,display:"block"}}/>{editing&&<button type="button" onClick={()=>setData(d=>({...d,references:d.references.filter(x=>x.id!==r.id)}))} style={{fontSize:10,color:"#ef4444",background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:2}}><XMarkIcon style={{width:10,height:10}}/>Entfernen</button>}</div>))}{editing&&<button type="button" onClick={()=>setData(d=>({...d,references:[...d.references,{id:uid(),company:"Unternehmen",person:""}]}))} style={{fontSize:11,color:A,background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:4,fontWeight:600}}><PlusIcon style={{width:11,height:11}}/>Hinzufügen</button>}</div>},
                {title:"Zertifikate",c:<div>{data.certificates.map(c=>(<div key={c.id} style={{marginBottom:7}}><E value={c.name} onChange={v=>setData(d=>({...d,certificates:d.certificates.map(x=>x.id===c.id?{...x,name:v}:x)}))} editing={editing} multiline rows={2} style={{fontSize:10,color:CB,display:"block",lineHeight:1.5}}/><E value={c.period} onChange={v=>setData(d=>({...d,certificates:d.certificates.map(x=>x.id===c.id?{...x,period:v}:x)}))} editing={editing} style={{fontSize:9,color:CM,display:"block"}}/>{editing&&<button type="button" onClick={()=>setData(d=>({...d,certificates:d.certificates.filter(x=>x.id!==c.id)}))} style={{fontSize:10,color:"#ef4444",background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:2}}><XMarkIcon style={{width:10,height:10}}/>Entfernen</button>}</div>))}{editing&&<button type="button" onClick={()=>setData(d=>({...d,certificates:[...d.certificates,{id:uid(),name:"Zertifikat",period:""}]}))} style={{fontSize:11,color:A,background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:4,fontWeight:600}}><PlusIcon style={{width:11,height:11}}/>Hinzufügen</button>}</div>},
                {title:"Sprachen",c:<div>{data.languages.map(l=>(<div key={l.id} style={{marginBottom:7}}><E value={l.language} onChange={v=>setData(d=>({...d,languages:d.languages.map(x=>x.id===l.id?{...x,language:v}:x)}))} editing={editing} style={{fontSize:12,fontWeight:700,color:CT,display:"block"}}/><E value={l.level} onChange={v=>setData(d=>({...d,languages:d.languages.map(x=>x.id===l.id?{...x,level:v}:x)}))} editing={editing} style={{fontSize:10,color:A,fontWeight:600,display:"block"}}/>{editing&&<button type="button" onClick={()=>setData(d=>({...d,languages:d.languages.filter(x=>x.id!==l.id)}))} style={{fontSize:10,color:"#ef4444",background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:2}}><XMarkIcon style={{width:10,height:10}}/>Entfernen</button>}</div>))}{editing&&<button type="button" onClick={()=>setData(d=>({...d,languages:[...d.languages,{id:uid(),language:"Sprache",level:"Niveau"}]}))} style={{fontSize:11,color:A,background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:4,fontWeight:600}}><PlusIcon style={{width:11,height:11}}/>Hinzufügen</button>}</div>},
                {title:"Interessen",c:<TagList tags={data.interests} onChange={t=>setData(d=>({...d,interests:t}))} editing={editing}/>},
              ].map(({title,c})=><div key={title} style={{marginBottom:20}}><SecH title={title}/>{c}</div>)}
            </div>
          </div>
          {/* Footer accent */}
          <div style={{height:3,backgroundColor:A}}/>
        </div>
      </div>
    </div>
  </ColCtx.Provider>
  );
}
