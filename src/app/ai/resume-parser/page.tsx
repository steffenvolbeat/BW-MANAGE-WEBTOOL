import type { Metadata } from "next";
import ResumeParserClientWrapper from "./ResumeParserClientWrapper";

export const metadata: Metadata = {
  title: "CV Scanner – AI Resume Parser | BW Manage",
  description:
    "Lade deinen Lebenslauf hoch und lass die KI Skills, Erfahrungen und Qualifikationen extrahieren – inkl. Gap-Analyse für Stellenanzeigen.",
};

export default function ResumeParserPage() {
  return (
    <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50 dark:bg-slate-950">
      {/* Seitenheader */}
      <div className="max-w-5xl mx-auto mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-linear-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m5.231 13.481L15 17.25m-4.5-15H5.625c-.621 0-1.125.504-1.125 1.125v16.5c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Zm3.75 11.625a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">AI Resume Parser</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">CV scannen · Skills extrahieren · Gap-Analyse</p>
          </div>
          <span className="ml-auto inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-linear-to-r from-indigo-600 to-violet-600 text-white shadow-sm shadow-indigo-500/20">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 0 0 .95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 0 0-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 0 0-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 0 0-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 0 0 .951-.69l1.07-3.292Z" />
            </svg>
            KI-Feature
          </span>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-3 max-w-2xl">
          Lade einen Lebenslauf als PDF hoch – die KI extrahiert automatisch alle relevanten Daten und kann anschließend
          eine detaillierte <strong>Gap-Analyse</strong> gegen jede Stellenanzeige durchführen.
        </p>
      </div>

      <ResumeParserClientWrapper />
    </main>
  );
}
