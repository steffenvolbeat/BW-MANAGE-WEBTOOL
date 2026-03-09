"use client";

import { useEffect, useMemo, useState } from "react";
import { useAppUser } from "@/hooks/useAppUser";

interface Board {
  id: string;
  name: string;
  columns: Array<Column>;
}

interface Column {
  id: string;
  title: string;
  position: number;
  cards: Card[];
}

interface Card {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  columnId: string;
  assignee?: { id: string; name?: string | null; email?: string | null } | null;
}

interface AgentPreview {
  preview: string;
  applyRequiresApproval: boolean;
}

interface AgentApplyResult {
  applied: boolean;
  message: string;
}

export function TrustedKanban() {
  const { id: userId } = useAppUser();
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [agentPreview, setAgentPreview] = useState<AgentPreview | null>(null);
  const [agentResult, setAgentResult] = useState<AgentApplyResult | null>(null);
  const [agentLoading, setAgentLoading] = useState(false);

  const selectedBoard = useMemo(
    () => boards.find((b) => b.id === selectedBoardId) ?? null,
    [boards, selectedBoardId]
  );

  async function fetchBoards() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/kanban/boards");
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Konnte Boards nicht laden");
      setBoards(data.boards ?? []);
      if (!selectedBoardId && data.boards?.[0]?.id) {
        setSelectedBoardId(data.boards[0].id);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function viewAgentSuggestion(card: Card) {
    setAgentLoading(true);
    setAgentResult(null);
    try {
      const res = await fetch("/api/kanban/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ boardId: selectedBoardId, cardId: card.id, action: "view" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Agent View fehlgeschlagen");
      setAgentPreview(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setAgentLoading(false);
    }
  }

  async function applyAgentSuggestion(card: Card) {
    setAgentLoading(true);
    try {
      const res = await fetch("/api/kanban/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ boardId: selectedBoardId, cardId: card.id, action: "apply", approve: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Agent Apply fehlgeschlagen");
      setAgentResult(data);
      await fetchBoards();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setAgentLoading(false);
    }
  }

  useEffect(() => {
    fetchBoards();
  }, []);

  return (
    <div className="flex h-[85vh] flex-col gap-4 rounded-lg border border-(--border) bg-(--card) p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Kanban Board</h2>
        {boards.length > 1 && (
          <select
            id="kanban-board-select"
            name="boardId"
            className="rounded border border-(--border) px-2 py-1 text-sm bg-(--card)"
            value={selectedBoardId ?? ""}
            onChange={(e) => {
              setSelectedBoardId(e.target.value);
              setSelectedCard(null);
              setAgentPreview(null);
              setAgentResult(null);
            }}
          >
            {boards.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {loading && <p className="text-sm text-gray-500">Lade Boards...</p>}

      <div className="grid flex-1 grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Spalten */}
        <div className="col-span-2 overflow-x-auto">
          <div className="flex gap-3 pb-2" style={{ minWidth: "max-content" }}>
            {selectedBoard?.columns.map((col) => (
              <div
                key={col.id}
                className="w-60 shrink-0 rounded-lg border border-(--border) bg-gray-50 dark:bg-slate-800 p-3 shadow-sm"
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold">{col.title}</p>
                  <span className="rounded bg-gray-200 dark:bg-slate-700 px-2 py-0.5 text-[11px] text-gray-700 dark:text-slate-300">
                    {col.cards.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {col.cards.map((card) => (
                    <div
                      key={card.id}
                      onClick={() => {
                        setSelectedCard(card);
                        setAgentPreview(null);
                        setAgentResult(null);
                      }}
                      className="cursor-pointer rounded border border-(--border) bg-(--card) px-3 py-2 shadow-sm transition hover:border-blue-400 hover:shadow"
                    >
                      <p className="text-sm font-medium">{card.title}</p>
                      {card.description && (
                        <p className="mt-1 text-xs text-gray-500 line-clamp-2">{card.description}</p>
                      )}
                      <div className="mt-1 flex items-center gap-2 text-[11px] text-gray-500">
                        <span className="rounded bg-gray-100 dark:bg-slate-700 px-2 py-0.5">{card.status}</span>
                      </div>
                    </div>
                  ))}
                  {col.cards.length === 0 && (
                    <p className="text-xs text-gray-400">Keine Karten</p>
                  )}
                </div>
              </div>
            ))}
            {selectedBoard && selectedBoard.columns.length === 0 && (
              <p className="text-sm text-gray-500">Keine Spalten konfiguriert.</p>
            )}
            {!selectedBoard && !loading && (
              <p className="text-sm text-gray-500">Kein Board ausgewählt.</p>
            )}
          </div>
        </div>

        {/* Agent Assist Panel */}
        <div className="flex flex-col gap-3 rounded-lg border border-(--border) bg-gray-50 dark:bg-slate-800 p-3">
          <div>
            <p className="text-sm font-semibold">Agent Assist</p>
            <p className="text-xs text-gray-500">KI-Vorschläge für Karten</p>
          </div>

          {!selectedCard && (
            <p className="text-xs text-gray-500">Karte auswählen für KI-Vorschlag.</p>
          )}

          {selectedCard && (
            <div className="space-y-2">
              <div className="rounded border border-(--border) bg-(--card) p-3">
                <p className="text-sm font-semibold">{selectedCard.title}</p>
                {selectedCard.description && (
                  <p className="mt-1 text-xs text-gray-500">{selectedCard.description}</p>
                )}
                <p className="mt-1 text-[11px] text-gray-400">Status: {selectedCard.status}</p>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => viewAgentSuggestion(selectedCard)}
                  disabled={agentLoading}
                  className="rounded bg-blue-600 px-3 py-1.5 text-xs text-white shadow hover:bg-blue-700 disabled:opacity-60"
                >
                  {agentLoading ? "..." : "Vorschlag anzeigen"}
                </button>
                <button
                  type="button"
                  onClick={() => applyAgentSuggestion(selectedCard)}
                  disabled={agentLoading || !agentPreview}
                  className="rounded bg-emerald-600 px-3 py-1.5 text-xs text-white shadow hover:bg-emerald-700 disabled:opacity-60"
                >
                  Übernehmen
                </button>
              </div>

              {agentPreview && (
                <div className="rounded border border-blue-200 bg-blue-50 dark:bg-blue-900/20 p-2 text-xs text-blue-900 dark:text-blue-200">
                  <p className="font-semibold mb-1">Vorschau</p>
                  <p>{agentPreview.preview}</p>
                </div>
              )}

              {agentResult && (
                <div className="rounded border border-emerald-200 bg-emerald-50 dark:bg-emerald-900/20 p-2 text-xs text-emerald-900 dark:text-emerald-200">
                  <p className="font-semibold">Angewendet</p>
                  <p>{agentResult.message}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
