"use client";
// ─── CV Template: Circuit (Tech-Leiterplatten-Design) ────────────────────────
import { useState, useRef, useContext, createContext } from "react";
import { PrinterIcon, PencilSquareIcon, CheckIcon, PlusIcon, TrashIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { FONTS, FONT_SIZES, PHOTO_SHAPES, CVData, DEFAULT_CV_DATA, uid } from "./shared";
import { useCVStorage } from "./useCV";

const DEFAULT_COLORS = { A:"#76ff03", BG:"#0a1a08", S2:"#0d2010", S3:"#142b10", SBG:"#071205", CT:"#c8ff90", CB:"#90d060", CM:"#507030" };
const hex2rgba=(hex:string,a:number)=>{const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);return `rgba(${r},${g},${b},${a})`;};
const ColCtx=createContext(DEFAULT_COLORS);
const PFX="ccir";

function E({value,onChange,editing,multiline=false,style={} as React.CSSProperties,placeholder="...",rows=3}:{value:string;onChange:(v:string)=>void;editing:boolean;multiline?:boolean;style?:React.CSSProperties;placeholder?:string;rows?:number;}) {
  const {A}=useContext(ColCtx);
  const s:React.CSSProperties={...style,background:hex2rgba(A,0.06),border:`1px solid ${hex2rgba(A,0.3)}`,borderRadius:1,padding:"2px 6px",outline:"none",width:"100%",fontFamily:"inherit",fontSize:"inherit",color:"inherit",lineHeight:"inherit",fontWeight:"inherit",boxSizing:"border-box"};
  if(!editing)return <span style={style}>{value||<span style={{opacity:0.3,fontStyle:"italic"}}>{placeholder}</span>}</span>;
  if(multiline)return <textarea style={{...s,resize:"vertical",display:"block"}} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={rows}/>;
  return <input style={s} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}/>;
}
function BulletList({bullets,onChange,editing}:{bullets:string[];onChange:(b:string[])=>void;editing:boolean}) {
  const {A,CB}=useContext(ColCtx);
  return(<ul style={{listStyle:"none",margin:0,padding:0}}>{bullets.map((b,i)=>(<li key={i} style={{display:"flex",alignItems:"flex-start",gap:8,marginBottom:2}}><span style={{color:A,fontFamily:"monospace",fontSize:10,marginTop:2,flexShrink:0}}>{">"}</span>{editing?(<div style={{flex:1,display:"flex",gap:4}}><input value={b} onChange={e=>{const n=[...bullets];n[i]=e.target.value;onChange(n);}} style={{flex:1,fontSize:10,color:CB,background:hex2rgba(A,0.05),border:`1px solid ${hex2rgba(A,0.25)}`,borderRadius:1,padding:"1px 5px",outline:"none",fontFamily:"monospace"}}/><button type="button" onClick={()=>onChange(bullets.filter((_,idx)=>idx!==i))} style={{background:"none",border:"none",cursor:"pointer",color:"#ef4444",padding:0,display:"flex"}}><XMarkIcon style={{width:11,height:11}}/></button></div>):<span style={{fontSize:10,color:CB,lineHeight:1.8,fontFamily:"monospace"}}>{b}</span>}</li>))}{editing&&<li><button type="button" onClick={()=>onChange([...bullets,""])} style={{display:"flex",alignItems:"center",gap:4,fontSize:10,color:A,background:"none",border:"none",cursor:"pointer",padding:"3px 0",fontFamily:"monospace"}}><PlusIcon style={{width:11,height:11}}/>// Add</button></li>}</ul>);
}
function TagList({tags,onChange,editing}:{tags:string[];onChange:(t:string[])=>void;editing:boolean}) {
  const {A,S3}=useContext(ColCtx);
  const [nv,setNv]=useState("");
  return(<div style={{display:"flex",flexWrap:"wrap",gap:4}}>{tags.map((t,i)=>(<div key={i} style={{background:S3,color:A,border:`1px solid ${hex2rgba(A,0.4)}`,borderRadius:1,padding:"2px 8px",fontSize:9,fontFamily:"monospace",display:"flex",alignItems:"center",gap:3}}>{t}{editing&&<button type="button" onClick={()=>onChange(tags.filter((_,idx)=>idx!==i))} style={{background:"none",border:"none",cursor:"pointer",color:"#ef4444",padding:0,display:"flex"}}><XMarkIcon style={{width:9,height:9}}/></button>}</div>))}{editing&&<input value={nv} onChange={e=>setNv(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&nv.trim()){onChange([...tags,nv.trim()]);setNv("");}}} style={{width:70,fontSize:9,border:`1px solid ${hex2rgba(A,0.3)}`,borderRadius:1,padding:"2px 8px",background:"transparent",outline:"none",color:A,fontFamily:"monospace"}} placeholder="+ pkg"/>}</div>);
}
function SecH({title}:{title:string}) {
  const {A,CT}=useContext(ColCtx);
  return(<div style={{marginBottom:10}}><div style={{display:"flex",alignItems:"center",gap:6}}><span style={{color:A,fontFamily:"monospace",fontSize:11}}>{"//"}</span><span style={{fontSize:9,fontWeight:700,letterSpacing:"0.2em",textTransform:"uppercase" as const,color:CT,fontFamily:"monospace"}}>{title.toLowerCase()}</span></div><div style={{height:1,background:`linear-gradient(90deg,${hex2rgba(A,0.6)},transparent)`,marginTop:4}}/></div>);
}

export default function CV_Circuit() {
  const {data,setData,fontKey,setFontKey,sizeKey,setSizeKey,photoShapeKey,setPhotoShapeKey,photoSrc,setPhotoSrc,clrs,setClrs,resetStorage}=useCVStorage("circuit",DEFAULT_COLORS);
  const [editing,setEditing]=useState(false);
  const [showDesign,setShowDesign]=useState(false);
  const {A,BG,S2,S3,SBG,CT,CB,CM}=clrs;
  const curFont=FONTS.find(f=>f.key===fontKey)??FONTS[9];
  const curSize=FONT_SIZES.find(s=>s.key===sizeKey)??FONT_SIZES[2];
  const curShape=PHOTO_SHAPES.find(s=>s.key===photoShapeKey)??PHOTO_SHAPES[0];
  const fnt=curFont.family;const scale=curSize.scale;
  const photoInputRef=useRef<HTMLInputElement>(null);
  const setP=(p:Partial<CVData["personal"]>)=>setData(d=>({...d,personal:{...d.personal,...p}}));
  const updProj=(id:string,p:Partial<typeof data.projects[0]>)=>setData(d=>({...d,projects:d.projects.map(x=>x.id===id?{...x,...p}:x)}));
  const updEdu=(id:string,p:Partial<typeof data.education[0]>)=>setData(d=>({...d,education:d.education.map(x=>x.id===id?{...x,...p}:x)}));
  const updExp=(id:string,p:Partial<typeof data.experience[0]>)=>setData(d=>({...d,experience:d.experience.map(x=>x.id===id?{...x,...p}:x)}));

  return(
  <ColCtx.Provider value={clrs}>
    <div style={{minHeight:"100vh",background:"#010a00",padding:"24px 16px",fontFamily:fnt}}>
      <style>{`
        ${curFont.gf?`@import url('https://fonts.googleapis.com/css2?family=${curFont.gf}&display=swap');`:""}
        .${PFX}-doc,.${PFX}-doc *{font-family:${fnt}!important;}
        @media print{
          @page{size:A4 portrait;margin:0;}
          *,*::before,*::after{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;}
          body *{visibility:hidden!important;}
          .${PFX}-doc,.${PFX}-doc *{visibility:visible!important;}
          .${PFX}-doc{position:absolute!important;top:0!important;left:0!important;width:850px!important;min-height:1202px!important;overflow:visible!important;zoom:0.934!important;box-shadow:none!important;margin:0!important;}
          .${PFX}-zoom{zoom:1!important;width:100%!important;}
          .${PFX}-ctrl{display:none!important;}
        }
      `}</style>
      <div className={`${PFX}-ctrl`} style={{maxWidth:850,margin:"0 auto 16px",display:"flex",gap:8,flexWrap:"wrap"}}>
        <button onClick={()=>setEditing(e=>!e)} style={{display:"flex",alignItems:"center",gap:6,padding:"7px 16px",borderRadius:1,fontSize:13,fontWeight:700,cursor:"pointer",border:`1px solid ${editing?"#16a34a":A}`,backgroundColor:editing?"#16a34a":hex2rgba(A,0.1),color:editing?"#000":A,fontFamily:"monospace"}}>{editing?<CheckIcon style={{width:16,height:16}}/>:<PencilSquareIcon style={{width:16,height:16}}/>}{editing?"[DONE]":"[EDIT]"}</button>
        <button onClick={()=>window.print()} style={{padding:"7px 16px",borderRadius:1,fontSize:13,fontWeight:700,cursor:"pointer",border:`1px solid ${A}`,backgroundColor:hex2rgba(A,0.08),color:A,display:"flex",alignItems:"center",gap:6,fontFamily:"monospace"}}><PrinterIcon style={{width:16,height:16}}/>PRINT</button>
        <button onClick={()=>setShowDesign(v=>!v)} style={{padding:"7px 16px",borderRadius:1,fontSize:13,cursor:"pointer",border:`1px solid ${showDesign?A:"#2a4020"}`,backgroundColor:"transparent",color:showDesign?A:"#3a5030",fontFamily:"monospace"}}>// DESIGN</button>
        <button onClick={()=>{resetStorage();setData(JSON.parse(JSON.stringify(DEFAULT_CV_DATA)));setPhotoSrc("");setFontKey("firacode");setSizeKey("md");setPhotoShapeKey("square");setClrs(DEFAULT_COLORS);setShowDesign(false);}} style={{padding:"7px 16px",borderRadius:1,fontSize:13,cursor:"pointer",border:"1px solid #2a4020",backgroundColor:"transparent",color:"#3a5030",display:"flex",alignItems:"center",gap:6,fontFamily:"monospace"}}><XMarkIcon style={{width:16,height:16}}/>RESET</button>
        {showDesign&&(<div style={{width:"100%",background:"#0a1a08",border:`1px solid ${hex2rgba(A,0.4)}`,borderRadius:2,padding:"14px 18px",display:"flex",gap:24,flexWrap:"wrap"}}>
          <div><div style={{fontSize:9,fontWeight:700,color:A,marginBottom:7,fontFamily:"monospace"}}>// font</div><div style={{display:"flex",gap:5,flexWrap:"wrap"}}>{FONTS.map(f=><button key={f.key} onClick={()=>setFontKey(f.key)} style={{padding:"3px 9px",borderRadius:1,border:`1px solid ${fontKey===f.key?A:"#2a4020"}`,background:fontKey===f.key?hex2rgba(A,0.1):"transparent",color:fontKey===f.key?A:"#3a5030",fontSize:11,cursor:"pointer",fontFamily:f.family}}>{f.label}</button>)}</div></div>
          <div><div style={{fontSize:9,fontWeight:700,color:A,marginBottom:7,fontFamily:"monospace"}}>// size</div><div style={{display:"flex",gap:5}}>{FONT_SIZES.map(s=><button key={s.key} onClick={()=>setSizeKey(s.key)} style={{padding:"3px 12px",borderRadius:1,border:`1px solid ${sizeKey===s.key?A:"#2a4020"}`,background:sizeKey===s.key?hex2rgba(A,0.1):"transparent",color:sizeKey===s.key?A:"#3a5030",fontSize:11,cursor:"pointer"}}>{s.label}</button>)}</div></div>
          <div><div style={{fontSize:9,fontWeight:700,color:A,marginBottom:7,fontFamily:"monospace"}}>// photo_shape</div><div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{PHOTO_SHAPES.map(s=><button key={s.key} onClick={()=>setPhotoShapeKey(s.key)} title={s.label} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3,padding:"5px 7px",borderRadius:1,border:`1px solid ${photoShapeKey===s.key?A:"#2a4020"}`,background:photoShapeKey===s.key?hex2rgba(A,0.08):"transparent",cursor:"pointer"}}><div style={{width:20,height:s.key==="ellipse"?26:20,borderRadius:s.br,clipPath:s.clip??"",backgroundColor:photoShapeKey===s.key?A:S3}}/><span style={{fontSize:8,color:photoShapeKey===s.key?A:"#3a5030",whiteSpace:"nowrap",fontFamily:"monospace"}}>{s.label}</span></button>)}</div></div>
          <div><div style={{fontSize:9,fontWeight:700,color:A,marginBottom:7,fontFamily:"monospace"}}>// colors</div><div style={{display:"flex",gap:10,flexWrap:"wrap",alignItems:"flex-end"}}>{([{k:"A" as const,l:"accent"},{k:"BG" as const,l:"bg"},{k:"S2" as const,l:"header"},{k:"S3" as const,l:"card"},{k:"SBG" as const,l:"sidebar"},{k:"CT" as const,l:"title"},{k:"CB" as const,l:"text"},{k:"CM" as const,l:"meta"}]).map(({k,l})=>(<label key={k} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3,cursor:"pointer"}}><input type="color" value={clrs[k]} onChange={e=>setClrs(c=>({...c,[k]:e.target.value}))} style={{width:32,height:32,padding:2,borderRadius:1,border:`1px solid ${hex2rgba(A,0.3)}`,cursor:"pointer",background:"none"}}/><span style={{fontSize:8,color:"#3a5030",fontFamily:"monospace"}}>{l}</span></label>))}<button onClick={()=>setClrs(DEFAULT_COLORS)} style={{padding:"4px 10px",borderRadius:1,fontSize:10,border:`1px solid ${A}`,background:"transparent",color:A,cursor:"pointer",alignSelf:"center",fontFamily:"monospace"}}>↺ reset</button></div></div>
        </div>)}
      </div>

      <div className={`${PFX}-doc`} style={{width:850,margin:"0 auto",backgroundColor:BG,boxShadow:`0 0 30px rgba(118,255,3,0.08)`,fontFamily:fnt,overflow:"hidden",border:`1px solid ${hex2rgba(A,0.2)}`}}>
        <div className={`${PFX}-zoom`} style={{width:Math.round(850/scale),zoom:scale}}>
          {/* Circuit top bar */}
          <div style={{height:3,background:`linear-gradient(90deg,${A},${hex2rgba(A,0.3)},${A})`}}/>
          <div style={{backgroundColor:S2,padding:"28px 40px 22px",borderBottom:`1px dashed ${hex2rgba(A,0.3)}`}}>
            <div style={{display:"flex",gap:24,alignItems:"center"}}>
              <div style={{width:curShape.w,height:curShape.h,borderRadius:curShape.br,clipPath:curShape.clip??"",overflow:"hidden",flexShrink:0,backgroundColor:S3,border:`1px solid ${hex2rgba(A,0.5)}`,display:"flex",alignItems:"center",justifyContent:"center",cursor:editing?"pointer":"default"}} onClick={()=>editing&&photoInputRef.current?.click()}>
                {photoSrc?<img src={photoSrc} alt="Foto" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<span style={{fontSize:9,color:A,textAlign:"center",fontFamily:"monospace"}}>{editing?"UPLOAD":"NULL"}</span>}
                <input ref={photoInputRef} type="file" accept="image/*" style={{display:"none"}} onChange={e=>{const f=e.target.files?.[0];if(!f)return;const r=new FileReader();r.onload=ev=>setPhotoSrc((ev.target?.result as string)??"");r.readAsDataURL(f);}}/>
              </div>
              <div style={{flex:1}}>
                <div style={{fontFamily:"monospace",fontSize:10,color:hex2rgba(A,0.5),marginBottom:4}}>{"// CURRICULUM_VITAE = {"}</div>
                {editing?<input value={data.personal.name} onChange={e=>setP({name:e.target.value})} style={{display:"block",fontSize:32,fontWeight:700,color:A,lineHeight:1,marginBottom:2,fontFamily:"monospace",background:hex2rgba(A,0.06),border:`1px solid ${hex2rgba(A,0.3)}`,padding:"2px 8px",outline:"none",width:"100%",boxSizing:"border-box"}}/>:<div style={{fontSize:32,fontWeight:700,color:A,lineHeight:1,marginBottom:2,fontFamily:"monospace"}}>{data.personal.name}</div>}
                {editing?<input value={data.personal.subtitle} onChange={e=>setP({subtitle:e.target.value})} style={{display:"block",fontSize:11,color:CT,fontFamily:"monospace",background:hex2rgba(A,0.04),border:`1px solid ${hex2rgba(A,0.2)}`,padding:"1px 6px",outline:"none",width:"100%",boxSizing:"border-box",marginBottom:8}}/>:<div style={{fontSize:11,color:CT,fontFamily:"monospace",marginBottom:8,opacity:0.8}}>{data.personal.subtitle}</div>}
                <E value={data.personal.bio} onChange={v=>setP({bio:v})} editing={editing} multiline rows={2} style={{fontSize:10,color:CB,fontFamily:"monospace",lineHeight:1.7}}/>
                <div style={{display:"flex",flexWrap:"wrap",gap:16,marginTop:12}}>
                  {(["email","phone","location","github","linkedin"] as const).map(k=>data.personal[k]||editing?editing?<input key={k} value={data.personal[k]??""} onChange={e=>setP({[k]:e.target.value} as Partial<CVData["personal"]>)} style={{fontSize:9,color:CM,background:hex2rgba(A,0.04),border:`1px solid ${hex2rgba(A,0.2)}`,padding:"2px 8px",outline:"none",fontFamily:"monospace"}}/>:<span key={k} style={{fontSize:9,color:CM,fontFamily:"monospace"}}>{data.personal[k]}</span>:null)}
                </div>
                <div style={{fontFamily:"monospace",fontSize:10,color:hex2rgba(A,0.5),marginTop:6}}>{"}"}</div>
              </div>
            </div>
          </div>
          <div style={{display:"flex"}}>
            <div style={{flex:1,padding:"22px 24px 48px 40px",minWidth:0}}>
              <div style={{marginBottom:20}}><SecH title="Projekte"/>
                {data.projects.map(p=>(<div key={p.id} style={{marginBottom:12,paddingBottom:10,borderBottom:`1px dashed ${hex2rgba(A,0.2)}`}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:2,gap:8}}><E value={p.title} onChange={v=>updProj(p.id,{title:v})} editing={editing} style={{fontSize:12,fontWeight:700,color:CT,fontFamily:"monospace"}}/><E value={p.period} onChange={v=>updProj(p.id,{period:v})} editing={editing} style={{fontSize:9,color:CM,fontFamily:"monospace",flexShrink:0}}/></div><BulletList bullets={p.bullets} onChange={b=>updProj(p.id,{bullets:b})} editing={editing}/>{editing&&<button type="button" onClick={()=>setData(d=>({...d,projects:d.projects.filter(x=>x.id!==p.id)}))} style={{fontSize:9,color:"#ef4444",background:"none",border:"none",cursor:"pointer",marginTop:3,display:"flex",alignItems:"center",gap:3,fontFamily:"monospace"}}><TrashIcon style={{width:10,height:10}}/> rm</button>}</div>))}
                {editing&&<button type="button" onClick={()=>setData(d=>({...d,projects:[...d.projects,{id:uid(),title:"project_name",period:"",bullets:[],link:""}]}))} style={{fontSize:10,color:A,background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:4,fontFamily:"monospace"}}><PlusIcon style={{width:12,height:12}}/>new Project()</button>}
              </div>
              <div style={{marginBottom:20}}><SecH title="Berufserfahrung"/>
                {data.experience.map(ex=>(<div key={ex.id} style={{marginBottom:12,paddingBottom:10,borderBottom:`1px dashed ${hex2rgba(A,0.2)}`}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:2,gap:8,alignItems:"flex-start"}}><div><E value={ex.position} onChange={v=>updExp(ex.id,{position:v})} editing={editing} style={{fontSize:12,fontWeight:700,color:CT,fontFamily:"monospace",display:"block",marginBottom:1}}/><E value={ex.company} onChange={v=>updExp(ex.id,{company:v})} editing={editing} style={{fontSize:11,color:A,fontFamily:"monospace"}}/></div><E value={ex.period} onChange={v=>updExp(ex.id,{period:v})} editing={editing} style={{fontSize:9,color:CM,fontFamily:"monospace",flexShrink:0}}/></div><BulletList bullets={ex.bullets} onChange={b=>updExp(ex.id,{bullets:b})} editing={editing}/>{editing&&<button type="button" onClick={()=>setData(d=>({...d,experience:d.experience.filter(x=>x.id!==ex.id)}))} style={{fontSize:9,color:"#ef4444",background:"none",border:"none",cursor:"pointer",marginTop:3,display:"flex",alignItems:"center",gap:3,fontFamily:"monospace"}}><TrashIcon style={{width:10,height:10}}/> rm</button>}</div>))}
                {editing&&<button type="button" onClick={()=>setData(d=>({...d,experience:[...d.experience,{id:uid(),position:"role",company:"company",period:"",location:"",description:"",type:"",bullets:[],contact:""}]}))} style={{fontSize:10,color:A,background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:4,fontFamily:"monospace"}}><PlusIcon style={{width:12,height:12}}/>new Experience()</button>}
              </div>
              <div><SecH title="Ausbildung"/>
                {data.education.map(e=>(<div key={e.id} style={{marginBottom:10,paddingBottom:8,borderBottom:`1px dashed ${hex2rgba(A,0.2)}`}}><E value={e.degree} onChange={v=>updEdu(e.id,{degree:v})} editing={editing} style={{fontSize:12,fontWeight:700,color:CT,fontFamily:"monospace",display:"block",marginBottom:1}}/><E value={e.institution} onChange={v=>updEdu(e.id,{institution:v})} editing={editing} style={{fontSize:11,color:A,fontFamily:"monospace",display:"block",marginBottom:1}}/><div style={{display:"flex",justifyContent:"space-between",gap:8}}><E value={e.period} onChange={v=>updEdu(e.id,{period:v})} editing={editing} style={{fontSize:9,color:CM,fontFamily:"monospace"}}/><E value={e.location} onChange={v=>updEdu(e.id,{location:v})} editing={editing} style={{fontSize:9,color:CM,fontFamily:"monospace"}}/></div>{editing&&<button type="button" onClick={()=>setData(d=>({...d,education:d.education.filter(x=>x.id!==e.id)}))} style={{fontSize:9,color:"#ef4444",background:"none",border:"none",cursor:"pointer",marginTop:3,display:"flex",alignItems:"center",gap:3,fontFamily:"monospace"}}><TrashIcon style={{width:10,height:10}}/> rm</button>}</div>))}
                {editing&&<button type="button" onClick={()=>setData(d=>({...d,education:[...d.education,{id:uid(),degree:"degree",institution:"institution",period:"",location:"",type:"",bullets:[]}]}))} style={{fontSize:10,color:A,background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:4,fontFamily:"monospace"}}><PlusIcon style={{width:12,height:12}}/>new Education()</button>}
              </div>
            </div>
            <div style={{width:230,flexShrink:0,backgroundColor:SBG,padding:"22px 16px 48px",borderLeft:`1px dashed ${hex2rgba(A,0.3)}`}}>
              {[
                {title:"Fähigkeiten",c:<TagList tags={data.skills} onChange={t=>setData(d=>({...d,skills:t}))} editing={editing}/>},
                {title:"Technisch",c:<div>{data.technicalSkills.map(ts=>(<div key={ts.id} style={{marginBottom:6}}><E value={ts.name} onChange={v=>setData(d=>({...d,technicalSkills:d.technicalSkills.map(t=>t.id===ts.id?{...t,name:v}:t)}))} editing={editing} style={{fontSize:11,fontWeight:700,color:CT,fontFamily:"monospace",display:"block"}}/><E value={ts.description} onChange={v=>setData(d=>({...d,technicalSkills:d.technicalSkills.map(t=>t.id===ts.id?{...t,description:v}:t)}))} editing={editing} style={{fontSize:9,color:CM,fontFamily:"monospace",display:"block"}}/>{editing&&<button type="button" onClick={()=>setData(d=>({...d,technicalSkills:d.technicalSkills.filter(t=>t.id!==ts.id)}))} style={{fontSize:9,color:"#ef4444",background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:2,fontFamily:"monospace"}}><XMarkIcon style={{width:9,height:9}}/>rm</button>}</div>))}{editing&&<button type="button" onClick={()=>setData(d=>({...d,technicalSkills:[...d.technicalSkills,{id:uid(),name:"lib",description:"desc"}]}))} style={{fontSize:10,color:A,background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:4,fontFamily:"monospace"}}><PlusIcon style={{width:11,height:11}}/>push()</button>}</div>},
                {title:"Soft Skills",c:<TagList tags={data.softSkills} onChange={t=>setData(d=>({...d,softSkills:t}))} editing={editing}/>},
                {title:"Sprachen",c:<div>{data.languages.map(l=>(<div key={l.id} style={{marginBottom:6}}><E value={l.language} onChange={v=>setData(d=>({...d,languages:d.languages.map(x=>x.id===l.id?{...x,language:v}:x)}))} editing={editing} style={{fontSize:11,fontWeight:700,color:CT,fontFamily:"monospace",display:"block"}}/><E value={l.level} onChange={v=>setData(d=>({...d,languages:d.languages.map(x=>x.id===l.id?{...x,level:v}:x)}))} editing={editing} style={{fontSize:9,color:A,fontFamily:"monospace",display:"block"}}/>{editing&&<button type="button" onClick={()=>setData(d=>({...d,languages:d.languages.filter(x=>x.id!==l.id)}))} style={{fontSize:9,color:"#ef4444",background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:2,fontFamily:"monospace"}}><XMarkIcon style={{width:9,height:9}}/>rm</button>}</div>))}{editing&&<button type="button" onClick={()=>setData(d=>({...d,languages:[...d.languages,{id:uid(),language:"lang",level:"level"}]}))} style={{fontSize:10,color:A,background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:4,fontFamily:"monospace"}}><PlusIcon style={{width:11,height:11}}/>push()</button>}</div>},
                {title:"Zertifikate",c:<div>{data.certificates.map(c=>(<div key={c.id} style={{marginBottom:6}}><E value={c.name} onChange={v=>setData(d=>({...d,certificates:d.certificates.map(x=>x.id===c.id?{...x,name:v}:x)}))} editing={editing} multiline rows={2} style={{fontSize:9,color:CB,fontFamily:"monospace",display:"block",lineHeight:1.5}}/><E value={c.period} onChange={v=>setData(d=>({...d,certificates:d.certificates.map(x=>x.id===c.id?{...x,period:v}:x)}))} editing={editing} style={{fontSize:8,color:CM,fontFamily:"monospace",display:"block"}}/>{editing&&<button type="button" onClick={()=>setData(d=>({...d,certificates:d.certificates.filter(x=>x.id!==c.id)}))} style={{fontSize:9,color:"#ef4444",background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:2,fontFamily:"monospace"}}><XMarkIcon style={{width:9,height:9}}/>rm</button>}</div>))}{editing&&<button type="button" onClick={()=>setData(d=>({...d,certificates:[...d.certificates,{id:uid(),name:"cert",period:""}]}))} style={{fontSize:10,color:A,background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:4,fontFamily:"monospace"}}><PlusIcon style={{width:11,height:11}}/>push()</button>}</div>},
                {title:"Referenzen",c:<div>{data.references.map(r=>(<div key={r.id} style={{marginBottom:6}}><E value={r.company} onChange={v=>setData(d=>({...d,references:d.references.map(x=>x.id===r.id?{...x,company:v}:x)}))} editing={editing} style={{fontSize:11,fontWeight:700,color:CT,fontFamily:"monospace",display:"block"}}/><E value={r.person??""} onChange={v=>setData(d=>({...d,references:d.references.map(x=>x.id===r.id?{...x,person:v}:x)}))} editing={editing} style={{fontSize:9,color:CM,fontFamily:"monospace",display:"block"}}/>{editing&&<button type="button" onClick={()=>setData(d=>({...d,references:d.references.filter(x=>x.id!==r.id)}))} style={{fontSize:9,color:"#ef4444",background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:2,fontFamily:"monospace"}}><XMarkIcon style={{width:9,height:9}}/>rm</button>}</div>))}{editing&&<button type="button" onClick={()=>setData(d=>({...d,references:[...d.references,{id:uid(),company:"ref",person:""}]}))} style={{fontSize:10,color:A,background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:4,fontFamily:"monospace"}}><PlusIcon style={{width:11,height:11}}/>push()</button>}</div>},
                {title:"Interessen",c:<TagList tags={data.interests} onChange={t=>setData(d=>({...d,interests:t}))} editing={editing}/>},
              ].map(({title,c})=><div key={title} style={{marginBottom:16}}><SecH title={title}/>{c}</div>)}
            </div>
          </div>
          <div style={{height:3,background:`linear-gradient(90deg,${A},${hex2rgba(A,0.3)},${A})`}}/>
        </div>
      </div>
    </div>
  </ColCtx.Provider>
  );
}
