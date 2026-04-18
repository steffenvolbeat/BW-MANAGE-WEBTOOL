"use client";

/**
 * AvatarScene – 3D animierter KI-Avatar mit React Three Fiber
 * Feature 3: 3D AI-Avatar / Bot
 *
 * Props:
 *  isSpeaking   – Mund-Lip-Sync-Animation aktivieren
 *  emotion      – "neutral" | "happy" | "thinking" | "greeting"
 *  mouthOpen    – externe Amplitude (0–1) für Audio-Sync
 */

import { useRef, useMemo, Component, Suspense, type ReactNode } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Float, ContactShadows } from "@react-three/drei";
import * as THREE from "three";
import RPMAvatarModel from "./RPMAvatarModel";
import CustomAvatarModel from "./CustomAvatarModel";

// ── HDR-Fetch-Block ───────────────────────────────────────────────────────────
// @react-three/drei registriert intern einen RGBELoader für die Standard-
// Umgebung (potsdamer_platz_1k.hdr) als Modul-Side-Effect – unabhängig ob
// <Environment> im JSX verwendet wird. Wir patchen THREE.FileLoader, damit
// externe .hdr-Requests abgefangen werden bevor sie CSP oder Netzwerk treffen.
if (typeof window !== "undefined") {
  const FLoader = THREE.FileLoader as any;
  const _origLoad = FLoader.prototype.load;
  FLoader.prototype.load = function (url: string, ...rest: unknown[]) {
    if (typeof url === "string" && url.includes(".hdr") && !url.startsWith("/")) {
      // Stilles Blockieren – kein Netzwerk-Request, kein CSP-Fehler, kein ErrorBoundary-Trigger
      console.info("[AVA] Externer HDR-Load blockiert:", url);
      return this;
    }
    return _origLoad.call(this, url, ...rest);
  };
}

// ── Error Boundary (fängt Three.js / Loader-Fehler ab) ───────────────────────

interface EBState { hasError: boolean; message: string }
export class AvatarErrorBoundary extends Component<{ children: ReactNode }, EBState> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, message: "" };
  }
  static getDerivedStateFromError(error: Error): EBState {
    return { hasError: true, message: error?.message ?? "Unbekannter Fehler" };
  }
  componentDidCatch(error: Error) {
    // HDR-Fetch-Fehler sind nicht fatal – nur loggen
    console.warn("[AvatarScene] WebGL-/Loader-Fehler (nicht fatal):", error?.message);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-slate-900/90 rounded-2xl">
          <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
            </svg>
          </div>
          <p className="text-slate-300 text-sm font-medium">AVA – Text-Modus aktiv</p>
          <p className="text-slate-500 text-xs text-center max-w-40">
            3D-Render nicht verfügbar<br />(Seite neu laden zum Retry)
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}

// ── Typen ─────────────────────────────────────────────────────────────────────

export type AvatarEmotion = "neutral" | "happy" | "thinking" | "greeting";

interface AvatarModelProps {
  isSpeaking: boolean;
  emotion: AvatarEmotion;
  mouthOpen?: number;
}

// ── Farben ────────────────────────────────────────────────────────────────────

const SKIN = new THREE.Color("#f5c5a3");
const SKIN_DARK = new THREE.Color("#e8a87c");
const HAIR = new THREE.Color("#2c1810");
const EYE_WHITE = new THREE.Color("#f8f8ff");
const IRIS = new THREE.Color("#4a90e2");
const PUPIL = new THREE.Color("#111111");
const MOUTH_COLOR = new THREE.Color("#c87878");
const SHIRT_COLOR = new THREE.Color("#3730a3"); // Indigo
const COLLAR_COLOR = new THREE.Color("#e2e8f0");

// ── Einzelner Augapfel ────────────────────────────────────────────────────────

