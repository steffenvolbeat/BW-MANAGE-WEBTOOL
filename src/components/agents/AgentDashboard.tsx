"use client";

/**
 * AgentDashboard – Autonomer Bewerbungs-Agent (Feature 7)
 *
 * Human-in-the-Loop Workflow:
 *  1. Nutzer beschreibt gewünschte Aktion im Chat
 *  2. KI-Agent analysiert und schlägt Tasks vor (ProposedTask[])
 *  3. Jeder Task wird im MCP-Store registriert (POST /api/agents/tasks)
 *  4. Nutzer genehmigt oder lehnt jeden Task einzeln ab
 *  5. Ausgeführte Tasks erscheinen in der Verlaufsliste
 */

import { useState, useRef, useEffect, useCallback } from "react";
import {
  PaperAirplaneIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  BoltIcon,
  CpuChipIcon,
  ArrowPathIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ExclamationTriangleIcon,
  CheckBadgeIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";

// ─── Typen ───────────────────────────────────────────────────────────────────

type AgentAction =
  | "submit_application"
  | "schedule_followup"
  | "create_calendar_event"
  | "set_reminder"
  | "draft_email"
  | "update_status";

type ApprovalStatus = "pending" | "approved" | "rejected" | "executed" | "rolled_back";

interface AgentTask {
  id: string;
  action: AgentAction;
  payload: Record<string, unknown>;
  reasoning: string;
  dryRunResult?: unknown;
  status: ApprovalStatus;
  createdAt: string;
  executedAt?: string;
}

interface ProposedTask {
  action: AgentAction;
  payload: Record<string, unknown>;
  reasoning: string;
  label: string;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  proposedTasks?: ProposedTask[];
  timestamp: string;
}

// ─── Hilfsfunktionen ─────────────────────────────────────────────────────────

const ACTION_LABELS: Record<AgentAction, string> = {
  submit_application: "Bewerbung einreichen",
  schedule_followup: "Follow-up planen",
  create_calendar_event: "Kalender-Eintrag erstellen",
  set_reminder: "Erinnerung setzen",
  draft_email: "E-Mail verfassen",
  update_status: "Status aktualisieren",
};

const ACTION_COLORS: Record<AgentAction, string> = {
  submit_application: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  schedule_followup: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  create_calendar_event: "bg-green-500/20 text-green-300 border-green-500/30",
  set_reminder: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  draft_email: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  update_status: "bg-gray-500/20 text-gray-300 border-gray-500/30",
};

const STATUS_CONFIG: Record<ApprovalStatus, { label: string; color: string; Icon: React.ComponentType<{ className?: string }> }> = {
  pending: { label: "Ausstehend", color: "text-yellow-400", Icon: ClockIcon },
  approved: { label: "Genehmigt", color: "text-blue-400", Icon: CheckCircleIcon },
  rejected: { label: "Abgelehnt", color: "text-red-400", Icon: XCircleIcon },
  executed: { label: "Ausgeführt", color: "text-green-400", Icon: CheckBadgeIcon },
  rolled_back: { label: "Zurückgesetzt", color: "text-gray-400", Icon: ArrowPathIcon },
};

const QUICK_PROMPTS = [
  "Reiche meine Bewerbung bei SAP für die Backend-Engineer Stelle ein",
  "Plane ein Follow-up für meine offene Bewerbung bei BMW",
  "Erstelle eine Erinnerung für das Vorstellungsgespräch morgen",
  "Schreibe eine Dankesmail nach meinem Interview bei Siemens",
];

function formatPayload(payload: Record<string, unknown>): string {
  return Object.entries(payload)
    .filter(([, v]) => v !== null && v !== undefined && v !== "")
    .map(([k, v]) => `${k}: ${String(v)}`)
    .join(" · ");
}

// ─── Task-Card Komponente ─────────────────────────────────────────────────────

function AgentTaskCard({
  task,
  onApprove,
  onReject,
}: {
  task: AgentTask;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const { label: statusLabel, color: statusColor, Icon: StatusIcon } = STATUS_CONFIG[task.status];
  const actionStyle = ACTION_COLORS[task.action];

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:border-white/20 transition-all">
      {/* Header */}
      <div className="p-4 flex items-start gap-3">
        <div className={`shrink-0 mt-0.5 px-2 py-0.5 rounded-full text-xs font-semibold border ${actionStyle}`}>
          {ACTION_LABELS[task.action]}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-white/90 leading-snug">{task.reasoning}</p>
          <p className="text-xs text-white/40 mt-1 truncate">{formatPayload(task.payload)}</p>
        </div>
        <button
          onClick={() => setExpanded((e) => !e)}
          className="shrink-0 text-white/40 hover:text-white/80 transition-colors"
        >
          {expanded ? (
            <ChevronUpIcon className="w-4 h-4" />
          ) : (
            <ChevronDownIcon className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Dry-Run Vorschau */}
      {expanded && !!task.dryRunResult && (
        <div className="px-4 pb-3 border-t border-white/10 pt-3">
          <p className="text-xs text-white/50 mb-1 flex items-center gap-1">
            <InformationCircleIcon className="w-3.5 h-3.5" />
            Dry-Run Vorschau
          </p>
          <pre className="text-xs text-white/70 bg-white/5 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap">
            {JSON.stringify(task.dryRunResult, null, 2)}
          </pre>
        </div>
      )}

      {/* Footer */}
      <div className="px-4 pb-4 flex items-center justify-between gap-2">
        <div className={`flex items-center gap-1 text-xs ${statusColor}`}>
          <StatusIcon className="w-3.5 h-3.5" />
          <span>{statusLabel}</span>
          {task.executedAt && (
            <span className="text-white/30 ml-1">
              · {new Date(task.executedAt).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
        </div>

        {task.status === "pending" && (
          <div className="flex gap-2">
            <button
              onClick={() => onReject(task.id)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all"
            >
              <XCircleIcon className="w-3.5 h-3.5" />
              Ablehnen
            </button>
            <button
              onClick={() => onApprove(task.id)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs bg-green-500/20 text-green-300 border border-green-500/30 hover:bg-green-500/30 transition-all font-semibold"
            >
              <CheckCircleIcon className="w-3.5 h-3.5" />
              Genehmigen
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Haupt-Komponente ─────────────────────────────────────────────────────────

export default function AgentDashboard() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Hallo! Ich bin dein autonomer Bewerbungs-Agent. Beschreibe mir, was du erledigen möchtest – ich erstelle einen Aktionsplan, den du dann Schritt für Schritt genehmigen kannst.",
      timestamp: new Date().toISOString(),
    },
  ]);
  const [tasks, setTasks] = useState<AgentTask[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [taskLoading, setTaskLoading] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState<"pending" | "history">("pending");
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Lade bestehende Tasks beim Mount
  const loadTasks = useCallback(async () => {
    try {
      const res = await fetch("/api/agents/tasks");
      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks ?? []);
      }
    } catch {
      // Silently ignore on initial load
    }
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  // Sendet Nachricht an Agent-Chat API
  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isLoading) return;
      setError(null);

      const userMsg: ChatMessage = {
        role: "user",
        content: text.trim(),
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setIsLoading(true);

      try {
        // 1. Chat-Anfrage an Agent KI
        const chatRes = await fetch("/api/agents/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: text.trim() }),
        });

        if (!chatRes.ok) {
          const err = await chatRes.json().catch(() => ({}));
          throw new Error(err.error ?? `HTTP ${chatRes.status}`);
        }

        const chatData = await chatRes.json();
        const { message: aiMessage, tasks: proposed = [] } = chatData as {
          message: string;
          tasks: ProposedTask[];
        };

        // 2. Jeden vorgeschlagenen Task im MCP-Store registrieren
        const registeredTasks: AgentTask[] = [];
        for (const pt of proposed) {
          const taskRes = await fetch("/api/agents/tasks", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: pt.action,
              payload: pt.payload,
              reasoning: pt.reasoning,
            }),
          });
          if (taskRes.ok) {
            const taskData = await taskRes.json();
            if (taskData.task) registeredTasks.push(taskData.task as AgentTask);
          }
        }

        // 3. State aktualisieren
        setTasks((prev) => [...registeredTasks, ...prev]);
        if (registeredTasks.length > 0) setActiveTab("pending");

        const assistantMsg: ChatMessage = {
          role: "assistant",
          content: aiMessage,
          proposedTasks: proposed,
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : "Unbekannter Fehler";
        setError(errMsg);
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `Entschuldigung, ein Fehler ist aufgetreten: ${errMsg}`,
            timestamp: new Date().toISOString(),
          },
        ]);
      } finally {
        setIsLoading(false);
        inputRef.current?.focus();
      }
    },
    [isLoading]
  );

  // Task genehmigen
  const handleApprove = useCallback(async (taskId: string) => {
    setTaskLoading((prev) => ({ ...prev, [taskId]: true }));
    try {
      const res = await fetch("/api/agents/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId, action: "approve" }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.task) {
        setTasks((prev) => prev.map((t) => (t.id === taskId ? (data.task as AgentTask) : t)));
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Fehler";
      setError(`Genehmigung fehlgeschlagen: ${msg}`);
    } finally {
      setTaskLoading((prev) => ({ ...prev, [taskId]: false }));
    }
  }, []);

  // Task ablehnen
  const handleReject = useCallback(async (taskId: string) => {
    setTaskLoading((prev) => ({ ...prev, [taskId]: true }));
    try {
      const res = await fetch("/api/agents/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId, action: "reject" }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.task) {
        setTasks((prev) => prev.map((t) => (t.id === taskId ? (data.task as AgentTask) : t)));
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Fehler";
      setError(`Ablehnung fehlgeschlagen: ${msg}`);
    } finally {
      setTaskLoading((prev) => ({ ...prev, [taskId]: false }));
    }
  }, []);

  // Textarea: Enter = senden, Shift+Enter = neue Zeile
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const pendingTasks = tasks.filter((t) => t.status === "pending");
  const historyTasks = tasks.filter((t) => t.status !== "pending");

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-4rem)] gap-4 p-4">
      {/* ── Linke Spalte: Chat ───────────────────────────────────────────── */}
      <div className="flex flex-col flex-1 min-w-0 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-white/10 bg-gradient-to-r from-violet-500/10 to-blue-500/10">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center shadow-lg">
            <CpuChipIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">Autonomer Bewerbungs-Agent</h2>
            <p className="text-xs text-white/50">Human-in-the-Loop · MCP-gesteuert</p>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${isLoading ? "bg-yellow-400 animate-pulse" : "bg-green-400"}`} />
            <span className="text-xs text-white/50">{isLoading ? "Denkt nach…" : "Bereit"}</span>
          </div>
        </div>

        {/* Fehlermeldung */}
        {error && (
          <div className="mx-4 mt-3 flex items-center gap-2 px-3 py-2.5 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-300">
            <ExclamationTriangleIcon className="w-4 h-4 shrink-0" />
            <span>{error}</span>
            <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-200">
              ✕
            </button>
          </div>
        )}

        {/* Chat-Verlauf */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-violet-600/70 text-white rounded-br-sm"
                    : "bg-white/10 text-white/90 rounded-bl-sm"
                }`}
              >
                {msg.role === "assistant" && (
                  <div className="flex items-center gap-1.5 mb-1.5 text-violet-300">
                    <BoltIcon className="w-3.5 h-3.5" />
                    <span className="text-xs font-semibold uppercase tracking-wide">Agent</span>
                  </div>
                )}
                <p className="whitespace-pre-wrap">{msg.content}</p>
                {msg.proposedTasks && msg.proposedTasks.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-white/10">
                    <p className="text-xs text-white/50">
                      {msg.proposedTasks.length} Aktion{msg.proposedTasks.length !== 1 ? "en" : ""} vorgeschlagen →
                      rechte Spalte
                    </p>
                  </div>
                )}
                <p className="text-right text-xs text-white/30 mt-1.5">
                  {new Date(msg.timestamp).toLocaleTimeString("de-DE", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white/10 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-2">
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="w-2 h-2 rounded-full bg-violet-400 animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
                <span className="text-xs text-white/50">Agent analysiert…</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick-Prompts */}
        {messages.length === 1 && (
          <div className="px-4 pb-3">
            <p className="text-xs text-white/40 mb-2">Schnellauswahl:</p>
            <div className="flex flex-wrap gap-2">
              {QUICK_PROMPTS.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(prompt)}
                  className="text-xs px-3 py-1.5 rounded-full bg-violet-500/15 text-violet-300 border border-violet-500/25 hover:bg-violet-500/25 transition-all truncate max-w-[250px]"
                  title={prompt}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Eingabe */}
        <div className="px-4 pb-4">
          <div className="flex gap-2 items-end bg-white/10 rounded-xl border border-white/15 focus-within:border-violet-500/50 transition-all p-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Beschreibe was der Agent erledigen soll… (Enter zum Senden)"
              rows={2}
              disabled={isLoading}
              className="flex-1 bg-transparent text-sm text-white placeholder-white/30 resize-none outline-none leading-relaxed disabled:opacity-50"
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isLoading}
              className="shrink-0 w-9 h-9 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-all"
            >
              <PaperAirplaneIcon className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Rechte Spalte: Tasks ─────────────────────────────────────────── */}
      <div className="flex flex-col w-full lg:w-[420px] shrink-0 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden">
        {/* Header + Tabs */}
        <div className="px-5 pt-4 border-b border-white/10">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <BoltIcon className="w-4 h-4 text-violet-400" />
              Agenten-Aktionen
            </h3>
            <button
              onClick={loadTasks}
              className="text-white/40 hover:text-white/80 transition-colors"
              title="Aktualisieren"
            >
              <ArrowPathIcon className="w-4 h-4" />
            </button>
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab("pending")}
              className={`flex-1 pb-2.5 text-xs font-medium border-b-2 transition-all ${
                activeTab === "pending"
                  ? "border-violet-500 text-violet-300"
                  : "border-transparent text-white/40 hover:text-white/70"
              }`}
            >
              Ausstehend
              {pendingTasks.length > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-yellow-500/20 text-yellow-300 text-xs">
                  {pendingTasks.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`flex-1 pb-2.5 text-xs font-medium border-b-2 transition-all ${
                activeTab === "history"
                  ? "border-violet-500 text-violet-300"
                  : "border-transparent text-white/40 hover:text-white/70"
              }`}
            >
              Verlauf
              {historyTasks.length > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-white/10 text-white/50 text-xs">
                  {historyTasks.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Task-Liste */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {activeTab === "pending" ? (
            pendingTasks.length === 0 ? (
              <div className="text-center py-12">
                <BoltIcon className="w-10 h-10 text-white/10 mx-auto mb-3" />
                <p className="text-sm text-white/40">Keine ausstehenden Aktionen</p>
                <p className="text-xs text-white/25 mt-1">
                  Schreibe dem Agenten, was er tun soll
                </p>
              </div>
            ) : (
              pendingTasks.map((task) => (
                <div key={task.id} className={taskLoading[task.id] ? "opacity-60 pointer-events-none" : ""}>
                  <AgentTaskCard
                    task={task}
                    onApprove={handleApprove}
                    onReject={handleReject}
                  />
                </div>
              ))
            )
          ) : historyTasks.length === 0 ? (
            <div className="text-center py-12">
              <ClockIcon className="w-10 h-10 text-white/10 mx-auto mb-3" />
              <p className="text-sm text-white/40">Noch kein Verlauf</p>
            </div>
          ) : (
            historyTasks.map((task) => (
              <AgentTaskCard
                key={task.id}
                task={task}
                onApprove={handleApprove}
                onReject={handleReject}
              />
            ))
          )}
        </div>

        {/* Stats Footer */}
        <div className="px-4 py-3 border-t border-white/10 flex items-center justify-between">
          <div className="flex gap-4 text-xs text-white/40">
            <span>
              <span className="text-yellow-400 font-semibold">{pendingTasks.length}</span> ausstehend
            </span>
            <span>
              <span className="text-green-400 font-semibold">
                {tasks.filter((t) => t.status === "executed").length}
              </span>{" "}
              ausgeführt
            </span>
            <span>
              <span className="text-red-400 font-semibold">
                {tasks.filter((t) => t.status === "rejected").length}
              </span>{" "}
              abgelehnt
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
