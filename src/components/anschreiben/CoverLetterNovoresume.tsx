"use client";
import { useState, useCallback } from "react";
import {
  PrinterIcon,
  PencilSquareIcon,
  CheckIcon,
  PlusIcon,
  TrashIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  LinkIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

const ACCENT = "#3ecfd6";
const SIDEBAR_BG = "#1d2a3a";

// ── Types ─────────────────────────────────────────────────────────────────────
interface CLData {
  personal: {
    name: string;
    subtitle: string;
    email: string;
    phone: string;
    location: string;
    website: string;
    linkedin: string;
    github: string;
  };
  recipient: {
    company: string;
    street: string;
    cityZip: string;
    country: string;
  };
  date: string;
  subject: string;
  salutation: string;
  bodyParagraphs: string[];
  closing: string;
  signatureName: string;
  signatureSign: string;
}

const uid = () => Math.random().toString(36).slice(2, 9);

const DEFAULT_CL: CLData = {
  personal: {
    name: "Steffen Lorenz",
    subtitle: "Web- und Softwareentwickler",
    email: "steffen.konstanz@gmx.ch",
    phone: "0173 4235651",
    location: "Erfurt, Deutschland",
    website: "next-gen-developer-portfolio.vercel.app/",
    linkedin: "linkedin.com/in/steffenlorenz-8412873b2",
    github: "github.com/steffenvolbeat",
  },
  recipient: {
    company: "addON Solution GmbH",
    street: "Otto-Eppenstein-Straße",
    cityZip: "26 07745 Jena",
    country: "Germany",
  },
  date: "01. April 2026",
  subject: "Bewerbung als Quereinsteiger (m/w/d) Software-Entwicklung / Web-Entwicklung",
  salutation: "Sehr geehrte Damen und Herren,",
  bodyParagraphs: [
    "Ihre Ausschreibung ist deshalb interessant, weil sie nicht auf formale Lebensläufe fixiert ist, sondern auf echte Entwicklungsbegeisterung, Problemlösung und technisches Wachstum. Genau darin sehe ich meine Stärke. Ich arbeite mich konsequent in Technologien ein, entwickle eigene Projekte, denke strukturiert und bleibe an Problemen so lange dran, bis eine belastbare Lösung steht.",
    'Aktuell absolviere ich eine Weiterbildung zum Web- und Softwareentwickler. Dabei arbeite ich mit Linux, Git-Workflows, HTML, CSS, JavaScript, TypeScript, Node.js, React, Next.js, PostgreSQL, Docker, APIs sowie agilen Workflows. Mein Abschlussprojekt „3D Event Plattform“ setze ich eigenständig um. Dadurch kenne ich nicht nur einzelne Werkzeuge, sondern den Aufbau moderner Webanwendungen über Frontend, Backend, Datenbank, Testing und saubere Projektstruktur hinweg.',
    "Besonders passend finde ich Ihr Umfeld, weil Sie mit Ihren Lösungen egON und LeON seit Jahren spezialisierte Software für Energievertriebe, Distributionen und Energieversorger entwickeln. Mich überzeugt daran die Verbindung aus fachlicher Spezialisierung, produktnaher Entwicklung und realem Kundennutzen. Dass in Ihrem Team enger Kundenkontakt, kurze Kommunikationswege, agile Zusammenarbeit und Raum für eigene Ideen ausdrücklich Teil der Arbeitsweise sind, entspricht genau dem Umfeld, in dem ich mich fachlich schnell weiterentwickeln und produktiv einbringen kann.",
    "Ich komme zwar nicht aus einem klassischen Informatikstudium, bringe aber genau die Mischung mit, die Sie für den Einstieg beschreiben, technische Lernbereitschaft, Begeisterung für Programmierung und den Anspruch, mich Schritt für Schritt zu einem belastbaren Entwicklerprofi weiterzuentwickeln. In meinen bisherigen Projekten arbeite ich bereits mit modernen Webtechnologien, komponentenbasierten Strukturen und datengetriebenen Anwendungen. Dabei lege ich Wert auf nachvollziehbaren Code, saubere Architektur und eine Lösung, die nicht nur funktioniert, sondern auch weiterentwickelbar bleibt.",
    "Ich bewerbe mich bei Ihnen, weil Ihre Stelle nicht auf reine Routine zielt, sondern auf Entwicklung im eigentlichen Sinn – neues Lernen, Verantwortung übernehmen, Ideen umsetzen und in realen Projekten wachsen. Genau diesen Anspruch verfolge ich auch selbst. Ich möchte mein technisches Fundament, meine Disziplin und meine hohe Motivation in Ihr Team einbringen und mich dort zu einem starken Entwickler mit belastbarem Praxisbezug weiterentwickeln.",
    "Über die Einladung zu einem persönlichen Gespräch freue ich mich.",
  ],
  closing: "Mit freundlichen Grüßen,",
  signatureName: "Steffen Lorenz",
  signatureSign: "",
};

// ── Sub-components ─────────────────────────────────────────────────────────────

function E({
  value,
  onChange,
  editing,
  multiline = false,
  className = "",
  placeholder = "...",
  rows = 4,
}: {
  value: string;
  onChange: (v: string) => void;
  editing: boolean;
  multiline?: boolean;
  className?: string;
  placeholder?: string;
  rows?: number;
}) {
  if (!editing)
    return (
      <span className={className}>
        {value || <span className="opacity-30 italic">{placeholder}</span>}
      </span>
    );
  if (multiline)
    return (
      <textarea
        className={`w-full border border-dashed border-blue-300 rounded px-1 py-0.5 text-inherit bg-blue-50/40 resize-y outline-none focus:border-blue-500 ${className}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
      />
    );
  return (
    <input
      className={`border border-dashed border-blue-300 rounded px-1 py-0.5 text-inherit bg-blue-50/40 outline-none focus:border-blue-500 w-full ${className}`}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
  );
}

function ContactRow({
  icon,
  value,
  editing,
  onChange,
}: {
  icon: React.ReactNode;
  value: string;
  editing: boolean;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-start gap-2 mb-2.5">
      <div
        className="w-6 h-6 rounded flex items-center justify-center shrink-0 mt-0.5"
        style={{ backgroundColor: ACCENT }}
      >
        <span className="text-white w-3.5 h-3.5 flex items-center justify-center">{icon}</span>
      </div>
      <E
        value={value}
        onChange={onChange}
        editing={editing}
        className="text-xs text-white leading-tight break-all"
        placeholder="..."
      />
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function CoverLetterNovoresume({
  initialCompany,
  initialPosition,
}: {
  initialCompany?: string;
  initialPosition?: string;
}) {
  const startData = JSON.parse(JSON.stringify(DEFAULT_CL)) as CLData;
  if (initialCompany) startData.recipient.company = initialCompany;
  if (initialPosition) startData.subject = `Bewerbung als ${initialPosition}`;
  const [data, setData] = useState<CLData>(startData);
  const [editing, setEditing] = useState(false);

  const setPersonal = (patch: Partial<CLData["personal"]>) =>
    setData((d) => ({ ...d, personal: { ...d.personal, ...patch } }));
  const setRecipient = (patch: Partial<CLData["recipient"]>) =>
    setData((d) => ({ ...d, recipient: { ...d.recipient, ...patch } }));

  const updateParagraph = useCallback(
    (idx: number, val: string) =>
      setData((d) => {
        const bp = [...d.bodyParagraphs];
        bp[idx] = val;
        return { ...d, bodyParagraphs: bp };
      }),
    []
  );
  const addParagraph = () =>
    setData((d) => ({ ...d, bodyParagraphs: [...d.bodyParagraphs, ""] }));
  const removeParagraph = (idx: number) =>
    setData((d) => ({ ...d, bodyParagraphs: d.bodyParagraphs.filter((_, i) => i !== idx) }));

  return (
    <div className="min-h-screen bg-gray-100 py-6 px-4">
      {/* Controls */}
      <div className="flex gap-3 mb-5 print:hidden" style={{ maxWidth: 850, margin: "0 auto 20px" }}>
        <button
          onClick={() => setEditing((e) => !e)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            editing
              ? "bg-green-600 hover:bg-green-700 text-white"
              : "bg-indigo-600 hover:bg-indigo-700 text-white"
          }`}
        >
          {editing ? <CheckIcon className="w-4 h-4" /> : <PencilSquareIcon className="w-4 h-4" />}
          {editing ? "Fertig bearbeiten" : "Bearbeiten"}
        </button>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-gray-700 hover:bg-gray-800 text-white transition-colors"
        >
          <PrinterIcon className="w-4 h-4" />
          Drucken / PDF
        </button>
        <button
          onClick={() => {
            if (window.confirm("Alle Änderungen zurücksetzen?"))
              setData(JSON.parse(JSON.stringify(DEFAULT_CL)));
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-gray-200 hover:bg-gray-300 text-gray-700 transition-colors"
        >
          <XMarkIcon className="w-4 h-4" />
          Zurücksetzen
        </button>
        {editing && (
          <p className="self-center text-xs text-gray-500 italic">
            Alle Felder direkt bearbeitbar.
          </p>
        )}
      </div>

      {/* ── Cover Letter Document ──────────────────────────────────────────────── */}
      <div
        className="shadow-2xl bg-white print:shadow-none"
        style={{ maxWidth: 850, margin: "0 auto", fontFamily: "'Calibri', 'Segoe UI', Arial, sans-serif" }}
      >
        <div className="flex" style={{ minHeight: 1100 }}>
          {/* ─── LEFT COLUMN ──────────────────────────────────────────────────── */}
          <div className="flex-1 bg-white" style={{ padding: "40px 24px 40px 40px" }}>
            {/* Name + Subtitle */}
            <div className="mb-6">
              {editing ? (
                <input
                  value={data.personal.name}
                  onChange={(e) => setPersonal({ name: e.target.value })}
                  style={{ display: "block", fontSize: 36, fontWeight: 700, color: "#0f1e2e", lineHeight: 1.2, border: "1px dashed #93c5fd", borderRadius: 3, padding: "2px 4px", background: "rgba(219,234,254,0.3)", outline: "none", width: "100%", marginBottom: 4 }}
                />
              ) : (
                <span style={{ display: "block", fontSize: 36, fontWeight: 700, color: "#0f1e2e", lineHeight: 1.2, marginBottom: 4 }}>{data.personal.name}</span>
              )}
              {editing ? (
                <input
                  value={data.personal.subtitle}
                  onChange={(e) => setPersonal({ subtitle: e.target.value })}
                  style={{ display: "block", fontSize: 14, color: ACCENT, fontWeight: 500, marginBottom: 24, border: "1px dashed #93c5fd", borderRadius: 3, padding: "2px 4px", background: "rgba(219,234,254,0.3)", outline: "none", width: "100%" }}
                />
              ) : (
                <span style={{ display: "block", fontSize: 14, color: ACCENT, fontWeight: 500, marginBottom: 24 }}>{data.personal.subtitle}</span>
              )}

              {/* Recipient block */}
              <div className="mb-1">
                <p style={{ fontSize: 11, fontStyle: "italic", color: "#9ca3af", marginBottom: 2 }}>An</p>
                <E
                  value={data.recipient.company}
                  onChange={(v) => setRecipient({ company: v })}
                  editing={editing}
                  className="block font-bold text-base text-gray-900"
                />
              </div>
              <div className="mb-0.5">
                <E
                  value={data.recipient.street}
                  onChange={(v) => setRecipient({ street: v })}
                  editing={editing}
                  className="block text-base text-gray-900"
                />
              </div>
              <div className="mb-0.5">
                <E
                  value={data.recipient.cityZip}
                  onChange={(v) => setRecipient({ cityZip: v })}
                  editing={editing}
                  className="block text-base text-gray-900"
                />
              </div>
              <div className="mb-3">
                <E
                  value={data.recipient.country}
                  onChange={(v) => setRecipient({ country: v })}
                  editing={editing}
                  className="block text-base font-semibold text-gray-900"
                />
              </div>

              {/* Date */}
              <div className="mb-6" style={{ color: ACCENT }}>
                <E
                  value={data.date}
                  onChange={(v) => setData((d) => ({ ...d, date: v }))}
                  editing={editing}
                  className="text-sm italic"
                />
              </div>
            </div>

            {/* Left accent bar + body */}
            <div className="border-l-4 pl-4 mb-8" style={{ borderColor: ACCENT }}>
              {/* Subject */}
              <div className="mb-5">
                <E
                  value={data.subject}
                  onChange={(v) => setData((d) => ({ ...d, subject: v }))}
                  editing={editing}
                  className="font-semibold text-sm text-gray-900"
                />
              </div>

              {/* Salutation */}
              <div className="mb-4">
                <E
                  value={data.salutation}
                  onChange={(v) => setData((d) => ({ ...d, salutation: v }))}
                  editing={editing}
                  className="text-sm text-gray-900"
                />
              </div>

              {/* Body paragraphs */}
              <div className="space-y-3">
                {data.bodyParagraphs.map((para, idx) => (
                  <div key={idx} className="relative">
                    <E
                      value={para}
                      onChange={(v) => updateParagraph(idx, v)}
                      editing={editing}
                      multiline
                      rows={5}
                      className="text-sm text-gray-700 leading-relaxed block w-full"
                    />
                    {editing && (
                      <button
                        type="button"
                        onClick={() => removeParagraph(idx)}
                        className="absolute -right-5 top-0 text-red-400 hover:text-red-600"
                        title="Absatz entfernen"
                      >
                        <XMarkIcon className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
                {editing && (
                  <button
                    type="button"
                    onClick={addParagraph}
                    className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 mt-2"
                  >
                    <PlusIcon className="w-3.5 h-3.5" /> Absatz hinzufügen
                  </button>
                )}
              </div>
            </div>

            {/* Signature */}
            <div className="mt-8">
              <E
                value={data.closing}
                onChange={(v) => setData((d) => ({ ...d, closing: v }))}
                editing={editing}
                className="block text-sm text-gray-800 mb-8"
              />
              {/* Signature space */}
              <div className="mb-1 h-8 border-b border-gray-200 w-48" />
              <E
                value={data.signatureName}
                onChange={(v) => setData((d) => ({ ...d, signatureName: v }))}
                editing={editing}
                className="block text-sm font-semibold text-gray-900"
              />
            </div>
          </div>

          {/* ─── RIGHT SIDEBAR ─────────────────────────────────────────────────── */}
          <div
            style={{ width: 295, flexShrink: 0, backgroundColor: SIDEBAR_BG, color: "white", padding: "40px 20px" }}
          >
            <ContactRow
              icon={<EnvelopeIcon className="w-3 h-3" />}
              value={data.personal.email}
              editing={editing}
              onChange={(v) => setPersonal({ email: v })}
            />
            <ContactRow
              icon={<PhoneIcon className="w-3 h-3" />}
              value={data.personal.phone}
              editing={editing}
              onChange={(v) => setPersonal({ phone: v })}
            />
            <ContactRow
              icon={<MapPinIcon className="w-3 h-3" />}
              value={data.personal.location}
              editing={editing}
              onChange={(v) => setPersonal({ location: v })}
            />
            <ContactRow
              icon={<LinkIcon className="w-3 h-3" />}
              value={data.personal.website}
              editing={editing}
              onChange={(v) => setPersonal({ website: v })}
            />
            <ContactRow
              icon={
                <svg viewBox="0 0 16 16" className="w-3 h-3" fill="currentColor">
                  <path d="M13 2H3a1 1 0 00-1 1v10a1 1 0 001 1h10a1 1 0 001-1V3a1 1 0 00-1-1zM6 11H4V6h2v5zm-1-5.7a1.15 1.15 0 110-2.3 1.15 1.15 0 010 2.3zM12 11h-2V8.5c0-.6-.5-1-1-1s-1 .4-1 1V11H6V6h2v.8A2.5 2.5 0 0112 8.5V11z" />
                </svg>
              }
              value={data.personal.linkedin}
              editing={editing}
              onChange={(v) => setPersonal({ linkedin: v })}
            />
            <ContactRow
              icon={
                <svg viewBox="0 0 16 16" className="w-3 h-3" fill="currentColor">
                  <path d="M8 0a8 8 0 100 16A8 8 0 008 0zm0 1.5a6.5 6.5 0 016.28 4.83L9.5 4.5V3L8 1.5zm-1.5 0L5 3v1.5L.22 6.33A6.5 6.5 0 016.5 1.5zM8 14.5a6.47 6.47 0 01-5.5-3.08L5 10l1.5 1.5H9L10.5 10l2.5 1.42A6.47 6.47 0 018 14.5z" />
                </svg>
              }
              value={data.personal.github}
              editing={editing}
              onChange={(v) => setPersonal({ github: v })}
            />
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          body { margin: 0; }
          .print\\:hidden { display: none !important; }
          .print\\:shadow-none { box-shadow: none !important; }
        }
      `}</style>
    </div>
  );
}
