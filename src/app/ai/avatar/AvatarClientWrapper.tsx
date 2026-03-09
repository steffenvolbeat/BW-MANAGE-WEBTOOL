"use client";

import dynamic from "next/dynamic";

const AvatarChat = dynamic(() => import("@/components/ai/AvatarChat"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full min-h-100">
      <div className="text-center space-y-4">
        <div className="relative mx-auto w-20 h-20">
          <div className="w-20 h-20 rounded-full bg-linear-to-br from-indigo-500 to-violet-600 animate-pulse flex items-center justify-center">
            <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
            </svg>
          </div>
          <div className="absolute inset-0 rounded-full border-4 border-indigo-400/30 animate-ping" />
        </div>
        <div>
          <p className="text-slate-700 dark:text-slate-200 font-semibold">AVA wird geladen</p>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">3D-Rendering initialisiert…</p>
        </div>
      </div>
    </div>
  ),
});

export default function AvatarClientWrapper() {
  return <AvatarChat />;
}
