import AnschreibenStudio from "@/components/anschreiben/AnschreibenStudio";
import ProtectedRoute from "@/components/ProtectedRoute";
import MainLayout from "@/components/layout/MainLayout";

export default function AnschreibenPage() {
  return (
    <ProtectedRoute>
      <MainLayout>
        <AnschreibenStudio />
      </MainLayout>
    </ProtectedRoute>
  );
}
