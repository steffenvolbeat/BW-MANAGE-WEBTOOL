import { Suspense } from "react";
import { TrustedKanban } from "@/components/kanban/TrustedKanban";

export const dynamic = "force-dynamic";

export default function KanbanPage() {
  return (
    <main className="px-3 py-4 sm:px-6 sm:py-6 pb-24">
      <Suspense>
        <TrustedKanban />
      </Suspense>
    </main>
  );
}
