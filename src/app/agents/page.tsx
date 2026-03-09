import AgentDashboard from "@/components/agents/AgentDashboard";
import { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Autonomer Agent – BW Manage",
  description: "KI-Agent mit Human-in-the-Loop Genehmigung für Bewerbungsautomatisierung",
};

export default function AgentsPage() {
  return (
    <main>
      <AgentDashboard />
    </main>
  );
}
