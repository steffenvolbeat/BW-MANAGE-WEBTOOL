import MainLayout from "@/components/layout/MainLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import NotesManagement from "@/components/notes/NotesManagement";

export default function NotesPage() {
  return (
    <ProtectedRoute>
      <MainLayout>
        <NotesManagement />
      </MainLayout>
    </ProtectedRoute>
  );
}
