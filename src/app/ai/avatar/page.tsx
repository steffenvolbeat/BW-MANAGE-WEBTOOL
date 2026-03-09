/**
 * /ai/avatar – 3D AI-Avatar / Bot Seite (Feature 3)
 */
import type { Metadata } from "next";
import AvatarClientWrapper from "./AvatarClientWrapper";

export const metadata: Metadata = {
  title: "3D AI-Avatar | BW-Manage",
  description: "Animierter sprechender 3D-KI-Avatar für Bewerbungscoaching mit Lippensynchronisation und Spracheingabe",
};

export default function AvatarPage() {
  return (
    <main className="flex flex-col h-[calc(100vh-4rem)] bg-slate-50 dark:bg-slate-950 overflow-hidden">
      {/* Page-Header */}
      <div className="shrink-0 px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-linear-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-md shadow-indigo-500/20">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
              AVA – 3D AI-Avatar
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Animierter sprechender Avatar · Lippensynchronisation · Spracheingabe · TTS
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="px-2 py-0.5 text-xs font-semibold bg-linear-to-r from-indigo-500 to-violet-600 text-white rounded-full">
              3D
            </span>
            <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-full">
              Three.js
            </span>
            <span className="px-2 py-0.5 text-xs font-semibold bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 rounded-full">
              KI
            </span>
          </div>
        </div>
      </div>

      {/* Chat-Bereich */}
      <div className="flex-1 min-h-0">
        <AvatarClientWrapper />
      </div>

      {/* Privacy-Footer */}
      <div className="shrink-0 px-6 py-2 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
        <p className="text-xs text-slate-400 dark:text-slate-500 text-center">
          🔒 Spracheingabe nur lokal · keine Daten werden gespeichert · TTS via ElevenLabs oder Browser
        </p>
      </div>
    </main>
  );
}
