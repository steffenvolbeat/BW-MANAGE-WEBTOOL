import { Suspense } from "react";
import Calendar from "@/components/calendar/Calendar";
import MainLayout from "@/components/layout/MainLayout";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function CalendarPage() {
  return (
    <ProtectedRoute>
      <MainLayout>
        <Suspense>
          <Calendar />
        </Suspense>
      </MainLayout>
    </ProtectedRoute>
  );
}
