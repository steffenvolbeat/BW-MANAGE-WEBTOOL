"use client";
import { useState, useRef, useCallback } from "react";
import {
  PrinterIcon, PencilSquareIcon, CheckIcon,
  PlusIcon, TrashIcon, EnvelopeIcon, PhoneIcon,
  MapPinIcon, LinkIcon, XMarkIcon,
} from "@heroicons/react/24/outline";

// ─── Tokens ───────────────────────────────────────────────────────────────────
const A   = "#3ecfd6";
const SBG = "#1d2a3a";
const TBG = "#0f1e2e";
const FNT = "'Nunito','Calibri','Segoe UI',Arial,sans-serif";
const CT  = "#111827";
const CB  = "#374151";
const CM  = "#6b7280";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Project   { id:string; title:string; period:string; bullets:string[]; link?:string; }
interface Education { id:string; degree:string; institution:string; period:string; location:string; type:string; bullets:string[]; }
interface Experience{ id:string; position:string; company:string; period:string; location:string; description?:string; type?:string; bullets:string[]; contact?:string; }
interface TechSkill { id:string; name:string; description:string; }
interface Language  { id:string; language:string; level:string; }
interface Certificate{ id:string; name:string; period:string; }
interface Reference { id:string; company:string; person?:string; }
interface CVData {
  personal: { name:string; subtitle:string; bio:string; email:string; phone:string; location:string; linkedin:string; github:string; website?:string; };
  projects: Project[]; education: Education[]; experience: Experience[];
  skills: string[]; technicalSkills: TechSkill[]; softSkills: string[];
  references: Reference[]; certificates: Certificate[]; languages: Language[]; interests: string[];
}

const uid = () => Math.random().toString(36).slice(2,9);

