import LebenslaufTemplate from "@/components/lebenslauf/LebenslaufTemplate";
import ProtectedRoute from "@/components/ProtectedRoute";
import MainLayout from "@/components/layout/MainLayout";

export default function LebenslaufPage() {
  return (
    <ProtectedRoute>
      <MainLayout>
        <LebenslaufTemplate />
      </MainLayout>
    </ProtectedRoute>
  );
}
