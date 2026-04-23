"use client";
// ─── Anschreiben Template: Velvet (Lila & Gold, Luxuriös) ───────────────────
import { useState, useContext, createContext } from "react";
import { PrinterIcon, PencilSquareIcon, CheckIcon, PlusIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { FONTS, FONT_SIZES, CLData, DEFAULT_CL_DATA, usePersistentCLState } from "./shared";

const DEFAULT_COLORS = { A:"#f4c430", BG:"#fdf7e3", HD:"#1a0533", S2:"#f0e8d0", CT:"#f5e6c8", CB:"#3d2010", CM:"#7a6030" };
const hex2rgba=(hex:string,a:number)=>{const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);return `rgba(${r},${g},${b},${a})`;};
const ColCtx=createContext(DEFAULT_COLORS);

function E({value,onChange,editing,multiline=false,style={} as React.CSSProperties,placeholder="...",rows=4}:{value:string;onChange:(v:string)=>void;editing:boolean;multiline?:boolean;style?:React.CSSProperties;placeholder?:string;rows?:number;}) {
  const {A}=useContext(ColCtx);
  const s:React.CSSProperties={...style,background:hex2rgba(A,0.12),border:`1px solid ${hex2rgba(A,0.4)}`,borderRadius:3,padding:"2px 6px",outline:"none",width:"100%",fontFamily:"inherit",fontSize:"inherit",color:"inherit",lineHeight:"inherit",fontWeight:"inherit",boxSizing:"border-box"};
  if(!editing)return <span style={style}>{value||<span style={{opacity:0.3,fontStyle:"italic"}}>{placeholder}</span>}</span>;
  if(multiline)return <textarea style={{...s,resize:"vertical",display:"block"}} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={rows}/>;
  return <input style={s} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}/>;
}