// ─── Default Data ─────────────────────────────────────────────────────────────
const DEFAULT_DATA: CVData = {
  personal: {
    name:     "Steffen Lorenz",
    subtitle: "Webentwickler / Fullstack",
    bio:      "Als motivierter und engagierter Web-Entwickler mit Fokus auf strukturierte, semantische und performante Weblösungen. Meine Schwerpunkte liegen in HTML5, CSS3, JavaScript, Next.js und SQL. Durch meine IT-Umschulung und vielseitige Praxiserfahrung arbeite ich analytisch, zuverlässig und lösungsorientiert. Eigene Projekte und ständiges Lernen treiben mich an – ebenso wie Musik, E-Gitarren und Laufen.",
    email:    "steffen.konstanz@gmx.ch",
    phone:    "0173 4235651",
    location: "Erfurt, Deutschland",
    linkedin: "linkedin.com/in/steffenlorenz-8412873b2",
    github:   "github.com/steffenvolbeat",
    website:  "",
  },
  projects: [
    { id:uid(), title:"Band-Website", period:"08/2025 - In Progress", link:"steffenvolbeatBand-Website", bullets:[
      "Im Projekt \"Band-Website\" entwickelte ich eine moderne Band-Webseite auf Basis von React 19, Vite 7, Tailwind CSS 4 und React Router.",
      "Die Anwendung ist als mehrseitige Frontend-Struktur aufgebaut und umfasst die Bereiche Home, Band, About, Tour, Media und Contact.",
      "Für eine konsistente Benutzerführung implementierte ich ein zentrales RootLayout mit Navigation, Footer und einem einheitlich dunkel gestalteten Seitenaufbau.",
      "Die Inhalte werden datengetrieben über einen generischen Fetch-Hook aus lokalen JSON-Dateien geladen, unter anderem für Band- und Albumdaten auf der Startseite.",
      "Zusätzlich integrierte ich im Medienbereich eine Foto-Galerie und Videokomponenten sowie im Kontaktbereich Social-Media-Links und ein strukturiertes Kontaktformular.",
    ]},
    { id:uid(), title:"LandingPage", period:"09/2025 - In Progress", link:"steffenvolbeatLanding_Page", bullets:[
      "Im Projekt \"Landing_Page\" entwickelte ich im Team eine moderne Landingpage auf Basis von Next.js 15.5.4, React 19.1.0, TypeScript und Tailwind CSS 4.",
      "Die Anwendung ist modular aufgebaut und gliedert sich in eine zentrale App-Struktur mit Komponenten für Header, Footer, Kundenbereich, Demo-Sektion, Registrierungs-Swiper und weitere Inhaltsblöcke.",
      "Für die Benutzeroberfläche integrierte ich ein Theme-System mit ThemeProvider sowie einen Dark/Light Mode mit angepassten Farbvariablen, automatischer Systemerkennung und sanften Übergängen.",
      "Zusätzlich nutzt das Projekt next/font mit Geist und Geist Mono und ist als moderne Business-Landingpage aufgebaut.",
      "Interaktive UI-Elemente werden unter anderem mit Swiper umgesetzt.",
    ]},
    { id:uid(), title:"FullStack-Todo-Web-App", period:"10/2025 - In Progress", link:"FullStack-Todo-Web-App", bullets:[
      "Im Projekt \"FullStack Todo Web-App\" entwickelte ich eine moderne, responsive Aufgabenverwaltung auf Basis von Next.js 16, React 19, TypeScript, Prisma und PostgreSQL.",
      "Die Anwendung wurde als FullStack-Lösung mit Next.js App Router, serverseitigem Rendering und RESTful API-Routen umgesetzt.",
      "Funktional umfasst das Projekt die vollständige CRUD-Verwaltung von Todos einschließlich Erstellen, Bearbeitung, Löschen und Statusänderung.",
      "Zusätzlich integrierte ich persistente Datenspeicherung, automatische Zeitstempel, Fehlerbehandlung, Loading States und interaktive Echtzeit-Updates.",
      "Die Architektur ist modular aufgebaut und gliedert sich in klar getrennte Bereiche: UI-Komponenten, API-Endpunkte, Prisma-Konfiguration und TypeScript-Typdefinitionen.",
    ]},
    { id:uid(), title:"Portfolio für NextGen-Entwickler", period:"11/2025 - In Progress", link:"steffenvolbeatNextGen-Developer-Portfolio", bullets:[
      "Im Projekt NextGen Developer Portfolio habe ich ein interaktives 3D-Portfolio auf Basis von Next.js, React, TypeScript und Tailwind CSS entwickelt.",
      "Der Schwerpunkt lag auf einer fotorealistischen 3D-Scene im Motherboard-Design sowie interaktiven Portfolio-Stationen.",
      "Zusätzlich habe ich ein vollständiges Dark-/Light-Mode-System mit automatischer Systemerkennung, Toggle-Funktion und persistenter Speicherung umgesetzt.",
      "Die Projektdaten werden zentral verwaltet. Mock- und Demo-Daten wurden entfernt und durch strukturierte Dateninhalte ersetzt.",
      "Das Projekt ist modular dokumentiert und auf Erweiterungen wie Cypress-E2E-Tests, Docker sowie Prisma und PostgreSQL vorbereitet.",
    ]},
    { id:uid(), title:"Abschluss-Projekt Metal3DEvent-Plattform", period:"07/2025 - In Progress", link:"steffenvolbeatMETAL3DCORE-Plattform", bullets:[
      "Im Projekt \"METAL3DCORE-Plattform\" entwickelte ich eine moderne Webanwendung auf Basis von Next.js, React und TypeScript mit Fokus auf eine performante und modular aufgebaute Architektur.",
      "Für die visuelle Umsetzung nutze ich einen 3D-Stack aus React Three Fiber, Drei, Three.js und Postprocessing, um interaktive und grafisch anspruchsvolle Oberflächen umzusetzen.",
      "Die Daten- und Backend-Anbindung ist mit Prisma und PostgreSQL angelegt und wird durch PGAdmin sowie Docker-Strukturen für die Entwicklung und das Deployment ergänzt.",
      "Darüber hinaus integrierte ich Bausteine für Authentifizierung, Formularverarbeitung und Validierung mit NextAuth, React Hook Form und Zod.",
      "Für die Qualitätssicherung implementierte ich eine strukturierte Testumgebung mit Jest für Unit-Tests sowie Cypress für End-to-End-Tests.",
    ]},
  ],
  education: [
    { id:uid(), degree:"Web- und Softwareentwicklung", institution:"Digital Career Institute GmbH", period:"02/2025 - 04/2026", location:"Berlin / Deutschland", type:"Kurse / Inhalte", bullets:[
      "Webentwicklung mit HTML5, CSS3, JavaScript",
      "Frontend-Entwicklung mit Next.js",
      "Datenbanken & SQL (PostgreSQL, Prisma)",
      "Versionskontrolle mit Git/GitHub",
      "Grundlagen Backend & API-Konzepte",
      "Projektarbeit (Fullstack-Webanwendungen)",
    ]},
    { id:uid(), degree:"Umschulung", institution:"BFW – Thüringen", period:"03/2020 - 06/2021", location:"Seelingstädt / Deutschland", type:"Kurse / Inhalte", bullets:[
      "Windows- und Client-Administration",
      "Netzwerke (WAN/LAN), Hardware & Peripherie",
      "IT-Support, Fehleranalyse und Troubleshooting",
      "Grundlagen der IT-Sicherheit",
      "Praktische Projekt- und Werkstattarbeit",
    ]},
    { id:uid(), degree:"Ausbildung", institution:"Berufsschule / Saalfeld", period:"08/1992 - 08/1995", location:"Saalfeld", type:"Abschluss", bullets:[
      "Geselle im Zimmerhandwerk",
    ]},
  ],
  experience: [
    { id:uid(), position:"Produktionsmitarbeiter", company:"Mercedes-Benz Zentrum / Büropersonal", period:"09/2022 - 07/2024", location:"Kölleda, Erfurt / Deutschland", description:"Das Motorenwerk steht für erstklassige Innovation und stetige Verbesserung.", type:"Aufgaben", bullets:[
      "Durchführen von Qualitätskontrollen",
      "fachgerechtes Montieren von Bauteilen",
      "Sicherstellen der Produktqualität",
    ], contact:"Kathrin Niemann – erfurt@office-people.com"},
    { id:uid(), position:"Praktikant", company:"Secosys-IT", period:"03/2021 - 06/2021", location:"Erfurt / Deutschland", description:"Ist ein IT-Systemhaus, welches Telekommunikationsinfrastrukturen in Planung, Implementierung & Wartung anbietet", type:"Aufgaben", bullets:[
      "Konfiguration von Routern und Netzwerken (WAN, LAN, Routing, NAT).",
      "Aufnahme von PCs in Domänen und Einrichtung von Arbeitsplatzsystemen.",
      "Migration von Clientsystemen inklusive Datenübernahme.",
      "Mitarbeit in Kundenprojekten und Vor-Ort-IT-Support.",
      "Unterstützung bei Fehleranalyse und technischer Problemlösung.",
    ], contact:"Christian Ranft – info@secosys-it.de"},
    { id:uid(), position:"Zimmermann", company:"Yelloshark, Das Team", period:"05/2009 - 06/2018", location:"Österreich / Schweiz", description:"Ausländische temporäre Einsätze (Österreich, Schweiz), Salzburg/Land, Innsbruck, Wien, Luzern, Zürich, Bern, Basel, Interlaken", type:"Aufgaben", bullets:[
      "Durchführung von Qualitätskontrollen und fachgerechtem Montieren von Bauteilen.",
      "Ausführung von Zimmer- und Holzbauarbeiten.",
      "Mitarbeit bei Ausbau- und Dämmarbeiten.",
      "Arbeit nach technischen Vorgaben und Qualitätsstandards in wechselnden Einsatzorten (DE/AT/CH).",
    ], contact:"Damian Rimo – Yellowshark AG"},
  ],
  skills:["HTML 5","CSS 3","JavaScript","NextJS","Fiber.js","Figma","Python","SQL","Docker","TCP/IP","Netzwerk","Lan/Wan","VMware","Netzwerksicherheit"],
  technicalSkills:[
    { id:uid(), name:"React.js",  description:"Zum Erstellen von Benutzeroberflächen." },
    { id:uid(), name:"Node.js",   description:"Für die serverseitige Entwicklung." },
    { id:uid(), name:"Git",       description:"Für Versionskontrolle und Zusammenarbeit auf GitHub." },
  ],
  softSkills:["Teamfähig","Kreativ","analytisches Denken","Motivation","Selbstständigkeit"],
  references:[{ id:uid(), company:"Secosys IT", person:'"Christian Ranft Geschäftsführer"' }],
  certificates:[
    { id:uid(), name:"Web & Software Development Certificate – Digital Career Institute (DCI)", period:"(02/2025 - 04/2026)" },
    { id:uid(), name:"PC-Service / IT-Grundlagen", period:"(02/2020 - 06/2021)" },
  ],
  languages:[
    { id:uid(), language:"Deutsch",  level:"Muttersprachliche" },
    { id:uid(), language:"Englisch", level:"Eingeschränkte Arbeitskompetenz" },
  ],
  interests:["E-Gitarre Spielen","Fitness / Laufen"],
};

