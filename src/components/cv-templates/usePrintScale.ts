import { RefObject, useEffect } from "react";

/**
 * Passt den zoom des .doc-Elements vor dem Drucken automatisch an,
 * sodass der Inhalt IMMER auf genau 1 DIN A4 Seite passt.
 * @param docRef  Ref auf das .doc-Root-Element des Templates
 * @param maxPx   Maximale Pixelhöhe bei zoom=1 (Standard: 1202 = A4 bei zoom:0.934)
 * @param baseZoom  Basis-Zoom für A4-Breite (Standard: 0.934)
 */
export function usePrintScale(
  docRef: RefObject<HTMLDivElement | null>,
  maxPx = 1202,
  baseZoom = 0.934
) {
  useEffect(() => {
    const before = () => {
      const el = docRef.current;
      if (!el) return;
      const h = el.scrollHeight;
      const zoom = h > maxPx ? (baseZoom * maxPx) / h : baseZoom;
      el.style.zoom = zoom.toFixed(5);
    };
    const after = () => {
      const el = docRef.current;
      if (el) el.style.zoom = "";
    };
    window.addEventListener("beforeprint", before);
    window.addEventListener("afterprint", after);
    return () => {
      window.removeEventListener("beforeprint", before);
      window.removeEventListener("afterprint", after);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
