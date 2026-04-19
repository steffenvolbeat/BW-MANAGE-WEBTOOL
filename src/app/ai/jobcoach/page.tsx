"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import Link from "next/link";
import {
  SparklesIcon,
  PaperAirplaneIcon,
  TrashIcon,
  LanguageIcon,
  BriefcaseIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";

// ── Typen ────────────────────────────────────────────────────────────────────

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  backend?: string;
  ts: number;
}

interface Application {
  id: string;
  companyName: string;
  position: string;
  status: string;
}

// ── Quick-Action-Sets ─────────────────────────────────────────────────────────

const QUICK = {
  de: [
    { icon: "📝", label: "Anschreiben prüfen", text: "Bitte analysiere mein Anschreiben und gib mir konkrete Verbesserungsvorschläge." },
    { icon: "🎤", label: "Interview-Vorbereitung", text: "Welche Fragen sollte ich für ein technisches IT-Interview vorbereiten?" },
    { icon: "💰", label: "Gehaltsverhandlung", text: "Wie verhandle ich mein Gehalt professionell und überzeugend?" },
    { icon: "🎯", label: "Keywords analysieren", text: "Wie finde und integriere ich die richtigen Keywords aus einer Stellenanzeige?" },
    { icon: "📊", label: "Bewerbungsstrategie", text: "Wie priorisiere ich meine aktiven Bewerbungen effektiv?" },
    { icon: "🔄", label: "Absage verarbeiten", text: "Ich habe eine Absage bekommen. Was sollte ich jetzt tun?" },
    { icon: "🌐", label: "LinkedIn optimieren", text: "Wie optimiere ich mein LinkedIn-Profil, um von Recruitern gefunden zu werden?" },
    { icon: "🤝", label: "Netzwerken", text: "Wie baue ich aktiv ein berufliches Netzwerk auf und pflege es?" },
  ],
  en: [
    { icon: "📝", label: "Review cover letter", text: "Please analyze my cover letter and give me concrete improvement suggestions." },
    { icon: "🎤", label: "Interview prep", text: "What questions should I prepare for a technical IT interview?" },
    { icon: "💰", label: "Salary negotiation", text: "How do I negotiate my salary professionally and convincingly?" },
    { icon: "🎯", label: "Keyword analysis", text: "How do I find and integrate the right keywords from a job posting?" },
    { icon: "📊", label: "Application strategy", text: "How do I effectively prioritize my active applications?" },
    { icon: "🔄", label: "Handle rejection", text: "I got rejected. What should I do now?" },
    { icon: "🌐", label: "LinkedIn optimization", text: "How do I optimize my LinkedIn profile to be found by recruiters?" },
    { icon: "🤝", label: "Networking", text: "How do I actively build and maintain a professional network?" },
  ],
};

// ── Markdown ──────────────────────────────────────────────────────────────────

