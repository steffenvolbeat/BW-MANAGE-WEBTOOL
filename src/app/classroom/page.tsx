import { Suspense } from "react";
import MainLayout from "@/components/layout/MainLayout";
import DCIClassroom from "@/components/classroom/DCIClassroom";
import ProtectedRoute from "@/components/ProtectedRoute";

export const metadata = {
  title: "DCI Bewerbung – Classroom",
  description: "12-Wochen ISP-Programm: Aufgaben, Wochenziele und Lernmaterialien",
};

export default function ClassroomPage() {
  return (
    <ProtectedRoute>
      <MainLayout>
        <Suspense>
          <DCIClassroom />
        </Suspense>
      </MainLayout>
    </ProtectedRoute>
  );
}
