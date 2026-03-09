"use client";

import { useState, useEffect, useCallback } from "react";
import {
  FolderIcon,
  FolderOpenIcon,
  PlusIcon,
  TrashIcon,
  PencilSquareIcon,
  ArrowLeftIcon,
  HomeIcon,
  BriefcaseIcon,
  AcademicCapIcon,
  DocumentTextIcon,
  UserIcon,
  ClipboardDocumentIcon,
  ChevronRightIcon,
  ArrowUpTrayIcon,
  MagnifyingGlassIcon,
  Squares2X2Icon,
  ListBulletIcon,
} from "@heroicons/react/24/outline";

interface FileFolder {
  id: string;
  name: string;
  parentId: string | null;
  color: string;
  icon: string;
  createdAt: string;
  childCount: number;
}

interface Breadcrumb { id: string | null; name: string; }

const ICON_MAP: Record<string, React.ElementType> = {
  "briefcase": BriefcaseIcon,
  "academic-cap": AcademicCapIcon,
  "document-text": DocumentTextIcon,
  "user": UserIcon,
  "clipboard-document": ClipboardDocumentIcon,
  "folder": FolderIcon,
};

const FOLDER_COLORS = [
  "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6",
  "#ef4444", "#ec4899", "#14b8a6", "#f97316",
  "#6b7280", "#84cc16",
];

const FOLDER_ICONS = ["folder", "briefcase", "academic-cap", "document-text", "user", "clipboard-document"];