// ─── E – Inline-editable field ────────────────────────────────────────────────
function E({ value, onChange, editing, multiline=false, style={} as React.CSSProperties, placeholder="...", rows=3 }: {
  value:string; onChange:(v:string)=>void; editing:boolean;
  multiline?:boolean; style?:React.CSSProperties; placeholder?:string; rows?:number;
}) {
  const s: React.CSSProperties = {
    ...style,
    background:"rgba(219,234,254,0.35)", border:"1px dashed #93c5fd", borderRadius:3,
    padding:"2px 4px", outline:"none", width:"100%", fontFamily:"inherit",
    fontSize:"inherit", color:"inherit", lineHeight:"inherit", fontWeight:"inherit",
    fontStyle:"inherit", boxSizing:"border-box" as const,
  };
  if (!editing) return <span style={style}>{value||<span style={{opacity:0.28,fontStyle:"italic"}}>{placeholder}</span>}</span>;
  if (multiline) return <textarea style={{...s,resize:"vertical",display:"block"}} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={rows}/>;
  return <input style={s} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}/>;
}

// ─── BulletList ───────────────────────────────────────────────────────────────
function BulletList({ bullets, onChange, editing, cols=1 }: {
  bullets:string[]; onChange:(b:string[])=>void; editing:boolean; cols?:number;
}) {
  return (
    <ul style={{listStyle:"none",margin:0,padding:0,display:"grid",gridTemplateColumns:`repeat(${cols},1fr)`,gap:"4px 16px"}}>
      {bullets.map((b,i)=>(
        <li key={i} style={{display:"flex",alignItems:"flex-start",gap:7}}>
          <span style={{width:6,height:6,borderRadius:"50%",backgroundColor:A,flexShrink:0,marginTop:5}}/>
          {editing ? (
            <div style={{flex:1,display:"flex",gap:4}}>
              <input style={{flex:1,fontSize:12,fontFamily:FNT,border:"1px dashed #93c5fd",borderRadius:3,padding:"2px 4px",background:"rgba(219,234,254,0.35)",outline:"none",color:CT}} value={b} onChange={e=>{const n=[...bullets];n[i]=e.target.value;onChange(n);}}/>
              <button type="button" onClick={()=>onChange(bullets.filter((_,idx)=>idx!==i))} style={{background:"none",border:"none",cursor:"pointer",color:"#f87171",padding:0,display:"flex",alignItems:"center"}}><XMarkIcon style={{width:11,height:11}}/></button>
            </div>
          ) : <span style={{fontSize:12,color:CB,lineHeight:1.5,flex:1}}>{b}</span>}
        </li>
      ))}
      {editing && (
        <li style={{gridColumn:"1/-1"}}>
          <button type="button" onClick={()=>onChange([...bullets,""])} style={{display:"flex",alignItems:"center",gap:4,fontSize:12,color:"#3b82f6",background:"none",border:"none",cursor:"pointer",padding:"4px 0",fontFamily:FNT}}>
            <PlusIcon style={{width:12,height:12}}/>Punkt hinzufügen
          </button>
        </li>
      )}
    </ul>
  );
}

// ─── TagList ──────────────────────────────────────────────────────────────────
function TagList({ tags, onChange, editing, variant="dark" }: {
  tags:string[]; onChange:(t:string[])=>void; editing:boolean; variant?:"dark"|"outlined"|"light";
}) {
  const [newTag,setNewTag] = useState("");
  const ts: React.CSSProperties = variant==="outlined"
    ? {border:"1px solid rgba(255,255,255,0.38)",color:"white",backgroundColor:"transparent",borderRadius:10,padding:"2px 10px",fontSize:11,display:"flex",alignItems:"center",gap:4}
    : variant==="dark"
    ? {backgroundColor:TBG,color:"white",borderRadius:3,padding:"2px 8px",fontSize:11,display:"flex",alignItems:"center",gap:4}
    : {backgroundColor:"#e5f9fa",color:"#0e7490",borderRadius:3,padding:"2px 8px",fontSize:11,display:"flex",alignItems:"center",gap:4};
  return (
    <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
      {tags.map((t,i)=>(
        <div key={i} style={ts}>
          {t}
          {editing&&<button type="button" onClick={()=>onChange(tags.filter((_,idx)=>idx!==i))} style={{background:"none",border:"none",cursor:"pointer",color:"#f87171",padding:0,display:"flex"}}><XMarkIcon style={{width:10,height:10}}/></button>}
        </div>
      ))}
      {editing&&<input style={{width:72,fontSize:11,border:"1px dashed #93c5fd",borderRadius:3,padding:"2px 4px",background:"rgba(219,234,254,0.35)",outline:"none",color:CT,fontFamily:FNT}} value={newTag} onChange={e=>setNewTag(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&newTag.trim()){onChange([...tags,newTag.trim()]);setNewTag("");}}} placeholder="+ Neu"/>}
    </div>
  );
}

