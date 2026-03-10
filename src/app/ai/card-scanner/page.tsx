"use client";
import { useRef, useState, useCallback } from "react";

interface ScannedContact {
  name?: string;
  company?: string;
  position?: string;
  email?: string;
  phone?: string;
  website?: string;
  linkedin?: string;
  address?: string;
}

export default function CardScannerPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [cameraOn, setCameraOn] = useState(false);
  const [snapshot, setSnapshot] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [contact, setContact] = useState<ScannedContact | null>(null);
  const [rawText, setRawText] = useState("");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const startCamera = useCallback(async () => {
    try {
      setError("");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 } },
        audio: false,
      });
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

  const capture = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    setSnapshot(dataUrl);
  }, []);

  const scanCard = useCallback(async () => {
    if (!snapshot && !rawText) return;
    setScanning(true);
    setContact(null);
    setSaved(false);

    try {
      const body = snapshot
        ? { imageBase64: snapshot.split(",")[1], mode: "image" }
        : { text: rawText, mode: "text" };

      const res = await fetch("/api/ai/card-scanner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      setContact(data.contact ?? null);
    } catch {
      setError("Scan fehlgeschlagen. Bitte erneut versuchen.");
    } finally {
      setScanning(false);
    }
  }, [snapshot, rawText]);

  const saveContact = useCallback(async () => {
    if (!contact) return;
    const res = await fetch("/api/contacts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: contact.name ?? "Unbekannt",
        company: contact.company,
        position: contact.position,
        email: contact.email,
        phone: contact.phone,
        website: contact.website,
        linkedin: contact.linkedin,
        notes: contact.address ? `Adresse: ${contact.address}` : undefined,
      }),
    });
    if (res.ok) setSaved(true);
  }, [contact]);

  return (
    <div className="min-h-screen bg-(--surface) text-foreground p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">📇 AR Visitenkarten-Scanner</h1>
        <p className="text-(--muted) mt-2">
          Scanne Visitenkarten mit der Kamera oder gib den Text manuell ein. 
          KI extrahiert Kontaktdaten automatisch.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-6 text-sm">
          ⚠️ {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Linke Spalte: Eingabe */}
        <div className="space-y-4">
          {/* Kamera */}
          <div className="bg-(--card) border border-(--border) rounded-xl overflow-hidden">
            <div className="relative bg-gray-900 aspect-video flex items-center justify-center">
              <video
                ref={videoRef}
                muted
                playsInline
                className={`w-full h-full object-cover ${cameraOn ? "block" : "hidden"}`}
              />
              <canvas ref={canvasRef} className="hidden" />
              {!cameraOn && snapshot ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={snapshot} alt="Snapshot" className="w-full h-full object-cover" />
              ) : !cameraOn ? (
                <div className="text-center text-gray-400">
                  <p className="text-5xl mb-3">📷</p>
                  <p className="text-sm">Kamera für Scan starten</p>
                </div>
              ) : null}
            </div>

            <div className="p-4 flex gap-2">
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
                    onClick={capture}
                    className="flex-1 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                  >
                    📸 Aufnehmen
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

          {/* Oder: Text eingeben */}
          <div className="bg-(--card) border border-(--border) rounded-xl p-4">
            <p className="text-sm font-medium mb-2">Oder Text der Visitenkarte eingeben:</p>
            <textarea
              rows={5}
              className="w-full border border-(--border) rounded-lg px-3 py-2 bg-(--surface) text-sm resize-y"
              placeholder="Max Mustermann&#10;Senior Developer&#10;Musterfirma GmbH&#10;max@example.com&#10;+49 123 456 789"
              value={rawText}
              onChange={(e) => { setRawText(e.target.value); setSnapshot(null); }}
            />
          </div>

          <button
            onClick={scanCard}
            disabled={scanning || (!snapshot && !rawText)}
            className="w-full py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 font-medium disabled:opacity-50"
          >
            {scanning ? "🧠 KI analysiert..." : "🔍 Visitenkarte scannen"}
          </button>
        </div>

        {/* Rechte Spalte: Ergebnis */}
        <div>
          {scanning && (
            <div className="bg-(--card) border border-(--border) rounded-xl p-8 text-center">
              <div className="text-4xl animate-pulse mb-3">🧠</div>
              <p className="text-(--muted) text-sm">KI extrahiert Kontaktdaten...</p>
            </div>
          )}

          {contact && !scanning && (
            <div className="bg-(--card) border border-(--border) rounded-xl p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                ✅ Erkannte Kontaktdaten
              </h2>

              <div className="space-y-3 mb-6">
                {[
                  { label: "Name", key: "name", icon: "👤" },
                  { label: "Unternehmen", key: "company", icon: "🏢" },
                  { label: "Position", key: "position", icon: "💼" },
                  { label: "E-Mail", key: "email", icon: "📧" },
                  { label: "Telefon", key: "phone", icon: "📞" },
                  { label: "Website", key: "website", icon: "🌐" },
                  { label: "LinkedIn", key: "linkedin", icon: "💼" },
                  { label: "Adresse", key: "address", icon: "📍" },
                ].map(({ label, key, icon }) => {
                  const val = contact[key as keyof ScannedContact];
                  if (!val) return null;
                  return (
                    <div key={key} className="flex items-start gap-3 p-3 bg-(--surface) rounded-lg border border-(--border)">
                      <span className="text-lg">{icon}</span>
                      <div>
                        <p className="text-xs text-(--muted)">{label}</p>
                        <p className="text-sm font-medium">{val}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {saved ? (
                <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg p-3 text-sm text-center">
                  ✅ Kontakt wurde gespeichert!
                </div>
              ) : (
                <button
                  onClick={saveContact}
                  className="w-full py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                >
                  💾 In Kontakte speichern
                </button>
              )}
            </div>
          )}

          {!contact && !scanning && (
            <div className="bg-(--card) border border-(--border) rounded-xl p-8 text-center text-(--muted)">
              <p className="text-4xl mb-3">📇</p>
              <p className="text-sm mb-4">Scanne eine Visitenkarte und die KI erkennt automatisch:</p>
              <ul className="text-xs space-y-1 text-left">
                {["Name & Position", "Unternehmen & Branche", "E-Mail & Telefon", "Website & LinkedIn", "Adresse"].map((t) => (
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
