"use client";

/**
 * RPMAvatarModel – Lädt einen Ready Player Me .glb-Avatar und animiert ihn
 *
 * Unterstützt:
 *  - Lip-Sync via ARKit/Oculus Viseme Morph-Targets
 *  - Blinzeln (eyeBlinkLeft / eyeBlinkRight)
 *  - Emotionen (mouthSmile, browDown, etc.)
 *  - Idle-Kopf-Animation über Head-Bone
 *  - Lip-Sync-Amplitude (mouthOpen 0–1) von Audio-Analyser
 */

import { useRef, useEffect, useMemo } from "react";
import { useGLTF, useAnimations } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { AvatarEmotion } from "./AvatarScene";

// ── Viseme-Mapping (Oculus Visemes → Sprechen-Animation) ─────────────────────
// RPM liefert diese Morph-Targets wenn ?morphTargets=Oculus+Visemes gesetzt ist

const SPEAK_VISEMES = [
  "viseme_AA",  // "ah"
  "viseme_E",   // "eh"
  "viseme_I",   // "ih"
  "viseme_O",   // "oh"
  "viseme_U",   // "oo"
  "viseme_PP",  // "p", "b", "m"
  "viseme_FF",  // "f", "v"
  "viseme_DD",  // "d", "g"
  "viseme_kk",  // "k"
  "viseme_CH",  // "ch", "sh"
  "viseme_SS",  // "s", "z"
  "viseme_nn",  // "n"
  "viseme_RR",  // "r"
  "viseme_TH",  // "th"
];

// Emotionen → Morph-Targets
const EMOTION_MORPHS: Record<AvatarEmotion, Record<string, number>> = {
  neutral: {},
  happy: {
    mouthSmileLeft:  0.7,
    mouthSmileRight: 0.7,
    cheekSquintLeft:  0.3,
    cheekSquintRight: 0.3,
    browInnerUp:      0.2,
  },
  thinking: {
    browDownLeft:  0.5,
    browDownRight: 0.3,
    mouthPucker:   0.3,
    eyeLookUpLeft:    0.4,
    eyeLookUpRight:   0.4,
  },
  greeting: {
    mouthSmileLeft:   0.9,
    mouthSmileRight:  0.9,
    browInnerUp:      0.5,
    browOuterUpLeft:  0.4,
    browOuterUpRight: 0.4,
    eyeWideLeft:      0.3,
    eyeWideRight:     0.3,
  },
};

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  url: string;
  isSpeaking: boolean;
  emotion: AvatarEmotion;
  mouthOpen?: number; // 0–1 Audio-Amplitude
}

// ── Hilfsfunktion: Morph-Target-Index suchen ──────────────────────────────────

function getMorphIndex(mesh: THREE.SkinnedMesh, name: string): number {
  return mesh.morphTargetDictionary?.[name] ?? -1;
}

function setMorph(mesh: THREE.SkinnedMesh, name: string, value: number) {
  const idx = getMorphIndex(mesh, name);
  if (idx !== -1 && mesh.morphTargetInfluences) {
    mesh.morphTargetInfluences[idx] = THREE.MathUtils.clamp(value, 0, 1);
  }
}

function lerpMorph(mesh: THREE.SkinnedMesh, name: string, target: number, speed: number) {
  const idx = getMorphIndex(mesh, name);
  if (idx !== -1 && mesh.morphTargetInfluences) {
    mesh.morphTargetInfluences[idx] = THREE.MathUtils.lerp(
      mesh.morphTargetInfluences[idx], target, speed
    );
  }
}

// ── Hauptkomponente ───────────────────────────────────────────────────────────

