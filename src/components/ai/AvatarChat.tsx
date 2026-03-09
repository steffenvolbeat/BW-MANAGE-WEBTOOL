"use client";

/**
 * AvatarChat – Vollständige Chat-UI mit 3D-Avatar, Spracheingabe und TTS
 * Feature 3: 3D AI-Avatar / Bot
 */

import { useState, useRef, useEffect, useCallback, lazy, Suspense, type ChangeEvent } from "react";
import {
  MicrophoneIcon,
  StopIcon,
  PaperAirplaneIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  LanguageIcon,
  ArrowPathIcon,
  UserCircleIcon,
  TrashIcon,
  CubeIcon,
} from "@heroicons/react/24/outline";
import { SparklesIcon } from "@heroicons/react/24/solid";
import type { AvatarEmotion } from "./AvatarScene";

// Dynamischer Import des 3D-Avatars (SSR deaktiviert)
const AvatarScene = lazy(() => import("./AvatarScene"));
// RPM-Creator nur Client-seitig (iFrame)
const RPMAvatarCreator = lazy(() => import("./RPMAvatarCreator"));

// localStorage-Keys
const AVATAR_URL_KEY    = "ava_rpm_avatar_url";
const CUSTOM_GLB_KEY    = "ava_custom_glb_name"; // nur Name speichern – URL muss neu erstellt werden

// ── Typen ─────────────────────────────────────────────────────────────────────

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

// Web Speech API – Browser-seitig, kein @types package nötig
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySpeechRecognition = any;

// ── Quick-Actions ─────────────────────────────────────────────────────────────

const QUICK_ACTIONS: Record<"de" | "en", { label: string; prompt: string; emoji: string }[]> = {
  de: [
    { label: "Motivation", prompt: "Ich bin gerade frustriert von der Jobsuche. Wie bleibe ich motiviert?", emoji: "💪" },
    { label: "Interview-Tipps", prompt: "Was sind die wichtigsten Tipps für ein erfolgreiches Vorstellungsgespräch?", emoji: "🎯" },
    { label: "Gehalt verhandeln", prompt: "Wie verhandele ich professionell mein Wunschgehalt?", emoji: "💰" },
    { label: "Lebenslauf", prompt: "Welche häufigen Fehler sollte ich in meinem Lebenslauf vermeiden?", emoji: "📄" },
    { label: "Netzwerken", prompt: "Wie baue ich effektiv mein berufliches Netzwerk auf?", emoji: "🤝" },
    { label: "Absage erhalten", prompt: "Ich habe eine Absage bekommen. Wie gehe ich damit um?", emoji: "💌" },
  ],
  en: [
    { label: "Stay Motivated", prompt: "I'm feeling frustrated with my job search. How do I stay motivated?", emoji: "💪" },
    { label: "Interview Tips", prompt: "What are the most important tips for a successful job interview?", emoji: "🎯" },
    { label: "Salary Negotiation", prompt: "How do I professionally negotiate my target salary?", emoji: "💰" },
    { label: "Resume Mistakes", prompt: "What common mistakes should I avoid in my resume?", emoji: "📄" },
    { label: "Networking", prompt: "How do I effectively build my professional network?", emoji: "🤝" },
    { label: "Handle Rejection", prompt: "I just received a rejection. How do I handle it constructively?", emoji: "💌" },
  ],
};

// ── Browser TTS ───────────────────────────────────────────────────────────────

function speakWithBrowserTTS(text: string, language: "de" | "en", onEnd: () => void) {
  if (!("speechSynthesis" in window)) { onEnd(); return; }
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = language === "de" ? "de-DE" : "en-US";
  utter.rate = 1.0;
  utter.pitch = 1.05;
  const voices = window.speechSynthesis.getVoices();
  const preferred = voices.find(v =>
    language === "de"
      ? v.lang.startsWith("de") && v.name.includes("Google")
      : v.lang.startsWith("en") && v.name.includes("Google")
  ) ?? voices.find(v => v.lang.startsWith(language === "de" ? "de" : "en"));
  if (preferred) utter.voice = preferred;
  utter.onend = onEnd;
  utter.onerror = onEnd;
  window.speechSynthesis.speak(utter);
}

// ── Hauptkomponente ───────────────────────────────────────────────────────────

