import ProtectedRoute from "@/components/ProtectedRoute";
import MainLayout from "@/components/layout/MainLayout";
import FileBrowser from "@/components/documents/FileBrowser";

export const metadata = { title: "Datei-Browser – BW-Manage" };

export default function FilesPage() {
  return (
    <ProtectedRoute>
      <MainLayout>
        <FileBrowser />
      </MainLayout>
    </ProtectedRoute>
  );
}
