"use client";
import { useAppUser } from "@/hooks/useAppUser";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  DocumentPlusIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  TagIcon,
} from "@heroicons/react/24/outline";

interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  category: string;
  createdAt: string;
  updatedAt: string;
  applicationId?: string | null;
  contactId?: string | null;
  application?: { companyName?: string | null; position?: string | null };
  contact?: { firstName?: string | null; lastName?: string | null };
}

export default function NotesManagement() {
  const { id: userId } = useAppUser();
  const searchParams = useSearchParams();
  const [notes, setNotes] = useState<Note[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [newNote, setNewNote] = useState({
    title: "",
    content: "",
    category: "general",
    tags: [] as string[],
    tagInput: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categories = useMemo(
    () => [
      { id: "all", name: "Alle Notizen", count: notes.length },
      { id: "general", name: "Allgemein", count: notes.filter((n) => n.category === "general").length },
      { id: "interview", name: "Interviews", count: notes.filter((n) => n.category === "interview").length },
      { id: "company", name: "Unternehmen", count: notes.filter((n) => n.category === "company").length },
      { id: "application", name: "Bewerbungen", count: notes.filter((n) => n.category === "application").length },
      { id: "idea", name: "Ideen", count: notes.filter((n) => n.category === "idea").length },
    ],
    [notes]
  );

  const loadNotes = async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ userId: userId });
      const applicationId = searchParams.get("applicationId");
      const contactId = searchParams.get("contactId");
      if (applicationId) params.append("applicationId", applicationId);
      if (contactId) params.append("contactId", contactId);
      if (selectedCategory && selectedCategory !== "all") {
        params.append("category", selectedCategory);
      }
      const res = await fetch(`/api/notes?${params.toString()}`);
      if (!res.ok) throw new Error(`Notes fetch failed (${res.status})`);
      const data = (await res.json()) as Note[];
      setNotes(data);
    } catch (err) {
      console.error("Notes fetch failed", err);
      setError("Notizen konnten nicht geladen werden.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, selectedCategory]);

  useEffect(() => {
    const cat = searchParams.get("category");
    if (cat) setSelectedCategory(cat);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredNotes = useMemo(
    () =>
      notes.filter((note) => {
        const matchesCategory = selectedCategory === "all" || note.category === selectedCategory;
        if (!matchesCategory) return false;
        if (!searchTerm.trim()) return true;
        const s = searchTerm.toLowerCase();
        return (
          note.title.toLowerCase().includes(s) ||
          note.content.toLowerCase().includes(s) ||
          note.tags.some((tag) => tag.toLowerCase().includes(s))
        );
      }),
    [notes, searchTerm, selectedCategory]
  );

  const createNote = async () => {
    if (!newNote.title || !newNote.content || !userId) return;
    try {
      setLoading(true);
      const payload = {
        userId: userId,
        title: newNote.title,
        content: newNote.content,
        category: newNote.category,
        tags: newNote.tags,
      };
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Create failed (${res.status})`);
      const created = (await res.json()) as Note;
      setNotes((prev) => [created, ...prev]);
      setShowCreateForm(false);
      resetForm();
    } catch (err) {
      console.error("Create note failed", err);
      setError("Notiz konnte nicht erstellt werden.");
    } finally {
      setLoading(false);
    }
  };

  const updateNote = async () => {
    if (!editingNote || !newNote.title || !newNote.content || !userId) return;
    try {
      setLoading(true);
      const payload = {
        id: editingNote.id,
        userId: userId,
        title: newNote.title,
        content: newNote.content,
        category: newNote.category,
        tags: newNote.tags,
      };
      const res = await fetch("/api/notes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Update failed (${res.status})`);
      const updated = (await res.json()) as Note;
      setNotes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
      setEditingNote(null);
      resetForm();
    } catch (err) {
      console.error("Update note failed", err);
      setError("Notiz konnte nicht aktualisiert werden.");
    } finally {
      setLoading(false);
    }
  };

  const deleteNote = async (id: string) => {
    if (!userId) return;
    if (!confirm("Sind Sie sicher, dass Sie diese Notiz löschen möchten?")) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/notes?id=${id}&userId=${userId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error(`Delete failed (${res.status})`);
      setNotes((prev) => prev.filter((note) => note.id !== id));
    } catch (err) {
      console.error("Delete note failed", err);
      setError("Notiz konnte nicht gelöscht werden.");
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (note: Note) => {
    setEditingNote(note);
    setNewNote({
      title: note.title,
      content: note.content,
      category: note.category,
      tags: note.tags,
      tagInput: "",
    });
    setShowCreateForm(true);
  };

  const resetForm = () => {
    setNewNote({ title: "", content: "", category: "general", tags: [], tagInput: "" });
  };

  const addTag = () => {
    const tag = newNote.tagInput.trim().toLowerCase();
    if (tag && !newNote.tags.includes(tag)) {
      setNewNote((prev) => ({ ...prev, tags: [...prev.tags, tag], tagInput: "" }));
    }
  };

  const removeTag = (tagToRemove: string) => {
    setNewNote((prev) => ({ ...prev, tags: prev.tags.filter((t) => t !== tagToRemove) }));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "Heute";
    if (diffDays === 1) return "Gestern";
    if (diffDays < 7) return `vor ${diffDays} Tagen`;
    return date.toLocaleDateString("de-DE");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Notizen</h1>
          <p className="mt-2 text-gray-600">
            Verwalten Sie Ihre Bewerbungsnotizen und wichtigen Informationen
          </p>
          {false && <p className="text-sm text-gray-500 mt-2">Lädt Benutzer...</p>}
          {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
        </div>
        <button
          onClick={() => { setShowCreateForm(true); setEditingNote(null); resetForm(); }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center space-x-2 disabled:opacity-60 disabled:cursor-not-allowed"
          disabled={!userId}
        >
          <PlusIcon className="h-5 w-5" />
          <span>Neue Notiz</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Search */}
          <div className="relative">
            <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-3 text-gray-600" />
            <input
              id="note-search"
              name="search"
              type="text"
              placeholder="Notizen durchsuchen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md placeholder-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Categories */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="font-medium text-gray-900 mb-3">Kategorien</h3>
            <div className="space-y-2">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                    selectedCategory === category.id
                      ? "bg-blue-100 text-blue-800"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span>{category.name}</span>
                    <span className={`text-xs ${selectedCategory === category.id ? "text-blue-600" : "text-gray-700"}`}>
                      {category.count}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Create/Edit Form */}
          {showCreateForm && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                {editingNote ? "Notiz bearbeiten" : "Neue Notiz erstellen"}
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Titel</label>
                  <input
                    id="note-title"
                    name="title"
                    type="text"
                    value={newNote.title}
                    onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                    placeholder="Notiz-Titel eingeben..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kategorie</label>
                  <select
                    id="note-category"
                    name="category"
                    value={newNote.category}
                    onChange={(e) => setNewNote({ ...newNote, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="general">Allgemein</option>
                    <option value="interview">Interview</option>
                    <option value="company">Unternehmen</option>
                    <option value="application">Bewerbung</option>
                    <option value="idea">Idee</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                  <div className="flex space-x-2 mb-2">
                    <input
                      id="note-tag-input"
                      name="tagInput"
                      type="text"
                      value={newNote.tagInput}
                      onChange={(e) => setNewNote({ ...newNote, tagInput: e.target.value })}
                      onKeyPress={(e) => e.key === "Enter" && addTag()}
                      placeholder="Tag hinzufügen..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md placeholder-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={addTag}
                      type="button"
                      className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-2 rounded-md"
                    >
                      Hinzufügen
                    </button>
                  </div>
                  {newNote.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {newNote.tags.map((tag) => (
                        <span key={tag} className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-md">
                          {tag}
                          <button onClick={() => removeTag(tag)} className="ml-1 text-blue-600 hover:text-blue-800">×</button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Inhalt</label>
                  <textarea
                    id="note-content"
                    name="content"
                    value={newNote.content}
                    onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                    placeholder="Notiz-Inhalt eingeben..."
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={editingNote ? updateNote : createNote}
                    disabled={!newNote.title || !newNote.content}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md"
                  >
                    {editingNote ? "Aktualisieren" : "Erstellen"}
                  </button>
                  <button
                    onClick={() => { setShowCreateForm(false); setEditingNote(null); resetForm(); }}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-md"
                  >
                    Abbrechen
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Notes List */}
          <div className="space-y-4">
            {loading ? (
              <div className="bg-white rounded-lg border border-gray-200 p-6 text-sm text-gray-600">
                Notizen werden geladen...
              </div>
            ) : filteredNotes.length === 0 ? (
              <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                <DocumentPlusIcon className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchTerm ? "Keine Notizen gefunden" : "Noch keine Notizen vorhanden"}
                </h3>
                <p className="text-gray-800 mb-4">
                  {searchTerm
                    ? "Versuchen Sie andere Suchbegriffe."
                    : "Erstellen Sie Ihre erste Notiz für wichtige Bewerbungsinformationen."}
                </p>
                {!searchTerm && (
                  <button
                    onClick={() => setShowCreateForm(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
                  >
                    Erste Notiz erstellen
                  </button>
                )}
              </div>
            ) : (
              filteredNotes.map((note) => (
                <div key={note.id} className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">{note.title}</h3>
                      <div className="flex items-center space-x-2 text-sm text-gray-700">
                        <span className="capitalize">{note.category}</span>
                        <span>•</span>
                        <span>{formatDate(note.updatedAt)}</span>
                        {(note.application?.companyName || note.contact) && (
                          <>
                            <span>•</span>
                            <span>
                              {note.application?.companyName ||
                                `${note.contact?.firstName ?? ""} ${note.contact?.lastName ?? ""}`.trim()}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button onClick={() => startEdit(note)} className="text-blue-600 hover:text-blue-800 p-1" title="Bearbeiten">
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button onClick={() => deleteNote(note.id)} className="text-red-600 hover:text-red-800 p-1" title="Löschen">
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="prose max-w-none text-gray-700 mb-3">
                    <div className="whitespace-pre-line text-sm">
                      {note.content}
                    </div>
                  </div>

                  {note.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {note.tags.map((tag) => (
                        <span key={tag} className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md">
                          <TagIcon className="h-3 w-3 mr-1" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
