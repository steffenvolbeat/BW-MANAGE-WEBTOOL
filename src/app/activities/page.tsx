import { Suspense } from "react";
import ActivitiesOverview from "@/components/activities/ActivitiesOverview";

export default function ActivitiesPage() {
  return (
    <Suspense>
      <ActivitiesOverview />
    </Suspense>
  );
}
