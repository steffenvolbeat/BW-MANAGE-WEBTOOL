"use client";
// ─── CV Template: NeoNoir ─────────────────────────────────────────────
import { useState, useRef, useContext, createContext } from "react";
import { PrinterIcon, PencilSquareIcon, CheckIcon, PlusIcon, TrashIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { FONTS, FONT_SIZES, PHOTO_SHAPES, CVData, DEFAULT_CV_DATA, uid } from "./shared";
import { useCVStorage } from "./useCV";

const DEFAULT_COLORS = { A:"#fbbf24", BG:"#050505", S2:"#0f0f0f", S3:"#181818", SBG:"#0a0a0a", CT:"#f5f5f5", CB:"#d0d0d0", CM:"#808080" };
const hex2rgba=(hex:string,a:number)=>{const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);return `rgba(${r},${g},${b},${a})`;}
const ColCtx=createContext(DEFAULT_COLORS);
const PFX="nnoir";

function E({value,onChange,editing,multiline=false,style={} as React.CSSProperties,placeholder="...",rows=3}:{value:string;onChange:(v:string)=>void;editing:boolean;multiline?:boolean;style?:React.CSSProperties;placeholder?:string;rows?:number;}){
  const {A}=useContext(ColCtx);
  const s:React.CSSProperties={...style,background:hex2rgba(A,0.08),border:`1px dashed ${A}66`,padding:"2px 4px",outline:"none",width:"100%",fontFamily:"inherit",fontSize:"inherit",color:"inherit",lineHeight:"inherit",fontWeight:"inherit",boxSizing:"border-box"};
  if(!editing)return <span style={style}>{value||<span style={{opacity:0.3}}>{placeholder}</span>}</span>;
  if(multiline)return <textarea style={{...s,resize:"vertical",display:"block"}} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={rows}/>;
  return <input style={s} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}/>;
}
function BulletList({bullets,onChange,editing}:{bullets:string[];onChange:(b:string[])=>void;editing:boolean}){
  const {A,CB}=useContext(ColCtx);
  return(<ul style={{listStyle:"none",margin:0,padding:0}}>{bullets.map((b,i)=>(
    <li key={i} style={{display:"flex",alignItems:"flex-start",gap:6,marginBottom:3}}>
      <span style={{width:6,height:6,background:A,borderRadius:1,flexShrink:0,marginTop:4}}/>
      {editing?(<div style={{flex:1,display:"flex",gap:4}}><input value={b} onChange={e=>{const n=[...bullets];n[i]=e.target.value;onChange(n);}} style={{flex:1,fontSize:11,color:CB,background:hex2rgba(A,0.06),border:`1px dashed ${A}44`,padding:"1px 4px",outline:"none",fontFamily:"inherit"}}/><button type="button" onClick={()=>onChange(bullets.filter((_,j)=>j!==i))} style={{background:"none",border:"none",cursor:"pointer",color:"#f87171",padding:0}}><XMarkIcon style={{width:11,height:11}}/></button></div>)
      :<span style={{fontSize:11,color:CB,lineHeight:1.6}}>{b}</span>}
    </li>
  ))}{editing&&<li><button type="button" onClick={()=>onChange([...bullets,""])} style={{fontSize:11,color:A,background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:4}}><PlusIcon style={{width:11,height:11}}/>Hinzufügen</button></li>}</ul>);
}
function TagList({tags,onChange,editing}:{tags:string[];onChange:(t:string[])=>void;editing:boolean}){
  const {A,CT}=useContext(ColCtx);const [nv,setNv]=useState("");
  return(<div style={{display:"flex",flexWrap:"wrap",gap:4}}>{tags.map((t,i)=>(<div key={i} style={{background:hex2rgba(A,0.12),border:`1px solid ${A}55`,color:CT,padding:"2px 8px",fontSize:10,display:"flex",alignItems:"center",gap:3,borderRadius:3}}>{t}{editing&&<button type="button" onClick={()=>onChange(tags.filter((_,j)=>j!==i))} style={{background:"none",border:"none",cursor:"pointer",color:"#f87171",padding:0}}><XMarkIcon style={{width:9,height:9}}/></button>}</div>))}
  {editing&&<input value={nv} onChange={e=>setNv(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&nv.trim()){onChange([...tags,nv.trim()]);setNv("");}}} style={{width:70,fontSize:10,border:`1px dashed ${A}`,padding:"2px 5px",background:hex2rgba(A,0.06),outline:"none",color:CT,fontFamily:"inherit"}} placeholder="+ Neu"/>}</div>);
}
function SecH({title}:{title:string}){
  const {A,CT}=useContext(ColCtx);
  return(<div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
    <div style={{width:12,height:12,background:A,borderRadius:2,flexShrink:0}}/>
    <span style={{fontSize:11,fontWeight:800,letterSpacing:"0.12em",textTransform:"uppercase" as const,color:CT}}>{title}</span>
    <div style={{flex:1,height:1,background:`linear-gradient(90deg,${A}55,transparent)`}}/>
  </div>);
}

