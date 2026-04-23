"use client";
// ─── Anschreiben Template: Terminal (CLI / Kommandozeilen Stil) ──────────────
import { useState, useContext, createContext } from "react";
import { PrinterIcon, PencilSquareIcon, CheckIcon, PlusIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { FONTS, FONT_SIZES, CLData, DEFAULT_CL_DATA, uid, usePersistentCLState } from "./shared";

const DEFAULT_COLORS = { A:"#00ff41", BG:"#0a0a0a", HD:"#050505", S2:"#111111", CT:"#00ff41", CB:"#a0f0a0", CM:"#3a8a3a" };
const hex2rgba = (hex:string,a:number) => { const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16); return `rgba(${r},${g},${b},${a})`; };
const ColCtx = createContext(DEFAULT_COLORS);

function E({ value, onChange, editing, multiline=false, style={} as React.CSSProperties, placeholder="...", rows=4 }: {
  value:string; onChange:(v:string)=>void; editing:boolean;
  multiline?:boolean; style?:React.CSSProperties; placeholder?:string; rows?:number;
}) {
  const {A}=useContext(ColCtx);
  const base: React.CSSProperties = { ...style, background: hex2rgba(A,0.08), border:`1px solid ${A}44`, borderRadius:0, padding:"2px 6px", outline:"none", width:"100%", fontFamily:"inherit", fontSize:"inherit", color:"inherit", lineHeight:"inherit", fontWeight:"inherit", boxSizing:"border-box" };
  if (!editing) return <span style={style}>{value||<span style={{opacity:0.35,fontStyle:"italic"}}>{placeholder}</span>}</span>;
  if (multiline) return <textarea style={{...base,resize:"vertical",display:"block"}} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={rows}/>;
  return <input style={base} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}/>;
}

