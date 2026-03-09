import MainLayout from "@/components/layout/MainLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import JobPortalIntegration from "@/components/integrations/JobPortalIntegration";

export default function JobPortalsPage() {
  return (
    <ProtectedRoute>
      <MainLayout>
        <JobPortalIntegration />
      </MainLayout>
    </ProtectedRoute>
  );
}
