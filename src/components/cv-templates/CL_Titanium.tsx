"use client";
// ─── Anschreiben Template: Titanium (Dunkles Metall, Industriell) ────────────
import { useState, useContext, createContext } from "react";
import { PrinterIcon, PencilSquareIcon, CheckIcon, PlusIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { FONTS, FONT_SIZES, CLData, DEFAULT_CL_DATA, usePersistentCLState } from "./shared";

const DEFAULT_COLORS = { A:"#90a4ae", BG:"#1c2833", HD:"#212e3a", S2:"#2c3e50", CT:"#cfd8dc", CB:"#b0bec5", CM:"#607d8b" };
const hex2rgba=(hex:string,a:number)=>{const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);return `rgba(${r},${g},${b},${a})`;};
const ColCtx=createContext(DEFAULT_COLORS);

function E({value,onChange,editing,multiline=false,style={} as React.CSSProperties,placeholder="...",rows=4}:{value:string;onChange:(v:string)=>void;editing:boolean;multiline?:boolean;style?:React.CSSProperties;placeholder?:string;rows?:number;}) {
  const {A}=useContext(ColCtx);
  const s:React.CSSProperties={...style,background:hex2rgba(A,0.1),border:`1px solid ${hex2rgba(A,0.35)}`,borderRadius:2,padding:"2px 6px",outline:"none",width:"100%",fontFamily:"inherit",fontSize:"inherit",color:"inherit",lineHeight:"inherit",fontWeight:"inherit",boxSizing:"border-box"};
  if(!editing)return <span style={style}>{value||<span style={{opacity:0.3,fontStyle:"italic"}}>{placeholder}</span>}</span>;
  if(multiline)return <textarea style={{...s,resize:"vertical",display:"block"}} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={rows}/>;
  return <input style={s} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}/>;
}