function MsgContent({ content }: { content: string }) {
  return (
    <ReactMarkdown
      components={{
        h1: ({ children }) => <h1 className="font-bold text-base mb-2 mt-3 first:mt-0">{children}</h1>,
        h2: ({ children }) => <h2 className="font-bold text-sm mb-1.5 mt-3 first:mt-0">{children}</h2>,
        h3: ({ children }) => <h3 className="font-semibold text-sm mb-1 mt-2">{children}</h3>,
        p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
        ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
        li: ({ children }) => <li className="text-sm leading-relaxed">{children}</li>,
        strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
        em: ({ children }) => <em className="italic">{children}</em>,
        blockquote: ({ children }) => (
          <blockquote className="border-l-2 border-violet-400 pl-3 italic text-(--muted) mb-2">
            {children}
          </blockquote>
        ),
        code: ({ children }) => (
          <code className="bg-black/10 dark:bg-white/10 px-1.5 py-0.5 rounded text-xs font-mono">
            {children}
          </code>
        ),
        hr: () => <hr className="border-(--border) my-3" />,
        a: ({ href, children }) => (
          <a href={href} className="underline text-violet-600 dark:text-violet-400 hover:text-violet-800" target="_blank" rel="noreferrer">
            {children}
          </a>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

// ── Haupt-Seite ───────────────────────────────────────────────────────────────

export default function JobCoachPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState<"de" | "en">("de");
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedApp, setSelectedApp] = useState<string>("");
  const [showAppPicker, setShowAppPicker] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const quickActions = QUICK[language];

  // Bewerbungen laden
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/applications?limit=20&sort=recent", { signal: controller.signal })
      .then((r) => r.json())
      .then((d) => {
        const apps = d.applications ?? d.data ?? d ?? [];
        if (Array.isArray(apps)) setApplications(apps.slice(0, 20));
      })
      .catch((err) => { if (err instanceof Error && err.name === "AbortError") return; });
    return () => controller.abort();
  }, []);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || loading) return;

      const userMsg: ChatMessage = {
        role: "user",
        content: trimmed,
        ts: Date.now(),
      };
      const newMessages = [...messages, userMsg];
      setMessages(newMessages);
      setInput("");
      setLoading(true);

      try {
        const res = await fetch("/api/ai/jobcoach/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
            language,
            applicationId: selectedApp || undefined,
          }),
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: data.reply ?? "Keine Antwort.",
            backend: data.backend,
            ts: Date.now(),
          },
        ]);
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content:
              language === "de"
                ? "⚠️ Verbindungsfehler. Bitte versuche es erneut."
                : "⚠️ Connection error. Please try again.",
            ts: Date.now(),
          },
        ]);
      } finally {
        setLoading(false);
        setTimeout(() => inputRef.current?.focus(), 50);
      }
    },
    [loading, messages, language, selectedApp]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const selectedAppLabel = applications.find((a) => a.id === selectedApp);

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header className="shrink-0 border-b border-(--border) bg-(--card) px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-linear-to-br from-violet-600 to-indigo-600">
              <SparklesIcon className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-none">JobCoach AI</h1>
              <p className="text-(--muted) text-xs mt-0.5">
                {language === "de"
                  ? "Dein persönlicher KI-Bewerbungsassistent"
                  : "Your personal AI job application assistant"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Bewerbungs-Kontext */}
            {applications.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => setShowAppPicker((v) => !v)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    selectedApp
                      ? "bg-violet-100 text-violet-700 border-violet-300 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-700"
                      : "bg-(--surface) border-(--border) text-(--muted) hover:text-foreground"
                  }`}
                >
                  <BriefcaseIcon className="h-3.5 w-3.5 shrink-0" />
                  <span className="max-w-40 truncate">
                    {selectedAppLabel
                      ? `${selectedAppLabel.position} @ ${selectedAppLabel.companyName}`
                      : language === "de" ? "Kontext: alle Bewerbungen" : "Context: all applications"}
                  </span>
                  <ChevronDownIcon className="h-3 w-3 shrink-0" />
                </button>
                {showAppPicker && (
                  <div className="absolute right-0 top-full mt-1 w-72 bg-(--card) border border-(--border) rounded-xl shadow-xl z-10 overflow-hidden">
                    <div className="px-3 py-2 border-b border-(--border)">
                      <p className="text-xs font-semibold text-(--muted) uppercase tracking-wider">
                        {language === "de" ? "Bewerbungskontext" : "Application Context"}
                      </p>
                    </div>
                    <button
                      onClick={() => { setSelectedApp(""); setShowAppPicker(false); }}
                      className={`w-full text-left px-3 py-2.5 text-sm hover:bg-(--surface) transition-colors ${!selectedApp ? "bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300" : ""}`}
                    >
                      {language === "de" ? "🌐 Alle Bewerbungen" : "🌐 All applications"}
                    </button>
                    {applications.map((app) => (
                      <button
                        key={app.id}
                        onClick={() => { setSelectedApp(app.id); setShowAppPicker(false); }}
                        className={`w-full text-left px-3 py-2.5 text-sm hover:bg-(--surface) transition-colors ${selectedApp === app.id ? "bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300" : ""}`}
                      >
                        <div className="font-medium truncate">{app.position}</div>
                        <div className="text-(--muted) text-xs">{app.companyName} · {app.status}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Sprache */}
            <button
              onClick={() => setLanguage((l) => (l === "de" ? "en" : "de"))}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-(--surface) border border-(--border) text-(--muted) hover:text-foreground transition-colors"
            >
              <LanguageIcon className="h-3.5 w-3.5" />
              {language === "de" ? "DE" : "EN"}
            </button>

            {/* Leeren */}
            {messages.length > 0 && (
              <button
                onClick={() => setMessages([])}
                className="p-1.5 rounded-lg text-(--muted) hover:text-foreground hover:bg-(--surface) transition-colors"
                title={language === "de" ? "Chat leeren" : "Clear chat"}
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            )}

            <Link
              href="/applications"
              className="text-xs text-(--muted) hover:text-foreground transition-colors hidden sm:block"
            >
              ← {language === "de" ? "Bewerbungen" : "Applications"}
            </Link>
          </div>
        </div>
      </header>

      {/* ── Chat-Bereich ────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-6 py-6 space-y-6">

          {/* Welcome / Quick-Actions */}
          {messages.length === 0 && (
            <div>
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-linear-to-br from-violet-600 to-indigo-600 mb-4 shadow-lg shadow-violet-500/30">
                  <SparklesIcon className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold mb-2">
                  {language === "de"
                    ? "Womit kann ich helfen?"
                    : "How can I help you?"}
                </h2>
                <p className="text-(--muted) max-w-md mx-auto">
                  {language === "de"
                    ? "Frag mich alles rund um deine Bewerbungen – Anschreiben, Interviews, Gehaltsverhandlung, Netzwerken und mehr."
                    : "Ask me anything about your job search – cover letters, interviews, salary negotiation, networking and more."}
                </p>
                {selectedAppLabel && (
                  <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 text-xs font-medium">
                    <BriefcaseIcon className="h-3.5 w-3.5" />
                    Kontext: {selectedAppLabel.position} @ {selectedAppLabel.companyName}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {quickActions.map((q) => (
                  <button
                    key={q.label}
                    onClick={() => sendMessage(q.text)}
                    className="flex flex-col items-start gap-1.5 p-3.5 rounded-xl bg-(--card) border border-(--border) hover:border-violet-400 hover:shadow-sm transition-all text-left group"
                  >
                    <span className="text-xl">{q.icon}</span>
                    <span className="text-xs font-medium group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                      {q.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Nachrichten */}
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "assistant" && (
                <div className="h-9 w-9 rounded-xl bg-linear-to-br from-violet-600 to-indigo-600 flex items-center justify-center shrink-0 mt-1 shadow-sm">
                  <SparklesIcon className="h-4 w-4 text-white" />
                </div>
              )}
              <div
                className={`
                  max-w-[80%] px-4 py-3 rounded-2xl
                  ${
                    msg.role === "user"
                      ? "bg-linear-to-br from-violet-600 to-indigo-600 text-white rounded-tr-sm shadow-sm"
                      : "bg-(--card) border border-(--border) rounded-tl-sm shadow-sm"
                  }
                `}
              >
                <div className="text-sm leading-relaxed">
                  {msg.role === "assistant" ? (
                    <MsgContent content={msg.content} />
                  ) : (
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  )}
                </div>
                <div className="flex items-center justify-between mt-2 gap-4">
                  <p
                    className={`text-[10px] ${
                      msg.role === "user" ? "text-white/50" : "text-(--muted)"
                    }`}
                  >
                    {new Date(msg.ts).toLocaleTimeString("de-DE", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                  {msg.backend && msg.backend !== "local" && (
                    <p className="text-[10px] text-(--muted)">via {msg.backend}</p>
                  )}
                </div>
              </div>
              {msg.role === "user" && (
                <div className="h-9 w-9 rounded-xl bg-(--surface) border border-(--border) flex items-center justify-center shrink-0 mt-1 text-base">
                  👤
                </div>
              )}
            </div>
          ))}

          {/* Loading */}
          {loading && (
            <div className="flex gap-3 justify-start">
              <div className="h-9 w-9 rounded-xl bg-linear-to-br from-violet-600 to-indigo-600 flex items-center justify-center shrink-0 shadow-sm">
                <SparklesIcon className="h-4 w-4 text-white" />
              </div>
              <div className="px-5 py-3.5 rounded-2xl rounded-tl-sm bg-(--card) border border-(--border) shadow-sm">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="h-2 w-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="h-2 w-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* ── Eingabe ─────────────────────────────────────────────────────── */}
      <div className="shrink-0 border-t border-(--border) bg-(--card) px-6 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-end gap-3 bg-(--surface) border border-(--border) rounded-2xl px-4 py-3 focus-within:border-violet-400 focus-within:shadow-sm transition-all">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                language === "de"
                  ? "Frag den JobCoach… (Enter senden, Shift+Enter neue Zeile)"
                  : "Ask JobCoach… (Enter to send, Shift+Enter new line)"
              }
              rows={1}
              className="flex-1 bg-transparent text-sm resize-none outline-none placeholder-gray-400 max-h-32"
              style={{ lineHeight: "1.6" }}
              onInput={(e) => {
                const el = e.currentTarget;
                el.style.height = "auto";
                el.style.height = Math.min(el.scrollHeight, 128) + "px";
              }}
              autoFocus
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || loading}
              className="p-2.5 rounded-xl bg-linear-to-br from-violet-600 to-indigo-600 text-white hover:from-violet-700 hover:to-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm shrink-0"
            >
              <PaperAirplaneIcon className="h-4 w-4" />
            </button>
          </div>
          <p className="text-center text-[11px] text-(--muted) mt-2">
            {language === "de"
              ? "🔒 Privacy-First · Keine Datenspeicherung · Antworten sind KI-generiert und können Fehler enthalten"
              : "🔒 Privacy-First · No data storage · Responses are AI-generated and may contain errors"}
          </p>
        </div>
      </div>
    </div>
  );
}
