import ProtectedRoute from "@/components/ProtectedRoute";
import MainLayout from "@/components/layout/MainLayout";
import OutboxReminders from "@/components/reminders/OutboxReminders";

export const metadata = { title: "Erinnerungen – BW-Manage" };

export default function RemindersPage() {
  return (
    <ProtectedRoute>
      <MainLayout>
        <OutboxReminders />
      </MainLayout>
    </ProtectedRoute>
  );
}