function Eye({ position, blinkRef }: { position: [number, number, number]; blinkRef: React.Ref<THREE.Mesh> }) {
  return (
    <group position={position}>
      {/* Weißes Auge */}
      <mesh>
        <sphereGeometry args={[0.095, 16, 16]} />
        <meshStandardMaterial color={EYE_WHITE} roughness={0.1} />
      </mesh>
      {/* Iris */}
      <mesh position={[0, 0, 0.06]}>
        <circleGeometry args={[0.058, 16]} />
        <meshStandardMaterial color={IRIS} roughness={0.2} />
      </mesh>
      {/* Pupille */}
      <mesh position={[0, 0, 0.065]}>
        <circleGeometry args={[0.03, 16]} />
        <meshStandardMaterial color={PUPIL} roughness={0.1} />
      </mesh>
      {/* Highlight */}
      <mesh position={[0.02, 0.025, 0.07]}>
        <circleGeometry args={[0.01, 8]} />
        <meshStandardMaterial color={new THREE.Color("#ffffff")} />
      </mesh>
      {/* Blink-Lid */}
      <mesh ref={blinkRef} position={[0, 0, 0.062]}>
        <planeGeometry args={[0.2, 0.002]} />
        <meshStandardMaterial color={SKIN} />
      </mesh>
    </group>
  );
}

// ── Hauptavatar ───────────────────────────────────────────────────────────────

