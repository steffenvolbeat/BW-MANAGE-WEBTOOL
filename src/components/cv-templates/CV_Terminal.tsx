"use client";
// ─── CV Template: Terminal ───────────────────────────────────────────────────
import { useState, useRef, useContext, createContext } from "react";
import { PrinterIcon, PencilSquareIcon, CheckIcon, PlusIcon, TrashIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { FONTS, FONT_SIZES, PHOTO_SHAPES, CVData, DEFAULT_CV_DATA, uid } from "./shared";
import { useCVStorage } from "./useCV";

const DEFAULT_COLORS = { A:"#00ff41", BG:"#0a0a0a", S2:"#0d0d0d", S3:"#111111", SBG:"#080808", CT:"#00ff41", CB:"#00cc33", CM:"#008820" };
const hex2rgba = (hex:string,a:number) => { const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16); return `rgba(${r},${g},${b},${a})`; };
const ColCtx = createContext(DEFAULT_COLORS);
const PFX = "ctm";

function E({ value, onChange, editing, multiline=false, style={} as React.CSSProperties, placeholder="...", rows=3 }:{ value:string; onChange:(v:string)=>void; editing:boolean; multiline?:boolean; style?:React.CSSProperties; placeholder?:string; rows?:number; }) {
  const s: React.CSSProperties = { ...style, background: "rgba(0,255,65,0.07)", border:"1px solid rgba(0,255,65,0.3)", borderRadius:2, padding:"2px 4px", outline:"none", width:"100%", fontFamily:"'Courier New',monospace", fontSize:"inherit", color:"inherit", lineHeight:"inherit", fontWeight:"inherit", boxSizing:"border-box" };
  if (!editing) return <span style={style}>{value||<span style={{opacity:0.3,fontStyle:"italic"}}>{placeholder}</span>}</span>;
  if (multiline) return <textarea style={{...s,resize:"vertical",display:"block"}} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={rows}/>;
  return <input style={s} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}/>;
}

function BulletList({ bullets, onChange, editing }:{ bullets:string[]; onChange:(b:string[])=>void; editing:boolean }) {
  const {A,CT}=useContext(ColCtx);
  return (
    <ul style={{listStyle:"none",margin:0,padding:0}}>
      {bullets.map((b,i)=>(
        <li key={i} style={{display:"flex",alignItems:"flex-start",gap:6,marginBottom:2}}>
          <span style={{color:A,fontSize:9,flexShrink:0,fontFamily:"monospace",marginTop:2}}>$</span>
          {editing?(
            <div style={{flex:1,display:"flex",gap:4}}>
              <input value={b} onChange={e=>{const n=[...bullets];n[i]=e.target.value;onChange(n);}} style={{flex:1,fontSize:11,color:CT,background:"rgba(0,255,65,0.05)",border:"1px solid rgba(0,255,65,0.25)",borderRadius:2,padding:"1px 4px",outline:"none",fontFamily:"'Courier New',monospace"}}/>
              <button type="button" onClick={()=>onChange(bullets.filter((_,idx)=>idx!==i))} style={{background:"none",border:"none",cursor:"pointer",color:"#f87171",padding:0,display:"flex"}}><XMarkIcon style={{width:11,height:11}}/></button>
            </div>
          ):<span style={{fontSize:11,color:A,lineHeight:1.5,fontFamily:"'Courier New',monospace"}}>{b}</span>}
        </li>
      ))}
      {editing&&<li><button type="button" onClick={()=>onChange([...bullets,""])} style={{display:"flex",alignItems:"center",gap:4,fontSize:11,color:A,background:"none",border:"none",cursor:"pointer",padding:"3px 0",fontFamily:"'Courier New',monospace"}}><PlusIcon style={{width:11,height:11}}/>echo ""</button></li>}
    </ul>
  );
}

