"use client";

import { useEffect, useMemo, useState } from "react";
import { useAppUser } from "@/hooks/useAppUser";
import {
  PlusIcon,
  TrashIcon,
  XMarkIcon,
  PencilSquareIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";

interface Board {
  id: string;
  name: string;
  columns: Column[];
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

export function TrustedKanban() {
  const { id: userId } = useAppUser();
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null);

  // Board erstellen
  const [showNewBoard, setShowNewBoard] = useState(false);
  const [newBoardName, setNewBoardName] = useState("");
  const [creatingBoard, setCreatingBoard] = useState(false);

  // Karte hinzufügen
  const [addingCardToCol, setAddingCardToCol] = useState<string | null>(null);
  const [newCardTitle, setNewCardTitle] = useState("");
  const [newCardDesc, setNewCardDesc] = useState("");
  const [savingCard, setSavingCard] = useState(false);

  // Karte bearbeiten/verschieben
  const [editCard, setEditCard] = useState<Card | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editColId, setEditColId] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

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
      if (!res.ok) throw new Error(data?.error ?? "Boards konnten nicht geladen werden");
      const loaded: Board[] = data.boards ?? [];
      setBoards(loaded);
      if (!selectedBoardId && loaded[0]?.id) {
        setSelectedBoardId(loaded[0].id);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchBoards();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  async function handleCreateBoard() {
    if (!newBoardName.trim()) return;
    setCreatingBoard(true);
    try {
      const res = await fetch("/api/kanban/boards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newBoardName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Fehler beim Erstellen");
      setNewBoardName("");
      setShowNewBoard(false);
      await fetchBoards();
      setSelectedBoardId(data.board.id);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setCreatingBoard(false);
    }
  }

  async function handleAddCard(columnId: string) {
    if (!newCardTitle.trim() || !selectedBoardId) return;
    setSavingCard(true);
    try {
      const res = await fetch("/api/kanban/cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          boardId: selectedBoardId,
          columnId,
          title: newCardTitle.trim(),
          description: newCardDesc.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Fehler beim Erstellen");
      setNewCardTitle("");
      setNewCardDesc("");
      setAddingCardToCol(null);
      await fetchBoards();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSavingCard(false);
    }
  }

  async function handleDeleteCard(cardId: string) {
    if (!confirm("Karte wirklich löschen?")) return;
    try {
      const res = await fetch(`/api/kanban/cards?id=${cardId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Löschen fehlgeschlagen");
      await fetchBoards();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  function openEditCard(card: Card) {
    setEditCard(card);
    setEditTitle(card.title);
    setEditDesc(card.description ?? "");
    setEditColId(card.columnId);
  }

  async function handleSaveEdit() {
    if (!editCard) return;
    setSavingEdit(true);
    try {
      const res = await fetch("/api/kanban/cards", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editCard.id,
          title: editTitle,
          description: editDesc,
          columnId: editColId,
        }),
      });
      if (!res.ok) throw new Error("Speichern fehlgeschlagen");
      setEditCard(null);
      await fetchBoards();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSavingEdit(false);
    }
  }

  async function moveCard(card: Card, direction: "left" | "right") {
    if (!selectedBoard) return;
    const cols = [...selectedBoard.columns].sort((a, b) => a.position - b.position);
    const idx = cols.findIndex((c) => c.id === card.columnId);
    const target = direction === "right" ? cols[idx + 1] : cols[idx - 1];
    if (!target) return;
    try {
      await fetch("/api/kanban/cards", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: card.id, columnId: target.id }),
      });
      await fetchBoards();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  const sortedColumns = useMemo(
    () => [...(selectedBoard?.columns ?? [])].sort((a, b) => a.position - b.position),
    [selectedBoard]
  );

  return (
    <div className="flex flex-col gap-4 min-h-[80vh]">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-gray-900">Kanban Board</h2>
          {boards.length > 1 && (
            <select
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm bg-white text-gray-800 focus:ring-2 focus:ring-blue-500"
              value={selectedBoardId ?? ""}
              onChange={(e) => setSelectedBoardId(e.target.value)}
            >
              {boards.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          )}
          {boards.length === 1 && (
            <span className="text-sm text-gray-500">{boards[0].name}</span>
          )}
        </div>
        <button
          onClick={() => setShowNewBoard(true)}
          className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <PlusIcon className="w-4 h-4" />
          Neues Board
        </button>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex justify-between">
          {error}
          <button onClick={() => setError(null)}><XMarkIcon className="w-4 h-4" /></button>
        </div>
      )}

      {loading && <p className="text-sm text-gray-500">Lade Boards…</p>}

      {/* Kein Board vorhanden */}
      {!loading && boards.length === 0 && (
        <div className="flex flex-col items-center justify-center flex-1 py-20 gap-4">
          <div className="text-6xl">📋</div>
          <p className="text-lg font-semibold text-gray-700">Noch kein Kanban-Board vorhanden</p>
          <p className="text-sm text-gray-500">Erstelle dein erstes Board um loszulegen.</p>
          <button
            onClick={() => setShowNewBoard(true)}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            <PlusIcon className="w-4 h-4" />
            Erstes Board erstellen
          </button>
        </div>
      )}

      {/* Board-Spalten */}
      {selectedBoard && (
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4" style={{ minWidth: "max-content" }}>
            {sortedColumns.map((col, colIdx) => (
              <div
                key={col.id}
                className="w-64 shrink-0 flex flex-col rounded-xl border border-gray-200 bg-gray-50 shadow-sm"
              >
                {/* Spalten-Header */}
                <div className="flex items-center justify-between px-3 py-2.5 border-b border-gray-200 bg-white rounded-t-xl">
                  <span className="text-sm font-semibold text-gray-800">{col.title}</span>
                  <span className="rounded-full bg-gray-200 px-2 py-0.5 text-[11px] text-gray-600 font-medium">
                    {col.cards.length}
                  </span>
                </div>

                {/* Karten */}
                <div className="flex flex-col gap-2 p-2 flex-1 min-h-[80px]">
                  {col.cards.map((card) => (
                    <div
                      key={card.id}
                      className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm group"
                    >
                      <div className="flex items-start justify-between gap-1">
                        <p className="text-sm font-medium text-gray-900 flex-1">{card.title}</p>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            title="Bearbeiten"
                            onClick={() => openEditCard(card)}
                            className="text-gray-400 hover:text-blue-600"
                          >
                            <PencilSquareIcon className="w-3.5 h-3.5" />
                          </button>
                          <button
                            title="Löschen"
                            onClick={() => handleDeleteCard(card.id)}
                            className="text-gray-400 hover:text-red-600"
                          >
                            <TrashIcon className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      {card.description && (
                        <p className="mt-1 text-xs text-gray-500 line-clamp-2">{card.description}</p>
                      )}
                      {/* Verschieben-Pfeile */}
                      <div className="mt-2 flex gap-1">
                        {colIdx > 0 && (
                          <button
                            onClick={() => moveCard(card, "left")}
                            title="Zurück"
                            className="flex items-center gap-0.5 text-[10px] text-gray-400 hover:text-blue-600"
                          >
                            <ArrowRightIcon className="w-3 h-3 rotate-180" />
                            {sortedColumns[colIdx - 1]?.title}
                          </button>
                        )}
                        {colIdx < sortedColumns.length - 1 && (
                          <button
                            onClick={() => moveCard(card, "right")}
                            title="Weiter"
                            className="flex items-center gap-0.5 text-[10px] text-gray-400 hover:text-blue-600 ml-auto"
                          >
                            {sortedColumns[colIdx + 1]?.title}
                            <ArrowRightIcon className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Karte hinzufügen */}
                {addingCardToCol === col.id ? (
                  <div className="p-2 border-t border-gray-200 bg-white rounded-b-xl">
                    <input
                      autoFocus
                      className="w-full mb-1.5 px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      placeholder="Titel der Karte"
                      value={newCardTitle}
                      onChange={(e) => setNewCardTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleAddCard(col.id);
                        if (e.key === "Escape") { setAddingCardToCol(null); setNewCardTitle(""); setNewCardDesc(""); }
                      }}
                    />
                    <textarea
                      className="w-full mb-2 px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
                      placeholder="Beschreibung (optional)"
                      rows={2}
                      value={newCardDesc}
                      onChange={(e) => setNewCardDesc(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAddCard(col.id)}
                        disabled={savingCard || !newCardTitle.trim()}
                        className="flex-1 rounded-lg bg-blue-600 py-1.5 text-xs text-white hover:bg-blue-700 disabled:opacity-50"
                      >
                        {savingCard ? "…" : "Hinzufügen"}
                      </button>
                      <button
                        onClick={() => { setAddingCardToCol(null); setNewCardTitle(""); setNewCardDesc(""); }}
                        className="px-2 rounded-lg border border-gray-300 text-xs text-gray-600 hover:bg-gray-50"
                      >
                        <XMarkIcon className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => { setAddingCardToCol(col.id); setNewCardTitle(""); setNewCardDesc(""); }}
                    className="flex items-center gap-1 px-3 py-2 text-xs text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-b-xl border-t border-gray-200 bg-white transition"
                  >
                    <PlusIcon className="w-3.5 h-3.5" />
                    Karte hinzufügen
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal: Neues Board */}
      {showNewBoard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Neues Board erstellen</h3>
            <input
              autoFocus
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-4 focus:ring-2 focus:ring-blue-500"
              placeholder="Board-Name, z.B. Meine Bewerbungen"
              value={newBoardName}
              onChange={(e) => setNewBoardName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreateBoard();
                if (e.key === "Escape") setShowNewBoard(false);
              }}
            />
            <p className="text-xs text-gray-500 mb-4">
              Standard-Spalten werden automatisch angelegt: Offen, In Bearbeitung, Warte auf Antwort, Interview, Angebot, Abgeschlossen.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleCreateBoard}
                disabled={creatingBoard || !newBoardName.trim()}
                className="flex-1 rounded-lg bg-blue-600 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {creatingBoard ? "Erstelle…" : "Board erstellen"}
              </button>
              <button
                onClick={() => { setShowNewBoard(false); setNewBoardName(""); }}
                className="px-4 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50"
              >
                Abbrechen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Karte bearbeiten */}
      {editCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <PencilSquareIcon className="w-5 h-5 text-blue-600" />
              Karte bearbeiten
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Titel</label>
                <input
                  autoFocus
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Beschreibung</label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Spalte</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  value={editColId}
                  onChange={(e) => setEditColId(e.target.value)}
                >
                  {sortedColumns.map((c) => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button
                onClick={handleSaveEdit}
                disabled={savingEdit || !editTitle.trim()}
                className="flex-1 rounded-lg bg-blue-600 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {savingEdit ? "Speichere…" : "Speichern"}
              </button>
              <button
                onClick={() => setEditCard(null)}
                className="px-4 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50"
              >
                Abbrechen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
