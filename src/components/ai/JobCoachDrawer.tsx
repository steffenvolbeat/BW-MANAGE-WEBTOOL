"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import {
  SparklesIcon,
  XMarkIcon,
  PaperAirplaneIcon,
  ArrowsPointingOutIcon,
  LanguageIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";

// ── Typen ────────────────────────────────────────────────────────────────────

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  backend?: string;
  ts?: number;
}

// ── Quick-Actions ─────────────────────────────────────────────────────────────

const QUICK_DE = [
  { label: "📝 Anschreiben prüfen", text: "Ich möchte mein Anschreiben optimieren. Was sind die wichtigsten Punkte?" },
  { label: "🎤 Interview-Tipps", text: "Gib mir die wichtigsten Tipps für Vorstellungsgespräche" },
  { label: "💰 Gehaltsverhandlung", text: "Wie verhandle ich mein Gehalt professionell?" },
  { label: "📊 Absage analysieren", text: "Ich habe eine Absage erhalten. Wie gehe ich damit um?" },
  { label: "🌐 LinkedIn-Profil", text: "Wie optimiere ich mein LinkedIn-Profil für Recruiter?" },
  { label: "🎯 Keywords finden", text: "Wie finde ich die richtigen Keywords für meine Bewerbung?" },
];

const QUICK_EN = [
  { label: "📝 Cover letter tips", text: "I want to optimize my cover letter. What are the key points?" },
  { label: "🎤 Interview tips", text: "Give me the most important tips for job interviews" },
  { label: "💰 Salary negotiation", text: "How do I negotiate my salary professionally?" },
  { label: "📊 Handle rejection", text: "I received a rejection. How should I handle it?" },
  { label: "🌐 LinkedIn profile", text: "How do I optimize my LinkedIn profile for recruiters?" },
  { label: "🎯 Find keywords", text: "How do I find the right keywords for my application?" },
];

// ── Markdown-Renderer (leichtgewichtig) ──────────────────────────────────────

