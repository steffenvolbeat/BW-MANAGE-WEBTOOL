import AgentDashboard from "@/components/agents/AgentDashboard";
import { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Job-Hunter Agent – BW Manage",
  description: "Autonomer Job-Hunter Agent: Bewerbungen automatisch einreichen, Follow-ups planen",
};

export default function JobHunterPage() {
  return (
    <main>
      {/* Job-Hunter spezifischer Header */}
      <div className="px-4 pt-4 pb-0">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
          <h1 className="text-sm font-semibold text-white/70 uppercase tracking-widest">
            Job-Hunter Modus
          </h1>
        </div>
        <p className="text-xs text-white/30 px-5">
          Spezialisiert auf: Stellen suchen · Bewerbungen einreichen · Follow-ups automatisieren
        </p>
      </div>
      <AgentDashboard />
    </main>
  );
}