export default function CL_Terminal() {
  const [data, setData] = usePersistentCLState<CLData>('cl_terminal_data', JSON.parse(JSON.stringify(DEFAULT_CL_DATA)));
  const [editing, setEditing] = useState(false);
  const [fontKey, setFontKey] = usePersistentCLState('cl_terminal_font', "roboto");
  const [sizeKey, setSizeKey] = usePersistentCLState('cl_terminal_size', "md");
  const [showDesign, setShowDesign] = useState(false);
  const [clrs, setClrs] = usePersistentCLState('cl_terminal_colors', DEFAULT_COLORS);
  const {A,BG,HD,S2,CT,CB,CM} = clrs;
  const curFont = FONTS.find(f=>f.key===fontKey)??FONTS[0];
  const curSize = FONT_SIZES.find(s=>s.key===sizeKey)??FONT_SIZES[2];
  const fnt = `'Courier New', Courier, monospace`; const scale = curSize.scale;
  const setP = (p:Partial<CLData["personal"]>)=>setData(d=>({...d,personal:{...d.personal,...p}}));
  const setR = (p:Partial<CLData["recipient"]>)=>setData(d=>({...d,recipient:{...d.recipient,...p}}));
  const doReset = ()=>{setData(JSON.parse(JSON.stringify(DEFAULT_CL_DATA)));setClrs(DEFAULT_COLORS);setFontKey("roboto");setSizeKey("md");};
  const scanlines = `repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.3) 2px,rgba(0,0,0,0.3) 4px)`;

  return (
  <ColCtx.Provider value={clrs}>
    <div style={{minHeight:"100vh",background:"#000000",padding:"24px 16px",fontFamily:fnt}}>
      <style>{`
        .clt-doc, .clt-doc * { font-family: 'Courier New', Courier, monospace !important; }
        .clt-cursor::after { content: '_'; animation: blink 1s step-end infinite; }
        @keyframes blink { 0%,100%{opacity:1;} 50%{opacity:0;} }
        @media print {
          @page{size:A4 portrait;margin:0;}
          *,*::before,*::after{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;}
          body *{visibility:hidden!important;}
          .clt-doc,.clt-doc *{visibility:visible!important;}
          .clt-doc{position:absolute!important;top:0!important;left:0!important;width:210mm!important;box-shadow:none!important;margin:0!important;}
          .clt-zoom{zoom:1!important;width:100%!important;}
          .clt-ctrl{display:none!important;}
          .clt-cursor::after{display:none!important;}
        }
      `}</style>

      {/* Controls */}
      <div className="clt-ctrl" style={{maxWidth:850,margin:"0 auto 16px",display:"flex",gap:8,flexWrap:"wrap"}}>
        <button onClick={()=>setEditing(e=>!e)} style={{padding:"7px 16px",borderRadius:0,fontSize:13,fontFamily:"monospace",cursor:"pointer",border:`1px solid ${A}`,backgroundColor:editing?"#16a34a":hex2rgba(A,0.12),color:editing?"white":A,display:"flex",alignItems:"center",gap:6}}>
          {editing?<CheckIcon style={{width:16,height:16}}/>:<PencilSquareIcon style={{width:16,height:16}}/>}$ {editing?"exit edit":"vim"}
        </button>
        <button onClick={()=>window.print()} style={{padding:"7px 16px",borderRadius:0,fontSize:13,fontFamily:"monospace",cursor:"pointer",border:"1px solid #555",backgroundColor:"transparent",color:"#aaa",display:"flex",alignItems:"center",gap:6}}>
          <PrinterIcon style={{width:16,height:16}}/>$ print
        </button>
        <button onClick={()=>setShowDesign(v=>!v)} style={{padding:"7px 16px",borderRadius:0,fontSize:13,fontFamily:"monospace",cursor:"pointer",border:`1px solid ${showDesign?A:"#555"}`,backgroundColor:"transparent",color:showDesign?A:"#aaa"}}>$ theme</button>
        <button onClick={doReset} style={{padding:"7px 16px",borderRadius:0,fontSize:13,fontFamily:"monospace",cursor:"pointer",border:"1px solid #555",backgroundColor:"transparent",color:"#aaa",display:"flex",alignItems:"center",gap:6}}>
          <XMarkIcon style={{width:16,height:16}}/>$ reset
        </button>
        {showDesign&&(
          <div style={{width:"100%",background:"#0a0a0a",border:`1px solid ${A}33`,borderRadius:0,padding:"14px 18px",display:"flex",gap:24,flexWrap:"wrap"}}>
            <div><div style={{fontSize:10,fontFamily:"monospace",color:CM,marginBottom:7,textTransform:"uppercase",letterSpacing:"0.1em"}}># FONT</div>
              <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>{FONTS.map(f=><button key={f.key} onClick={()=>setFontKey(f.key)} style={{padding:"3px 9px",borderRadius:0,border:`1px solid ${fontKey===f.key?A:"#444"}`,background:fontKey===f.key?hex2rgba(A,0.15):"transparent",color:fontKey===f.key?A:"#555",fontSize:11,cursor:"pointer",fontFamily:"monospace"}}>{f.label}</button>)}</div>
            </div>
            <div><div style={{fontSize:10,fontFamily:"monospace",color:CM,marginBottom:7,textTransform:"uppercase",letterSpacing:"0.1em"}}># SIZE</div>
              <div style={{display:"flex",gap:5}}>{FONT_SIZES.map(s=><button key={s.key} onClick={()=>setSizeKey(s.key)} style={{padding:"3px 12px",borderRadius:0,border:`1px solid ${sizeKey===s.key?A:"#444"}`,background:sizeKey===s.key?hex2rgba(A,0.15):"transparent",color:sizeKey===s.key?A:"#555",fontSize:11,cursor:"pointer",fontFamily:"monospace"}}>{s.label}</button>)}</div>
            </div>
            <div style={{flex:1}}><div style={{fontSize:10,fontFamily:"monospace",color:CM,marginBottom:7,textTransform:"uppercase",letterSpacing:"0.1em"}}># COLORS</div>
              <div style={{display:"flex",gap:10,flexWrap:"wrap",alignItems:"flex-end"}}>
                {([{k:"A" as const,l:"FG"},{k:"BG" as const,l:"BG"},{k:"HD" as const,l:"Header"},{k:"S2" as const,l:"Panel"},{k:"CT" as const,l:"Prompt"},{k:"CB" as const,l:"Body"},{k:"CM" as const,l:"Comment"}]).map(({k,l})=>(
                  <label key={k} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3,cursor:"pointer"}}>
                    <input type="color" value={clrs[k]} onChange={e=>setClrs(c=>({...c,[k]:e.target.value}))} style={{width:32,height:32,padding:2,borderRadius:0,border:`1px solid ${A}44`,cursor:"pointer",background:"none"}}/>
                    <span style={{fontSize:9,color:CM,fontFamily:"monospace"}}>{l}</span>
                  </label>
                ))}
                <button onClick={()=>setClrs(DEFAULT_COLORS)} style={{padding:"4px 10px",borderRadius:0,fontSize:11,border:`1px solid ${A}44`,background:"transparent",color:CM,cursor:"pointer",alignSelf:"center",fontFamily:"monospace"}}>$ reset</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Document */}
      <div className="clt-doc" style={{width:850,margin:"0 auto",backgroundColor:BG,boxShadow:`0 0 40px ${hex2rgba(A,0.15)}`,position:"relative",overflow:"hidden",border:`1px solid ${A}22`}}>
        {/* Scanlines overlay */}
        <div style={{position:"absolute",inset:0,backgroundImage:scanlines,pointerEvents:"none",zIndex:10,opacity:0.35}}/>

        <div className="clt-zoom" style={{width:Math.round(850/scale),zoom:scale}}>
          {/* Window title bar */}
          <div style={{background:HD,padding:"8px 16px",display:"flex",alignItems:"center",gap:10,borderBottom:`1px solid ${A}33`}}>
            <span style={{width:12,height:12,borderRadius:"50%",background:"#ff5f57",display:"inline-block"}}/>
            <span style={{width:12,height:12,borderRadius:"50%",background:"#ffbd2e",display:"inline-block"}}/>
            <span style={{width:12,height:12,borderRadius:"50%",background:"#28c940",display:"inline-block"}}/>
            <span style={{flex:1,textAlign:"center",fontSize:11,color:CM,fontFamily:"monospace"}}>bewerbung.sh — terminal</span>
          </div>

          {/* Boot sequence / header */}
          <div style={{background:HD,padding:"20px 32px 16px",borderBottom:`1px solid ${A}22`,zIndex:1,position:"relative"}}>
            <div style={{fontSize:9,color:CM,marginBottom:4,fontFamily:"monospace"}}>[user@system ~]$ ./bewerbung.sh --init</div>
            <div style={{color:A,fontSize:9,marginBottom:10,fontFamily:"monospace"}}>Loading profile...</div>
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              <span style={{color:A,fontSize:26,fontWeight:700,fontFamily:"monospace"}}>{'>'}_</span>
              <E value={data.personal.name} onChange={v=>setP({name:v})} editing={editing} style={{fontSize:26,fontWeight:700,color:CT,fontFamily:"monospace"}}/>
            </div>
            <div style={{marginTop:4}}>
              <span style={{color:CM,fontSize:10,fontFamily:"monospace"}}># </span>
              <E value={data.personal.subtitle} onChange={v=>setP({subtitle:v})} editing={editing} style={{fontSize:10,color:CM,fontFamily:"monospace"}}/>
            </div>
            <div style={{marginTop:12,display:"flex",gap:20,flexWrap:"wrap"}}>
              {[data.personal.email,data.personal.phone,data.personal.location,data.personal.website,data.personal.linkedin,data.personal.github].map((v,i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",gap:4}}>
                  <span style={{color:A,fontFamily:"monospace",fontSize:10}}>{["✉","✆","⌖","⚬"][i]}</span>
                  <E value={v} onChange={nv=>setP([{email:nv},{phone:nv},{location:nv},{website:nv},{linkedin:nv},{github:nv}][i])} editing={editing} style={{fontSize:10,color:CB,fontFamily:"monospace"}}/>
                </div>
              ))}
            </div>
          </div>

          {/* Body */}
          <div style={{padding:"24px 32px 40px",color:CB,position:"relative",zIndex:1}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:20,gap:16,alignItems:"flex-start"}}>
              <div style={{background:S2,padding:"12px 16px",flex:1,border:`1px solid ${A}22`}}>
                <div style={{color:A,fontSize:9,marginBottom:6,fontFamily:"monospace"}}>[an]</div>
                {[data.recipient.company,data.recipient.street,data.recipient.cityZip,data.recipient.country].map((v,i)=>(
                  <E key={i} value={v} onChange={nv=>setR([{company:nv},{street:nv},{cityZip:nv},{country:nv}][i])} editing={editing} style={{fontSize:11,color:CB,display:"block",lineHeight:1.7,fontFamily:"monospace"}}/>
                ))}
              </div>
              <div style={{textAlign:"right",paddingTop:4}}>
                <div style={{fontSize:9,color:CM,marginBottom:3,fontFamily:"monospace"}}>timestamp:</div>
                <E value={data.date} onChange={v=>setData(d=>({...d,date:v}))} editing={editing} style={{fontSize:10,color:A,fontFamily:"monospace"}}/>
              </div>
            </div>

            <div style={{marginBottom:18,color:A,fontFamily:"monospace",fontSize:9,display:"flex",alignItems:"center",gap:8}}>
              <span>$</span>
              <span style={{color:CM}}>cat</span>
              <span style={{color:CB}}>betreff.txt</span>
            </div>
            <div style={{marginBottom:20,borderLeft:`2px solid ${A}`,paddingLeft:12}}>
              <E value={data.subject} onChange={v=>setData(d=>({...d,subject:v}))} editing={editing} style={{fontSize:13,fontWeight:700,color:CT,fontFamily:"monospace"}}/>
            </div>

            <div style={{color:A,fontSize:9,marginBottom:12,fontFamily:"monospace"}}>$ cat anschreiben.txt | less</div>
            <E value={data.salutation} onChange={v=>setData(d=>({...d,salutation:v}))} editing={editing} style={{fontSize:12,color:CB,display:"block",marginBottom:18,fontFamily:"monospace"}}/>

            {data.bodyParagraphs.map((p,i)=>(
              <div key={i} style={{marginBottom:14,display:"flex",gap:8,alignItems:"flex-start"}}>
                {editing&&<button type="button" onClick={()=>setData(d=>({...d,bodyParagraphs:d.bodyParagraphs.filter((_,j)=>j!==i)}))} style={{padding:"2px 4px",fontSize:10,color:"#f87171",background:"none",border:"none",cursor:"pointer",marginTop:2,flexShrink:0}}>✕</button>}
                <E value={p} onChange={v=>setData(d=>({...d,bodyParagraphs:d.bodyParagraphs.map((x,j)=>j===i?v:x)}))} editing={editing} multiline rows={4} style={{fontSize:11,color:CB,lineHeight:1.8,display:"block",fontFamily:"monospace"}}/>
              </div>
            ))}
            {editing&&<button type="button" onClick={()=>setData(d=>({...d,bodyParagraphs:[...d.bodyParagraphs,"Neuer Absatz..."]}))} style={{fontSize:11,color:A,background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:4,marginBottom:16,fontFamily:"monospace"}}><PlusIcon style={{width:12,height:12}}/>$ append paragraph</button>}

            <div style={{marginTop:28,paddingTop:20,borderTop:`1px dashed ${A}33`}}>
              <E value={data.closing} onChange={v=>setData(d=>({...d,closing:v}))} editing={editing} style={{fontSize:11,color:CB,display:"block",marginBottom:32,fontFamily:"monospace"}}/>
              <div style={{fontSize:9,color:CM,marginBottom:4,fontFamily:"monospace"}}># signatur</div>
              <div className="clt-cursor">
                <E value={data.signatureName} onChange={v=>setData(d=>({...d,signatureName:v}))} editing={editing} style={{fontSize:16,fontWeight:700,color:CT,letterSpacing:"0.04em",display:"inline",fontFamily:"monospace"}}/>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </ColCtx.Provider>
  );
}
