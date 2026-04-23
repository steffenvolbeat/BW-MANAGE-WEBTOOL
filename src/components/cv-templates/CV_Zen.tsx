"use client";
// ─── CV Template: Zen (Japanischer Minimalismus) ─────────────────────────────
import { useState, useRef, useContext, createContext } from "react";
import { PrinterIcon, PencilSquareIcon, CheckIcon, PlusIcon, TrashIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { FONTS, FONT_SIZES, PHOTO_SHAPES, CVData, DEFAULT_CV_DATA, uid } from "./shared";
import { useCVStorage } from "./useCV";

const DEFAULT_COLORS = { A:"#c62828", BG:"#fafaf7", S2:"#f2f2ef", S3:"#e8e8e4", SBG:"#f8f8f5", CT:"#1a1a1a", CB:"#333333", CM:"#999999" };
const hex2rgba=(hex:string,a:number)=>{const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);return `rgba(${r},${g},${b},${a})`;};
const ColCtx=createContext(DEFAULT_COLORS);
const PFX="czen";

function E({value,onChange,editing,multiline=false,style={} as React.CSSProperties,placeholder="...",rows=3}:{value:string;onChange:(v:string)=>void;editing:boolean;multiline?:boolean;style?:React.CSSProperties;placeholder?:string;rows?:number;}) {
  const {A}=useContext(ColCtx);
  const s:React.CSSProperties={...style,background:hex2rgba(A,0.04),border:`1px solid ${hex2rgba(A,0.25)}`,borderRadius:2,padding:"2px 5px",outline:"none",width:"100%",fontFamily:"inherit",fontSize:"inherit",color:"inherit",lineHeight:"inherit",fontWeight:"inherit",boxSizing:"border-box"};
  if(!editing)return <span style={style}>{value||<span style={{opacity:0.3,fontStyle:"italic"}}>{placeholder}</span>}</span>;
  if(multiline)return <textarea style={{...s,resize:"vertical",display:"block"}} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={rows}/>;
  return <input style={s} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}/>;
}
function BulletList({bullets,onChange,editing}:{bullets:string[];onChange:(b:string[])=>void;editing:boolean}) {
  const {A,CB}=useContext(ColCtx);
  return(<ul style={{listStyle:"none",margin:0,padding:0}}>{bullets.map((b,i)=>(<li key={i} style={{display:"flex",alignItems:"flex-start",gap:10,marginBottom:4}}><span style={{width:1,height:14,backgroundColor:A,marginTop:3,flexShrink:0}}/>{editing?(<div style={{flex:1,display:"flex",gap:4}}><input value={b} onChange={e=>{const n=[...bullets];n[i]=e.target.value;onChange(n);}} style={{flex:1,fontSize:11,color:CB,background:hex2rgba(A,0.03),border:`1px solid ${hex2rgba(A,0.2)}`,borderRadius:2,padding:"1px 4px",outline:"none",fontFamily:"inherit"}}/><button type="button" onClick={()=>onChange(bullets.filter((_,idx)=>idx!==i))} style={{background:"none",border:"none",cursor:"pointer",color:"#ef4444",padding:0,display:"flex"}}><XMarkIcon style={{width:11,height:11}}/></button></div>):<span style={{fontSize:11,color:CB,lineHeight:1.8}}>{b}</span>}</li>))}{editing&&<li><button type="button" onClick={()=>onChange([...bullets,""])} style={{display:"flex",alignItems:"center",gap:4,fontSize:11,color:A,background:"none",border:"none",cursor:"pointer",padding:"3px 0",fontFamily:"inherit"}}><PlusIcon style={{width:11,height:11}}/>Hinzufügen</button></li>}</ul>);
}
function TagList({tags,onChange,editing}:{tags:string[];onChange:(t:string[])=>void;editing:boolean}) {
  const {A,CB,S3}=useContext(ColCtx);
  const [nv,setNv]=useState("");
  return(<div style={{display:"flex",flexWrap:"wrap",gap:5}}>{tags.map((t,i)=>(<div key={i} style={{background:S3,color:CB,borderRadius:2,padding:"3px 10px",fontSize:10,display:"flex",alignItems:"center",gap:3,borderLeft:`2px solid ${A}`}}>{t}{editing&&<button type="button" onClick={()=>onChange(tags.filter((_,idx)=>idx!==i))} style={{background:"none",border:"none",cursor:"pointer",color:"#ef4444",padding:0,display:"flex"}}><XMarkIcon style={{width:9,height:9}}/></button>}</div>))}{editing&&<input value={nv} onChange={e=>setNv(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&nv.trim()){onChange([...tags,nv.trim()]);setNv("");}}} style={{width:70,fontSize:10,border:`1px solid ${hex2rgba(A,0.25)}`,borderRadius:2,padding:"2px 8px",background:"transparent",outline:"none",color:CB,fontFamily:"inherit"}} placeholder="+ Neu"/>}</div>);
}
function SecH({title}:{title:string}) {
  const {A,CT}=useContext(ColCtx);
  return(<div style={{marginBottom:14,display:"flex",alignItems:"center",gap:16}}><div style={{width:20,height:1,backgroundColor:A}}/><span style={{fontSize:9,fontWeight:600,letterSpacing:"0.22em",textTransform:"uppercase" as const,color:CT}}>{title}</span><div style={{flex:1,height:1,backgroundColor:hex2rgba(A,0.15)}}/></div>);
}

