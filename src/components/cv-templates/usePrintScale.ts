import { RefObject, useCallback, useEffect } from "react";

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
  const applyScale = useCallback(() => {
    const el = docRef.current;
    if (!el) return;
    const h = el.scrollHeight;
    const zoom = h > maxPx ? (baseZoom * maxPx) / h : baseZoom;
    el.style.zoom = zoom.toFixed(5);
  }, [docRef, maxPx, baseZoom]);

  const resetScale = useCallback(() => {
    const el = docRef.current;
    if (el) el.style.zoom = "";
  }, [docRef]);

  const printNow = useCallback(() => {
    applyScale();
    // Zwei Frames warten, damit der Browser die inline-Skalierung sicher übernimmt.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        window.print();
      });
    });
  }, [applyScale]);

  useEffect(() => {
    window.addEventListener("beforeprint", applyScale);
    window.addEventListener("afterprint", resetScale);
    return () => {
      window.removeEventListener("beforeprint", applyScale);
      window.removeEventListener("afterprint", resetScale);
    };
  }, [applyScale, resetScale]);

  return printNow;
}