export default function FileBrowser() {
  const [folders, setFolders] = useState<FileFolder[]>([]);
  const [breadcrumb, setBreadcrumb] = useState<Breadcrumb[]>([{ id: null, name: "Alle Ordner" }]);
  const [currentParent, setCurrentParent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [search, setSearch] = useState("");
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("#3b82f6");
  const [newIcon, setNewIcon] = useState("folder");
  const [renaming, setRenaming] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const notify = (msg: string) => { setNotification(msg); setTimeout(() => setNotification(null), 3000); };

  const load = useCallback(async (parentId: string | null = currentParent) => {
    setLoading(true);
    try {
      const url = parentId ? `/api/files/folders?parentId=${parentId}` : "/api/files/folders";
      const res = await fetch(url);
      const data = await res.json() as { folders: FileFolder[]; breadcrumb: Breadcrumb[] };
      setFolders(data.folders);
      setBreadcrumb(data.breadcrumb);
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }, [currentParent]);

  useEffect(() => { void load(currentParent); }, [currentParent, load]);

  const openFolder = (id: string) => { setCurrentParent(id); };
  const navigateTo = (id: string | null) => { setCurrentParent(id); };

  const createFolder = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    try {
      await fetch("/api/files/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName, parentId: currentParent, color: newColor, icon: newIcon }),
      });
      setShowNewFolder(false);
      setNewName("");
      setNewColor("#3b82f6");
      setNewIcon("folder");
      notify("Ordner erstellt");
      await load(currentParent);
    } finally { setSaving(false); }
  };

  const renameFolder = async (id: string) => {
    if (!renameValue.trim()) return;
    await fetch(`/api/files/folders?id=${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: renameValue }),
    });
    setRenaming(null);
    setRenameValue("");
    notify("Ordner umbenannt");
    await load(currentParent);
  };

  const deleteFolder = async (id: string, name: string) => {
    if (!confirm(`Ordner "${name}" und alle Unterordner löschen?`)) return;
    await fetch(`/api/files/folders?id=${id}`, { method: "DELETE" });
    notify("Ordner gelöscht");
    await load(currentParent);
  };

  const filtered = folders.filter((f) => f.name.toLowerCase().includes(search.toLowerCase()));

  const FolderIconComp = ({ iconName, color }: { iconName: string; color: string }) => {
    const Icon = (ICON_MAP[iconName] ?? FolderIcon) as React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
    return <Icon className="h-6 w-6" style={{ color }} />;
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Notification */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 px-5 py-3 rounded-xl bg-green-600 text-white text-sm font-medium shadow-lg">
          {notification}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-teal-100 dark:bg-teal-900/40 rounded-xl">
            <FolderOpenIcon className="h-7 w-7 text-teal-600 dark:text-teal-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Datei-Browser</h1>
            <p className="text-sm text-gray-500 dark:text-slate-400">Hierarchische Ordnerstruktur für alle Dokumente</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")} className="p-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700 transition">
            {viewMode === "grid" ? <ListBulletIcon className="h-5 w-5" /> : <Squares2X2Icon className="h-5 w-5" />}
          </button>
          <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700 transition">
            <ArrowUpTrayIcon className="h-4 w-4" /> Hochladen
          </button>
          <button onClick={() => setShowNewFolder(true)} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 transition">
            <PlusIcon className="h-4 w-4" /> Neuer Ordner
          </button>
        </div>
      </div>

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 mb-4 flex-wrap">
        {breadcrumb.map((crumb, idx) => (
          <span key={idx} className="flex items-center gap-1">
            {idx === 0
              ? <button onClick={() => navigateTo(null)} className="flex items-center gap-1 text-sm text-teal-600 dark:text-teal-400 hover:underline"><HomeIcon className="h-4 w-4" /> {crumb.name}</button>
              : <button onClick={() => navigateTo(crumb.id)} className={`text-sm transition ${idx === breadcrumb.length - 1 ? "text-gray-900 dark:text-white font-semibold" : "text-teal-600 dark:text-teal-400 hover:underline"}`}>{crumb.name}</button>
            }
            {idx < breadcrumb.length - 1 && <ChevronRightIcon className="h-4 w-4 text-gray-400 dark:text-slate-500" />}
          </span>
        ))}
      </nav>

      {/* Search */}
      <div className="relative mb-6">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Ordner suchen…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-gray-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 transition"
        />
      </div>

      {/* Back button */}
      {currentParent && (
        <button onClick={() => { const parent = breadcrumb[breadcrumb.length - 2]; navigateTo(parent?.id ?? null); }} className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 mb-4 transition">
          <ArrowLeftIcon className="h-4 w-4" /> Zurück
        </button>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600" /></div>
      )}

      {/* Empty state */}
      {!loading && filtered.length === 0 && (
        <div className="text-center py-16 text-gray-500 dark:text-slate-400">
          <FolderIcon className="h-12 w-12 mx-auto mb-3 opacity-40" />
          <p className="text-sm">Keine Ordner gefunden.</p>
          <button onClick={() => setShowNewFolder(true)} className="mt-3 text-sm text-teal-600 dark:text-teal-400 hover:underline">Ersten Ordner erstellen</button>
        </div>
      )}

      {/* Grid view */}
      {!loading && filtered.length > 0 && viewMode === "grid" && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filtered.map((folder) => (
            <div key={folder.id} className="group relative bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-4 hover:shadow-md hover:border-teal-300 dark:hover:border-teal-600 transition cursor-pointer">
              {/* Actions */}
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 flex gap-1 transition">
                <button onClick={(e) => { e.stopPropagation(); setRenaming(folder.id); setRenameValue(folder.name); }} className="p-1 rounded-lg bg-white dark:bg-slate-700 shadow text-gray-500 hover:text-blue-600 transition">
                  <PencilSquareIcon className="h-3.5 w-3.5" />
                </button>
                <button onClick={(e) => { e.stopPropagation(); void deleteFolder(folder.id, folder.name); }} className="p-1 rounded-lg bg-white dark:bg-slate-700 shadow text-gray-500 hover:text-red-600 transition">
                  <TrashIcon className="h-3.5 w-3.5" />
                </button>
              </div>

              <div onClick={() => openFolder(folder.id)}>
                <div className="flex justify-center mb-3">
                  <div className="p-3 rounded-xl" style={{ backgroundColor: `${folder.color}20` }}>
                    <FolderIconComp iconName={folder.icon} color={folder.color} />
                  </div>
                </div>
                {renaming === folder.id ? (
                  <div onClick={(e) => e.stopPropagation()}>
                    <input
                      autoFocus
                      type="text"
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") void renameFolder(folder.id); if (e.key === "Escape") setRenaming(null); }}
                      className="w-full text-xs text-center border border-teal-400 rounded px-1 py-0.5 focus:outline-none"
                    />
                  </div>
                ) : (
                  <p className="text-xs font-medium text-center text-gray-800 dark:text-white truncate">{folder.name}</p>
                )}
                {folder.childCount > 0 && (
                  <p className="text-[10px] text-center text-gray-400 dark:text-slate-500 mt-0.5">{folder.childCount} Unterordner</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* List view */}
      {!loading && filtered.length > 0 && viewMode === "list" && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
          {filtered.map((folder, idx) => (
            <div key={folder.id} className={`group flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-slate-700/50 cursor-pointer transition ${idx > 0 ? "border-t border-gray-100 dark:border-slate-700" : ""}`}>
              <div className="p-2 rounded-lg" style={{ backgroundColor: `${folder.color}20` }} onClick={() => openFolder(folder.id)}>
                <FolderIconComp iconName={folder.icon} color={folder.color} />
              </div>
              <div className="flex-1 min-w-0" onClick={() => openFolder(folder.id)}>
                {renaming === folder.id ? (
                  <input
                    autoFocus
                    type="text"
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") void renameFolder(folder.id); if (e.key === "Escape") setRenaming(null); }}
                    className="text-sm border border-teal-400 rounded px-1 py-0.5 focus:outline-none w-40"
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <p className="text-sm font-medium text-gray-800 dark:text-white truncate">{folder.name}</p>
                )}
                <p className="text-xs text-gray-400 dark:text-slate-500">{folder.childCount > 0 ? `${folder.childCount} Unterordner` : "Leer"} • {new Date(folder.createdAt).toLocaleDateString("de-DE")}</p>
              </div>
              <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition">
                <button onClick={() => { setRenaming(folder.id); setRenameValue(folder.name); }} className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition">
                  <PencilSquareIcon className="h-4 w-4" />
                </button>
                <button onClick={() => void deleteFolder(folder.id, folder.name)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition">
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
              <ChevronRightIcon className="h-4 w-4 text-gray-300 dark:text-slate-600" />
            </div>
          ))}
        </div>
      )}

      {/* New Folder Modal */}
      {showNewFolder && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm p-6 border border-gray-200 dark:border-slate-700">
            <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <FolderIcon className="h-5 w-5 text-teal-500" /> Neuer Ordner
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">Name</label>
                <input
                  autoFocus
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") void createFolder(); }}
                  placeholder="Ordnername…"
                  className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1.5">Farbe</label>
                <div className="flex flex-wrap gap-2">
                  {FOLDER_COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setNewColor(c)}
                      className="w-7 h-7 rounded-full transition-transform hover:scale-110"
                      style={{ backgroundColor: c, outline: newColor === c ? `3px solid ${c}` : "none", outlineOffset: "2px" }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1.5">Symbol</label>
                <div className="flex gap-2">
                  {FOLDER_ICONS.map((icon) => {
                    const Icon = (ICON_MAP[icon] ?? FolderIcon) as React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
                    return (
                      <button
                        key={icon}
                        onClick={() => setNewIcon(icon)}
                        className={`p-2 rounded-lg border transition ${newIcon === icon ? "border-teal-500 bg-teal-50 dark:bg-teal-900/30" : "border-gray-200 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700"}`}
                      >
                        <Icon className="h-5 w-5" style={{ color: newColor }} />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowNewFolder(false)} className="flex-1 py-2.5 rounded-xl border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-200 text-sm font-medium hover:bg-gray-50 dark:hover:bg-slate-800 transition">
                Abbrechen
              </button>
              <button onClick={() => void createFolder()} disabled={!newName.trim() || saving} className="flex-1 py-2.5 rounded-xl bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 disabled:opacity-50 transition">
                Erstellen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
