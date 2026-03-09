import { Suspense } from "react";
import MainLayout from "@/components/layout/MainLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import NotesManagement from "@/components/notes/NotesManagement";

export default function NotesPage() {
  return (
    <ProtectedRoute>
      <MainLayout>
        <Suspense fallback={<div className="min-h-[200px]" />}>
          <NotesManagement />
        </Suspense>
      </MainLayout>
    </ProtectedRoute>
  );
}
