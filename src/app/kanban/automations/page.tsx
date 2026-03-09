import ProtectedRoute from "@/components/ProtectedRoute";
import MainLayout from "@/components/layout/MainLayout";
import KanbanAutomations from "@/components/kanban/KanbanAutomations";

export const metadata = { title: "Kanban-Automationen – BW-Manage" };

export default function KanbanAutomationsPage() {
  return (
    <ProtectedRoute>
      <MainLayout>
        <KanbanAutomations />
      </MainLayout>
    </ProtectedRoute>
  );
}