export default function CV_Zen() {
  const {data,setData,fontKey,setFontKey,sizeKey,setSizeKey,photoShapeKey,setPhotoShapeKey,photoSrc,setPhotoSrc,clrs,setClrs,resetStorage}=useCVStorage("zen",DEFAULT_COLORS);
  const [editing,setEditing]=useState(false);
  const [showDesign,setShowDesign]=useState(false);
  const {A,BG,S2,S3,SBG,CT,CB,CM}=clrs;
  const curFont=FONTS.find(f=>f.key===fontKey)??FONTS[4];
  const curSize=FONT_SIZES.find(s=>s.key===sizeKey)??FONT_SIZES[2];
  const curShape=PHOTO_SHAPES.find(s=>s.key===photoShapeKey)??PHOTO_SHAPES[4];
  const fnt=curFont.family;const scale=curSize.scale;
  const photoInputRef=useRef<HTMLInputElement>(null);
  const setP=(p:Partial<CVData["personal"]>)=>setData(d=>({...d,personal:{...d.personal,...p}}));
  const updProj=(id:string,p:Partial<typeof data.projects[0]>)=>setData(d=>({...d,projects:d.projects.map(x=>x.id===id?{...x,...p}:x)}));
  const updEdu=(id:string,p:Partial<typeof data.education[0]>)=>setData(d=>({...d,education:d.education.map(x=>x.id===id?{...x,...p}:x)}));
  const updExp=(id:string,p:Partial<typeof data.experience[0]>)=>setData(d=>({...d,experience:d.experience.map(x=>x.id===id?{...x,...p}:x)}));

  return(
  <ColCtx.Provider value={clrs}>
    <div style={{minHeight:"100vh",background:"#e8e8e4",padding:"24px 16px",fontFamily:fnt}}>
      <style>{`
        ${curFont.gf?`@import url('https://fonts.googleapis.com/css2?family=${curFont.gf}&display=swap');`:""}
        .${PFX}-doc,.${PFX}-doc *{font-family:${fnt}!important;}
        @media print{
          @page{size:A4 portrait;margin:0;}
          *,*::before,*::after{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;}
          body *{visibility:hidden!important;}
          .${PFX}-doc,.${PFX}-doc *{visibility:visible!important;}
          .${PFX}-doc{position:absolute!important;top:0!important;left:0!important;width:850px!important;min-height:1202px!important;max-height:1202px!important;overflow:hidden!important;zoom:0.934!important;box-shadow:none!important;margin:0!important;}
          .${PFX}-zoom{zoom:1!important;width:100%!important;}
          .${PFX}-ctrl{display:none!important;}
        }
      `}</style>
      <div className={`${PFX}-ctrl`} style={{maxWidth:850,margin:"0 auto 16px",display:"flex",gap:8,flexWrap:"wrap"}}>
        <button onClick={()=>setEditing(e=>!e)} style={{display:"flex",alignItems:"center",gap:6,padding:"7px 16px",borderRadius:2,fontSize:13,fontWeight:600,cursor:"pointer",border:`1px solid ${editing?"#16a34a":A}`,backgroundColor:editing?"#16a34a":"transparent",color:editing?"white":A}}>{editing?<CheckIcon style={{width:16,height:16}}/>:<PencilSquareIcon style={{width:16,height:16}}/>}{editing?"Fertig":"Bearbeiten"}</button>
        <button onClick={()=>window.print()} style={{padding:"7px 16px",borderRadius:2,fontSize:13,fontWeight:600,cursor:"pointer",border:`1px solid ${CT}`,backgroundColor:"transparent",color:CT,display:"flex",alignItems:"center",gap:6}}><PrinterIcon style={{width:16,height:16}}/>Drucken</button>
        <button onClick={()=>setShowDesign(v=>!v)} style={{padding:"7px 16px",borderRadius:2,fontSize:13,cursor:"pointer",border:`1px solid ${showDesign?A:"#ccc"}`,backgroundColor:"transparent",color:showDesign?A:CM}}>🎨 Design</button>
        <button onClick={()=>{resetStorage();setData(JSON.parse(JSON.stringify(DEFAULT_CV_DATA)));setPhotoSrc("");setFontKey("inter");setSizeKey("md");setPhotoShapeKey("circle");setClrs(DEFAULT_COLORS);setShowDesign(false);}} style={{padding:"7px 16px",borderRadius:2,fontSize:13,cursor:"pointer",border:"1px solid #ccc",backgroundColor:"transparent",color:CM,display:"flex",alignItems:"center",gap:6}}><XMarkIcon style={{width:16,height:16}}/>Reset</button>
        {showDesign&&(<div style={{width:"100%",background:BG,border:`1px solid ${S3}`,borderRadius:4,padding:"14px 18px",display:"flex",gap:24,flexWrap:"wrap"}}>
          <div><div style={{fontSize:9,fontWeight:600,color:CM,marginBottom:7,letterSpacing:"0.2em",textTransform:"uppercase"}}>Schriftart</div><div style={{display:"flex",gap:5,flexWrap:"wrap"}}>{FONTS.map(f=><button key={f.key} onClick={()=>setFontKey(f.key)} style={{padding:"3px 9px",borderRadius:2,border:`1px solid ${fontKey===f.key?A:"#ddd"}`,background:fontKey===f.key?hex2rgba(A,0.05):"transparent",color:fontKey===f.key?A:CM,fontSize:11,cursor:"pointer",fontFamily:f.family}}>{f.label}</button>)}</div></div>
          <div><div style={{fontSize:9,fontWeight:600,color:CM,marginBottom:7,letterSpacing:"0.2em",textTransform:"uppercase"}}>Schriftgröße</div><div style={{display:"flex",gap:5}}>{FONT_SIZES.map(s=><button key={s.key} onClick={()=>setSizeKey(s.key)} style={{padding:"3px 12px",borderRadius:2,border:`1px solid ${sizeKey===s.key?A:"#ddd"}`,background:sizeKey===s.key?hex2rgba(A,0.05):"transparent",color:sizeKey===s.key?A:CM,fontSize:11,cursor:"pointer"}}>{s.label}</button>)}</div></div>
          <div><div style={{fontSize:9,fontWeight:600,color:CM,marginBottom:7,letterSpacing:"0.2em",textTransform:"uppercase"}}>Foto-Form</div><div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{PHOTO_SHAPES.map(s=><button key={s.key} onClick={()=>setPhotoShapeKey(s.key)} title={s.label} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3,padding:"5px 7px",borderRadius:2,border:`1px solid ${photoShapeKey===s.key?A:"#ddd"}`,background:photoShapeKey===s.key?hex2rgba(A,0.04):"transparent",cursor:"pointer"}}><div style={{width:20,height:s.key==="ellipse"?26:20,borderRadius:s.br,clipPath:s.clip??"",backgroundColor:photoShapeKey===s.key?A:S3}}/><span style={{fontSize:8,color:photoShapeKey===s.key?A:CM,whiteSpace:"nowrap"}}>{s.label}</span></button>)}</div></div>
          <div><div style={{fontSize:9,fontWeight:600,color:CM,marginBottom:7,letterSpacing:"0.2em",textTransform:"uppercase"}}>Farben</div><div style={{display:"flex",gap:10,flexWrap:"wrap",alignItems:"flex-end"}}>{([{k:"A" as const,l:"Akzent"},{k:"BG" as const,l:"BG"},{k:"S2" as const,l:"Header"},{k:"S3" as const,l:"Karte"},{k:"SBG" as const,l:"Sidebar"},{k:"CT" as const,l:"Titel"},{k:"CB" as const,l:"Text"},{k:"CM" as const,l:"Meta"}]).map(({k,l})=>(<label key={k} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3,cursor:"pointer"}}><input type="color" value={clrs[k]} onChange={e=>setClrs(c=>({...c,[k]:e.target.value}))} style={{width:32,height:32,padding:2,borderRadius:2,border:"1px solid #ddd",cursor:"pointer",background:"none"}}/><span style={{fontSize:9,color:CM}}>{l}</span></label>))}<button onClick={()=>setClrs(DEFAULT_COLORS)} style={{padding:"4px 10px",borderRadius:2,fontSize:11,border:"1px solid #ddd",background:"transparent",color:CM,cursor:"pointer",alignSelf:"center"}}>↺ Reset</button></div></div>
        </div>)}
      </div>

      <div className={`${PFX}-doc`} style={{width:850, minHeight: 1202,margin:"0 auto",backgroundColor:BG,boxShadow:"0 1px 12px rgba(0,0,0,0.07)",fontFamily:fnt,overflow: "visible",borderLeft:`6px solid ${A}`}}>
        <div className={`${PFX}-zoom`} style={{width:Math.round(850/scale),zoom:scale}}>
          {/* Zen header – spacious, minimal */}
          <div style={{backgroundColor:S2,padding:"52px 64px 40px"}}>
            <div style={{display:"flex",gap:32,alignItems:"flex-start"}}>
              <div style={{width:curShape.w,height:curShape.h,borderRadius:curShape.br,clipPath:curShape.clip??"",overflow:"hidden",flexShrink:0,backgroundColor:S3,display:"flex",alignItems:"center",justifyContent:"center",cursor:editing?"pointer":"default"}} onClick={()=>editing&&photoInputRef.current?.click()}>
                {photoSrc?<img src={photoSrc} alt="Foto" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<span style={{fontSize:10,color:CM,textAlign:"center"}}>{editing?"📷":"Foto"}</span>}
                <input ref={photoInputRef} type="file" accept="image/*" style={{display:"none"}} onChange={e=>{const f=e.target.files?.[0];if(!f)return;const r=new FileReader();r.onload=ev=>setPhotoSrc((ev.target?.result as string)??"");r.readAsDataURL(f);}}/>
              </div>
              <div style={{flex:1}}>
                {editing?<input value={data.personal.name} onChange={e=>setP({name:e.target.value})} style={{display:"block",fontSize:44,fontWeight:300,color:CT,lineHeight:1,marginBottom:8,fontFamily:fnt,background:hex2rgba(A,0.04),border:`1px solid ${hex2rgba(A,0.2)}`,padding:"2px 6px",outline:"none",width:"100%",boxSizing:"border-box"}}/>:<div style={{fontSize:44,fontWeight:300,color:CT,lineHeight:1,marginBottom:8,letterSpacing:"-0.01em"}}>{data.personal.name}</div>}
                <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16}}>
                  <div style={{width:32,height:2,backgroundColor:A}}/>
                  {editing?<input value={data.personal.subtitle} onChange={e=>setP({subtitle:e.target.value})} style={{flex:1,fontSize:12,color:CM,letterSpacing:"0.1em",fontFamily:fnt,background:hex2rgba(A,0.03),border:`1px solid ${hex2rgba(A,0.15)}`,padding:"1px 4px",outline:"none"}}/>:<span style={{fontSize:12,color:CM,letterSpacing:"0.1em",textTransform:"uppercase"}}>{data.personal.subtitle}</span>}
                </div>
                <E value={data.personal.bio} onChange={v=>setP({bio:v})} editing={editing} multiline rows={2} style={{fontSize:12,color:CB,lineHeight:1.9}}/>
                <div style={{display:"flex",flexWrap:"wrap",gap:18,marginTop:16}}>
                  {(["email","phone","location","github","linkedin"] as const).map(k=>data.personal[k]||editing?editing?<input key={k} value={data.personal[k]??""} onChange={e=>setP({[k]:e.target.value} as Partial<CVData["personal"]>)} style={{fontSize:11,color:CM,background:hex2rgba(A,0.03),border:`1px solid ${hex2rgba(A,0.15)}`,padding:"2px 8px",outline:"none",fontFamily:"inherit"}}/>:<span key={k} style={{fontSize:11,color:CM}}>{data.personal[k]}</span>:null)}
                </div>
              </div>
            </div>
          </div>
          <div style={{height:1,backgroundColor:hex2rgba(A,0.2),margin:"0 64px"}}/>
          <div style={{display:"flex"}}>
            <div style={{flex:1,padding:"32px 32px 48px 64px",minWidth:0}}>
              <div style={{marginBottom:28}}><SecH title="Projekte"/>
                {data.projects.map(p=>(<div key={p.id} style={{marginBottom:18,paddingBottom:16,borderBottom:`1px solid ${S3}`}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:4,gap:8}}><E value={p.title} onChange={v=>updProj(p.id,{title:v})} editing={editing} style={{fontSize:13,fontWeight:600,color:CT}}/><E value={p.period} onChange={v=>updProj(p.id,{period:v})} editing={editing} style={{fontSize:10,color:CM,flexShrink:0}}/></div><BulletList bullets={p.bullets} onChange={b=>updProj(p.id,{bullets:b})} editing={editing}/>{editing&&<button type="button" onClick={()=>setData(d=>({...d,projects:d.projects.filter(x=>x.id!==p.id)}))} style={{fontSize:10,color:"#ef4444",background:"none",border:"none",cursor:"pointer",marginTop:3,display:"flex",alignItems:"center",gap:3}}><TrashIcon style={{width:10,height:10}}/>Entfernen</button>}</div>))}
                {editing&&<button type="button" onClick={()=>setData(d=>({...d,projects:[...d.projects,{id:uid(),title:"Neues Projekt",period:"",bullets:[],link:""}]}))} style={{fontSize:11,color:A,background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:4}}><PlusIcon style={{width:12,height:12}}/>Projekt hinzufügen</button>}
              </div>
              <div style={{marginBottom:28}}><SecH title="Berufserfahrung"/>
                {data.experience.map(ex=>(<div key={ex.id} style={{marginBottom:18,paddingBottom:16,borderBottom:`1px solid ${S3}`}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:3,gap:8,alignItems:"flex-start"}}><div><E value={ex.position} onChange={v=>updExp(ex.id,{position:v})} editing={editing} style={{fontSize:13,fontWeight:600,color:CT,display:"block",marginBottom:1}}/><E value={ex.company} onChange={v=>updExp(ex.id,{company:v})} editing={editing} style={{fontSize:12,color:A}}/></div><E value={ex.period} onChange={v=>updExp(ex.id,{period:v})} editing={editing} style={{fontSize:10,color:CM,flexShrink:0}}/></div><BulletList bullets={ex.bullets} onChange={b=>updExp(ex.id,{bullets:b})} editing={editing}/>{editing&&<button type="button" onClick={()=>setData(d=>({...d,experience:d.experience.filter(x=>x.id!==ex.id)}))} style={{fontSize:10,color:"#ef4444",background:"none",border:"none",cursor:"pointer",marginTop:3,display:"flex",alignItems:"center",gap:3}}><TrashIcon style={{width:10,height:10}}/>Entfernen</button>}</div>))}
                {editing&&<button type="button" onClick={()=>setData(d=>({...d,experience:[...d.experience,{id:uid(),position:"Position",company:"Unternehmen",period:"",location:"",description:"",type:"",bullets:[],contact:""}]}))} style={{fontSize:11,color:A,background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:4}}><PlusIcon style={{width:12,height:12}}/>Erfahrung hinzufügen</button>}
              </div>
              <div><SecH title="Ausbildung"/>
                {data.education.map(e=>(<div key={e.id} style={{marginBottom:16,paddingBottom:14,borderBottom:`1px solid ${S3}`}}><E value={e.degree} onChange={v=>updEdu(e.id,{degree:v})} editing={editing} style={{fontSize:13,fontWeight:600,color:CT,display:"block",marginBottom:1}}/><E value={e.institution} onChange={v=>updEdu(e.id,{institution:v})} editing={editing} style={{fontSize:12,color:A,display:"block",marginBottom:2}}/><div style={{display:"flex",justifyContent:"space-between",gap:8}}><E value={e.period} onChange={v=>updEdu(e.id,{period:v})} editing={editing} style={{fontSize:10,color:CM}}/><E value={e.location} onChange={v=>updEdu(e.id,{location:v})} editing={editing} style={{fontSize:10,color:CM}}/></div>{editing&&<button type="button" onClick={()=>setData(d=>({...d,education:d.education.filter(x=>x.id!==e.id)}))} style={{fontSize:10,color:"#ef4444",background:"none",border:"none",cursor:"pointer",marginTop:3,display:"flex",alignItems:"center",gap:3}}><TrashIcon style={{width:10,height:10}}/>Entfernen</button>}</div>))}
                {editing&&<button type="button" onClick={()=>setData(d=>({...d,education:[...d.education,{id:uid(),degree:"Abschluss",institution:"Institut",period:"",location:"",type:"",bullets:[]}]}))} style={{fontSize:11,color:A,background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:4}}><PlusIcon style={{width:12,height:12}}/>Ausbildung hinzufügen</button>}
              </div>
            </div>
            <div style={{width:230,flexShrink:0,backgroundColor:SBG,padding:"32px 20px 48px",borderLeft:`1px solid ${S3}`}}>
              {[
                {title:"Fähigkeiten",c:<TagList tags={data.skills} onChange={t=>setData(d=>({...d,skills:t}))} editing={editing}/>},
                {title:"Technisch",c:<div>{data.technicalSkills.map(ts=>(<div key={ts.id} style={{marginBottom:8}}><E value={ts.name} onChange={v=>setData(d=>({...d,technicalSkills:d.technicalSkills.map(t=>t.id===ts.id?{...t,name:v}:t)}))} editing={editing} style={{fontSize:12,fontWeight:600,color:CT,display:"block"}}/><E value={ts.description} onChange={v=>setData(d=>({...d,technicalSkills:d.technicalSkills.map(t=>t.id===ts.id?{...t,description:v}:t)}))} editing={editing} style={{fontSize:10,color:CM,display:"block"}}/>{editing&&<button type="button" onClick={()=>setData(d=>({...d,technicalSkills:d.technicalSkills.filter(t=>t.id!==ts.id)}))} style={{fontSize:10,color:"#ef4444",background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:2}}><XMarkIcon style={{width:10,height:10}}/>Entfernen</button>}</div>))}{editing&&<button type="button" onClick={()=>setData(d=>({...d,technicalSkills:[...d.technicalSkills,{id:uid(),name:"Technologie",description:"Beschreibung"}]}))} style={{fontSize:11,color:A,background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:4}}><PlusIcon style={{width:11,height:11}}/>Hinzufügen</button>}</div>},
                {title:"Soft Skills",c:<TagList tags={data.softSkills} onChange={t=>setData(d=>({...d,softSkills:t}))} editing={editing}/>},
                {title:"Sprachen",c:<div>{data.languages.map(l=>(<div key={l.id} style={{marginBottom:8}}><E value={l.language} onChange={v=>setData(d=>({...d,languages:d.languages.map(x=>x.id===l.id?{...x,language:v}:x)}))} editing={editing} style={{fontSize:12,fontWeight:600,color:CT,display:"block"}}/><E value={l.level} onChange={v=>setData(d=>({...d,languages:d.languages.map(x=>x.id===l.id?{...x,level:v}:x)}))} editing={editing} style={{fontSize:10,color:A,display:"block"}}/>{editing&&<button type="button" onClick={()=>setData(d=>({...d,languages:d.languages.filter(x=>x.id!==l.id)}))} style={{fontSize:10,color:"#ef4444",background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:2}}><XMarkIcon style={{width:10,height:10}}/>Entfernen</button>}</div>))}{editing&&<button type="button" onClick={()=>setData(d=>({...d,languages:[...d.languages,{id:uid(),language:"Sprache",level:"Niveau"}]}))} style={{fontSize:11,color:A,background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:4}}><PlusIcon style={{width:11,height:11}}/>Hinzufügen</button>}</div>},
                {title:"Zertifikate",c:<div>{data.certificates.map(c=>(<div key={c.id} style={{marginBottom:7}}><E value={c.name} onChange={v=>setData(d=>({...d,certificates:d.certificates.map(x=>x.id===c.id?{...x,name:v}:x)}))} editing={editing} multiline rows={2} style={{fontSize:10,color:CB,display:"block",lineHeight:1.5}}/><E value={c.period} onChange={v=>setData(d=>({...d,certificates:d.certificates.map(x=>x.id===c.id?{...x,period:v}:x)}))} editing={editing} style={{fontSize:9,color:CM,display:"block"}}/>{editing&&<button type="button" onClick={()=>setData(d=>({...d,certificates:d.certificates.filter(x=>x.id!==c.id)}))} style={{fontSize:10,color:"#ef4444",background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:2}}><XMarkIcon style={{width:10,height:10}}/>Entfernen</button>}</div>))}{editing&&<button type="button" onClick={()=>setData(d=>({...d,certificates:[...d.certificates,{id:uid(),name:"Zertifikat",period:""}]}))} style={{fontSize:11,color:A,background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:4}}><PlusIcon style={{width:11,height:11}}/>Hinzufügen</button>}</div>},
                {title:"Referenzen",c:<div>{data.references.map(r=>(<div key={r.id} style={{marginBottom:7}}><E value={r.company} onChange={v=>setData(d=>({...d,references:d.references.map(x=>x.id===r.id?{...x,company:v}:x)}))} editing={editing} style={{fontSize:11,fontWeight:600,color:CT,display:"block"}}/><E value={r.person??""} onChange={v=>setData(d=>({...d,references:d.references.map(x=>x.id===r.id?{...x,person:v}:x)}))} editing={editing} style={{fontSize:10,fontStyle:"italic",color:CM,display:"block"}}/>{editing&&<button type="button" onClick={()=>setData(d=>({...d,references:d.references.filter(x=>x.id!==r.id)}))} style={{fontSize:10,color:"#ef4444",background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:2}}><XMarkIcon style={{width:10,height:10}}/>Entfernen</button>}</div>))}{editing&&<button type="button" onClick={()=>setData(d=>({...d,references:[...d.references,{id:uid(),company:"Unternehmen",person:""}]}))} style={{fontSize:11,color:A,background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:4}}><PlusIcon style={{width:11,height:11}}/>Hinzufügen</button>}</div>},
                {title:"Interessen",c:<TagList tags={data.interests} onChange={t=>setData(d=>({...d,interests:t}))} editing={editing}/>},
              ].map(({title,c})=><div key={title} style={{marginBottom:22}}><SecH title={title}/>{c}</div>)}
            </div>
          </div>
          <div style={{height:6,backgroundColor:A}}/>
        </div>
      </div>
    </div>
  </ColCtx.Provider>
  );
}
