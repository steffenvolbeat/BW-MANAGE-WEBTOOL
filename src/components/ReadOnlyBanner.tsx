"use client";

import { useReadOnly } from "@/hooks/useReadOnly";
import { ShieldExclamationIcon } from "@heroicons/react/24/outline";

/**
 * Gelber Hinweisbalken, der für MANAGER und VERMITTLER angezeigt wird.
 * Ist für alle anderen Rollen unsichtbar (rendert null).
 */
export default function ReadOnlyBanner() {
  const { isReadOnly } = useReadOnly();

  if (!isReadOnly) return null;

  return (
    <div className="w-full bg-amber-100 dark:bg-amber-900/40 border-b border-amber-300 dark:border-amber-700 px-4 py-2 flex items-center gap-2 text-sm text-amber-800 dark:text-amber-200">
      <ShieldExclamationIcon className="h-4 w-4 shrink-0" />
      <span className="font-medium">Lesezugriff –</span>
      <span>Änderungen sind in diesem Modus nicht erlaubt.</span>
    </div>
  );
}
