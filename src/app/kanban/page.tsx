import { TrustedKanban } from "@/components/kanban/TrustedKanban";

export const dynamic = "force-dynamic";

export default function KanbanPage() {
  return (
    <main className="p-6">
      <TrustedKanban />
    </main>
  );
}