function AvatarModel({ isSpeaking, emotion, mouthOpen = 0 }: AvatarModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const mouthRef = useRef<THREE.Mesh>(null);
  const leftBlinkRef = useRef<THREE.Mesh>(null);
  const rightBlinkRef = useRef<THREE.Mesh>(null);
  const leftBrowRef = useRef<THREE.Mesh>(null);
  const rightBrowRef = useRef<THREE.Mesh>(null);

  // Animationszeit-Refs
  const clockRef = useRef(0);
  const blinkTimerRef = useRef(0);
  const blinkStateRef = useRef(false);

  // Materialien (einmalig erstellen)
  const skinMat = useMemo(() => new THREE.MeshStandardMaterial({ color: SKIN, roughness: 0.8 }), []);
  const skinDarkMat = useMemo(() => new THREE.MeshStandardMaterial({ color: SKIN_DARK, roughness: 0.8 }), []);
  const hairMat = useMemo(() => new THREE.MeshStandardMaterial({ color: HAIR, roughness: 0.9 }), []);
  const mouthMat = useMemo(() => new THREE.MeshStandardMaterial({ color: MOUTH_COLOR, roughness: 0.5, emissive: new THREE.Color("#5a2020"), emissiveIntensity: 0.05 }), []);
  const shirtMat = useMemo(() => new THREE.MeshStandardMaterial({ color: SHIRT_COLOR, roughness: 0.7, metalness: 0.05 }), []);
  const collarMat = useMemo(() => new THREE.MeshStandardMaterial({ color: COLLAR_COLOR, roughness: 0.6 }), []);

  useFrame((state, delta) => {
    clockRef.current += delta;
    const t = clockRef.current;

    // ── Idle Kopfbewegung ──────────────────────────────────────────────────
    if (headRef.current) {
      headRef.current.rotation.y = Math.sin(t * 0.4) * 0.08;
      headRef.current.rotation.x = Math.sin(t * 0.25) * 0.04 - 0.05;
    }

    // ── Mund Lip-Sync ──────────────────────────────────────────────────────
    if (mouthRef.current) {
      let targetScaleY = 1;
      if (isSpeaking) {
        // Zufällige Lip-Sync-Rhythmus-Simulation
        const lipsync = Math.abs(
          Math.sin(t * 8.5) * 0.5 +
          Math.sin(t * 13.3) * 0.3 +
          Math.sin(t * 5.7) * 0.2
        );
        targetScaleY = 1 + lipsync * 3.5 + (mouthOpen * 2);
      } else if (mouthOpen > 0.05) {
        targetScaleY = 1 + mouthOpen * 3;
      } else if (emotion === "happy") {
        targetScaleY = 1.3;
      }
      mouthRef.current.scale.y += (targetScaleY - mouthRef.current.scale.y) * 0.3;
    }

    // ── Blinzeln ────────────────────────────────────────────────────────────
    blinkTimerRef.current -= delta;
    if (blinkTimerRef.current <= 0) {
      blinkStateRef.current = !blinkStateRef.current;
      blinkTimerRef.current = blinkStateRef.current ? 0.12 : (2.5 + Math.random() * 3);
    }
    const blinkScale = blinkStateRef.current ? 80 : 1;
    if (leftBlinkRef.current) leftBlinkRef.current.scale.y = THREE.MathUtils.lerp(leftBlinkRef.current.scale.y, blinkScale, 0.35);
    if (rightBlinkRef.current) rightBlinkRef.current.scale.y = THREE.MathUtils.lerp(rightBlinkRef.current.scale.y, blinkScale, 0.35);

    // ── Augenbrauen nach Emotion ─────────────────────────────────────────────
    if (leftBrowRef.current && rightBrowRef.current) {
      const browY = emotion === "thinking" ? 0.02 : emotion === "happy" ? 0.01 : 0;
      const leftBrowX = emotion === "thinking" ? -0.015 : 0;
      leftBrowRef.current.position.y += (browY - leftBrowRef.current.position.y) * 0.1;
      leftBrowRef.current.position.x += (leftBrowX - leftBrowRef.current.position.x) * 0.1;
    }
  });

  return (
    <group ref={groupRef}>
      {/* ── Torso ─────────────────────────────────────────────────────────── */}
      <mesh position={[0, -0.98, 0]} material={shirtMat} castShadow>
        <capsuleGeometry args={[0.32, 0.55, 8, 16]} />
      </mesh>
      {/* Schultern */}
      <mesh position={[-0.44, -0.82, 0]} material={shirtMat} castShadow>
        <sphereGeometry args={[0.18, 12, 12]} />
      </mesh>
      <mesh position={[0.44, -0.82, 0]} material={shirtMat} castShadow>
        <sphereGeometry args={[0.18, 12, 12]} />
      </mesh>
      {/* Kragen */}
      <mesh position={[0, -0.5, 0.14]} material={collarMat}>
        <cylinderGeometry args={[0.14, 0.16, 0.18, 16]} />
      </mesh>

      {/* ── Hals ──────────────────────────────────────────────────────────── */}
      <mesh position={[0, -0.28, 0]} material={skinMat} castShadow>
        <cylinderGeometry args={[0.14, 0.16, 0.28, 16]} />
      </mesh>

      {/* ── Kopf ──────────────────────────────────────────────────────────── */}
      <group ref={headRef} position={[0, 0.44, 0]}>
        {/* Schädel */}
        <mesh material={skinMat} castShadow>
          <sphereGeometry args={[0.62, 32, 32]} />
        </mesh>

        {/* Kiefer (leicht abgeflacht unten) */}
        <mesh position={[0, -0.35, 0.1]} material={skinMat}>
          <sphereGeometry args={[0.42, 16, 16]} />
        </mesh>

        {/* ── Ohren ─────────────────────────────────────────────────────── */}
        <mesh position={[-0.62, 0, 0]} material={skinDarkMat}>
          <sphereGeometry args={[0.11, 12, 12]} />
        </mesh>
        <mesh position={[0.62, 0, 0]} material={skinDarkMat}>
          <sphereGeometry args={[0.11, 12, 12]} />
        </mesh>

        {/* ── Augen ─────────────────────────────────────────────────────── */}
        <Eye position={[-0.2, 0.1, 0.57]} blinkRef={leftBlinkRef} />
        <Eye position={[0.2, 0.1, 0.57]} blinkRef={rightBlinkRef} />

        {/* ── Augenbrauen ───────────────────────────────────────────────── */}
        <mesh ref={leftBrowRef} position={[-0.2, 0.26, 0.58]} rotation={[0, 0, 0.15]}>
          <boxGeometry args={[0.16, 0.025, 0.02]} />
          <meshStandardMaterial color={HAIR} />
        </mesh>
        <mesh ref={rightBrowRef} position={[0.2, 0.26, 0.58]} rotation={[0, 0, -0.15]}>
          <boxGeometry args={[0.16, 0.025, 0.02]} />
          <meshStandardMaterial color={HAIR} />
        </mesh>

        {/* ── Nase ──────────────────────────────────────────────────────── */}
        <mesh position={[0, -0.02, 0.62]} material={skinDarkMat}>
          <sphereGeometry args={[0.065, 12, 12]} />
        </mesh>

        {/* ── Mund ──────────────────────────────────────────────────────── */}
        <group position={[0, -0.22, 0.6]}>
          {/* Lippen */}
          <mesh ref={mouthRef} material={mouthMat}>
            <boxGeometry args={[0.22, 0.04, 0.04]} />
          </mesh>
          {/* Mundwinkel */}
          <mesh position={[-0.12, 0, 0]} material={mouthMat}>
            <sphereGeometry args={[0.025, 8, 8]} />
          </mesh>
          <mesh position={[0.12, 0, 0]} material={mouthMat}>
            <sphereGeometry args={[0.025, 8, 8]} />
          </mesh>
          {/* Zähne (sichtbar wenn Mund offen) */}
          <mesh position={[0, 0.025, 0.015]}>
            <boxGeometry args={[0.18, 0.025, 0.02]} />
            <meshStandardMaterial color={new THREE.Color("#f0f0f0")} roughness={0.1} />
          </mesh>
        </group>

        {/* ── Haare ─────────────────────────────────────────────────────── */}
        {/* Haupt-Haarschicht */}
        <mesh position={[0, 0.38, 0]} material={hairMat}>
          <sphereGeometry args={[0.64, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
        </mesh>
        {/* Seite links */}
        <mesh position={[-0.52, 0.18, 0]} material={hairMat}>
          <sphereGeometry args={[0.24, 12, 12]} />
        </mesh>
        {/* Seite rechts */}
        <mesh position={[0.52, 0.18, 0]} material={hairMat}>
          <sphereGeometry args={[0.24, 12, 12]} />
        </mesh>
        {/* Hinterkopf */}
        <mesh position={[0, 0.1, -0.42]} material={hairMat}>
          <sphereGeometry args={[0.41, 16, 12]} />
        </mesh>
        {/* Stirnlocke */}
        <mesh position={[0.05, 0.62, 0.38]} rotation={[0.3, -0.2, 0.1]} material={hairMat}>
          <torusGeometry args={[0.12, 0.045, 8, 12, Math.PI]} />
        </mesh>
      </group>

      {/* ── Arme ──────────────────────────────────────────────────────────── */}
      <mesh position={[-0.7, -1.1, 0]} rotation={[0, 0, 0.3]} material={shirtMat} castShadow>
        <capsuleGeometry args={[0.1, 0.5, 6, 12]} />
      </mesh>
      <mesh position={[0.7, -1.1, 0]} rotation={[0, 0, -0.3]} material={shirtMat} castShadow>
        <capsuleGeometry args={[0.1, 0.5, 6, 12]} />
      </mesh>
      {/* Hände */}
      <mesh position={[-0.82, -1.45, 0]} material={skinMat}>
        <sphereGeometry args={[0.115, 12, 12]} />
      </mesh>
      <mesh position={[0.82, -1.45, 0]} material={skinMat}>
        <sphereGeometry args={[0.115, 12, 12]} />
      </mesh>
    </group>
  );
}

// ── Partikel-Aura (spricht UI) ────────────────────────────────────────────────

// Partikel-Positionen auf Modulebene initialisieren: Math.random() außerhalb des Render-Pfads
const PARTICLE_COUNT = 12;
const PARTICLE_POSITIONS = Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
  angle: (i / PARTICLE_COUNT) * Math.PI * 2,
  radius: 0.85 + Math.random() * 0.2,
  speed: 0.5 + Math.random() * 1.5,
  phase: Math.random() * Math.PI * 2,
  yBase: -0.1 + Math.random() * 0.6,
}));