function MsgContent({ content }: { content: string }) {
  return (
    <ReactMarkdown
      components={{
        h2: ({ children }) => (
          <h2 className="font-bold text-sm mb-1.5 mt-2">{children}</h2>
        ),
        h3: ({ children }) => (
          <h3 className="font-semibold text-sm mb-1">{children}</h3>
        ),
        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
        ul: ({ children }) => (
          <ul className="list-disc list-inside mb-2 space-y-0.5">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal list-inside mb-2 space-y-0.5">{children}</ol>
        ),
        li: ({ children }) => <li className="text-sm">{children}</li>,
        strong: ({ children }) => (
          <strong className="font-semibold">{children}</strong>
        ),
        em: ({ children }) => <em className="italic">{children}</em>,
        code: ({ children }) => (
          <code className="bg-black/10 dark:bg-white/10 px-1 rounded text-xs font-mono">
            {children}
          </code>
        ),
        a: ({ href, children }) => (
          <a href={href} className="underline text-blue-600" target="_blank" rel="noreferrer">
            {children}
          </a>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

// ── Haupt-Komponente ──────────────────────────────────────────────────────────

export default function JobCoachDrawer() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState<"de" | "en">("de");
  const [showQuick, setShowQuick] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const quickActions = language === "de" ? QUICK_DE : QUICK_EN;

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Focus input when drawer opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [open]);

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
      setShowQuick(false);

      try {
        const res = await fetch("/api/ai/jobcoach/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: newMessages.map((m) => ({
              role: m.role,
              content: m.content,
            })),
            language,
          }),
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: data.reply ?? "Keine Antwort erhalten.",
            backend: data.backend,
            ts: Date.now(),
          },
        ]);
      } catch (err) {
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
      }
    },
    [loading, messages, language]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setShowQuick(true);
  };

  const placeholderDE = "Frage den JobCoach… (Enter senden, Shift+Enter neue Zeile)";
  const placeholderEN = "Ask JobCoach… (Enter to send, Shift+Enter new line)";

  return (
    <>
      {/* ── Floating-Button ──────────────────────────────────────────────── */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="JobCoach AI öffnen"
        className={`
          fixed bottom-6 right-6 z-50 flex items-center gap-2
          px-4 py-3 rounded-full shadow-xl font-semibold text-sm
          transition-all duration-300 select-none
          ${
            open
              ? "bg-gray-700 text-white scale-95"
              : "bg-linear-to-br from-violet-600 to-indigo-600 text-white hover:scale-105 hover:shadow-violet-500/40"
          }
        `}
      >
        <SparklesIcon className="h-5 w-5" />
        <span className="hidden sm:inline">JobCoach AI</span>
      </button>

      {/* ── Drawer ───────────────────────────────────────────────────────── */}
      <div
        className={`
          fixed bottom-20 right-6 z-50 w-95 max-w-[calc(100vw-2rem)]
          bg-(--card) border border-(--border) rounded-2xl shadow-2xl
          flex flex-col overflow-hidden
          transition-all duration-300 ease-out origin-bottom-right
          ${open ? "opacity-100 scale-100 pointer-events-auto" : "opacity-0 scale-90 pointer-events-none"}
        `}
        style={{ height: "560px" }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-(--border) bg-linear-to-r from-violet-600 to-indigo-600 text-white shrink-0">
          <SparklesIcon className="h-5 w-5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">JobCoach AI</p>
            <p className="text-xs text-white/70">
              {language === "de" ? "Dein KI-Bewerbungsassistent" : "Your AI job application coach"}
            </p>
          </div>
          <button
            onClick={() => setLanguage((l) => (l === "de" ? "en" : "de"))}
            className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
            title={language === "de" ? "Switch to English" : "Auf Deutsch wechseln"}
          >
            <LanguageIcon className="h-4 w-4" />
          </button>
          <Link
            href="/ai/jobcoach"
            onClick={() => setOpen(false)}
            className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
            title={language === "de" ? "Vollbild öffnen" : "Open full view"}
          >
            <ArrowsPointingOutIcon className="h-4 w-4" />
          </Link>
          {messages.length > 0 && (
            <button
              onClick={clearChat}
              className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
              title={language === "de" ? "Chat leeren" : "Clear chat"}
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={() => setOpen(false)}
            className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>

        {/* Nachrichten-Bereich */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {/* Welcome */}
          {messages.length === 0 && (
            <div className="text-center py-4">
              <div className="text-4xl mb-2">🧠</div>
              <p className="font-semibold text-sm">
                {language === "de"
                  ? "JobCoach AI – bereit!"
                  : "JobCoach AI – ready!"}
              </p>
              <p className="text-(--muted) text-xs mt-1">
                {language === "de"
                  ? "Stell mir eine Frage oder wähle ein Thema:"
                  : "Ask me anything or pick a topic:"}
              </p>
            </div>
          )}

          {/* Quick-Actions */}
          {showQuick && messages.length === 0 && (
            <div className="grid grid-cols-2 gap-1.5">
              {quickActions.map((q) => (
                <button
                  key={q.label}
                  onClick={() => sendMessage(q.text)}
                  className="text-left text-xs px-2.5 py-2 rounded-xl bg-(--surface) border border-(--border) hover:border-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors leading-tight"
                >
                  {q.label}
                </button>
              ))}
            </div>
          )}

          {/* Nachrichten */}
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "assistant" && (
                <div className="h-7 w-7 rounded-full bg-linear-to-br from-violet-600 to-indigo-600 flex items-center justify-center shrink-0 mr-2 mt-0.5">
                  <SparklesIcon className="h-3.5 w-3.5 text-white" />
                </div>
              )}
              <div
                className={`
                  max-w-[85%] px-3 py-2.5 rounded-2xl text-sm leading-relaxed
                  ${
                    msg.role === "user"
                      ? "bg-linear-to-br from-violet-600 to-indigo-600 text-white rounded-tr-sm"
                      : "bg-(--surface) border border-(--border) rounded-tl-sm"
                  }
                `}
              >
                {msg.role === "assistant" ? (
                  <MsgContent content={msg.content} />
                ) : (
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                )}
                {msg.backend && msg.backend !== "local" && (
                  <p className="text-[10px] text-(--muted) mt-1 opacity-60">
                    via {msg.backend}
                  </p>
                )}
              </div>
            </div>
          ))}

          {/* Loading-Indikator */}
          {loading && (
            <div className="flex justify-start">
              <div className="h-7 w-7 rounded-full bg-linear-to-br from-violet-600 to-indigo-600 flex items-center justify-center mr-2">
                <SparklesIcon className="h-3.5 w-3.5 text-white" />
              </div>
              <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-(--surface) border border-(--border) flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Eingabe */}
        <div className="shrink-0 border-t border-(--border) p-3">
          <div className="flex items-end gap-2 bg-(--surface) border border-(--border) rounded-xl px-3 py-2 focus-within:border-violet-400 transition-colors">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={language === "de" ? placeholderDE : placeholderEN}
              rows={1}
              className="flex-1 bg-transparent text-sm resize-none outline-none placeholder-gray-400 max-h-24 min-h-6"
              style={{ lineHeight: "1.5" }}
              onInput={(e) => {
                const el = e.currentTarget;
                el.style.height = "auto";
                el.style.height = Math.min(el.scrollHeight, 96) + "px";
              }}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || loading}
              className="p-1.5 rounded-lg bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
            >
              <PaperAirplaneIcon className="h-4 w-4" />
            </button>
          </div>
          <p className="text-[10px] text-(--muted) text-center mt-1.5">
            {language === "de"
              ? "Keine Datenspeicherung · Privacy-First"
              : "No data storage · Privacy-First"}
          </p>
        </div>
      </div>
    </>
  );
}