export default function CL_Velvet() {
  const [data,setData]=usePersistentCLState<CLData>("cl_velvet_data",JSON.parse(JSON.stringify(DEFAULT_CL_DATA)));
  const [editing,setEditing]=useState(false);
  const [fontKey,setFontKey]=usePersistentCLState("cl_velvet_font","playfair");
  const [sizeKey,setSizeKey]=usePersistentCLState("cl_velvet_size","md");
  const [showDesign,setShowDesign]=useState(false);
  const [clrs,setClrs]=usePersistentCLState("cl_velvet_colors",DEFAULT_COLORS);
  const {A,BG,HD,S2,CT,CB,CM}=clrs;
  const curFont=FONTS.find(f=>f.key===fontKey)??FONTS[6];
  const curSize=FONT_SIZES.find(s=>s.key===sizeKey)??FONT_SIZES[2];
  const fnt=curFont.family;const scale=curSize.scale;
  const setP=(p:Partial<CLData["personal"]>)=>setData(d=>({...d,personal:{...d.personal,...p}}));
  const setR=(p:Partial<CLData["recipient"]>)=>setData(d=>({...d,recipient:{...d.recipient,...p}}));
  const doReset=()=>{setData(JSON.parse(JSON.stringify(DEFAULT_CL_DATA)));setClrs(DEFAULT_COLORS);setFontKey("playfair");setSizeKey("md");};

  return(
  <ColCtx.Provider value={clrs}>
    <div style={{minHeight:"100vh",background:"#100320",padding:"24px 16px",fontFamily:fnt}}>
      <style>{`
        ${curFont.gf?`@import url('https://fonts.googleapis.com/css2?family=${curFont.gf}&display=swap')`:""}
        .clvlv-doc,.clvlv-doc *{font-family:${fnt}!important;}
        @media print{
          @page{size:A4 portrait;margin:0;}
          *,*::before,*::after{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;}
          body *{visibility:hidden!important;}
          .clvlv-doc,.clvlv-doc *{visibility:visible!important;}
          .clvlv-doc{position:absolute!important;top:0!important;left:0!important;width:850px!important;min-height:1202px!important;overflow:visible!important;zoom:0.934!important;box-shadow:none!important;margin:0!important;}
          .clvlv-zoom{zoom:1!important;width:100%!important;}
          .clvlv-ctrl{display:none!important;}
        }
      `}</style>
      <div className="clvlv-ctrl" style={{maxWidth:850,margin:"0 auto 16px",display:"flex",gap:8,flexWrap:"wrap"}}>
        <button onClick={()=>setEditing(e=>!e)} style={{padding:"7px 16px",fontSize:13,fontWeight:600,cursor:"pointer",border:`1px solid ${editing?"#16a34a":A}`,borderRadius:4,backgroundColor:editing?"#16a34a":"transparent",color:editing?"white":A,display:"flex",alignItems:"center",gap:6}}>{editing?<CheckIcon style={{width:16,height:16}}/>:<PencilSquareIcon style={{width:16,height:16}}/>}{editing?"Fertig":"Bearbeiten"}</button>
        <button onClick={()=>window.print()} style={{padding:"7px 16px",fontSize:13,cursor:"pointer",border:`1px solid ${A}`,borderRadius:4,backgroundColor:hex2rgba(A,0.15),color:"#fdf7e3",display:"flex",alignItems:"center",gap:6}}><PrinterIcon style={{width:16,height:16}}/>Drucken</button>
        <button onClick={()=>setShowDesign(v=>!v)} style={{padding:"7px 16px",fontSize:13,cursor:"pointer",border:`1px solid ${showDesign?A:"#6a3a90"}`,borderRadius:4,backgroundColor:"transparent",color:showDesign?A:"#b090d0"}}>🎨 Design</button>
        <button onClick={doReset} style={{padding:"7px 16px",fontSize:13,cursor:"pointer",border:"1px solid #6a3a90",borderRadius:4,backgroundColor:"transparent",color:"#b090d0",display:"flex",alignItems:"center",gap:6}}><XMarkIcon style={{width:16,height:16}}/>Reset</button>
        {showDesign&&(<div style={{width:"100%",background:"#1e0740",border:`1px solid ${hex2rgba(A,0.25)}`,borderRadius:6,padding:"14px 18px",display:"flex",gap:24,flexWrap:"wrap"}}>
          <div><div style={{fontSize:10,fontWeight:700,color:CM,marginBottom:7,textTransform:"uppercase",letterSpacing:"0.1em"}}>Schriftart</div><div style={{display:"flex",gap:5,flexWrap:"wrap"}}>{FONTS.map(f=><button key={f.key} onClick={()=>setFontKey(f.key)} style={{padding:"3px 9px",border:`1px solid ${fontKey===f.key?A:hex2rgba(A,0.2)}`,borderRadius:3,background:fontKey===f.key?hex2rgba(A,0.1):"transparent",color:fontKey===f.key?A:CM,fontSize:11,cursor:"pointer",fontFamily:f.family}}>{f.label}</button>)}</div></div>
          <div><div style={{fontSize:10,fontWeight:700,color:CM,marginBottom:7,textTransform:"uppercase",letterSpacing:"0.1em"}}>Schriftgröße</div><div style={{display:"flex",gap:5}}>{FONT_SIZES.map(s=><button key={s.key} onClick={()=>setSizeKey(s.key)} style={{padding:"3px 12px",border:`1px solid ${sizeKey===s.key?A:hex2rgba(A,0.2)}`,borderRadius:3,background:sizeKey===s.key?hex2rgba(A,0.1):"transparent",color:sizeKey===s.key?A:CM,fontSize:11,cursor:"pointer"}}>{s.label}</button>)}</div></div>
          <div><div style={{fontSize:10,fontWeight:700,color:CM,marginBottom:7,textTransform:"uppercase",letterSpacing:"0.1em"}}>Farben</div><div style={{display:"flex",gap:10,flexWrap:"wrap",alignItems:"flex-end"}}>{([{k:"A" as const,l:"Gold"},{k:"BG" as const,l:"BG"},{k:"HD" as const,l:"Header"},{k:"S2" as const,l:"Panel"},{k:"CT" as const,l:"HText"},{k:"CB" as const,l:"Text"},{k:"CM" as const,l:"Meta"}]).map(({k,l})=>(<label key={k} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3,cursor:"pointer"}}><input type="color" value={clrs[k]} onChange={e=>setClrs(c=>({...c,[k]:e.target.value}))} style={{width:32,height:32,padding:2,border:`1px solid ${hex2rgba(A,0.3)}`,cursor:"pointer",background:"none"}}/><span style={{fontSize:9,color:CM}}>{l}</span></label>))}<button onClick={()=>setClrs(DEFAULT_COLORS)} style={{padding:"4px 10px",fontSize:11,border:`1px solid ${hex2rgba(A,0.3)}`,background:"transparent",color:CM,cursor:"pointer",alignSelf:"center"}}>↺</button></div></div>
        </div>)}
      </div>
      <div className="clvlv-doc" style={{width:850,margin:"0 auto",backgroundColor:BG,boxShadow:`0 4px 40px rgba(26,5,51,0.5)`,fontFamily:fnt,overflow:"hidden"}}>
        <div className="clvlv-zoom" style={{width:Math.round(850/scale),zoom:scale}}>
          <div style={{backgroundColor:HD,padding:"44px 60px 32px",borderBottom:`3px solid ${A}`}}>
            <div style={{fontSize:11,letterSpacing:"0.3em",color:A,textTransform:"uppercase",marginBottom:10,fontStyle:"italic"}}>✦ Bewerbungsschreiben ✦</div>
            <E value={data.personal.name} onChange={v=>setP({name:v})} editing={editing} style={{fontSize:38,fontWeight:700,color:CT,display:"block",lineHeight:1.1}}/>
            <div style={{height:1,background:`linear-gradient(90deg,${A},${hex2rgba(A,0.2)})`,margin:"14px 0 10px"}}/>
            <E value={data.personal.subtitle} onChange={v=>setP({subtitle:v})} editing={editing} style={{fontSize:12,color:hex2rgba("#f5e6c8",0.7),display:"block",fontStyle:"italic"}}/>
            <div style={{display:"flex",gap:28,flexWrap:"wrap",marginTop:14}}>{(["email","phone","location","website","linkedin","github"] as const).map(k=>data.personal[k]||editing?editing?<input key={k} value={data.personal[k]??""} onChange={e=>setP({[k]:e.target.value} as Partial<CLData["personal"]>)} style={{fontSize:10,color:hex2rgba(CT,0.8),background:hex2rgba(A,0.1),border:`1px solid ${hex2rgba(A,0.3)}`,padding:"2px 8px",outline:"none",fontFamily:"inherit",borderRadius:2}}/>:<span key={k} style={{fontSize:10,color:hex2rgba(CT,0.7)}}>{data.personal[k]}</span>:null)}</div>
          </div>
          <div style={{padding:"36px 60px 52px",color:CB}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:32,gap:16,alignItems:"flex-start"}}>
              <div style={{flex:1,padding:"12px 16px",background:S2,borderLeft:`4px solid ${A}`}}>{(["company","street","cityZip","country"] as const).map(k=><E key={k} value={data.recipient[k]??""} onChange={v=>setR({[k]:v} as Partial<CLData["recipient"]>)} editing={editing} style={{fontSize:12,color:CB,display:"block",lineHeight:1.8}}/>)}</div>
              <E value={data.date} onChange={v=>setData(d=>({...d,date:v}))} editing={editing} style={{fontSize:11,color:CM}}/>
            </div>
            <div style={{marginBottom:28,paddingBottom:14,borderBottom:`2px solid ${A}`}}><E value={data.subject} onChange={v=>setData(d=>({...d,subject:v}))} editing={editing} style={{fontSize:16,fontWeight:700,color:HD}}/></div>
            <E value={data.salutation} onChange={v=>setData(d=>({...d,salutation:v}))} editing={editing} style={{fontSize:12,color:CB,display:"block",marginBottom:18}}/>
            {data.bodyParagraphs.map((p,i)=>(<div key={i} style={{marginBottom:16,display:"flex",gap:8,alignItems:"flex-start"}}>{editing&&<button type="button" onClick={()=>setData(d=>({...d,bodyParagraphs:d.bodyParagraphs.filter((_,j)=>j!==i)}))} style={{padding:"2px 4px",fontSize:10,color:"#f87171",background:"none",border:"none",cursor:"pointer",marginTop:2,flexShrink:0}}>✕</button>}<E value={p} onChange={v=>setData(d=>({...d,bodyParagraphs:d.bodyParagraphs.map((x,j)=>j===i?v:x)}))} editing={editing} multiline rows={4} style={{fontSize:12,color:CB,lineHeight:1.9,display:"block"}}/></div>))}
            {editing&&<button type="button" onClick={()=>setData(d=>({...d,bodyParagraphs:[...d.bodyParagraphs,"Neuer Absatz..."]}))} style={{fontSize:11,color:A,background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:4,marginBottom:16}}><PlusIcon style={{width:12,height:12}}/>Absatz hinzufügen</button>}
            <div style={{marginTop:40}}><E value={data.closing} onChange={v=>setData(d=>({...d,closing:v}))} editing={editing} style={{fontSize:12,color:CB,display:"block",marginBottom:48}}/><div style={{width:160,height:1,background:`linear-gradient(90deg,${A},transparent)`,marginBottom:10}}/><E value={data.signatureName} onChange={v=>setData(d=>({...d,signatureName:v}))} editing={editing} style={{fontSize:18,fontWeight:700,color:HD}}/></div>
          </div>
        </div>
      </div>
    </div>
  </ColCtx.Provider>
  );
}