function SpeakingParticles({ active }: { active: boolean }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const count = PARTICLE_COUNT;
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const positions = useRef(PARTICLE_POSITIONS);

  useFrame(({ clock }) => {
    if (!meshRef.current || !active) return;
    const t = clock.getElapsedTime();
    positions.current.forEach((p, i) => {
      const r = p.radius + Math.sin(t * p.speed + p.phase) * 0.12;
      dummy.position.set(
        Math.cos(p.angle + t * 0.3) * r,
        p.yBase + Math.sin(t * p.speed * 1.5 + p.phase) * 0.08,
        Math.sin(p.angle + t * 0.3) * r
      );
      const s = active ? (0.03 + Math.abs(Math.sin(t * p.speed + p.phase)) * 0.04) : 0.001;
      dummy.scale.setScalar(s);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 6, 6]} />
      <meshStandardMaterial
        color={new THREE.Color("#818cf8")}
        emissive={new THREE.Color("#6366f1")}
        emissiveIntensity={active ? 1.5 : 0}
        transparent
        opacity={active ? 0.7 : 0}
      />
    </instancedMesh>
  );
}

// ── Äußere Komponente (Canvas) ────────────────────────────────────────────────

interface AvatarSceneProps {
  isSpeaking: boolean;
  emotion?: AvatarEmotion;
  mouthOpen?: number;
  className?: string;
  /** Ready Player Me .glb URL – wenn gesetzt, wird RPM-Avatar gerendert */
  avatarUrl?: string;
  /** Nutzereigene Blender .glb-Datei (object URL) – hat Vorrang vor avatarUrl */
  customGlbUrl?: string;
}

export default function AvatarScene({
  isSpeaking,
  emotion = "neutral",
  mouthOpen = 0,
  className = "",
  avatarUrl,
  customGlbUrl,
}: AvatarSceneProps) {
  // Kameraposition je nach Modus:
  // customGlb / RPM → Vollkörper-Sicht, Prozedural → Brustbild
  const hasFullBody = !!(customGlbUrl || avatarUrl);
  const cameraPos: [number, number, number] = hasFullBody
    ? [0, 0.8, 3.5]
    : [0, 0.2, 4.2];

  return (
    <AvatarErrorBoundary>
      <div className={`relative ${className}`} style={{ background: "transparent" }}>
        <Canvas
          camera={{ position: cameraPos, fov: 40 }}
          gl={{ antialias: true, alpha: true }}
          shadows
          style={{ background: "transparent" }}
        >
        {/* Beleuchtung */}
        <ambientLight intensity={0.7} />
        <directionalLight
          castShadow
          position={[3, 5, 3]}
          intensity={1.4}
          color={"#fff5f0"}
          shadow-mapSize={[1024, 1024]}
        />
        <pointLight position={[-2, 1, 2]} intensity={0.6} color={"#a5b4fc"} />
        <pointLight position={[2, -1, 1]} intensity={0.3} color={"#fcd34d"} />

        {/* Umgebungs-Licht als Farbgradient – kein externes HDR benötigt */}
        <hemisphereLight color={"#a5b4fc"} groundColor={"#fcd34d"} intensity={0.4} />

        {customGlbUrl ? (
          /* ── Custom Blender .glb-Avatar (Toon-Shader) ─────────────── */
          <Suspense fallback={null}>
            <Float speed={0.8} rotationIntensity={0.02} floatIntensity={0.08}>
              <CustomAvatarModel
                url={customGlbUrl}
                isSpeaking={isSpeaking}
                emotion={emotion}
                mouthOpen={mouthOpen}
              />
              <SpeakingParticles active={isSpeaking} />
            </Float>
          </Suspense>
        ) : avatarUrl ? (
          /* ── Ready Player Me GLB-Avatar ───────────────────────────── */
          <Suspense fallback={null}>
            <Float speed={0.8} rotationIntensity={0.02} floatIntensity={0.08}>
              <RPMAvatarModel
                url={avatarUrl}
                isSpeaking={isSpeaking}
                emotion={emotion}
                mouthOpen={mouthOpen}
              />
              <SpeakingParticles active={isSpeaking} />
            </Float>
          </Suspense>
        ) : (
          /* ── Prozeduraler Basis-Avatar ────────────────────────────── */
          <Float speed={1.2} rotationIntensity={0.05} floatIntensity={0.15}>
            <AvatarModel isSpeaking={isSpeaking} emotion={emotion} mouthOpen={mouthOpen} />
            <SpeakingParticles active={isSpeaking} />
          </Float>
        )}

        {/* Schatten */}
        <ContactShadows
          position={[0, hasFullBody ? -1.1 : -1.85, 0]}
          opacity={0.35}
          scale={3}
          blur={2.5}
          color={"#6366f1"}
        />

        {/* Orbit Controls (begrenzt) */}
        <OrbitControls
          enablePan={false}
          enableZoom={false}
          minPolarAngle={Math.PI / 3}
          maxPolarAngle={Math.PI / 1.8}
          minAzimuthAngle={-Math.PI / 5}
          maxAzimuthAngle={Math.PI / 5}
          target={hasFullBody ? [0, 0.8, 0] : [0, 0.1, 0]}
        />
      </Canvas>

      {/* Sprechen-Indikator */}
      {isSpeaking && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-indigo-600/80 backdrop-blur-sm px-3 py-1.5 rounded-full">
          {[0, 0.15, 0.3].map((delay) => (
            <span
              key={delay}
              className="w-1.5 h-1.5 bg-white rounded-full animate-bounce"
              style={{ animationDelay: `${delay}s`, animationDuration: "0.8s" }}
            />
          ))}
          <span className="text-white text-xs font-medium ml-1">AVA spricht</span>
        </div>
      )}
    </div>
    </AvatarErrorBoundary>
  );
}