function TagList({ tags, onChange, editing }:{ tags:string[]; onChange:(t:string[])=>void; editing:boolean }) {
  const {A,CT}=useContext(ColCtx);
  const [nv,setNv]=useState("");
  return (
    <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
      {tags.map((t,i)=>(
        <div key={i} style={{backgroundColor:"rgba(0,255,65,0.07)",border:"1px solid rgba(0,255,65,0.3)",color:A,borderRadius:2,padding:"1px 8px",fontSize:10,display:"flex",alignItems:"center",gap:3,fontFamily:"'Courier New',monospace"}}>
          [{t}]
          {editing&&<button type="button" onClick={()=>onChange(tags.filter((_,idx)=>idx!==i))} style={{background:"none",border:"none",cursor:"pointer",color:"#f87171",padding:0,display:"flex"}}><XMarkIcon style={{width:9,height:9}}/></button>}
        </div>
      ))}
      {editing&&<input value={nv} onChange={e=>setNv(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&nv.trim()){onChange([...tags,nv.trim()]);setNv("");}}} style={{width:80,fontSize:10,border:"1px solid rgba(0,255,65,0.3)",borderRadius:2,padding:"1px 6px",background:"rgba(0,255,65,0.05)",outline:"none",color:CT,fontFamily:"'Courier New',monospace"}} placeholder="input..."/>}
    </div>
  );
}

function SecH({ title }:{ title:string }) {
  const {A}=useContext(ColCtx);
  return (
    <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:8}}>
      <span style={{color:A,fontFamily:"'Courier New',monospace",fontSize:10,fontWeight:700}}>$</span>
      <span style={{fontSize:10,fontWeight:700,color:A,fontFamily:"'Courier New',monospace",textShadow:"0 0 6px rgba(0,255,65,0.5)"}}>cat ./{title.toLowerCase()}</span>
      <div style={{flex:1,height:1,backgroundColor:"rgba(0,255,65,0.15)"}}/>
    </div>
  );
}

