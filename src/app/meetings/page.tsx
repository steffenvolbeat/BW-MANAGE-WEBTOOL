import MainLayout from "@/components/layout/MainLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import MeetingManagement from "@/components/meetings/MeetingManagement";
import RemindersManagement from "@/components/meetings/RemindersManagement";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Meetings & Erinnerungen | BW-MANAGE",
};

export default function MeetingsPage() {
  return (
    <ProtectedRoute>
      <MainLayout>
        <div className="space-y-12">
          <MeetingManagement />
          <hr className="border-gray-100" />
          <RemindersManagement />
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}