export default function RPMAvatarModel({ url, isSpeaking, emotion, mouthOpen = 0 }: Props) {
  const group = useRef<THREE.Group>(null);

  // GLTF laden
  const { scene, animations } = useGLTF(url);
  const { actions } = useAnimations(animations, group);

  // Geklontes Scene-Objekt (damit mehrere Instanzen möglich wären)
  const clonedScene = useMemo(() => scene.clone(true), [scene]);

  // Alle SkinnedMesh-Nodes sammeln und Head-Bone finden
  const skinMeshes = useRef<THREE.SkinnedMesh[]>([]);
  const headBone = useRef<THREE.Bone | null>(null);

  useEffect(() => {
    const meshes: THREE.SkinnedMesh[] = [];
    clonedScene.traverse((obj) => {
      if ((obj as THREE.SkinnedMesh).isSkinnedMesh) {
        meshes.push(obj as THREE.SkinnedMesh);
      }
      // Head-Bone für Idle-Animation
      if (obj instanceof THREE.Bone && obj.name.toLowerCase().includes("head")) {
        headBone.current = obj;
      }
    });
    skinMeshes.current = meshes;

    // Idle-Animation starten wenn vorhanden
    const idleAction = actions["Idle"] ?? actions[Object.keys(actions)[0]];
    if (idleAction) {
      idleAction.reset().fadeIn(0.3).play();
    }
  }, [clonedScene, actions]);

  // Animations-Zustand
  const clockRef = useRef(0);
  const blinkTimer = useRef(0);
  const blinkState = useRef(false);
  const currentViseme = useRef(0);
  const visemeTimer = useRef(0);

  useFrame((_, delta) => {
    clockRef.current += delta;
    const t = clockRef.current;

    const meshes = skinMeshes.current;
    if (!meshes.length) return;

    // ── Idle-Kopfbewegung via Head-Bone ──────────────────────────────────
    if (headBone.current) {
      headBone.current.rotation.y = THREE.MathUtils.lerp(
        headBone.current.rotation.y,
        Math.sin(t * 0.4) * 0.08,
        0.05
      );
      headBone.current.rotation.x = THREE.MathUtils.lerp(
        headBone.current.rotation.x,
        Math.sin(t * 0.25) * 0.04 - 0.05,
        0.05
      );
    }

    for (const mesh of meshes) {
      if (!mesh.morphTargetDictionary || !mesh.morphTargetInfluences) continue;

      // ── Blinzeln ───────────────────────────────────────────────────────
      blinkTimer.current -= delta;
      if (blinkTimer.current <= 0) {
        blinkState.current = !blinkState.current;
        blinkTimer.current = blinkState.current ? 0.1 : (2 + Math.random() * 3);
      }
      const blinkTarget = blinkState.current ? 1 : 0;
      lerpMorph(mesh, "eyeBlinkLeft", blinkTarget, 0.4);
      lerpMorph(mesh, "eyeBlinkRight", blinkTarget, 0.4);

      // ── Lip-Sync ────────────────────────────────────────────────────────
      if (isSpeaking || mouthOpen > 0.05) {
        // Aktiven Viseme alle 80-150ms wechseln
        visemeTimer.current -= delta;
        if (visemeTimer.current <= 0) {
          visemeTimer.current = 0.08 + Math.random() * 0.07;
          // Alten Viseme auf 0 setzen
          lerpMorph(mesh, SPEAK_VISEMES[currentViseme.current], 0, 0.6);
          currentViseme.current = Math.floor(Math.random() * SPEAK_VISEMES.length);
        }

        // Aktiven Viseme animieren
        const amplitude = isSpeaking
          ? (0.3 + Math.abs(Math.sin(t * 7)) * 0.5 + mouthOpen * 0.4)
          : mouthOpen;

        lerpMorph(mesh, SPEAK_VISEMES[currentViseme.current], amplitude, 0.35);
        lerpMorph(mesh, "mouthOpen", amplitude * 0.6, 0.2);
        lerpMorph(mesh, "jawOpen", amplitude * 0.4, 0.2);
      } else {
        // Stumm: alles auf 0 zurücksetzen
        lerpMorph(mesh, SPEAK_VISEMES[currentViseme.current], 0, 0.3);
        lerpMorph(mesh, "mouthOpen", 0, 0.2);
        lerpMorph(mesh, "jawOpen", 0, 0.2);
      }

      // ── Emotionen ──────────────────────────────────────────────────────
      const targetMorphs = EMOTION_MORPHS[emotion] ?? {};

      // Alle möglichen Emotions-Morphs auf Zielwert animieren
      const allEmotionMorphs = new Set([
        ...Object.keys(EMOTION_MORPHS.happy),
        ...Object.keys(EMOTION_MORPHS.thinking),
        ...Object.keys(EMOTION_MORPHS.greeting),
      ]);

      for (const morphName of allEmotionMorphs) {
        lerpMorph(mesh, morphName, targetMorphs[morphName] ?? 0, 0.08);
      }
    }
  });

  return (
    <group ref={group}>
      <primitive object={clonedScene} />
    </group>
  );
}