export default function CV_NeoNoir(){
  const {data,setData,fontKey,setFontKey,sizeKey,setSizeKey,photoShapeKey,setPhotoShapeKey,photoSrc,setPhotoSrc,clrs,setClrs,resetStorage}=useCVStorage("neonoir",DEFAULT_COLORS);
  const [editing,setEditing]=useState(false);const [showDesign,setShowDesign]=useState(false);
  const {A,BG,S2,S3,SBG,CT,CB,CM}=clrs;
  const curFont=FONTS.find(f=>f.key===fontKey)??FONTS[0];const curSize=FONT_SIZES.find(s=>s.key===sizeKey)??FONT_SIZES[2];const curShape=PHOTO_SHAPES.find(s=>s.key===photoShapeKey)??PHOTO_SHAPES[0];
  const fnt=curFont.family;const scale=curSize.scale;
  const photoInputRef=useRef<HTMLInputElement>(null);const docRef=useRef<HTMLDivElement>(null);
  const setP=(p:Partial<CVData["personal"]>)=>setData(d=>({...d,personal:{...d.personal,...p}}));
  const updProj=(id:string,p:Partial<typeof data.projects[0]>)=>setData(d=>({...d,projects:d.projects.map(x=>x.id===id?{...x,...p}:x)}));
  const updEdu=(id:string,p:Partial<typeof data.education[0]>)=>setData(d=>({...d,education:d.education.map(x=>x.id===id?{...x,...p}:x)}));
  const updExp=(id:string,p:Partial<typeof data.experience[0]>)=>setData(d=>({...d,experience:d.experience.map(x=>x.id===id?{...x,...p}:x)}));

  return(
  <ColCtx.Provider value={clrs}>
    <div style={{minHeight:"100vh",background:"#000000",padding:"24px 16px",fontFamily:fnt}}>
      <style>{`
        ${curFont.gf?`@import url('https://fonts.googleapis.com/css2?family=${curFont.gf}&display=swap');`:""}
        .${PFX}-doc,.${PFX}-doc *{font-family:${fnt}!important;}
        @media print{@page{size:A4 portrait;margin:0;}*,*::before,*::after{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;}body *{visibility:hidden!important;}.${PFX}-doc,.${PFX}-doc *{visibility:visible!important;}.${PFX}-doc{position:fixed!important;top:0!important;left:0!important;width:850px!important;min-height:1202px!important;overflow:visible!important;zoom:0.934!important;box-shadow:none!important;margin:0!important;}.${PFX}-zoom{zoom:1!important;width:100%!important;}.${PFX}-ctrl{display:none!important;}}
      `}</style>
      <div className={`${PFX}-ctrl`} style={{maxWidth:850,margin:"0 auto 16px",display:"flex",gap:8,flexWrap:"wrap"}}>
        <button onClick={()=>setEditing(e=>!e)} style={{display:"flex",alignItems:"center",gap:6,padding:"7px 16px",fontSize:13,fontWeight:600,cursor:"pointer",border:`2px solid ${editing?"#16a34a":A}`,backgroundColor:editing?"#16a34a":hex2rgba(A,0.1),color:editing?"white":A}}>{editing?<CheckIcon style={{width:16,height:16}}/>:<PencilSquareIcon style={{width:16,height:16}}/>}{editing?"Fertig":"Bearbeiten"}</button>
        <button onClick={()=>{const el=docRef.current;if(el){const h=el.scrollHeight;el.style.zoom=(h>1202?(0.934*1202/h):0.934).toFixed(5);}requestAnimationFrame(()=>requestAnimationFrame(()=>window.print()));}} style={{padding:"7px 16px",fontSize:13,cursor:"pointer",border:"2px solid #374151",backgroundColor:"#374151",color:"white",display:"flex",alignItems:"center",gap:6}}><PrinterIcon style={{width:16,height:16}}/>Drucken</button>
        <button onClick={()=>setShowDesign(v=>!v)} style={{padding:"7px 16px",fontSize:13,cursor:"pointer",border:`2px solid ${showDesign?A:"#ccc"}`,backgroundColor:"transparent",color:showDesign?A:"#888"}}>🎨 Design</button>
        <button onClick={()=>{resetStorage();setData(JSON.parse(JSON.stringify(DEFAULT_CV_DATA)));setPhotoSrc("");setFontKey("nunito");setSizeKey("md");setPhotoShapeKey("square");setClrs(DEFAULT_COLORS);setShowDesign(false);}} style={{padding:"7px 16px",fontSize:13,cursor:"pointer",border:"2px solid #ccc",backgroundColor:"transparent",color:"#888",display:"flex",alignItems:"center",gap:6}}><XMarkIcon style={{width:16,height:16}}/>Reset</button>
        {showDesign&&(<div style={{width:"100%",background:"#f9f9f9",border:"1px solid #ddd",padding:"14px 18px",display:"flex",gap:24,flexWrap:"wrap"}}>
          <div><div style={{fontSize:10,fontWeight:700,color:"#999",marginBottom:7,textTransform:"uppercase",letterSpacing:"0.1em"}}>Font</div><div style={{display:"flex",gap:5,flexWrap:"wrap"}}>{FONTS.map(f=><button key={f.key} onClick={()=>setFontKey(f.key)} style={{padding:"3px 9px",border:`1px solid ${fontKey===f.key?A:"#ddd"}`,background:fontKey===f.key?hex2rgba(A,0.1):"transparent",color:fontKey===f.key?A:"#666",fontSize:11,cursor:"pointer",fontFamily:f.family}}>{f.label}</button>)}</div></div>
          <div><div style={{fontSize:10,fontWeight:700,color:"#999",marginBottom:7,textTransform:"uppercase",letterSpacing:"0.1em"}}>Größe</div><div style={{display:"flex",gap:5}}>{FONT_SIZES.map(s=><button key={s.key} onClick={()=>setSizeKey(s.key)} style={{padding:"3px 12px",border:`1px solid ${sizeKey===s.key?A:"#ddd"}`,background:sizeKey===s.key?hex2rgba(A,0.1):"transparent",color:sizeKey===s.key?A:"#666",fontSize:11,cursor:"pointer"}}>{s.label}</button>)}</div></div>
          <div><div style={{fontSize:10,fontWeight:700,color:"#999",marginBottom:7,textTransform:"uppercase",letterSpacing:"0.1em"}}>Foto</div><div style={{display:"flex",gap:5,flexWrap:"wrap"}}>{PHOTO_SHAPES.map(s=><button key={s.key} onClick={()=>setPhotoShapeKey(s.key)} style={{padding:"4px 8px",border:`2px solid ${photoShapeKey===s.key?A:"#ddd"}`,background:photoShapeKey===s.key?hex2rgba(A,0.1):"transparent",cursor:"pointer",fontSize:10,color:photoShapeKey===s.key?A:"#666"}}>{s.label}</button>)}</div></div>
          <div><div style={{fontSize:10,fontWeight:700,color:"#999",marginBottom:7,textTransform:"uppercase",letterSpacing:"0.1em"}}>Farben</div><div style={{display:"flex",gap:10,flexWrap:"wrap",alignItems:"flex-end"}}>{([{k:"A" as const,l:"Akzent"},{k:"BG" as const,l:"BG"},{k:"S2" as const,l:"Sidebar"},{k:"CT" as const,l:"Titel"},{k:"CB" as const,l:"Text"},{k:"CM" as const,l:"Gedimmt"}]).map(({k,l})=>(<label key={k} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3,cursor:"pointer"}}><input type="color" value={clrs[k]} onChange={e=>setClrs(c=>({...c,[k]:e.target.value}))} style={{width:32,height:32,padding:2,border:"1px solid #ddd",cursor:"pointer",background:"none"}}/><span style={{fontSize:9,color:"#999"}}>{l}</span></label>))}<button onClick={()=>setClrs(DEFAULT_COLORS)} style={{padding:"4px 10px",fontSize:11,border:"1px solid #ddd",background:"transparent",color:"#888",cursor:"pointer",alignSelf:"center"}}>↺</button></div></div>
        </div>)}
      </div>

      <div ref={docRef} className={`${PFX}-doc`} style={{width:850,minHeight:1202,margin:"0 auto",backgroundColor:BG,overflow:"visible",fontFamily:fnt,position:"relative",boxShadow:"0 0 40px rgba(251,191,36,0.15)"}}>
        <div className={`${PFX}-zoom`} style={{width:Math.round(850/scale),zoom:scale,position:"relative"}}>
          <div style={{background:S2,padding:"32px 40px 24px",borderBottom:`3px solid ${A}`,position:"relative",overflow:"hidden"}}>
            <div style={{display:"flex",gap:28,alignItems:"center"}}>
              <div style={{position:"relative",width:curShape.w,height:curShape.h,flexShrink:0,cursor:editing?"pointer":"default"}} onClick={()=>editing&&photoInputRef.current?.click()}>
                <div style={{width:"100%",height:"100%",borderRadius:curShape.br,clipPath:curShape.clip??"",overflow:"hidden",backgroundColor:S3,border:`2px solid ${A}`,display:"flex",alignItems:"center",justifyContent:"center"}}>
                  {photoSrc?<img src={photoSrc} alt="Foto" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<span style={{fontSize:10,color:CM}}>{editing?"📷":"Foto"}</span>}
                </div>
                <input ref={photoInputRef} type="file" accept="image/*" style={{display:"none"}} onChange={e=>{const f=e.target.files?.[0];if(!f)return;const r=new FileReader();r.onload=ev=>setPhotoSrc((ev.target?.result as string)??"");r.readAsDataURL(f);}}/>
              </div>
              <div style={{flex:1}}>
                {editing?<input value={data.personal.name} onChange={e=>setP({name:e.target.value})} style={{display:"block",fontSize:30,fontWeight:900,color:CT,marginBottom:4,fontFamily:"inherit",background:hex2rgba(A,0.08),border:`1px dashed ${A}`,padding:"2px 6px",outline:"none",width:"100%",boxSizing:"border-box"}}/>
                  :<div style={{fontSize:30,fontWeight:900,color:CT,marginBottom:4}}>{data.personal.name}</div>}
                {editing?<input value={data.personal.subtitle} onChange={e=>setP({subtitle:e.target.value})} style={{display:"block",fontSize:13,color:A,marginBottom:8,fontFamily:"inherit",background:hex2rgba(A,0.08),border:`1px dashed ${A}`,padding:"2px 6px",outline:"none",width:"100%",boxSizing:"border-box"}}/>
                  :<div style={{fontSize:13,fontWeight:700,color:A,marginBottom:8}}>{data.personal.subtitle}</div>}
                <E value={data.personal.bio} onChange={v=>setP({bio:v})} editing={editing} multiline rows={2} style={{fontSize:11,color:CM,lineHeight:1.6}}/>
                <div style={{display:"flex",flexWrap:"wrap",gap:6,marginTop:10}}>
                  {(["email","phone","location","github","linkedin","website"] as const).map(k=>editing
                    ?<input key={k} value={data.personal[k]??""} onChange={e=>setP({[k]:e.target.value} as Partial<CVData["personal"]>)} style={{fontSize:10,color:CT,background:hex2rgba(A,0.08),border:`1px dashed ${A}44`,padding:"2px 8px",outline:"none",fontFamily:"inherit"}}/>
                    :data.personal[k]?<span key={k} style={{fontSize:10,color:CM,background:S3,padding:"2px 10px",border:`1px solid ${A}22`,borderRadius:2}}>{data.personal[k]}</span>:null)}
                </div>
              </div>
            </div>
          </div>
          <div style={{display:"flex"}}>
            <div style={{width:220,background:S2,padding:"22px 18px",flexShrink:0,borderRight:`1px solid ${A}22`}}>
              <div style={{marginBottom:20}}><SecH title="Skills"/><TagList tags={data.skills} onChange={s=>setData(d=>({...d,skills:s}))} editing={editing}/></div>
              <div style={{marginBottom:20}}><SecH title="Sprachen"/>
                {data.languages.map((l,i)=>(<div key={i} style={{marginBottom:8}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                    {editing?<input value={l.language} onChange={e=>{const n=[...data.languages];n[i]={...n[i],language:e.target.value};setData(d=>({...d,languages:n}));}} style={{fontSize:11,color:CT,background:hex2rgba(A,0.08),border:`1px dashed ${A}44`,padding:"1px 4px",outline:"none",width:80,fontFamily:"inherit"}}/>:<span style={{fontSize:11,color:CT,fontWeight:600}}>{l.language}</span>}
                    {editing?<input value={l.level} onChange={e=>{const n=[...data.languages];n[i]={...n[i],level:e.target.value};setData(d=>({...d,languages:n}));}} style={{fontSize:10,color:CM,background:hex2rgba(A,0.08),border:`1px dashed ${A}44`,padding:"1px 4px",outline:"none",width:60,fontFamily:"inherit"}}/>:<span style={{fontSize:10,color:CM}}>{l.level}</span>}
                  </div>
                  <div style={{height:3,background:`${A}22`}}><div style={{height:"100%",width:l.level==="Muttersprache"?"100%":l.level==="Verhandlungssicher"?"85%":l.level==="Fließend"?"70%":l.level==="Grundkenntnisse"?"40%":"60%",background:A}}/></div>
                </div>))}
              </div>
              <div style={{marginBottom:20}}><SecH title="Ausbildung"/>
                {data.education.map(e=>(<div key={e.id} style={{marginBottom:12,paddingLeft:8,borderLeft:`2px solid ${A}`}}>
                  <E value={e.degree} onChange={v=>updEdu(e.id,{degree:v})} editing={editing} style={{fontSize:11,fontWeight:700,color:CT,display:"block",marginBottom:1}}/>
                  <E value={e.institution} onChange={v=>updEdu(e.id,{institution:v})} editing={editing} style={{fontSize:10,color:A,display:"block",marginBottom:1}}/>
                  <E value={e.period} onChange={v=>updEdu(e.id,{period:v})} editing={editing} style={{fontSize:10,color:CM}}/>
                  {editing&&<button type="button" onClick={()=>setData(d=>({...d,education:d.education.filter(x=>x.id!==e.id)}))} style={{fontSize:10,color:"#f87171",background:"none",border:"none",cursor:"pointer",marginTop:3,display:"flex",alignItems:"center",gap:3}}><TrashIcon style={{width:10,height:10}}/>Löschen</button>}
                </div>))}
                {editing&&<button type="button" onClick={()=>setData(d=>({...d,education:[...d.education,{id:uid(),degree:"",institution:"",period:"",location:"",type:"Kurse / Inhalte",bullets:[]}]}))} style={{fontSize:11,color:A,background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:4}}><PlusIcon style={{width:12,height:12}}/>Hinzufügen</button>}
              </div>
            </div>
            <div style={{flex:1,padding:"22px 28px"}}>
              <div style={{marginBottom:20}}><SecH title="Berufserfahrung"/>
                {data.experience.map(ex=>(<div key={ex.id} style={{marginBottom:16,paddingLeft:12,borderLeft:`2px solid ${A}55`,position:"relative"}}>
                  <div style={{position:"absolute",left:-5,top:4,width:8,height:8,background:A,borderRadius:1}}/>
                  <E value={ex.position} onChange={v=>updExp(ex.id,{position:v})} editing={editing} style={{fontSize:13,fontWeight:700,color:CT,display:"block",marginBottom:1}}/>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                    <E value={ex.company} onChange={v=>updExp(ex.id,{company:v})} editing={editing} style={{fontSize:12,color:A,fontWeight:600}}/>
                    <E value={ex.period} onChange={v=>updExp(ex.id,{period:v})} editing={editing} style={{fontSize:10,color:CM,fontStyle:"italic"}}/>
                  </div>
                  <BulletList bullets={ex.bullets} onChange={b=>updExp(ex.id,{bullets:b})} editing={editing}/>
                  {editing&&<button type="button" onClick={()=>setData(d=>({...d,experience:d.experience.filter(x=>x.id!==ex.id)}))} style={{fontSize:10,color:"#f87171",background:"none",border:"none",cursor:"pointer",marginTop:3,display:"flex",alignItems:"center",gap:3}}><TrashIcon style={{width:10,height:10}}/>Entfernen</button>}
                </div>))}
                {editing&&<button type="button" onClick={()=>setData(d=>({...d,experience:[...d.experience,{id:uid(),position:"",company:"",period:"",location:"",description:"",type:"",bullets:[],contact:""}]}))} style={{fontSize:11,color:A,background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:4}}><PlusIcon style={{width:12,height:12}}/>Hinzufügen</button>}
              </div>
              <div style={{marginBottom:20}}><SecH title="Projekte"/>
                {data.projects.map(p=>(<div key={p.id} style={{marginBottom:14,paddingLeft:12,borderLeft:`2px solid ${A}44`,position:"relative"}}>
                  <div style={{position:"absolute",left:-4,top:4,width:6,height:6,background:`${A}88`,borderRadius:1}}/>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}>
                    <E value={p.title} onChange={v=>updProj(p.id,{title:v})} editing={editing} style={{fontSize:12,fontWeight:700,color:CT}}/>
                    <E value={p.period} onChange={v=>updProj(p.id,{period:v})} editing={editing} style={{fontSize:10,color:CM,fontStyle:"italic"}}/>
                  </div>
                  <BulletList bullets={p.bullets} onChange={b=>updProj(p.id,{bullets:b})} editing={editing}/>
                  {editing&&<button type="button" onClick={()=>setData(d=>({...d,projects:d.projects.filter(x=>x.id!==p.id)}))} style={{fontSize:10,color:"#f87171",background:"none",border:"none",cursor:"pointer",marginTop:3,display:"flex",alignItems:"center",gap:3}}><TrashIcon style={{width:10,height:10}}/>Entfernen</button>}
                </div>))}
                {editing&&<button type="button" onClick={()=>setData(d=>({...d,projects:[...d.projects,{id:uid(),title:"",period:"",bullets:[],link:""}]}))} style={{fontSize:11,color:A,background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:4}}><PlusIcon style={{width:12,height:12}}/>Hinzufügen</button>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </ColCtx.Provider>
  );
}