export default function CL_Titanium() {
  const [data,setData]=usePersistentCLState<CLData>("cl_titanium_data",JSON.parse(JSON.stringify(DEFAULT_CL_DATA)));
  const [editing,setEditing]=useState(false);
  const [fontKey,setFontKey]=usePersistentCLState("cl_titanium_font","inter");
  const [sizeKey,setSizeKey]=usePersistentCLState("cl_titanium_size","md");
  const [showDesign,setShowDesign]=useState(false);
  const [clrs,setClrs]=usePersistentCLState("cl_titanium_colors",DEFAULT_COLORS);
  const {A,BG,HD,S2,CT,CB,CM}=clrs;
  const curFont=FONTS.find(f=>f.key===fontKey)??FONTS[2];
  const curSize=FONT_SIZES.find(s=>s.key===sizeKey)??FONT_SIZES[2];
  const fnt=curFont.family;const scale=curSize.scale;
  const setP=(p:Partial<CLData["personal"]>)=>setData(d=>({...d,personal:{...d.personal,...p}}));
  const setR=(p:Partial<CLData["recipient"]>)=>setData(d=>({...d,recipient:{...d.recipient,...p}}));
  const doReset=()=>{setData(JSON.parse(JSON.stringify(DEFAULT_CL_DATA)));setClrs(DEFAULT_COLORS);setFontKey("inter");setSizeKey("md");};

  return(
  <ColCtx.Provider value={clrs}>
    <div style={{minHeight:"100vh",background:"#0d1117",padding:"24px 16px",fontFamily:fnt}}>
      <style>{`
        ${curFont.gf?`@import url('https://fonts.googleapis.com/css2?family=${curFont.gf}&display=swap')`:""}
        .cltti-doc,.cltti-doc *{font-family:${fnt}!important;}
        @media print{
          @page{size:A4 portrait;margin:0;}
          *,*::before,*::after{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;}
          body *{visibility:hidden!important;}
          .cltti-doc,.cltti-doc *{visibility:visible!important;}
          .cltti-doc{position:absolute!important;top:0!important;left:0!important;width:850px!important;min-height:1202px!important;overflow:visible!important;zoom:0.934!important;box-shadow:none!important;margin:0!important;}
          .cltti-zoom{zoom:1!important;width:100%!important;}
          .cltti-ctrl{display:none!important;}
        }
      `}</style>
      <div className="cltti-ctrl" style={{maxWidth:850,margin:"0 auto 16px",display:"flex",gap:8,flexWrap:"wrap"}}>
        <button onClick={()=>setEditing(e=>!e)} style={{padding:"7px 16px",fontSize:13,fontWeight:600,cursor:"pointer",border:`1px solid ${editing?"#16a34a":A}`,borderRadius:3,backgroundColor:editing?"#16a34a":hex2rgba(A,0.15),color:editing?"white":A,display:"flex",alignItems:"center",gap:6}}>{editing?<CheckIcon style={{width:16,height:16}}/>:<PencilSquareIcon style={{width:16,height:16}}/>}{editing?"Fertig":"Bearbeiten"}</button>
        <button onClick={()=>window.print()} style={{padding:"7px 16px",fontSize:13,cursor:"pointer",border:`1px solid ${A}`,borderRadius:3,backgroundColor:hex2rgba(A,0.1),color:A,display:"flex",alignItems:"center",gap:6}}><PrinterIcon style={{width:16,height:16}}/>Drucken</button>
        <button onClick={()=>setShowDesign(v=>!v)} style={{padding:"7px 16px",fontSize:13,cursor:"pointer",border:`1px solid ${showDesign?A:CM}`,borderRadius:3,backgroundColor:"transparent",color:showDesign?A:CM}}>🎨 Design</button>
        <button onClick={doReset} style={{padding:"7px 16px",fontSize:13,cursor:"pointer",border:`1px solid ${CM}`,borderRadius:3,backgroundColor:"transparent",color:CM,display:"flex",alignItems:"center",gap:6}}><XMarkIcon style={{width:16,height:16}}/>Reset</button>
        {showDesign&&(<div style={{width:"100%",background:S2,border:`1px solid ${hex2rgba(A,0.25)}`,borderRadius:4,padding:"14px 18px",display:"flex",gap:24,flexWrap:"wrap"}}>
          <div><div style={{fontSize:10,fontWeight:700,color:CM,marginBottom:7,textTransform:"uppercase",letterSpacing:"0.1em"}}>Schriftart</div><div style={{display:"flex",gap:5,flexWrap:"wrap"}}>{FONTS.map(f=><button key={f.key} onClick={()=>setFontKey(f.key)} style={{padding:"3px 9px",border:`1px solid ${fontKey===f.key?A:hex2rgba(A,0.2)}`,borderRadius:3,background:fontKey===f.key?hex2rgba(A,0.12):"transparent",color:fontKey===f.key?A:CM,fontSize:11,cursor:"pointer",fontFamily:f.family}}>{f.label}</button>)}</div></div>
          <div><div style={{fontSize:10,fontWeight:700,color:CM,marginBottom:7,textTransform:"uppercase",letterSpacing:"0.1em"}}>Schriftgröße</div><div style={{display:"flex",gap:5}}>{FONT_SIZES.map(s=><button key={s.key} onClick={()=>setSizeKey(s.key)} style={{padding:"3px 12px",border:`1px solid ${sizeKey===s.key?A:hex2rgba(A,0.2)}`,borderRadius:3,background:sizeKey===s.key?hex2rgba(A,0.12):"transparent",color:sizeKey===s.key?A:CM,fontSize:11,cursor:"pointer"}}>{s.label}</button>)}</div></div>
          <div><div style={{fontSize:10,fontWeight:700,color:CM,marginBottom:7,textTransform:"uppercase",letterSpacing:"0.1em"}}>Farben</div><div style={{display:"flex",gap:10,flexWrap:"wrap",alignItems:"flex-end"}}>{([{k:"A" as const,l:"Metall"},{k:"BG" as const,l:"BG"},{k:"HD" as const,l:"Header"},{k:"S2" as const,l:"Panel"},{k:"CT" as const,l:"HText"},{k:"CB" as const,l:"Text"},{k:"CM" as const,l:"Meta"}]).map(({k,l})=>(<label key={k} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3,cursor:"pointer"}}><input type="color" value={clrs[k]} onChange={e=>setClrs(c=>({...c,[k]:e.target.value}))} style={{width:32,height:32,padding:2,border:`1px solid ${hex2rgba(A,0.3)}`,cursor:"pointer",background:"none"}}/><span style={{fontSize:9,color:CM}}>{l}</span></label>))}<button onClick={()=>setClrs(DEFAULT_COLORS)} style={{padding:"4px 10px",fontSize:11,border:`1px solid ${hex2rgba(A,0.3)}`,background:"transparent",color:CM,cursor:"pointer",alignSelf:"center"}}>↺</button></div></div>
        </div>)}
      </div>
      <div className="cltti-doc" style={{width:850,margin:"0 auto",backgroundColor:BG,boxShadow:`0 4px 40px rgba(0,0,0,0.5)`,fontFamily:fnt,overflow:"hidden",border:`1px solid ${hex2rgba(A,0.1)}`}}>
        <div className="cltti-zoom" style={{width:Math.round(850/scale),zoom:scale}}>
          <div style={{height:3,background:`linear-gradient(90deg,${A},${hex2rgba(A,0.3)},${A})`}}/>
          <div style={{backgroundColor:HD,padding:"40px 58px 28px",borderBottom:`1px solid ${hex2rgba(A,0.15)}`}}>
            <E value={data.personal.name} onChange={v=>setP({name:v})} editing={editing} style={{fontSize:34,fontWeight:700,color:CT,display:"block",letterSpacing:"-0.015em"}}/>
            <div style={{height:1,background:`linear-gradient(90deg,${A},${hex2rgba(A,0.1)})`,margin:"10px 0 8px"}}/>
            <E value={data.personal.subtitle} onChange={v=>setP({subtitle:v})} editing={editing} style={{fontSize:11,color:A,display:"block",letterSpacing:"0.08em",textTransform:"uppercase"}}/>
            <div style={{display:"flex",gap:24,flexWrap:"wrap",marginTop:14}}>{(["email","phone","location","website","linkedin","github"] as const).map(k=>data.personal[k]||editing?editing?<input key={k} value={data.personal[k]??""} onChange={e=>setP({[k]:e.target.value} as Partial<CLData["personal"]>)} style={{fontSize:10,color:CB,background:hex2rgba(A,0.08),border:`1px solid ${hex2rgba(A,0.2)}`,padding:"2px 8px",outline:"none",fontFamily:"inherit",borderRadius:2}}/>:<span key={k} style={{fontSize:10,color:CM}}>{data.personal[k]}</span>:null)}</div>
          </div>
          <div style={{padding:"32px 58px 48px",color:CB}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:28,gap:16,alignItems:"flex-start"}}>
              <div style={{flex:1,padding:"12px 14px",background:S2,borderLeft:`2px solid ${hex2rgba(A,0.6)}`}}>{(["company","street","cityZip","country"] as const).map(k=><E key={k} value={data.recipient[k]??""} onChange={v=>setR({[k]:v} as Partial<CLData["recipient"]>)} editing={editing} style={{fontSize:12,color:CB,display:"block",lineHeight:1.8}}/>)}</div>
              <E value={data.date} onChange={v=>setData(d=>({...d,date:v}))} editing={editing} style={{fontSize:10,color:CM}}/>
            </div>
            <div style={{marginBottom:24,paddingBottom:10,borderBottom:`1px solid ${hex2rgba(A,0.25)}`}}><E value={data.subject} onChange={v=>setData(d=>({...d,subject:v}))} editing={editing} style={{fontSize:14,fontWeight:700,color:CT,letterSpacing:"0.02em"}}/></div>
            <E value={data.salutation} onChange={v=>setData(d=>({...d,salutation:v}))} editing={editing} style={{fontSize:12,color:CB,display:"block",marginBottom:16}}/>
            {data.bodyParagraphs.map((p,i)=>(<div key={i} style={{marginBottom:16,display:"flex",gap:8,alignItems:"flex-start"}}>{editing&&<button type="button" onClick={()=>setData(d=>({...d,bodyParagraphs:d.bodyParagraphs.filter((_,j)=>j!==i)}))} style={{padding:"2px 4px",fontSize:10,color:"#f87171",background:"none",border:"none",cursor:"pointer",marginTop:2,flexShrink:0}}>✕</button>}<E value={p} onChange={v=>setData(d=>({...d,bodyParagraphs:d.bodyParagraphs.map((x,j)=>j===i?v:x)}))} editing={editing} multiline rows={4} style={{fontSize:12,color:CB,lineHeight:1.9,display:"block"}}/></div>))}
            {editing&&<button type="button" onClick={()=>setData(d=>({...d,bodyParagraphs:[...d.bodyParagraphs,"Neuer Absatz..."]}))} style={{fontSize:11,color:A,background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:4,marginBottom:16}}><PlusIcon style={{width:12,height:12}}/>Absatz hinzufügen</button>}
            <div style={{marginTop:40}}><E value={data.closing} onChange={v=>setData(d=>({...d,closing:v}))} editing={editing} style={{fontSize:12,color:CB,display:"block",marginBottom:44}}/><div style={{width:130,height:1,background:`linear-gradient(90deg,${A},transparent)`,marginBottom:10}}/><E value={data.signatureName} onChange={v=>setData(d=>({...d,signatureName:v}))} editing={editing} style={{fontSize:17,fontWeight:700,color:CT}}/></div>
          </div>
          <div style={{height:3,background:`linear-gradient(90deg,${A},${hex2rgba(A,0.3)},${A})`}}/>
        </div>
      </div>
    </div>
  </ColCtx.Provider>
  );
}
