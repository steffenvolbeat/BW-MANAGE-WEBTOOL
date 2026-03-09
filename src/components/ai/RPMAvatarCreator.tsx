"use client";

/**
 * RPMAvatarCreator – Ready Player Me iFrame-Modal
 *
 * Öffnet den RPM-Creator im Browser-Modal. Der User lädt ein Foto hoch,
 * RPM generiert automatisch einen vollständigen 3D-Avatar (.glb).
 * Nach Export wird die Avatar-URL per postMessage zurückgegeben.
 *
 * Avatar enthält:
 *  - Vollständiger Körper (Kopf, Torso, Arme, Beine, Hände, Füße)
 *  - Morph-Targets: Lip-Sync (viseme_*), Blinzeln, Emotionen
 *  - Eigene Skelett-Animationen
 */

import { useEffect, useRef, useCallback } from "react";
import { XMarkIcon, ArrowTopRightOnSquareIcon } from "@heroicons/react/24/outline";
import { SparklesIcon } from "@heroicons/react/24/solid";

// Ready Player Me App-ID (kostenlos, öffentlich)
const RPM_APP_SUBDOMAIN = "demo"; // Für eigene Subdomain: einfach ersetzen
const RPM_IFRAME_URL = `https://${RPM_APP_SUBDOMAIN}.readyplayer.me/avatar?frameApi&bodyType=fullbody&clearCache`;

interface Props {
  onAvatarCreated: (glbUrl: string) => void;
  onClose: () => void;
}

export default function RPMAvatarCreator({ onAvatarCreated, onClose }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // PostMessage-Handler: RPM schickt Avatar-URL nach Export
  const handleMessage = useCallback(
    (event: MessageEvent) => {
      // Nur RPM-Events akzeptieren
      if (!event.origin.includes("readyplayer.me")) return;

      try {
        const data = typeof event.data === "string" ? JSON.parse(event.data) : event.data;

        if (data?.source === "readyplayerme") {
          if (data.eventName === "v1.frame.ready") {
            // iFrame bereit – Kommunikation aktivieren
            iframeRef.current?.contentWindow?.postMessage(
              JSON.stringify({ target: "readyplayerme", type: "subscribe", eventName: "v1.**" }),
              "*"
            );
          }

          if (data.eventName === "v1.avatar.exported") {
            const url: string = data.data?.url;
            if (url) {
              // .glb direkt laden (kein Morph-Target-Strip)
              const glbUrl = url.includes("?") ? url : `${url}?morphTargets=ARKit,Oculus Visemes&textureAtlas=1024`;
              onAvatarCreated(glbUrl);
              onClose();
            }
          }
        }
      } catch {
        // JSON-Parse-Fehler ignorieren
      }
    },
    [onAvatarCreated, onClose]
  );

  useEffect(() => {
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [handleMessage]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl h-[90vh] bg-slate-900 rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-700/50">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-700/50 bg-slate-800/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <SparklesIcon className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-white font-semibold text-sm">AVA – Avatar erstellen</h2>
              <p className="text-slate-400 text-xs">Foto hochladen → 3D-Avatar automatisch generieren</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Externer Link */}
            <a
              href={RPM_IFRAME_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors px-2 py-1 rounded-md hover:bg-slate-700/50"
            >
              <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" />
              Im neuen Tab
            </a>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Anleitung */}
        <div className="flex items-start gap-6 px-5 py-3 bg-indigo-950/40 border-b border-indigo-800/30 shrink-0">
          {[
            { step: "1", text: "Foto hochladen oder Selfie nehmen" },
            { step: "2", text: "Aussehen anpassen (Haare, Kleidung, Körper)" },
            { step: "3", text: "\"Avatar speichern\" klicken – fertig!" },
          ].map(({ step, text }) => (
            <div key={step} className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
                {step}
              </span>
              <span className="text-slate-300 text-xs">{text}</span>
            </div>
          ))}
        </div>

        {/* Ready Player Me iFrame */}
        <iframe
          ref={iframeRef}
          src={RPM_IFRAME_URL}
          className="flex-1 w-full border-0"
          allow="camera *; microphone *; clipboard-write"
          title="Ready Player Me Avatar Creator"
        />
      </div>
    </div>
  );
}