export default function AvatarChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [language, setLanguage] = useState<"de" | "en">("de");
  const [emotion, setEmotion] = useState<AvatarEmotion>("neutral");
  const [mouthOpen, setMouthOpen] = useState(0);
  const [isAvatarLoaded, setIsAvatarLoaded] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [showCreator, setShowCreator] = useState(false);
  /** Object-URL einer nutzer-hochgeladenen .glb-Datei (Custom Blender-Modell) */
  const [customGlbUrl, setCustomGlbUrl] = useState<string | null>(null);
  const [customGlbName, setCustomGlbName] = useState<string | null>(null);
  const glbFileInputRef = useRef<HTMLInputElement>(null);
  // Wir speichern den Object-URL für Cleanup
  const customGlbObjectUrlRef = useRef<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // RPM-Avatar-URL aus localStorage laden (Custom-GLB kann nicht persitiert werden
  // da Object-URLs nach Page-Reload ungültig sind – nur Name merken)
  useEffect(() => {
    const saved = localStorage.getItem(AVATAR_URL_KEY);
    if (saved) setAvatarUrl(saved);
    const savedGlbName = localStorage.getItem(CUSTOM_GLB_KEY);
    if (savedGlbName) setCustomGlbName(savedGlbName);
  }, []);

  // Object-URL beim Unmount freigeben
  useEffect(() => {
    return () => {
      if (customGlbObjectUrlRef.current) {
        URL.revokeObjectURL(customGlbObjectUrlRef.current);
      }
    };
  }, []);

  const handleAvatarCreated = useCallback((url: string) => {
    setAvatarUrl(url);
    localStorage.setItem(AVATAR_URL_KEY, url);
    setShowCreator(false);
  }, []);

  const handleAvatarReset = useCallback(() => {
    setAvatarUrl(null);
    localStorage.removeItem(AVATAR_URL_KEY);
  }, []);

  /** Nutzer wählt eine .glb-Datei aus dem Dateisystem */
  const handleGlbFileChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Alten Object-URL freigeben
    if (customGlbObjectUrlRef.current) {
      URL.revokeObjectURL(customGlbObjectUrlRef.current);
    }
    const objUrl = URL.createObjectURL(file);
    customGlbObjectUrlRef.current = objUrl;
    setCustomGlbUrl(objUrl);
    setCustomGlbName(file.name);
    localStorage.setItem(CUSTOM_GLB_KEY, file.name);
    // File-Input zurücksetzen (damit gleiche Datei erneut geöffnet werden kann)
    e.target.value = "";
  }, []);

  const handleGlbReset = useCallback(() => {
    if (customGlbObjectUrlRef.current) {
      URL.revokeObjectURL(customGlbObjectUrlRef.current);
      customGlbObjectUrlRef.current = null;
    }
    setCustomGlbUrl(null);
    setCustomGlbName(null);
    localStorage.removeItem(CUSTOM_GLB_KEY);
  }, []);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<AnySpeechRecognition>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Begrüßung beim ersten Laden
  useEffect(() => {
    const greeting = language === "de"
      ? "Hallo! Ich bin AVA, dein persönlicher 3D-KI-Avatar. Ich begleite dich auf deiner Karrierereise. Was beschäftigt dich heute?"
      : "Hi! I'm AVA, your personal 3D AI avatar. I'm here to guide you on your career journey. What's on your mind today?";
    setMessages([{
      id: "init",
      role: "assistant",
      content: greeting,
      timestamp: new Date(),
    }]);
    setEmotion("greeting");
    setTimeout(() => setEmotion("happy"), 2000);
  }, [language]);

  // Auto-Scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── TTS abspielen ──────────────────────────────────────────────────────────

  const speak = useCallback(async (text: string) => {
    if (isMuted) return;
    // Altes Audio stoppen
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    window.speechSynthesis?.cancel();

    setIsSpeaking(true);

    const onEnd = () => {
      setIsSpeaking(false);
      setMouthOpen(0);
    };

    try {
      const resp = await fetch("/api/ai/avatar/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, language }),
      });

      if (resp.ok && resp.headers.get("Content-Type")?.includes("audio")) {
        const blob = await resp.blob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audioRef.current = audio;

        // Audio-Kontext für Amplitudenananalyse (Lip-Sync)
        try {
          const ctx = new AudioContext();
          const analyser = ctx.createAnalyser();
          const source = ctx.createMediaElementSource(audio);
          source.connect(analyser);
          analyser.connect(ctx.destination);
          analyser.fftSize = 256;
          const dataArray = new Uint8Array(analyser.frequencyBinCount);

          const updateMouth = () => {
            if (!audioRef.current || audioRef.current.paused) return;
            analyser.getByteFrequencyData(dataArray);
            const avg = dataArray.slice(0, 8).reduce((a, b) => a + b, 0) / 8;
            setMouthOpen(Math.min(1, avg / 80));
            requestAnimationFrame(updateMouth);
          };
          audio.onplay = () => updateMouth();
        } catch {}

        audio.onended = () => { URL.revokeObjectURL(url); onEnd(); };
        audio.onerror = () => { URL.revokeObjectURL(url); speakWithBrowserTTS(text, language, onEnd); };
        await audio.play();
      } else {
        // Browser-TTS Fallback
        const data = await resp.json().catch(() => ({ useBrowserTTS: true, text }));
        if (data.useBrowserTTS) {
          // Simuliertes Mouth-Open ohne echte Audioanalyse
          const interval = setInterval(() => {
            setMouthOpen(0.3 + Math.random() * 0.5);
          }, 120);
          speakWithBrowserTTS(text, language, () => {
            clearInterval(interval);
            onEnd();
          });
        }
      }
    } catch {
      speakWithBrowserTTS(text, language, onEnd);
    }
  }, [isMuted, language]);

  // ── Nachricht senden ───────────────────────────────────────────────────────

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text.trim(),
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);
    setEmotion("thinking");

    try {
      const chatMessages = [...messages, userMsg].map(m => ({
        role: m.role,
        content: m.content,
      }));

      const resp = await fetch("/api/ai/avatar/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: chatMessages, language }),
      });

      const data = await resp.json();
      const reply = data.reply ?? (language === "de" ? "Entschuldigung, ich konnte gerade nicht antworten." : "Sorry, I couldn't respond right now.");

      const asstMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: reply,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, asstMsg]);
      setEmotion("happy");

      // TTS automatisch
      if (!isMuted) {
        setTimeout(() => speak(reply), 300);
      }
    } catch {
      const errMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: language === "de"
          ? "Verbindungsfehler. Bitte prüfe deine Internetverbindung."
          : "Connection error. Please check your internet connection.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errMsg]);
      setEmotion("neutral");
    } finally {
      setIsLoading(false);
    }
  }, [messages, language, isLoading, isMuted, speak]);

  // ── Spracheingabe ──────────────────────────────────────────────────────────

  const toggleListening = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    const SR = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!SR) {
      alert(language === "de"
        ? "Spracheingabe wird von diesem Browser nicht unterstützt."
        : "Speech recognition is not supported by this browser.");
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const recognition = new SR();
    recognition.lang = language === "de" ? "de-DE" : "en-US";
    recognition.continuous = false;
    recognition.interimResults = true;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results as ArrayLike<unknown>)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((r: any) => r[0].transcript as string)
        .join("");
      setInput(transcript);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((event.results as any)[event.results.length - 1].isFinal) {
        sendMessage(transcript);
      }
    };

    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [isListening, language, sendMessage]);

  // ── Keyboard Submit ────────────────────────────────────────────────────────

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col lg:flex-row h-full gap-0 overflow-hidden">
      {/* ── Avatar-Panel ──────────────────────────────────────────────────── */}
      <div className="relative lg:w-[42%] h-64 lg:h-full shrink-0 bg-linear-to-b from-indigo-950 via-violet-950 to-slate-900 overflow-hidden">
        {/* Hintergrund-Glow */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div
            className={`w-48 h-48 rounded-full blur-3xl transition-all duration-700 ${
              isSpeaking
                ? "bg-indigo-500/30 scale-125"
                : "bg-violet-600/15 scale-100"
            }`}
          />
        </div>

        {/* 3D Canvas */}
        <Suspense
          fallback={
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <div className="w-16 h-16 rounded-full bg-linear-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
                <SparklesIcon className="w-8 h-8 text-white animate-pulse" />
              </div>
              <p className="text-indigo-300 text-sm animate-pulse">AVA lädt…</p>
            </div>
          }
        >
          <AvatarScene
            isSpeaking={isSpeaking}
            emotion={emotion}
            mouthOpen={mouthOpen}
            className="w-full h-full"
            avatarUrl={avatarUrl ?? undefined}
            customGlbUrl={customGlbUrl ?? undefined}
          />
        </Suspense>

        {/* AVA Badge */}
        <div className="absolute top-4 left-4 flex flex-col gap-1.5">
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-3 py-1.5">
            <div className={`w-2 h-2 rounded-full ${isSpeaking ? "bg-emerald-400 animate-pulse" : "bg-indigo-400"}`} />
            <span className="text-white text-xs font-semibold tracking-wide">AVA – 3D KI-Avatar</span>
          </div>
          {/* Modell-Quelle anzeigen */}
          {customGlbUrl && (
            <div className="flex items-center gap-1.5 bg-violet-600/60 backdrop-blur-sm rounded-full px-2.5 py-1">
              <CubeIcon className="w-3 h-3 text-violet-200" />
              <span className="text-violet-100 text-[10px] font-medium truncate max-w-32">
                {customGlbName ?? "Custom .glb"}
              </span>
            </div>
          )}
          {!customGlbUrl && avatarUrl && (
            <div className="flex items-center gap-1.5 bg-indigo-600/50 backdrop-blur-sm rounded-full px-2.5 py-1">
              <UserCircleIcon className="w-3 h-3 text-indigo-200" />
              <span className="text-indigo-100 text-[10px] font-medium">Ready Player Me</span>
            </div>
          )}
        </div>

        {/* Steuerung */}
        <div className="absolute bottom-4 right-4 flex items-center gap-2">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors backdrop-blur-sm"
            title={isMuted ? "Ton einschalten" : "Stummschalten"}
          >
            {isMuted ? <SpeakerXMarkIcon className="w-4 h-4" /> : <SpeakerWaveIcon className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setLanguage(l => l === "de" ? "en" : "de")}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors backdrop-blur-sm"
            title="Sprache wechseln"
          >
            <span className="text-xs font-bold">{language.toUpperCase()}</span>
          </button>
          {/* Custom .glb-Upload Button */}
          <button
            onClick={() => glbFileInputRef.current?.click()}
            className="p-2 rounded-full bg-violet-600/80 hover:bg-violet-500/90 text-white transition-colors backdrop-blur-sm"
            title={customGlbName ? `Blender-Modell: ${customGlbName}` : "Eigenes 3D-Modell (.glb) hochladen"}
          >
            <CubeIcon className="w-4 h-4" />
          </button>
          {/* Custom GLB zurücksetzen */}
          {customGlbUrl && (
            <button
              onClick={handleGlbReset}
              className="p-2 rounded-full bg-orange-600/70 hover:bg-orange-500/80 text-white transition-colors backdrop-blur-sm"
              title="Eigenes 3D-Modell entfernen"
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          )}
          {/* Avatar-Erstellen-Button (Ready Player Me) */}
          <button
            onClick={() => setShowCreator(true)}
            className="p-2 rounded-full bg-indigo-600/80 hover:bg-indigo-500/90 text-white transition-colors backdrop-blur-sm"
            title="Ready Player Me Avatar erstellen"
          >
            <UserCircleIcon className="w-4 h-4" />
          </button>
          {/* RPM Avatar zurücksetzen (nur wenn vorhanden) */}
          {avatarUrl && !customGlbUrl && (
            <button
              onClick={handleAvatarReset}
              className="p-2 rounded-full bg-red-600/70 hover:bg-red-500/80 text-white transition-colors backdrop-blur-sm"
              title="RPM Avatar zurücksetzen"
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          )}
          {/* Versteckter Datei-Input für .glb-Upload */}
          <input
            ref={glbFileInputRef}
            type="file"
            accept=".glb,.gltf"
            className="hidden"
            onChange={handleGlbFileChange}
          />
        </div>

        {/* RPM Avatar-Creator Modal */}
        {showCreator && (
          <Suspense fallback={null}>
            <RPMAvatarCreator
              onAvatarCreated={handleAvatarCreated}
              onClose={() => setShowCreator(false)}
            />
          </Suspense>
        )}
      </div>

      {/* ── Chat-Panel ────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col bg-white dark:bg-slate-900 min-h-0">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
          <div>
            <h2 className="font-semibold text-slate-900 dark:text-white text-sm">
              {language === "de" ? "Gespräch mit AVA" : "Conversation with AVA"}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {language === "de"
                ? "3D KI-Avatar · Bewerbungscoach · Spracheingabe aktiv"
                : "3D AI Avatar · Career Coach · Voice input active"}
            </p>
          </div>
          <button
            onClick={() => {
              window.speechSynthesis?.cancel();
              setMessages([]);
              setEmotion("greeting");
              setTimeout(() => setEmotion("happy"), 1500);
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            title={language === "de" ? "Gespräch zurücksetzen" : "Reset conversation"}
          >
            <ArrowPathIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Actions */}
        <div className="px-4 py-2 flex gap-2 overflow-x-auto border-b border-slate-100 dark:border-slate-800 shrink-0">
          {QUICK_ACTIONS[language].map((action) => (
            <button
              key={action.label}
              onClick={() => sendMessage(action.prompt)}
              disabled={isLoading}
              className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:hover:bg-indigo-800/50 text-indigo-700 dark:text-indigo-300 rounded-full text-xs font-medium transition-colors disabled:opacity-50"
            >
              <span>{action.emoji}</span>
              <span>{action.label}</span>
            </button>
          ))}
        </div>

        {/* Nachrichten */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-0">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role === "assistant" && (
                <div className="shrink-0 w-7 h-7 rounded-full bg-linear-to-br from-indigo-500 to-violet-600 flex items-center justify-center mr-2 mt-0.5">
                  <SparklesIcon className="w-3.5 h-3.5 text-white" />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                  msg.role === "user"
                    ? "bg-indigo-600 text-white rounded-br-sm"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-bl-sm"
                }`}
              >
                <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                <p className={`text-xs mt-1 ${msg.role === "user" ? "text-indigo-200" : "text-slate-400"}`}>
                  {msg.timestamp.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
              {msg.role === "assistant" && !isMuted && (
                <button
                  onClick={() => speak(msg.content)}
                  className="ml-1 mt-1 p-1 rounded text-slate-400 hover:text-indigo-600 transition-colors shrink-0"
                  title="Vorlesen"
                >
                  <SpeakerWaveIcon className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="shrink-0 w-7 h-7 rounded-full bg-linear-to-br from-indigo-500 to-violet-600 flex items-center justify-center mr-2">
                <SparklesIcon className="w-3.5 h-3.5 text-white animate-pulse" />
              </div>
              <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl rounded-bl-sm px-4 py-3">
                <div className="flex gap-1.5">
                  {[0, 150, 300].map((delay) => (
                    <span
                      key={delay}
                      className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                      style={{ animationDelay: `${delay}ms` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Eingabe */}
        <div className="border-t border-slate-200 dark:border-slate-700 p-4 bg-white dark:bg-slate-900">
          <div className="flex items-end gap-2">
            {/* Spracheingabe */}
            <button
              onClick={toggleListening}
              className={`shrink-0 p-3 rounded-full transition-all ${
                isListening
                  ? "bg-red-500 text-white shadow-lg shadow-red-500/30 animate-pulse"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 hover:text-indigo-600"
              }`}
              title={isListening ? (language === "de" ? "Aufnahme stoppen" : "Stop recording") : (language === "de" ? "Spracheingabe" : "Voice input")}
            >
              {isListening ? <StopIcon className="w-5 h-5" /> : <MicrophoneIcon className="w-5 h-5" />}
            </button>

            {/* Texteingabe */}
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  isListening
                    ? (language === "de" ? "🎤 Höre zu…" : "🎤 Listening…")
                    : (language === "de" ? "Schreib oder sprich mit AVA…" : "Type or speak with AVA…")
                }
                disabled={isLoading || isListening}
                className="w-full resize-none rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 max-h-32 overflow-y-auto"
                style={{ minHeight: "44px" }}
              />
            </div>

            {/* Senden */}
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isLoading}
              className="shrink-0 p-3 bg-linear-to-br from-indigo-600 to-violet-600 text-white rounded-full hover:from-indigo-700 hover:to-violet-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-indigo-500/25"
            >
              <PaperAirplaneIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Status */}
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-slate-400">
              {isListening
                ? (language === "de" ? "🔴 Mikrofon aktiv – sprich jetzt" : "🔴 Microphone active – speak now")
                : isSpeaking
                ? (language === "de" ? "🔊 AVA spricht…" : "🔊 AVA is speaking…")
                : (language === "de" ? "Enter zum Senden · Shift+Enter = Zeilenumbruch" : "Enter to send · Shift+Enter = new line")}
            </p>
            <button
              onClick={() => setLanguage(l => l === "de" ? "en" : "de")}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-indigo-600 transition-colors"
            >
              <LanguageIcon className="w-3.5 h-3.5" />
              {language === "de" ? "Switch to English" : "Auf Deutsch wechseln"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
