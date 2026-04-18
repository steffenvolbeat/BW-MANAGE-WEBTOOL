"use client";

/**
 * CustomAvatarModel – Lädt eine nutzereigene Blender-exportierte .glb-Datei
 * und rendert sie im Anime-/Cel-Shading-Stil (MeshToonMaterial + GradientMap).
 *
 * Features:
 *  - Automatisches Ersetzen aller Materialien durch MeshToonMaterial
 *  - 5-stufige Cartoon-Gradientmap für harte Licht-/Schatten-Übergänge
 *  - Morph-Target-Lip-Sync (Oculus Visemes, ARKit Jaw / mouthOpen)
 *  - Knochen-basierte Kiefer-Animation als Fallback
 *  - Idle-Kopf / Float-Bewegung
 *  - Blinzeln über EyeBlink_L/R Morph-Targets oder Upper-Lid-Knochen
 */

import { useRef, useEffect, useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { AvatarEmotion } from "./AvatarScene";

// ── Viseme-Reihenfolge (Oculus-Standard) ─────────────────────────────────────
// Gewichtung für Lip-Sync: mehrere Viseme gleichzeitig aktiv,
// um natürliche Übergänge zu simulieren.
const SPEAK_VISEMES = [
  "viseme_AA", "viseme_E", "viseme_I", "viseme_O", "viseme_U",
  "viseme_PP", "viseme_FF", "viseme_TH", "viseme_DD",
  "viseme_kk", "viseme_CH", "viseme_SS", "viseme_nn", "viseme_RR",
];

// ARKit / Blender Shape-Key-Alternativen für Mund/Kiefer
const JAW_SHAPES = [
  "jawOpen", "Jaw_Open", "jaw_open", "mouthOpen",
  "A", "AH", "Mbp", "FV",
];

// Blink-Morph-Alternativen
const BLINK_L_SHAPES = ["eyeBlinkLeft", "EyeBlink_L", "blink_L", "Blink_Left", "Blink"];
const BLINK_R_SHAPES = ["eyeBlinkRight", "EyeBlink_R", "blink_R", "Blink_Right", "Blink"];

// ── Gradient-Map für Toon-Shading ────────────────────────────────────────────
function createToonGradientMap(steps = 5): THREE.DataTexture {
  const size = 256;
  const data = new Uint8Array(size);
  for (let i = 0; i < size; i++) {
    const t = i / size;
    // Harte Stufen → Cartoon-Effekt
    const step = Math.floor(t * steps) / (steps - 1);
    data[i] = Math.round(step * 255);
  }
  const tex = new THREE.DataTexture(data, size, 1, THREE.RedFormat);
  tex.needsUpdate = true;
  return tex;
}

// ── Hilfsfunktion: Lerp Morph-Target ─────────────────────────────────────────
function lerpMorph(
  meshes: THREE.SkinnedMesh[],
  name: string,
  target: number,
  alpha: number,
) {
  for (const mesh of meshes) {
    if (!mesh.morphTargetDictionary || !mesh.morphTargetInfluences) continue;
    const idx = mesh.morphTargetDictionary[name];
    if (idx === undefined) continue;
    mesh.morphTargetInfluences[idx] = THREE.MathUtils.lerp(
      mesh.morphTargetInfluences[idx],
      target,
      alpha,
    );
  }
}

// ── Props ─────────────────────────────────────────────────────────────────────
interface CustomAvatarModelProps {
  url: string;
  isSpeaking: boolean;
  emotion: AvatarEmotion;
  mouthOpen?: number;
}

// ── Haupt-Komponente ──────────────────────────────────────────────────────────
export default function CustomAvatarModel({
  url,
  isSpeaking,
  emotion,
  mouthOpen = 0,
}: CustomAvatarModelProps) {
  const { scene, animations } = useGLTF(url);
  const groupRef = useRef<THREE.Group>(null);

  // Toon-Gradient (einmalig)
  const gradientMap = useMemo(() => createToonGradientMap(5), []);

  // Alle SkinnedMeshes + Meshes sammeln
  const skinnedMeshes = useMemo<THREE.SkinnedMesh[]>(() => {
    const list: THREE.SkinnedMesh[] = [];
    scene.traverse((obj) => {
      if ((obj as THREE.SkinnedMesh).isSkinnedMesh) {
        list.push(obj as THREE.SkinnedMesh);
      }
    });
    return list;
  }, [scene]);

  // Knochen-Maps
  const jawBone = useMemo<THREE.Bone | null>(() => {
    let found: THREE.Bone | null = null;
    scene.traverse((obj) => {
      if (!found && obj instanceof THREE.Bone) {
        const n = obj.name.toLowerCase();
        if (n.includes("jaw") || n.includes("mouth")) found = obj as THREE.Bone;
      }
    });
    return found;
  }, [scene]);

  const headBone = useMemo<THREE.Bone | null>(() => {
    let found: THREE.Bone | null = null;
    scene.traverse((obj) => {
      if (!found && obj instanceof THREE.Bone) {
        const n = obj.name.toLowerCase();
        if (n === "head" || n.includes("head")) found = obj as THREE.Bone;
      }
    });
    return found;
  }, [scene]);

  // Verfügbare Morph-Target-Namen ermitteln
  const availableMorphs = useMemo<Set<string>>(() => {
    const s = new Set<string>();
    for (const mesh of skinnedMeshes) {
      if (mesh.morphTargetDictionary) {
        Object.keys(mesh.morphTargetDictionary).forEach((k) => s.add(k));
      }
    }
    return s;
  }, [skinnedMeshes]);

  // Aktive Visemes / Jaw-Shape ermitteln
  const activeVisemes = useMemo(
    () => SPEAK_VISEMES.filter((v) => availableMorphs.has(v)),
    [availableMorphs],
  );
  const jawShape = useMemo(
    () => JAW_SHAPES.find((s) => availableMorphs.has(s)) ?? null,
    [availableMorphs],
  );
  const blinkLShape = useMemo(
    () => BLINK_L_SHAPES.find((s) => availableMorphs.has(s)) ?? null,
    [availableMorphs],
  );
  const blinkRShape = useMemo(
    () => BLINK_R_SHAPES.find((s) => availableMorphs.has(s)) ?? null,
    [availableMorphs],
  );

  // Animations-Mixer (falls Blender-Animationen vorhanden)
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  useEffect(() => {
    if (animations && animations.length > 0) {
      const mixer = new THREE.AnimationMixer(scene);
      // Idle-Animation bevorzugen
      const idle =
        animations.find((a) =>
          a.name.toLowerCase().includes("idle") ||
          a.name.toLowerCase().includes("breathing"),
        ) ?? animations[0];
      mixer.clipAction(idle).play();
      mixerRef.current = mixer;
      return () => {
        mixer.stopAllAction();
        mixerRef.current = null;
      };
    }
  }, [animations, scene]);

  // ── Toon-Material auf alle Meshes anwenden ────────────────────────────────
  useEffect(() => {
    scene.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh) return;

      const applyToon = (src: THREE.Material): THREE.MeshToonMaterial => {
        const old = src as Partial<THREE.MeshStandardMaterial>;
        return new THREE.MeshToonMaterial({
          color: old.color ?? new THREE.Color("#ccaaff"),
          map: old.map ?? undefined,
          gradientMap,
          transparent: old.transparent ?? false,
          opacity: old.opacity ?? 1,
          // Outline-ähnlicher Effekt: leicht dunkle Seite
          side: mesh.material instanceof THREE.Material && (mesh.material as THREE.MeshStandardMaterial).side === THREE.BackSide
            ? THREE.BackSide
            : THREE.FrontSide,
        });
      };

      if (Array.isArray(mesh.material)) {
        mesh.material = mesh.material.map(applyToon);
      } else {
        mesh.material = applyToon(mesh.material);
      }
    });
  }, [scene, gradientMap]);

  // ── Outline-Pass (schwarz, Scale-Trick) ──────────────────────────────────
  // Wir clonen die Meshes gespiegelt mit BackSide-Material für Kontur-Effekt
  useEffect(() => {
    const outlineObjects: THREE.Object3D[] = [];
    scene.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh || (obj as THREE.SkinnedMesh).isSkinnedMesh) return;

      const outline = mesh.clone();
      outline.scale.multiplyScalar(1.04);
      outline.material = new THREE.MeshBasicMaterial({
        color: new THREE.Color("#111111"),
        side: THREE.BackSide,
      });
      mesh.parent?.add(outline);
      outlineObjects.push(outline);
    });
    return () => {
      outlineObjects.forEach((o) => o.parent?.remove(o));
    };
  }, [scene]);

  // Animationsrefs
  const clockRef = useRef(0);
  // eslint-disable-next-line react-hooks/purity -- Math.random im useRef-Initializer ist sicher (nur einmalig, kein Re-Render-Pfad)
  const blinkTimerRef = useRef(1.5 + Math.random() * 2);
  const blinkStateRef = useRef(false);
  const jawRestRef = useRef<THREE.Euler | null>(null);

  useEffect(() => {
    if (jawBone) {
      jawRestRef.current = jawBone.rotation.clone();
    }
  }, [jawBone]);

  // ── Animation Loop ────────────────────────────────────────────────────────
  useFrame((_, delta) => {
    clockRef.current += delta;
    const t = clockRef.current;

    // Mixer updaten (Blender-Animations)
    mixerRef.current?.update(delta);

    // ── Idle Kopfbewegung ─────────────────────────────────────────────────
    if (headBone) {
      // eslint-disable-next-line react-hooks/immutability -- Three.js Bone wird in useFrame (Animations-Loop) mutiert, kein React-Render
      headBone.rotation.y = Math.sin(t * 0.4) * 0.08;
      headBone.rotation.x = Math.sin(t * 0.25) * 0.04 - 0.03;
    }

    // ── Mund Lip-Sync ──────────────────────────────────────────────────────
    if (isSpeaking || mouthOpen > 0.05) {
      const lipsyncAmp = isSpeaking
        ? Math.abs(Math.sin(t * 8.5) * 0.45 + Math.sin(t * 13.3) * 0.3 + Math.sin(t * 5.7) * 0.25)
        : 0;
      const totalMouth = Math.max(lipsyncAmp, mouthOpen);

      if (activeVisemes.length > 0) {
        // Oculus-Viseme-basiertes Lip-Sync
        const primary = activeVisemes[Math.floor(t * 7) % activeVisemes.length];
        for (const v of activeVisemes) {
          const w = v === primary ? totalMouth : totalMouth * 0.1;
          lerpMorph(skinnedMeshes, v, w, 0.35);
        }
      } else if (jawShape) {
        // Shape-Key Jaw-Fallback
        lerpMorph(skinnedMeshes, jawShape, totalMouth * 0.9, 0.3);
      } else if (jawBone && jawRestRef.current) {
        // Knochen-Kiefer-Fallback
        const targetRotX = jawRestRef.current.x + totalMouth * 0.25;
        // eslint-disable-next-line react-hooks/immutability -- Three.js Bone-Mutation in useFrame
        jawBone.rotation.x = THREE.MathUtils.lerp(jawBone.rotation.x, targetRotX, 0.3);
      }
    } else {
      // Mund schließen
      for (const v of activeVisemes) lerpMorph(skinnedMeshes, v, 0, 0.25);
      if (jawShape) lerpMorph(skinnedMeshes, jawShape, 0, 0.25);
      if (jawBone && jawRestRef.current) {
        jawBone.rotation.x = THREE.MathUtils.lerp(jawBone.rotation.x, jawRestRef.current.x, 0.25);
      }
    }

    // ── Blinzeln ──────────────────────────────────────────────────────────
    blinkTimerRef.current -= delta;
    if (blinkTimerRef.current <= 0) {
      blinkStateRef.current = !blinkStateRef.current;
      blinkTimerRef.current = blinkStateRef.current ? 0.1 : (2.5 + Math.random() * 3.5);
    }
    const blinkVal = blinkStateRef.current ? 1 : 0;
    if (blinkLShape) lerpMorph(skinnedMeshes, blinkLShape, blinkVal, 0.4);
    if (blinkRShape) lerpMorph(skinnedMeshes, blinkRShape, blinkVal, 0.4);

    // ── Emotion-Morphs ─────────────────────────────────────────────────────
    const smileShapes = ["mouthSmileLeft", "mouthSmileRight", "MouthSmile", "smile"];
    const sadShapes   = ["mouthFrownLeft", "mouthFrownRight", "Sad"];
    const browUpShapes = ["browInnerUp", "BrowRaise_L", "BrowRaise_R"];

    const smileVal = emotion === "happy" || emotion === "greeting" ? 0.7 : 0;
    const sadVal   = emotion === "thinking" ? 0.25 : 0;
    const browVal  = emotion === "greeting" ? 0.5 : emotion === "thinking" ? 0.3 : 0;

    for (const s of smileShapes) lerpMorph(skinnedMeshes, s, smileVal, 0.08);
    for (const s of sadShapes) lerpMorph(skinnedMeshes, s, sadVal, 0.08);
    for (const s of browUpShapes) lerpMorph(skinnedMeshes, s, browVal, 0.08);
  });

  return <primitive object={scene} ref={groupRef} />;
}
