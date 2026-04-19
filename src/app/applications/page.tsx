import { Suspense } from "react";
import ApplicationsOverview from "@/components/applications/ApplicationsOverview";

export default function ApplicationsPage() {
  return (
    <Suspense>
      <ApplicationsOverview />
    </Suspense>
  );
}
