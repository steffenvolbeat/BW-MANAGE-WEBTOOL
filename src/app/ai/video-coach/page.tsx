"use client";
import { useRef, useState, useCallback } from "react";

interface Tip {
  category: string;
  tip: string;
  score: number;
}

interface Analysis {
  overallScore: number;
  eyeContact: number;
  posture: number;
  confidence: number;
  expression: number;
  tips: Tip[];
  summary: string;
}

const SCORE_COLOR = (n: number) =>
  n >= 80 ? "text-green-600" : n >= 60 ? "text-yellow-600" : "text-red-500";

const ScoreCircle = ({ label, value }: { label: string; value: number }) => (
  <div className="text-center">
    <div className={`text-3xl font-bold ${SCORE_COLOR(value)}`}>{value}</div>
    <div className="text-xs text-(--muted) mt-1">{label}</div>
  </div>
);

export default function VideoCoachPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [cameraOn, setCameraOn] = useState(false);
  const [snapshot, setSnapshot] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState("");

  const startCamera = useCallback(async () => {
    try {
      setError("");
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraOn(true);
    } catch {
      setError("Kamera-Zugriff verweigert. Bitte Berechtigung erteilen.");
    }
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraOn(false);
    setSnapshot(null);
  }, []);

  const captureAndAnalyze = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
    setSnapshot(dataUrl);
    setAnalyzing(true);
    setAnalysis(null);

    try {
      const res = await fetch("/api/ai/video-coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: dataUrl.split(",")[1] }),
      });
      const data = await res.json();
      setAnalysis(data.analysis ?? null);
    } catch {
      setError("Analyse fehlgeschlagen. Bitte erneut versuchen.");
    } finally {
      setAnalyzing(false);
    }
  }, []);

  return (
    <div className="min-h-screen bg-(--surface) text-foreground p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">🎥 Video-Interview-Coach</h1>
        <p className="text-(--muted) mt-2">
          KI-Analyse deiner Körpersprache, Mimik und Körperhaltung für perfekte Interviews.
          Kamera bleibt vollständig lokal — kein Video wird gespeichert.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-6 text-sm">
          ⚠️ {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Kamera-Panel */}
        <div className="bg-(--card) border border-(--border) rounded-xl overflow-hidden">
          <div className="relative bg-gray-900 aspect-video flex items-center justify-center">
            <video
              ref={videoRef}
              muted
              playsInline
              className={`w-full h-full object-cover ${cameraOn ? "block" : "hidden"}`}
            />
            <canvas ref={canvasRef} className="hidden" />
            {!cameraOn && (
              <div className="text-center text-gray-400">
                <p className="text-5xl mb-3">📷</p>
                <p className="text-sm">Kamera starten, um zu beginnen</p>
              </div>
            )}
          </div>

          <div className="p-4 flex gap-3">
            {!cameraOn ? (
              <button
                onClick={startCamera}
                className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
              >
                📷 Kamera starten
              </button>
            ) : (
              <>
                <button
                  onClick={captureAndAnalyze}
                  disabled={analyzing}
                  className="flex-1 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium disabled:opacity-50"
                >
                  {analyzing ? "🧠 Analysiere..." : "📸 Aufnehmen & Analysieren"}
                </button>
                <button
                  onClick={stopCamera}
                  className="px-4 py-2.5 border border-(--border) rounded-lg text-sm hover:bg-(--surface)"
                >
                  ⏹ Stop
                </button>
              </>
            )}
          </div>
        </div>

        {/* Ergebnis-Panel */}
        <div className="space-y-4">
          {snapshot && (
            <div className="bg-(--card) border border-(--border) rounded-xl overflow-hidden">
              <p className="text-xs text-(--muted) px-4 pt-3 pb-1">Analyse-Snapshot</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={snapshot} alt="Snapshot" className="w-full max-h-40 object-cover opacity-70" />
            </div>
          )}

          {analyzing && (
            <div className="bg-(--card) border border-(--border) rounded-xl p-6 text-center">
              <div className="text-3xl animate-spin mb-3">🧠</div>
              <p className="text-(--muted) text-sm">KI analysiert Körpersprache und Mimik...</p>
            </div>
          )}

          {analysis && (
            <div className="space-y-4">
              {/* Gesamt-Score */}
              <div className="bg-gradient-to-br from-blue-600 to-purple-700 text-white rounded-xl p-6">
                <p className="text-blue-200 text-sm mb-2">Gesamt-Score</p>
                <p className={`text-5xl font-bold ${analysis.overallScore >= 75 ? "text-green-300" : analysis.overallScore >= 50 ? "text-yellow-300" : "text-red-300"}`}>
                  {analysis.overallScore}
                  <span className="text-2xl text-blue-200">/100</span>
                </p>
                <p className="text-blue-100 text-sm mt-2">{analysis.summary}</p>
              </div>

              {/* Einzel-Scores */}
              <div className="bg-(--card) border border-(--border) rounded-xl p-6">
                <p className="text-sm font-semibold mb-4">Detailwertung</p>
                <div className="grid grid-cols-4 gap-4">
                  <ScoreCircle label="Blickkontakt" value={analysis.eyeContact} />
                  <ScoreCircle label="Haltung" value={analysis.posture} />
                  <ScoreCircle label="Ausstrahlung" value={analysis.confidence} />
                  <ScoreCircle label="Mimik" value={analysis.expression} />
                </div>
              </div>

              {/* Tipps */}
              {analysis.tips?.length > 0 && (
                <div className="bg-(--card) border border-(--border) rounded-xl p-6">
                  <p className="text-sm font-semibold mb-3">💡 Verbesserungstipps</p>
                  <div className="space-y-3">
                    {analysis.tips.map((tip, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 bg-(--surface) rounded-lg border border-(--border)">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-bold flex-shrink-0 ${SCORE_COLOR(tip.score)} bg-current/10`}>
                          {tip.score}
                        </span>
                        <div>
                          <p className="text-xs font-medium text-(--muted)">{tip.category}</p>
                          <p className="text-sm">{tip.tip}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {!analyzing && !analysis && (
            <div className="bg-(--card) border border-(--border) rounded-xl p-8 text-center text-(--muted)">
              <p className="text-3xl mb-3">🎯</p>
              <p className="text-sm">
                Starte die Kamera, nimm einen Schnappschuss auf und erhalte 
                sofortige KI-Analyse deiner Interview-Präsenz.
              </p>
              <ul className="text-xs mt-4 space-y-1 text-left">
                {["Blickkontakt & Augenkontakt", "Körperhaltung & Schultern", "Selbstsicherheit & Ausstrahlung", "Mimik & Lächeln"].map((t) => (
                  <li key={t} className="flex items-center gap-2">
                    <span className="text-blue-500">✓</span> {t}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
