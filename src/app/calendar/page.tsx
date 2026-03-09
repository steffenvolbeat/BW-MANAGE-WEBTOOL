import Calendar from "@/components/calendar/Calendar";
import MainLayout from "@/components/layout/MainLayout";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function CalendarPage() {
  return (
    <ProtectedRoute>
      <MainLayout>
        <Calendar />
      </MainLayout>
    </ProtectedRoute>
  );
}