// ─── Section heading (main column) ────────────────────────────────────────────
function SecH({ title, icon }: { title:string; icon:React.ReactNode }) {
  return (
    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
      <div style={{width:26,height:26,borderRadius:"50%",border:`2px solid ${A}`,color:A,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{icon}</div>
      <span style={{fontSize:11,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase" as const,color:CT,whiteSpace:"nowrap" as const}}>{title}</span>
      <div style={{flex:1,height:1,backgroundColor:"#e5e7eb"}}/>
    </div>
  );
}

// ─── Sidebar heading ──────────────────────────────────────────────────────────
function SbH({ title, icon }: { title:string; icon:React.ReactNode }) {
  return (
    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
      <div style={{width:22,height:22,borderRadius:"50%",border:`2px solid ${A}`,color:A,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{icon}</div>
      <span style={{fontSize:10,fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase" as const,color:A}}>{title}</span>
    </div>
  );
}

// ─── Contact row (sidebar) ────────────────────────────────────────────────────
function CRow({ icon, value, editing, onChange, onDelete, hidden }: { icon:React.ReactNode; value:string; editing:boolean; onChange:(v:string)=>void; onDelete?:()=>void; hidden?:boolean; }) {
  if (hidden && !editing) return null;
  return (
    <div style={{display:"flex",alignItems:"flex-start",gap:10,marginBottom:14,opacity:hidden?0.35:1}}>
      <div style={{width:26,height:26,borderRadius:4,backgroundColor:hidden?"#6b7280":A,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:1}}>
        <span style={{color:"white",display:"flex"}}>{icon}</span>
      </div>
      <E value={value} onChange={onChange} editing={editing} style={{fontSize:12,color:"white",lineHeight:1.4,wordBreak:"break-all"}}/>
      {editing && onDelete && (
        <button type="button" onClick={onDelete} title={hidden?"Wieder einblenden":"Ausblenden"}
          style={{background:hidden?"rgba(62,207,214,0.18)":"rgba(248,113,113,0.18)",border:`1px solid ${hidden?A:"#f87171"}`,borderRadius:4,cursor:"pointer",color:hidden?A:"#f87171",padding:"2px 4px",lineHeight:1,flexShrink:0,marginTop:2,display:"flex",alignItems:"center"}}>
          <XMarkIcon style={{width:14,height:14}}/>
        </button>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function LebenslaufTemplate() {
  const [data,setData]     = useState<CVData>(JSON.parse(JSON.stringify(DEFAULT_DATA)));
  const [editing,setEditing] = useState(false);
  const [photoSrc,setPhotoSrc] = useState("");
  const [hiddenContacts,setHiddenContacts] = useState<Set<string>>(new Set());
  const photoInputRef = useRef<HTMLInputElement>(null);
  const toggleContact = (key:string) => setHiddenContacts(s=>{const n=new Set(s);n.has(key)?n.delete(key):n.add(key);return n;});

  const setPersonal  = (p:Partial<CVData["personal"]>)  => setData(d=>({...d,personal:{...d.personal,...p}}));
  const setProjects  = (v:Project[])     => setData(d=>({...d,projects:v}));
  const setEducation = (v:Education[])   => setData(d=>({...d,education:v}));
  const setExperience= (v:Experience[])  => setData(d=>({...d,experience:v}));
  const setTechSkills= (v:TechSkill[])   => setData(d=>({...d,technicalSkills:v}));
  const setRefs      = (v:Reference[])   => setData(d=>({...d,references:v}));
  const setCerts     = (v:Certificate[]) => setData(d=>({...d,certificates:v}));
  const setLangs     = (v:Language[])    => setData(d=>({...d,languages:v}));

  const updProj = useCallback((id:string,p:Partial<Project>)    => setData(d=>({...d,projects:   d.projects.map(x=>x.id===id?{...x,...p}:x)})),[]);
  const updEdu  = useCallback((id:string,p:Partial<Education>)  => setData(d=>({...d,education:  d.education.map(x=>x.id===id?{...x,...p}:x)})),[]);
  const updExp  = useCallback((id:string,p:Partial<Experience>) => setData(d=>({...d,experience: d.experience.map(x=>x.id===id?{...x,...p}:x)})),[]);

  return (
    <div style={{minHeight:"100vh",background:"#f3f4f6",padding:"24px 16px",overflowX:"auto",fontFamily:FNT}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800&display=swap');
        @media print {
          @page { size: A4 portrait; margin: 0; }
          body * { visibility: hidden !important; }
          .cv-doc, .cv-doc * { visibility: visible !important; }
          .cv-doc {
            position: absolute !important;
            top: 0 !important; left: 0 !important;
            width: 210mm !important; max-width: 210mm !important;
            box-shadow: none !important; margin: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          /* Sidebar nur so hoch wie ihr Inhalt – kein dunkler Balken auf Seite 2 */
          .cv-doc > div > div:first-child { align-items: flex-start !important; }
          .cv-ctrl { display: none !important; visibility: hidden !important; }
        }
      `}</style>

      {/* Controls */}
      <div className="cv-ctrl" style={{maxWidth:850,margin:"0 auto 20px",display:"flex",gap:10,flexWrap:"wrap"}}>
        <button onClick={()=>setEditing(e=>!e)} style={{display:"flex",alignItems:"center",gap:6,padding:"7px 16px",borderRadius:8,fontSize:13,fontWeight:600,cursor:"pointer",border:"none",backgroundColor:editing?"#16a34a":"#4f46e5",color:"white",fontFamily:FNT}}>
          {editing?<CheckIcon style={{width:16,height:16}}/>:<PencilSquareIcon style={{width:16,height:16}}/>}
          {editing?"Fertig bearbeiten":"Bearbeiten"}
        </button>
        <button onClick={()=>window.print()} style={{display:"flex",alignItems:"center",gap:6,padding:"7px 16px",borderRadius:8,fontSize:13,fontWeight:600,cursor:"pointer",border:"none",backgroundColor:"#374151",color:"white",fontFamily:FNT}}>
          <PrinterIcon style={{width:16,height:16}}/>Drucken / PDF
        </button>
        <button onClick={()=>{if(window.confirm("Zurücksetzen?")){setData(JSON.parse(JSON.stringify(DEFAULT_DATA)));setHiddenContacts(new Set());}}} style={{display:"flex",alignItems:"center",gap:6,padding:"7px 16px",borderRadius:8,fontSize:13,fontWeight:600,cursor:"pointer",border:"1px solid #d1d5db",backgroundColor:"white",color:CB,fontFamily:FNT}}>
          <XMarkIcon style={{width:16,height:16}}/>Zurücksetzen
        </button>
        {editing&&<span style={{alignSelf:"center",fontSize:12,color:CM,fontStyle:"italic"}}>Alle Felder direkt bearbeitbar</span>}
      </div>

      {/* Document */}
      <div className="cv-doc" style={{maxWidth:850,margin:"0 auto",fontFamily:FNT,backgroundColor:"white",boxShadow:"0 4px 32px rgba(0,0,0,0.14)"}}>
        <div style={{display:"flex"}}>

          {/* ── LEFT COLUMN ──────────────────────────────────────────────────── */}
          <div style={{flex:1,backgroundColor:"white",padding:"32px 20px 40px 32px",minWidth:0}}>

            {/* Header */}
            <div style={{display:"flex",alignItems:"flex-start",gap:16,marginBottom:28,paddingBottom:24,borderBottom:"1px solid #f3f4f6"}}>
              {/* Photo */}
              <div
                style={{width:96,height:112,borderRadius:4,overflow:"hidden",flexShrink:0,backgroundColor:"#e5e7eb",border:`2px solid ${A}`,display:"flex",alignItems:"center",justifyContent:"center",position:"relative",cursor:editing?"pointer":"default"}}
                onClick={()=>editing&&photoInputRef.current?.click()}
                title={editing?"Klicken zum Foto hochladen":""}
              >
                {photoSrc
                  ? <img src={photoSrc} alt="Profilfoto" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                  : <span style={{fontSize:11,color:CM,textAlign:"center",padding:"0 4px",lineHeight:1.3}}>{editing?"📷":"Foto"}</span>
                }
                <input ref={photoInputRef} type="file" accept="image/*" style={{display:"none"}} onChange={e=>{const f=e.target.files?.[0];if(!f)return;const r=new FileReader();r.onload=ev=>setPhotoSrc((ev.target?.result as string)??"");r.readAsDataURL(f);}}/>
              </div>
              {/* Personal info */}
              <div style={{flex:1,minWidth:0}}>
                {editing
                  ? <input value={data.personal.name} onChange={e=>setPersonal({name:e.target.value})} style={{display:"block",fontSize:34,fontWeight:800,color:CT,lineHeight:1.15,marginBottom:4,fontFamily:FNT,background:"rgba(219,234,254,0.35)",border:"1px dashed #93c5fd",borderRadius:3,padding:"2px 4px",outline:"none",width:"100%",boxSizing:"border-box"}}/>
                  : <div style={{fontSize:34,fontWeight:800,color:CT,lineHeight:1.15,marginBottom:4}}>{data.personal.name}</div>
                }
                {editing
                  ? <input value={data.personal.subtitle} onChange={e=>setPersonal({subtitle:e.target.value})} style={{display:"block",fontSize:14,fontWeight:600,color:A,marginBottom:10,fontFamily:FNT,background:"rgba(219,234,254,0.35)",border:"1px dashed #93c5fd",borderRadius:3,padding:"2px 4px",outline:"none",width:"100%",boxSizing:"border-box"}}/>
                  : <div style={{fontSize:14,fontWeight:600,color:A,marginBottom:10}}>{data.personal.subtitle}</div>
                }
                <E value={data.personal.bio} onChange={v=>setPersonal({bio:v})} editing={editing} multiline rows={5} placeholder="Profiltext..." style={{fontSize:11,color:CM,lineHeight:1.55,display:"block"}}/>
              </div>
            </div>

            {/* PROJEKTE */}
            <div style={{marginBottom:24}}>
              <SecH title="Projekte" icon={<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" style={{width:13,height:13}}><rect x="2" y="2" width="12" height="9" rx="1"/><path d="M5 14h6M8 11v3"/></svg>}/>
              {data.projects.map(p=>(
                <div key={p.id} style={{marginBottom:16}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:4,gap:8}}>
                    <E value={p.title} onChange={v=>updProj(p.id,{title:v})} editing={editing} style={{fontSize:13,fontWeight:700,color:CT}}/>
                    <E value={p.period} onChange={v=>updProj(p.id,{period:v})} editing={editing} style={{fontSize:11,fontStyle:"italic",color:A,flexShrink:0}}/>
                  </div>
                  <BulletList bullets={p.bullets} onChange={b=>updProj(p.id,{bullets:b})} editing={editing}/>
                  {(p.link||editing)&&(editing
                    ? <E value={p.link??""} onChange={v=>updProj(p.id,{link:v})} editing={editing} style={{fontSize:11,color:A,display:"block",marginTop:4}}/>
                    : <span style={{fontSize:11,color:A,textDecoration:"underline",display:"block",marginTop:4}}>{p.link}</span>
                  )}
                  {editing&&<button type="button" onClick={()=>setProjects(data.projects.filter(x=>x.id!==p.id))} style={{display:"flex",alignItems:"center",gap:4,fontSize:11,color:"#f87171",background:"none",border:"none",cursor:"pointer",padding:"4px 0",marginTop:2}}><TrashIcon style={{width:11,height:11}}/>Projekt entfernen</button>}
                </div>
              ))}
              {editing&&<button type="button" onClick={()=>setProjects([...data.projects,{id:uid(),title:"Neues Projekt",period:"",bullets:[],link:""}])} style={{display:"flex",alignItems:"center",gap:4,fontSize:12,color:"#3b82f6",background:"none",border:"none",cursor:"pointer",padding:"4px 0",fontFamily:FNT}}><PlusIcon style={{width:13,height:13}}/>Projekt hinzufügen</button>}
            </div>

            {/* AUSBILDUNG */}
            <div style={{marginBottom:24}}>
              <SecH title="Ausbildung" icon={<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" style={{width:13,height:13}}><path d="M2 6l6-4 6 4-6 4-6-4z"/><path d="M14 6v5M4 8.5v3.5a6 6 0 008 0V8.5"/></svg>}/>
              {data.education.map(e=>(
                <div key={e.id} style={{marginBottom:16}}>
                  <E value={e.degree} onChange={v=>updEdu(e.id,{degree:v})} editing={editing} style={{fontSize:13,fontWeight:700,color:CT,display:"block",marginBottom:1}}/>
                  <E value={e.institution} onChange={v=>updEdu(e.id,{institution:v})} editing={editing} style={{fontSize:13,color:CB,display:"block",marginBottom:3}}/>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                    <E value={e.period} onChange={v=>updEdu(e.id,{period:v})} editing={editing} style={{fontSize:11,fontStyle:"italic",color:A}}/>
                    <E value={e.location} onChange={v=>updEdu(e.id,{location:v})} editing={editing} style={{fontSize:11,fontStyle:"italic",color:A}}/>
                  </div>
                  <E value={e.type} onChange={v=>updEdu(e.id,{type:v})} editing={editing} style={{fontSize:11,fontStyle:"italic",color:A,display:"block",marginBottom:6}}/>
                  <BulletList bullets={e.bullets} onChange={b=>updEdu(e.id,{bullets:b})} editing={editing} cols={e.bullets.length>2?2:1}/>
                  {editing&&<button type="button" onClick={()=>setEducation(data.education.filter(x=>x.id!==e.id))} style={{display:"flex",alignItems:"center",gap:4,fontSize:11,color:"#f87171",background:"none",border:"none",cursor:"pointer",padding:"4px 0",marginTop:4}}><TrashIcon style={{width:11,height:11}}/>Entfernen</button>}
                </div>
              ))}
              {editing&&<button type="button" onClick={()=>setEducation([...data.education,{id:uid(),degree:"Abschluss",institution:"Schule",period:"",location:"",type:"Abschluss",bullets:[]}])} style={{display:"flex",alignItems:"center",gap:4,fontSize:12,color:"#3b82f6",background:"none",border:"none",cursor:"pointer",padding:"4px 0",fontFamily:FNT}}><PlusIcon style={{width:13,height:13}}/>Ausbildung hinzufügen</button>}
            </div>

            {/* BERUFSERFAHRUNG */}
            <div style={{marginBottom:24}}>
              <SecH title="Berufserfahrung" icon={<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" style={{width:13,height:13}}><rect x="4" y="5" width="8" height="8" rx="1"/><path d="M5 5V4a3 3 0 016 0v1"/></svg>}/>
              {data.experience.map(ex=>(
                <div key={ex.id} style={{marginBottom:20}}>
                  <E value={ex.position} onChange={v=>updExp(ex.id,{position:v})} editing={editing} style={{fontSize:13,fontWeight:700,color:CT,display:"block",marginBottom:1}}/>
                  <E value={ex.company} onChange={v=>updExp(ex.id,{company:v})} editing={editing} style={{fontSize:13,color:CB,display:"block",marginBottom:3}}/>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                    <E value={ex.period} onChange={v=>updExp(ex.id,{period:v})} editing={editing} style={{fontSize:11,fontStyle:"italic",color:A}}/>
                    <E value={ex.location} onChange={v=>updExp(ex.id,{location:v})} editing={editing} style={{fontSize:11,fontStyle:"italic",color:A}}/>
                  </div>
                  {(ex.description||editing)&&<E value={ex.description??""} onChange={v=>updExp(ex.id,{description:v})} editing={editing} style={{fontSize:11,fontStyle:"italic",color:CM,display:"block",marginBottom:3}}/>}
                  <E value={ex.type??"Aufgaben"} onChange={v=>updExp(ex.id,{type:v})} editing={editing} style={{fontSize:11,fontStyle:"italic",color:A,display:"block",marginBottom:5}}/>
                  <BulletList bullets={ex.bullets} onChange={b=>updExp(ex.id,{bullets:b})} editing={editing}/>
                  {(ex.contact||editing)&&<div style={{marginTop:6}}>
                    <span style={{fontSize:11,fontStyle:"italic",color:A}}>Kontakt: </span>
                    <E value={ex.contact??""} onChange={v=>updExp(ex.id,{contact:v})} editing={editing} style={{fontSize:11,fontStyle:"italic",color:A}}/>
                  </div>}
                  {editing&&<button type="button" onClick={()=>setExperience(data.experience.filter(x=>x.id!==ex.id))} style={{display:"flex",alignItems:"center",gap:4,fontSize:11,color:"#f87171",background:"none",border:"none",cursor:"pointer",padding:"4px 0",marginTop:4}}><TrashIcon style={{width:11,height:11}}/>Entfernen</button>}
                </div>
              ))}
              {editing&&<button type="button" onClick={()=>setExperience([...data.experience,{id:uid(),position:"Position",company:"Unternehmen",period:"",location:"",description:"",type:"Aufgaben",bullets:[]}])} style={{display:"flex",alignItems:"center",gap:4,fontSize:12,color:"#3b82f6",background:"none",border:"none",cursor:"pointer",padding:"4px 0",fontFamily:FNT}}><PlusIcon style={{width:13,height:13}}/>Erfahrung hinzufügen</button>}
            </div>

          </div>{/* end left column */}

          {/* ── RIGHT SIDEBAR ─────────────────────────────────────────────────── */}
          <div style={{width:295,flexShrink:0,backgroundColor:SBG,padding:"32px 22px 40px",color:"white"}}>

            {/* Contact */}
            <div style={{marginBottom:22}}>
              <CRow icon={<EnvelopeIcon style={{width:13,height:13}}/>} value={data.personal.email}    editing={editing} onChange={v=>setPersonal({email:v})}    hidden={hiddenContacts.has("email")}    onDelete={()=>toggleContact("email")}/>
              <CRow icon={<PhoneIcon    style={{width:13,height:13}}/>} value={data.personal.phone}    editing={editing} onChange={v=>setPersonal({phone:v})}    hidden={hiddenContacts.has("phone")}    onDelete={()=>toggleContact("phone")}/>
              <CRow icon={<MapPinIcon   style={{width:13,height:13}}/>} value={data.personal.location} editing={editing} onChange={v=>setPersonal({location:v})} hidden={hiddenContacts.has("location")} onDelete={()=>toggleContact("location")}/>
              <CRow icon={<LinkIcon     style={{width:13,height:13}}/>} value={data.personal.website??""} editing={editing} onChange={v=>setPersonal({website:v})} hidden={hiddenContacts.has("website")} onDelete={()=>toggleContact("website")}/>
              <CRow
                icon={<svg viewBox="0 0 24 24" fill="currentColor" style={{width:13,height:13}}><path d="M19 3a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h14zM8 10v7H6v-7h2zm0-2a1 1 0 10-2 0 1 1 0 002 0zm8 3.5c0-1.38-1.12-2.5-2.5-2.5H13v1.5h.5c.55 0 1 .45 1 1V17h2v-5.5z"/></svg>}
                value={data.personal.linkedin} editing={editing} onChange={v=>setPersonal({linkedin:v})} hidden={hiddenContacts.has("linkedin")} onDelete={()=>toggleContact("linkedin")}/>
              <CRow
                icon={<svg viewBox="0 0 24 24" fill="currentColor" style={{width:13,height:13}}><path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.009-.868-.014-1.703-2.782.604-3.369-1.342-3.369-1.342-.454-1.155-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.268 2.75 1.026A9.578 9.578 0 0112 6.836c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.026 2.747-1.026.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.137 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z"/></svg>}
                value={data.personal.github} editing={editing} onChange={v=>setPersonal({github:v})} hidden={hiddenContacts.has("github")} onDelete={()=>toggleContact("github")}/>
            </div>

            {/* FERTIGKEITEN */}
            <div style={{marginBottom:20}}>
              <SbH title="Fertigkeiten" icon={<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" style={{width:11,height:11}}><path d="M8 2l1.5 3 3.5.5-2.5 2.5.5 3.5L8 10 5 11.5l.5-3.5L3 5.5 6.5 5z"/></svg>}/>
              <TagList tags={data.skills} onChange={t=>setData(d=>({...d,skills:t}))} editing={editing} variant="dark"/>
            </div>

            {/* TECHNISCHE FERTIGKEITEN */}
            <div style={{marginBottom:20}}>
              <SbH title="Technische Fertigkeiten" icon={<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" style={{width:11,height:11}}><path d="M5 3l-3 5 3 5M11 3l3 5-3 5M9 2l-2 12"/></svg>}/>
              {data.technicalSkills.map(ts=>(
                <div key={ts.id} style={{marginBottom:9}}>
                  <E value={ts.name} onChange={v=>setTechSkills(data.technicalSkills.map(t=>t.id===ts.id?{...t,name:v}:t))} editing={editing} style={{fontSize:12,fontWeight:700,color:"white",display:"block"}}/>
                  <E value={ts.description} onChange={v=>setTechSkills(data.technicalSkills.map(t=>t.id===ts.id?{...t,description:v}:t))} editing={editing} style={{fontSize:11,color:"#9ca3af",display:"block"}}/>
                  {editing&&<button type="button" onClick={()=>setTechSkills(data.technicalSkills.filter(t=>t.id!==ts.id))} style={{display:"flex",alignItems:"center",gap:2,fontSize:10,color:"#f87171",background:"none",border:"none",cursor:"pointer",padding:"2px 0"}}><XMarkIcon style={{width:10,height:10}}/>Entfernen</button>}
                </div>
              ))}
              {editing&&<button type="button" onClick={()=>setTechSkills([...data.technicalSkills,{id:uid(),name:"Technologie",description:"Beschreibung"}])} style={{display:"flex",alignItems:"center",gap:4,fontSize:11,color:"#93c5fd",background:"none",border:"none",cursor:"pointer",padding:"4px 0",fontFamily:FNT}}><PlusIcon style={{width:12,height:12}}/>Hinzufügen</button>}
            </div>

            {/* SOFT SKILLS */}
            <div style={{marginBottom:20}}>
              <SbH title="Soft Skills" icon={<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" style={{width:11,height:11}}><path d="M8 1a4 4 0 100 8A4 4 0 008 1zM1.5 15c0-3.5 3-5.5 6.5-5.5S14.5 11.5 14.5 15"/></svg>}/>
              <TagList tags={data.softSkills} onChange={t=>setData(d=>({...d,softSkills:t}))} editing={editing} variant="dark"/>
            </div>

            {/* REFERENZEN */}
            <div style={{marginBottom:20}}>
              <SbH title="Referenzen" icon={<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" style={{width:11,height:11}}><path d="M3 13V9a5 5 0 0110 0v4M8 4a2 2 0 100-4 2 2 0 000 4z"/></svg>}/>
              {data.references.map(r=>(
                <div key={r.id} style={{marginBottom:9}}>
                  <E value={r.company} onChange={v=>setRefs(data.references.map(x=>x.id===r.id?{...x,company:v}:x))} editing={editing} style={{fontSize:12,fontWeight:600,color:"white",display:"block"}}/>
                  {(r.person||editing)&&<E value={r.person??""} onChange={v=>setRefs(data.references.map(x=>x.id===r.id?{...x,person:v}:x))} editing={editing} style={{fontSize:11,fontStyle:"italic",color:"#9ca3af",display:"block"}}/>}
                  {editing&&<button type="button" onClick={()=>setRefs(data.references.filter(x=>x.id!==r.id))} style={{display:"flex",alignItems:"center",gap:2,fontSize:10,color:"#f87171",background:"none",border:"none",cursor:"pointer",padding:"2px 0"}}><XMarkIcon style={{width:10,height:10}}/>Entfernen</button>}
                </div>
              ))}
              {editing&&<button type="button" onClick={()=>setRefs([...data.references,{id:uid(),company:"Unternehmen",person:""}])} style={{display:"flex",alignItems:"center",gap:4,fontSize:11,color:"#93c5fd",background:"none",border:"none",cursor:"pointer",padding:"4px 0",fontFamily:FNT}}><PlusIcon style={{width:12,height:12}}/>Hinzufügen</button>}
            </div>

            {/* ZERTIFIKATE */}
            <div style={{marginBottom:20}}>
              <SbH title="Zertifikate" icon={<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" style={{width:11,height:11}}><rect x="2" y="3" width="12" height="9" rx="1"/><path d="M5 7h6M5 9.5h4"/></svg>}/>
              {data.certificates.map(c=>(
                <div key={c.id} style={{marginBottom:9}}>
                  <E value={c.name} onChange={v=>setCerts(data.certificates.map(x=>x.id===c.id?{...x,name:v}:x))} editing={editing} multiline rows={2} style={{fontSize:11,color:"white",display:"block",lineHeight:1.4}}/>
                  <E value={c.period} onChange={v=>setCerts(data.certificates.map(x=>x.id===c.id?{...x,period:v}:x))} editing={editing} style={{fontSize:11,color:"#9ca3af",display:"block",marginTop:2}}/>
                  {editing&&<button type="button" onClick={()=>setCerts(data.certificates.filter(x=>x.id!==c.id))} style={{display:"flex",alignItems:"center",gap:2,fontSize:10,color:"#f87171",background:"none",border:"none",cursor:"pointer",padding:"2px 0"}}><XMarkIcon style={{width:10,height:10}}/>Entfernen</button>}
                </div>
              ))}
              {editing&&<button type="button" onClick={()=>setCerts([...data.certificates,{id:uid(),name:"Zertifikat",period:""}])} style={{display:"flex",alignItems:"center",gap:4,fontSize:11,color:"#93c5fd",background:"none",border:"none",cursor:"pointer",padding:"4px 0",fontFamily:FNT}}><PlusIcon style={{width:12,height:12}}/>Hinzufügen</button>}
            </div>

            {/* SPRACHEN */}
            <div style={{marginBottom:20}}>
              <SbH title="Sprachen" icon={<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" style={{width:11,height:11}}><circle cx="8" cy="8" r="6"/><path d="M8 2c-2 2-2 8 0 12M8 2c2 2 2 8 0 12M2 8h12"/></svg>}/>
              {data.languages.map(l=>(
                <div key={l.id} style={{marginBottom:9}}>
                  <E value={l.language} onChange={v=>setLangs(data.languages.map(x=>x.id===l.id?{...x,language:v}:x))} editing={editing} style={{fontSize:12,fontWeight:600,color:"white",display:"block"}}/>
                  <E value={l.level} onChange={v=>setLangs(data.languages.map(x=>x.id===l.id?{...x,level:v}:x))} editing={editing} style={{fontSize:11,fontStyle:"italic",color:A,display:"block"}}/>
                  {editing&&<button type="button" onClick={()=>setLangs(data.languages.filter(x=>x.id!==l.id))} style={{display:"flex",alignItems:"center",gap:2,fontSize:10,color:"#f87171",background:"none",border:"none",cursor:"pointer",padding:"2px 0"}}><XMarkIcon style={{width:10,height:10}}/>Entfernen</button>}
                </div>
              ))}
              {editing&&<button type="button" onClick={()=>setLangs([...data.languages,{id:uid(),language:"Sprache",level:"Niveau"}])} style={{display:"flex",alignItems:"center",gap:4,fontSize:11,color:"#93c5fd",background:"none",border:"none",cursor:"pointer",padding:"4px 0",fontFamily:FNT}}><PlusIcon style={{width:12,height:12}}/>Hinzufügen</button>}
            </div>

            {/* INTERESSEN */}
            <div>
              <SbH title="Interessen" icon={<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" style={{width:11,height:11}}><path d="M8 1l1.9 3.9 4.3.6-3.1 3 .7 4.3L8 10.5 4.2 12.8l.7-4.3L1.8 5.5l4.3-.6z"/></svg>}/>
              <TagList tags={data.interests} onChange={t=>setData(d=>({...d,interests:t}))} editing={editing} variant="outlined"/>
            </div>

          </div>{/* end sidebar */}
        </div>

        {/* Footer */}
        <div style={{display:"flex",justifyContent:"space-between",padding:"8px 32px",borderTop:"1px solid #f3f4f6",fontSize:11,color:CM,backgroundColor:"white"}}>
          <span>{new Date().toLocaleDateString("de-DE",{day:"2-digit",month:"long",year:"numeric"})}</span>
          <span style={{fontStyle:"italic"}}>{data.personal.name} · Lebenslauf</span>
        </div>
      </div>
    </div>
  );
}
