"use client";
// ─── useCVStorage: localStorage persistence for all CV templates ───────────
import { useState, useEffect } from "react";
import { CVData, DEFAULT_CV_DATA } from "./shared";

/**
 * Drop-in replacement for the 6 useState calls in every epic CV template.
 * Persists data, fonts, sizes, photo shape, photo src and colors to localStorage
 * under the key `cv-<templateKey>-*`. Safe during SSR (loads on mount only).
 *
 * Usage:
 *   const { data, setData, fontKey, setFontKey, sizeKey, setSizeKey,
 *           photoShapeKey, setPhotoShapeKey, photoSrc, setPhotoSrc,
 *           clrs, setClrs, resetStorage } = useCVStorage("midnight", DEFAULT_COLORS);
 */
export function useCVStorage<C extends Record<string, string>>(
  templateKey: string,
  defaultColors: C,
) {
  const K = `cv-${templateKey}`;

  // ── State (initialised with defaults, loaded from localStorage on mount) ──
  const [data, setData] = useState<CVData>(() =>
    JSON.parse(JSON.stringify(DEFAULT_CV_DATA))
  );
  const [fontKey, setFontKey] = useState("nunito");
  const [sizeKey, setSizeKey] = useState("md");
  const [photoShapeKey, setPhotoShapeKey] = useState("circle");
  const [photoSrc, setPhotoSrc] = useState("");
  const [clrs, setClrs] = useState<C>(defaultColors);

  // storageLoaded prevents save effects from overwriting stored data
  // before the load effect has a chance to restore it.
  const [storageLoaded, setStorageLoaded] = useState(false);

  // ── Load from localStorage once (after hydration) ─────────────────────────
  useEffect(() => {
    try {
      const d = localStorage.getItem(`${K}-data`);
      if (d) setData(JSON.parse(d));
      const f = localStorage.getItem(`${K}-font`);
      if (f) setFontKey(f);
      const s = localStorage.getItem(`${K}-size`);
      if (s) setSizeKey(s);
      const sh = localStorage.getItem(`${K}-shape`);
      if (sh) setPhotoShapeKey(sh);
      const p = localStorage.getItem(`${K}-photo`);
      if (p) setPhotoSrc(p);
      const c = localStorage.getItem(`${K}-colors`);
      if (c) setClrs(JSON.parse(c) as C);
    } catch { /* ignore */ }
    setStorageLoaded(true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Save to localStorage whenever values change (but not before first load) ─
  useEffect(() => {
    if (!storageLoaded) return;
    try { localStorage.setItem(`${K}-data`, JSON.stringify(data)); } catch { /* quota exceeded etc. */ }
  }, [data, storageLoaded, K]);

  useEffect(() => {
    if (!storageLoaded) return;
    try { localStorage.setItem(`${K}-font`, fontKey); } catch { /* ignore */ }
  }, [fontKey, storageLoaded, K]);

  useEffect(() => {
    if (!storageLoaded) return;
    try { localStorage.setItem(`${K}-size`, sizeKey); } catch { /* ignore */ }
  }, [sizeKey, storageLoaded, K]);

  useEffect(() => {
    if (!storageLoaded) return;
    try { localStorage.setItem(`${K}-shape`, photoShapeKey); } catch { /* ignore */ }
  }, [photoShapeKey, storageLoaded, K]);

  useEffect(() => {
    if (!storageLoaded) return;
    try { localStorage.setItem(`${K}-photo`, photoSrc); } catch { /* ignore */ }
  }, [photoSrc, storageLoaded, K]);

  useEffect(() => {
    if (!storageLoaded) return;
    try { localStorage.setItem(`${K}-colors`, JSON.stringify(clrs)); } catch { /* ignore */ }
  }, [clrs, storageLoaded, K]);

  // ── Clear all persisted data for this template ─────────────────────────────
  const resetStorage = () => {
    ["data", "font", "size", "shape", "photo", "colors"].forEach(suffix => {
      try { localStorage.removeItem(`${K}-${suffix}`); } catch { /* ignore */ }
    });
  };

  return {
    data, setData,
    fontKey, setFontKey,
    sizeKey, setSizeKey,
    photoShapeKey, setPhotoShapeKey,
    photoSrc, setPhotoSrc,
    clrs, setClrs,
    resetStorage,
  };
}