export default function CV_Terminal() {
  const {data,setData,fontKey,setFontKey,sizeKey,setSizeKey,photoShapeKey,setPhotoShapeKey,photoSrc,setPhotoSrc,clrs,setClrs,resetStorage}=useCVStorage("terminal",DEFAULT_COLORS);
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
    <div style={{minHeight:"100vh",background:"#050505",padding:"24px 16px",fontFamily:fnt}}>
      <style>{`
        .${PFX}-doc, .${PFX}-doc * { font-family: 'Courier New', monospace !important; }
        @keyframes ${PFX}-blink { 0%,50% { opacity:1; } 51%,100% { opacity:0; } }
        .${PFX}-cursor::after { content:"▋"; animation:${PFX}-blink 1s infinite; color:#00ff41; }
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
        <button onClick={()=>setEditing(e=>!e)} style={{display:"flex",alignItems:"center",gap:6,padding:"7px 16px",borderRadius:2,fontSize:13,cursor:"pointer",border:`1px solid ${editing?"#16a34a":"rgba(0,255,65,0.5)"}`,backgroundColor:editing?"#16a34a":"rgba(0,255,65,0.1)",color:editing?"white":A,fontFamily:"'Courier New',monospace"}}>
          {editing?<CheckIcon style={{width:16,height:16}}/>:<PencilSquareIcon style={{width:16,height:16}}/>}$ {editing?"exit":"vim"}
        </button>
        <button onClick={()=>window.print()} style={{padding:"7px 16px",borderRadius:2,fontSize:13,cursor:"pointer",border:"1px solid rgba(0,255,65,0.3)",backgroundColor:"rgba(0,255,65,0.06)",color:A,display:"flex",alignItems:"center",gap:6,fontFamily:"'Courier New',monospace"}}>
          <PrinterIcon style={{width:16,height:16}}/>$ lp
        </button>
        <button onClick={()=>setShowDesign(v=>!v)} style={{padding:"7px 16px",borderRadius:2,fontSize:13,cursor:"pointer",border:`1px solid ${showDesign?"rgba(0,255,65,0.5)":"rgba(0,255,65,0.1)"}`,backgroundColor:showDesign?"rgba(0,255,65,0.08)":"transparent",color:showDesign?A:"#444",fontFamily:"'Courier New',monospace"}}>
          $ config
        </button>
        <button onClick={()=>{resetStorage();setData(JSON.parse(JSON.stringify(DEFAULT_CV_DATA)));setPhotoSrc("");setFontKey("nunito");setSizeKey("md");setPhotoShapeKey("circle");setClrs(DEFAULT_COLORS);setShowDesign(false);}} style={{padding:"7px 16px",borderRadius:2,fontSize:13,cursor:"pointer",border:"1px solid rgba(0,255,65,0.1)",backgroundColor:"transparent",color:"#333",display:"flex",alignItems:"center",gap:6,fontFamily:"'Courier New',monospace"}}>
          <XMarkIcon style={{width:16,height:16}}/>$ reset
        </button>
        {showDesign&&(
          <div style={{width:"100%",background:S2,border:"1px solid rgba(0,255,65,0.2)",borderRadius:4,padding:"14px 18px",display:"flex",gap:24,flexWrap:"wrap"}}>
            <div><div style={{fontSize:10,color:"#444",marginBottom:7,letterSpacing:"0.08em",textTransform:"uppercase",fontFamily:"monospace"}}># font</div><div style={{display:"flex",gap:5,flexWrap:"wrap"}}>{FONTS.map(f=><button key={f.key} onClick={()=>setFontKey(f.key)} style={{padding:"3px 9px",borderRadius:2,border:`1px solid ${fontKey===f.key?"rgba(0,255,65,0.5)":"rgba(0,255,65,0.1)"}`,background:fontKey===f.key?"rgba(0,255,65,0.08)":"transparent",color:fontKey===f.key?A:"#444",fontSize:11,cursor:"pointer",fontFamily:f.family}}>{f.label}</button>)}</div></div>
            <div><div style={{fontSize:10,color:"#444",marginBottom:7,letterSpacing:"0.08em",textTransform:"uppercase",fontFamily:"monospace"}}># size</div><div style={{display:"flex",gap:5}}>{FONT_SIZES.map(s=><button key={s.key} onClick={()=>setSizeKey(s.key)} style={{padding:"3px 12px",borderRadius:2,border:`1px solid ${sizeKey===s.key?"rgba(0,255,65,0.5)":"rgba(0,255,65,0.1)"}`,background:sizeKey===s.key?"rgba(0,255,65,0.08)":"transparent",color:sizeKey===s.key?A:"#444",fontSize:11,cursor:"pointer"}}>{s.label}</button>)}</div></div>
            <div><div style={{fontSize:10,color:"#444",marginBottom:7,letterSpacing:"0.08em",textTransform:"uppercase",fontFamily:"monospace"}}># photo</div><div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{PHOTO_SHAPES.map(s=><button key={s.key} onClick={()=>setPhotoShapeKey(s.key)} title={s.label} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3,padding:"5px 7px",borderRadius:2,border:`2px solid ${photoShapeKey===s.key?"rgba(0,255,65,0.5)":"rgba(0,255,65,0.1)"}`,background:photoShapeKey===s.key?"rgba(0,255,65,0.07)":"transparent",cursor:"pointer"}}><div style={{width:20,height:s.key==="ellipse"?26:20,borderRadius:s.br,clipPath:s.clip??"",backgroundColor:photoShapeKey===s.key?A:"#222"}}/><span style={{fontSize:8,color:photoShapeKey===s.key?A:"#333",whiteSpace:"nowrap"}}>{s.label}</span></button>)}</div></div>
            <div><div style={{fontSize:10,color:"#444",marginBottom:7,letterSpacing:"0.08em",textTransform:"uppercase",fontFamily:"monospace"}}># colors</div><div style={{display:"flex",gap:10,flexWrap:"wrap",alignItems:"flex-end"}}>{([{k:"A" as const,l:"Akzent"},{k:"BG" as const,l:"BG"},{k:"S2" as const,l:"S2"},{k:"S3" as const,l:"S3"},{k:"SBG" as const,l:"SBG"},{k:"CT" as const,l:"CT"},{k:"CB" as const,l:"CB"},{k:"CM" as const,l:"CM"}]).map(({k,l})=>(<label key={k} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3,cursor:"pointer"}}><input type="color" value={clrs[k]} onChange={e=>setClrs(c=>({...c,[k]:e.target.value}))} style={{width:32,height:32,padding:2,borderRadius:2,border:"1px solid rgba(0,255,65,0.2)",cursor:"pointer",background:"none"}}/><span style={{fontSize:9,color:"#444",fontFamily:"monospace"}}>{l}</span></label>))}<button onClick={()=>setClrs(DEFAULT_COLORS)} style={{padding:"4px 10px",borderRadius:2,fontSize:11,border:"1px solid rgba(0,255,65,0.2)",background:"transparent",color:"#444",cursor:"pointer",alignSelf:"center",fontFamily:"monospace"}}>↺</button></div></div>
          </div>
        )}
      </div>

      <div className={`${PFX}-doc`} style={{width:850, minHeight: 1202,margin:"0 auto",backgroundColor:"#0a0a0a",boxShadow:`0 0 40px rgba(0,255,65,0.15)`,overflow: "visible",fontFamily:fnt,border:"1px solid rgba(0,255,65,0.2)"}}>
        <div className={`${PFX}-zoom`} style={{width:Math.round(850/scale),zoom:scale}}>
          {/* macOS-style window bar */}
          <div style={{backgroundColor:"#1a1a1a",padding:"8px 14px",display:"flex",alignItems:"center",gap:7,borderBottom:"1px solid rgba(0,255,65,0.1)"}}>
            <div style={{width:12,height:12,borderRadius:"50%",backgroundColor:"#ff5f57"}}/>
            <div style={{width:12,height:12,borderRadius:"50%",backgroundColor:"#febc2e"}}/>
            <div style={{width:12,height:12,borderRadius:"50%",backgroundColor:"#28c840"}}/>
            <span style={{marginLeft:12,fontSize:11,color:"#444",fontFamily:"'Courier New',monospace",letterSpacing:"0.06em"}}>~/curriculum_vitae — bash</span>
          </div>
          {/* Terminal header */}
          <div style={{background:"#0a0a0a",padding:"20px 40px 18px"}}>
            <div style={{fontSize:11,color:"rgba(0,255,65,0.5)",fontFamily:"monospace",marginBottom:12}}>
              Last login: {new Date().toDateString()} on ttys001
            </div>
            <div style={{display:"flex",gap:24,alignItems:"flex-start"}}>
              <div style={{width:curShape.w,height:curShape.h,borderRadius:curShape.br,clipPath:curShape.clip??"",overflow:"hidden",flexShrink:0,backgroundColor:S3,border:"1px solid rgba(0,255,65,0.3)",display:"flex",alignItems:"center",justifyContent:"center",cursor:editing?"pointer":"default"}} onClick={()=>editing&&photoInputRef.current?.click()}>
                {photoSrc?<img src={photoSrc} alt="Foto" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<span style={{fontSize:10,color:CM,textAlign:"center"}}>{editing?"📷":"FOTO"}</span>}
                <input ref={photoInputRef} type="file" accept="image/*" style={{display:"none"}} onChange={e=>{const f=e.target.files?.[0];if(!f)return;const r=new FileReader();r.onload=ev=>setPhotoSrc((ev.target?.result as string)??"");r.readAsDataURL(f);}}/>
              </div>
              <div style={{flex:1}}>
                <div style={{fontSize:11,color:"rgba(0,255,65,0.5)",fontFamily:"monospace",marginBottom:3}}>$ whoami</div>
                {editing?<input value={data.personal.name} onChange={e=>setP({name:e.target.value})} style={{display:"block",fontSize:34,fontWeight:900,color:A,lineHeight:1.1,marginBottom:3,fontFamily:"'Courier New',monospace",background:"rgba(0,255,65,0.07)",border:"1px solid rgba(0,255,65,0.3)",borderRadius:2,padding:"2px 6px",outline:"none",width:"100%",boxSizing:"border-box",textShadow:"0 0 15px rgba(0,255,65,0.4)"}}/>
                  :<div className={`${PFX}-cursor`} style={{fontSize:34,fontWeight:900,color:A,lineHeight:1.1,marginBottom:3,textShadow:"0 0 20px rgba(0,255,65,0.5)"}}>{data.personal.name}</div>}
                {editing?<input value={data.personal.subtitle} onChange={e=>setP({subtitle:e.target.value})} style={{display:"block",fontSize:13,color:CB,marginBottom:8,fontFamily:"'Courier New',monospace",background:"rgba(0,255,65,0.05)",border:"1px solid rgba(0,255,65,0.25)",borderRadius:2,padding:"2px 6px",outline:"none",width:"100%",boxSizing:"border-box"}}/>
                  :<div style={{fontSize:13,color:CB,marginBottom:8}}>{data.personal.subtitle}</div>}
                <E value={data.personal.bio} onChange={v=>setP({bio:v})} editing={editing} multiline rows={2} style={{fontSize:11,color:CM,lineHeight:1.6}}/>
                <div style={{display:"flex",flexWrap:"wrap",gap:6,marginTop:6}}>
                  {(["email","phone","location","github","linkedin","website"] as const).map(k=>editing
                    ?<input key={k} value={data.personal[k]??""} onChange={e=>setP({[k]:e.target.value} as Partial<CVData["personal"]>)} style={{fontSize:10,color:CB,background:"rgba(0,255,65,0.05)",border:"1px solid rgba(0,255,65,0.2)",borderRadius:2,padding:"2px 8px",outline:"none",fontFamily:"'Courier New',monospace"}}/>
                    :data.personal[k]?<span key={k} style={{fontSize:10,color:CM,backgroundColor:S3,borderRadius:2,padding:"2px 8px",border:"1px solid rgba(0,255,65,0.15)",fontFamily:"'Courier New',monospace"}}>{data.personal[k]}</span>:null
                  )}
                </div>
              </div>
            </div>
          </div>

          <div style={{display:"flex"}}>
            <div style={{flex:1,padding:"16px 28px 40px 40px",minWidth:0}}>
              <div style={{marginBottom:20}}>
                <SecH title="projects"/>
                {data.projects.map(p=>(
                  <div key={p.id} style={{marginBottom:12,paddingLeft:12,borderLeft:"1px solid rgba(0,255,65,0.2)"}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:1,gap:8}}>
                      <E value={p.title} onChange={v=>updProj(p.id,{title:v})} editing={editing} style={{fontSize:12,fontWeight:700,color:CT}}/>
                      <E value={p.period} onChange={v=>updProj(p.id,{period:v})} editing={editing} style={{fontSize:10,color:CM,flexShrink:0}}/>
                    </div>
                    <BulletList bullets={p.bullets} onChange={b=>updProj(p.id,{bullets:b})} editing={editing}/>
                    {editing&&<button type="button" onClick={()=>setData(d=>({...d,projects:d.projects.filter(x=>x.id!==p.id)}))} style={{fontSize:10,color:"#f87171",background:"none",border:"none",cursor:"pointer",marginTop:3,display:"flex",alignItems:"center",gap:3}}><TrashIcon style={{width:10,height:10}}/>rm</button>}
                  </div>
                ))}
                {editing&&<button type="button" onClick={()=>setData(d=>({...d,projects:[...d.projects,{id:uid(),title:"new_project",period:"",bullets:[],link:""}]}))} style={{fontSize:11,color:A,background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:4,fontFamily:"'Courier New',monospace"}}><PlusIcon style={{width:12,height:12}}/>mkdir proj</button>}
              </div>
              <div style={{marginBottom:20}}>
                <SecH title="experience"/>
                {data.experience.map(ex=>(
                  <div key={ex.id} style={{marginBottom:12,paddingLeft:12,borderLeft:"1px solid rgba(0,255,65,0.2)"}}>
                    <E value={ex.position} onChange={v=>updExp(ex.id,{position:v})} editing={editing} style={{fontSize:12,fontWeight:700,color:CT,display:"block",marginBottom:1}}/>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:1,gap:8}}>
                      <E value={ex.company} onChange={v=>updExp(ex.id,{company:v})} editing={editing} style={{fontSize:11,color:CB}}/>
                      <E value={ex.period} onChange={v=>updExp(ex.id,{period:v})} editing={editing} style={{fontSize:10,color:CM,fontStyle:"italic"}}/>
                    </div>
                    <BulletList bullets={ex.bullets} onChange={b=>updExp(ex.id,{bullets:b})} editing={editing}/>
                    {editing&&<button type="button" onClick={()=>setData(d=>({...d,experience:d.experience.filter(x=>x.id!==ex.id)}))} style={{fontSize:10,color:"#f87171",background:"none",border:"none",cursor:"pointer",marginTop:3,display:"flex",alignItems:"center",gap:3}}><TrashIcon style={{width:10,height:10}}/>rm</button>}
                  </div>
                ))}
                {editing&&<button type="button" onClick={()=>setData(d=>({...d,experience:[...d.experience,{id:uid(),position:"role",company:"corp",period:"",location:"",description:"",type:"",bullets:[],contact:""}]}))} style={{fontSize:11,color:A,background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:4,fontFamily:"'Courier New',monospace"}}><PlusIcon style={{width:12,height:12}}/>mkdir exp</button>}
              </div>
              <div>
                <SecH title="education"/>
                {data.education.map(e=>(
                  <div key={e.id} style={{marginBottom:10,paddingLeft:12,borderLeft:"1px solid rgba(0,255,65,0.2)"}}>
                    <E value={e.degree} onChange={v=>updEdu(e.id,{degree:v})} editing={editing} style={{fontSize:12,fontWeight:700,color:CT,display:"block",marginBottom:1}}/>
                    <E value={e.institution} onChange={v=>updEdu(e.id,{institution:v})} editing={editing} style={{fontSize:11,color:CB,display:"block",marginBottom:1}}/>
                    <E value={e.period} onChange={v=>updEdu(e.id,{period:v})} editing={editing} style={{fontSize:10,color:CM,fontStyle:"italic"}}/>
                    {editing&&<button type="button" onClick={()=>setData(d=>({...d,education:d.education.filter(x=>x.id!==e.id)}))} style={{fontSize:10,color:"#f87171",background:"none",border:"none",cursor:"pointer",marginTop:3,display:"flex",alignItems:"center",gap:3}}><TrashIcon style={{width:10,height:10}}/>rm</button>}
                  </div>
                ))}
                {editing&&<button type="button" onClick={()=>setData(d=>({...d,education:[...d.education,{id:uid(),degree:"degree",institution:"inst",period:"",location:"",type:"",bullets:[]}]}))} style={{fontSize:11,color:A,background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:4,fontFamily:"'Courier New',monospace"}}><PlusIcon style={{width:12,height:12}}/>mkdir edu</button>}
              </div>
            </div>
            <div style={{width:250,flexShrink:0,backgroundColor:"#080808",padding:"16px 18px 40px",borderLeft:"1px solid rgba(0,255,65,0.15)"}}>
              {[
                {title:"skills",c:<TagList tags={data.skills} onChange={t=>setData(d=>({...d,skills:t}))} editing={editing}/>},
                {title:"tech",c:<div>{data.technicalSkills.map(ts=>(<div key={ts.id} style={{marginBottom:6}}><E value={ts.name} onChange={v=>setData(d=>({...d,technicalSkills:d.technicalSkills.map(t=>t.id===ts.id?{...t,name:v}:t)}))} editing={editing} style={{fontSize:11,fontWeight:700,color:CT,display:"block"}}/><E value={ts.description} onChange={v=>setData(d=>({...d,technicalSkills:d.technicalSkills.map(t=>t.id===ts.id?{...t,description:v}:t)}))} editing={editing} style={{fontSize:10,color:CM,display:"block"}}/>{editing&&<button type="button" onClick={()=>setData(d=>({...d,technicalSkills:d.technicalSkills.filter(t=>t.id!==ts.id)}))} style={{fontSize:10,color:"#f87171",background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:2}}><XMarkIcon style={{width:10,height:10}}/>rm</button>}</div>))}{editing&&<button type="button" onClick={()=>setData(d=>({...d,technicalSkills:[...d.technicalSkills,{id:uid(),name:"tool",description:"v1"}]}))} style={{fontSize:11,color:A,background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:4,fontFamily:"monospace"}}><PlusIcon style={{width:11,height:11}}/>+</button>}</div>},
                {title:"soft",c:<TagList tags={data.softSkills} onChange={t=>setData(d=>({...d,softSkills:t}))} editing={editing}/>},
                {title:"references",c:<div>{data.references.map(r=>(<div key={r.id} style={{marginBottom:6}}><E value={r.company} onChange={v=>setData(d=>({...d,references:d.references.map(x=>x.id===r.id?{...x,company:v}:x)}))} editing={editing} style={{fontSize:11,fontWeight:700,color:CT,display:"block"}}/><E value={r.person??""} onChange={v=>setData(d=>({...d,references:d.references.map(x=>x.id===r.id?{...x,person:v}:x)}))} editing={editing} style={{fontSize:10,color:CM,display:"block"}}/>{editing&&<button type="button" onClick={()=>setData(d=>({...d,references:d.references.filter(x=>x.id!==r.id)}))} style={{fontSize:10,color:"#f87171",background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:2}}><XMarkIcon style={{width:10,height:10}}/>rm</button>}</div>))}{editing&&<button type="button" onClick={()=>setData(d=>({...d,references:[...d.references,{id:uid(),company:"corp",person:""}]}))} style={{fontSize:11,color:A,background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:4,fontFamily:"monospace"}}><PlusIcon style={{width:11,height:11}}/>+</button>}</div>},
                {title:"certs",c:<div>{data.certificates.map(c=>(<div key={c.id} style={{marginBottom:6}}><E value={c.name} onChange={v=>setData(d=>({...d,certificates:d.certificates.map(x=>x.id===c.id?{...x,name:v}:x)}))} editing={editing} multiline rows={2} style={{fontSize:10,color:CB,display:"block",lineHeight:1.4}}/><E value={c.period} onChange={v=>setData(d=>({...d,certificates:d.certificates.map(x=>x.id===c.id?{...x,period:v}:x)}))} editing={editing} style={{fontSize:9,color:CM,display:"block"}}/>{editing&&<button type="button" onClick={()=>setData(d=>({...d,certificates:d.certificates.filter(x=>x.id!==c.id)}))} style={{fontSize:10,color:"#f87171",background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:2}}><XMarkIcon style={{width:10,height:10}}/>rm</button>}</div>))}{editing&&<button type="button" onClick={()=>setData(d=>({...d,certificates:[...d.certificates,{id:uid(),name:"cert",period:""}]}))} style={{fontSize:11,color:A,background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:4,fontFamily:"monospace"}}><PlusIcon style={{width:11,height:11}}/>+</button>}</div>},
                {title:"languages",c:<div>{data.languages.map(l=>(<div key={l.id} style={{marginBottom:6}}><E value={l.language} onChange={v=>setData(d=>({...d,languages:d.languages.map(x=>x.id===l.id?{...x,language:v}:x)}))} editing={editing} style={{fontSize:11,fontWeight:700,color:CT,display:"block"}}/><E value={l.level} onChange={v=>setData(d=>({...d,languages:d.languages.map(x=>x.id===l.id?{...x,level:v}:x)}))} editing={editing} style={{fontSize:10,color:CM,display:"block"}}/>{editing&&<button type="button" onClick={()=>setData(d=>({...d,languages:d.languages.filter(x=>x.id!==l.id)}))} style={{fontSize:10,color:"#f87171",background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:2}}><XMarkIcon style={{width:10,height:10}}/>rm</button>}</div>))}{editing&&<button type="button" onClick={()=>setData(d=>({...d,languages:[...d.languages,{id:uid(),language:"lang",level:"lvl"}]}))} style={{fontSize:11,color:A,background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:4,fontFamily:"monospace"}}><PlusIcon style={{width:11,height:11}}/>+</button>}</div>},
                {title:"interests",c:<TagList tags={data.interests} onChange={t=>setData(d=>({...d,interests:t}))} editing={editing}/>},
              ].map(({title,c})=><div key={title} style={{marginBottom:16}}><SecH title={title}/>{c}</div>)}
            </div>
          </div>
          <div style={{height:1,backgroundColor:"rgba(0,255,65,0.15)"}}/>
          <div style={{backgroundColor:"#0a0a0a",padding:"6px 14px",fontSize:10,color:"rgba(0,255,65,0.3)",fontFamily:"'Courier New',monospace"}}>
            [Process completed] — press any key to continue
          </div>
        </div>
      </div>
    </div>
  </ColCtx.Provider>
  );
}
