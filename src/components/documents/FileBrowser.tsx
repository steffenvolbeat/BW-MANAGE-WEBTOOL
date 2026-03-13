"use client";

import { useState, useEffect, useCallback, useRef, DragEvent } from "react";
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
  DocumentIcon,
  PhotoIcon,
  FilmIcon,
  MusicalNoteIcon,
  ArchiveBoxIcon,
  ArrowsRightLeftIcon,
  EyeIcon,
  ExclamationTriangleIcon,
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

interface BrowserFile {
  id: string;
  name: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  filePath: string | null;
  type: string;
  uploadedAt: string;
  fileBrowserFolderId: string | null;
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

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function FileTypeIcon({ mimeType, className }: { mimeType: string; className?: string }) {
  const cls = className ?? "h-5 w-5";
  if (mimeType.startsWith("image/")) return <PhotoIcon className={cls} />;
  if (mimeType.startsWith("video/")) return <FilmIcon className={cls} />;
  if (mimeType.startsWith("audio/")) return <MusicalNoteIcon className={cls} />;
  if (mimeType === "application/pdf") return <DocumentTextIcon className={cls} />;
  if (mimeType.includes("zip") || mimeType.includes("tar") || mimeType.includes("rar"))
    return <ArchiveBoxIcon className={cls} />;
  return <DocumentIcon className={cls} />;
}

export default function FileBrowser() {
  const [folders, setFolders] = useState<FileFolder[]>([]);
  const [files, setFiles] = useState<BrowserFile[]>([]);
  const [allFolders, setAllFolders] = useState<FileFolder[]>([]);
  const [breadcrumb, setBreadcrumb] = useState<Breadcrumb[]>([{ id: null, name: "Alle Ordner" }]);
  const [currentParent, setCurrentParent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [filesLoading, setFilesLoading] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [search, setSearch] = useState("");

  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("#3b82f6");
  const [newIcon, setNewIcon] = useState("folder");
  const [renaming, setRenaming] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [saving, setSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOverFolder, setDragOverFolder] = useState<string | null>(null);
  const [dragOverRoot, setDragOverRoot] = useState(false);

  const [movingFile, setMovingFile] = useState<BrowserFile | null>(null);
  const [moveTarget, setMoveTarget] = useState<string | null>(null);

  const [notification, setNotification] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const notify = (msg: string, type: "success" | "error" = "success") => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3500);
  };

  const loadFolders = useCallback(async (parentId: string | null) => {
    setLoading(true);
    try {
      const url = parentId ? `/api/files/folders?parentId=${parentId}` : "/api/files/folders";
      const res = await fetch(url);
      const data = await res.json() as { folders: FileFolder[]; breadcrumb: Breadcrumb[] };
      setFolders(data.folders);
      setBreadcrumb(data.breadcrumb);
    } catch {
      notify("Ordner konnten nicht geladen werden.", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadFiles = useCallback(async (folderId: string | null) => {
    setFilesLoading(true);
    try {
      const url = folderId ? `/api/files/items?folderId=${folderId}` : "/api/files/items";
      const res = await fetch(url);
      const data = await res.json() as { files: BrowserFile[] };
      setFiles(data.files ?? []);
    } catch {
      // silent
    } finally {
      setFilesLoading(false);
    }
  }, []);

  const loadAllFolders = useCallback(async () => {
    const res = await fetch("/api/files/folders?all=true");
    const data = await res.json() as { folders: FileFolder[] };
    setAllFolders(data.folders ?? []);
  }, []);

  useEffect(() => {
    void loadFolders(null);
    void loadFiles(null);
  }, [loadFolders, loadFiles]);

  const navigateTo = (id: string | null) => {
    setCurrentParent(id);
    void loadFolders(id);
    void loadFiles(id);
  };

  const createFolder = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    try {
      await fetch("/api/files/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName, parentId: currentParent, color: newColor, icon: newIcon }),
      });
      setShowNewFolder(false); setNewName(""); setNewColor("#3b82f6"); setNewIcon("folder");
      notify("Ordner erstellt");
      await loadFolders(currentParent);
    } finally { setSaving(false); }
  };

  const renameFolder = async (id: string) => {
    if (!renameValue.trim()) return;
    await fetch(`/api/files/folders?id=${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: renameValue }) });
    setRenaming(null); setRenameValue("");
    notify("Ordner umbenannt");
    await loadFolders(currentParent);
  };

  const deleteFolder = async (id: string, name: string) => {
    if (!confirm(`Ordner "${name}" und alle Unterordner löschen?`)) return;
    await fetch(`/api/files/folders?id=${id}`, { method: "DELETE" });
    notify("Ordner gelöscht");
    await loadFolders(currentParent);
  };

  const uploadFiles = async (fileList: FileList, folderId: string | null = currentParent) => {
    setUploading(true);
    let ok = 0;
    for (const file of Array.from(fileList)) {
      const form = new FormData();
      form.append("file", file);
      form.append("name", file.name);
      form.append("type", "OTHER");
      if (folderId) form.append("fileBrowserFolderId", folderId);
      try { const res = await fetch("/api/documents", { method: "POST", body: form }); if (res.ok) ok++; } catch { /* skip */ }
    }
    setUploading(false);
    notify(ok === fileList.length ? `${ok} Datei${ok !== 1 ? "en" : ""} hochgeladen` : `${ok}/${fileList.length} Dateien hochgeladen`, ok > 0 ? "success" : "error");
    await loadFiles(currentParent);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) { void uploadFiles(e.target.files); e.target.value = ""; }
  };

  const deleteFile = async (file: BrowserFile) => {
    if (!confirm(`Datei "${file.name}" löschen?`)) return;
    const res = await fetch(`/api/files/items?id=${file.id}`, { method: "DELETE" });
    if (res.ok) { setFiles((prev) => prev.filter((f) => f.id !== file.id)); notify("Datei gelöscht"); }
    else notify("Löschen fehlgeschlagen.", "error");
  };

  const openMoveModal = async (file: BrowserFile) => {
    setMovingFile(file); setMoveTarget(file.fileBrowserFolderId);
    await loadAllFolders();
  };

  const confirmMove = async () => {
    if (!movingFile) return;
    const res = await fetch("/api/files/items", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: movingFile.id, fileBrowserFolderId: moveTarget }) });
    if (res.ok) { setFiles((prev) => prev.filter((f) => f.id !== movingFile.id)); notify(`"${movingFile.name}" verschoben`); }
    else notify("Verschieben fehlgeschlagen.", "error");
    setMovingFile(null);
  };

  const handleFileDragStart = (e: DragEvent<HTMLDivElement>, fileId: string) => {
    e.dataTransfer.setData("browserFileId", fileId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleFolderDragOver = (e: DragEvent<HTMLDivElement>, folderId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = e.dataTransfer.types.includes("Files") ? "copy" : "move";
    setDragOverFolder(folderId);
  };

  const handleFolderDrop = async (e: DragEvent<HTMLDivElement>, folderId: string) => {
    e.preventDefault(); setDragOverFolder(null);
    const fileId = e.dataTransfer.getData("browserFileId");
    if (fileId) {
      const res = await fetch("/api/files/items", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: fileId, fileBrowserFolderId: folderId }) });
      if (res.ok) { setFiles((prev) => prev.filter((f) => f.id !== fileId)); notify("Datei verschoben"); }
    } else if (e.dataTransfer.files.length > 0) {
      await uploadFiles(e.dataTransfer.files, folderId);
    }
  };

  const handleRootDragOver = (e: DragEvent<HTMLDivElement>) => {
    if (e.dataTransfer.types.includes("Files")) { e.preventDefault(); e.dataTransfer.dropEffect = "copy"; setDragOverRoot(true); }
  };

  const handleRootDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault(); setDragOverRoot(false);
    if (e.dataTransfer.files.length > 0) await uploadFiles(e.dataTransfer.files, currentParent);
  };

  const filteredFolders = folders.filter((f) => f.name.toLowerCase().includes(search.toLowerCase()));
  const filteredFiles = files.filter((f) => f.name.toLowerCase().includes(search.toLowerCase()));
  const isEmpty = !loading && !filesLoading && filteredFolders.length === 0 && filteredFiles.length === 0;

  const FolderIconComp = ({ iconName, color }: { iconName: string; color: string }) => {
    const Icon = (ICON_MAP[iconName] ?? FolderIcon) as React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
    return <Icon className="h-6 w-6" style={{ color }} />;
  };

  return (
    <div
      className={`max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 transition ${dragOverRoot ? "ring-2 ring-teal-500 ring-inset rounded-2xl bg-teal-50/50" : ""}`}
      onDragOver={handleRootDragOver}
      onDragLeave={() => setDragOverRoot(false)}
      onDrop={(e) => void handleRootDrop(e)}
    >
      <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileInputChange} />

      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl text-white text-sm font-medium shadow-lg ${notification.type === "success" ? "bg-green-600" : "bg-red-600"}`}>
          {notification.msg}
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
            <p className="text-sm text-gray-500 dark:text-slate-400">Dateien hochladen &amp; in Ordner organisieren · Drag &amp; Drop unterstützt</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")} className="p-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700 transition" title="Ansicht wechseln">
            {viewMode === "grid" ? <ListBulletIcon className="h-5 w-5" /> : <Squares2X2Icon className="h-5 w-5" />}
          </button>
          <button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700 transition disabled:opacity-60">
            {uploading ? <span className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" /> : <ArrowUpTrayIcon className="h-4 w-4" />}
            {uploading ? "Lädt…" : "Hochladen"}
          </button>
          <button onClick={() => setShowNewFolder(true)} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 transition">
            <PlusIcon className="h-4 w-4" /> Neuer Ordner
          </button>
        </div>
      </div>

      {dragOverRoot && (
        <div className="flex items-center justify-center gap-2 mb-4 text-teal-700 text-sm font-medium animate-pulse">
          <ArrowUpTrayIcon className="h-4 w-4" /> Dateien hier ablegen zum Hochladen in diesen Ordner
        </div>
      )}

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
        <input type="text" placeholder="Suchen…" value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-gray-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 transition" />
      </div>

      {currentParent && (
        <button onClick={() => { const parent = breadcrumb[breadcrumb.length - 2]; navigateTo(parent?.id ?? null); }} className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 mb-4 transition">
          <ArrowLeftIcon className="h-4 w-4" /> Zurück
        </button>
      )}

      {loading && (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600" /></div>
      )}

      {isEmpty && (
        <div className="text-center py-16 text-gray-500 dark:text-slate-400">
          <FolderIcon className="h-12 w-12 mx-auto mb-3 opacity-40" />
          <p className="text-sm">Keine Inhalte. Dateien hochladen oder Ordner erstellen.</p>
          <p className="text-xs mt-1 text-gray-400">Oder Dateien per Drag &amp; Drop aus dem Datei-Explorer hineinziehen.</p>
          <div className="flex justify-center gap-3 mt-4">
            <button onClick={() => fileInputRef.current?.click()} className="text-sm text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1"><ArrowUpTrayIcon className="h-4 w-4" /> Hochladen</button>
            <span className="text-gray-300">|</span>
            <button onClick={() => setShowNewFolder(true)} className="text-sm text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1"><PlusIcon className="h-4 w-4" /> Neuer Ordner</button>
          </div>
        </div>
      )}

      {/* GRID VIEW */}
      {!loading && viewMode === "grid" && (filteredFolders.length > 0 || filteredFiles.length > 0) && (
        <div className="space-y-6">
          {filteredFolders.length > 0 && (
            <div>
              {filteredFiles.length > 0 && <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-slate-500 mb-3">Ordner</p>}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {filteredFolders.map((folder) => (
                  <div
                    key={folder.id}
                    className={`group relative bg-white dark:bg-slate-800 border rounded-2xl p-4 hover:shadow-md transition cursor-pointer ${dragOverFolder === folder.id ? "border-teal-500 bg-teal-50 dark:bg-teal-900/20 scale-105 shadow-lg" : "border-gray-200 dark:border-slate-700 hover:border-teal-300 dark:hover:border-teal-600"}`}
                    onDragOver={(e) => handleFolderDragOver(e, folder.id)}
                    onDragLeave={() => setDragOverFolder(null)}
                    onDrop={(e) => void handleFolderDrop(e, folder.id)}
                  >
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 flex gap-1 transition">
                      <button onClick={(e) => { e.stopPropagation(); setRenaming(folder.id); setRenameValue(folder.name); }} className="p-1 rounded-lg bg-white dark:bg-slate-700 shadow text-gray-500 hover:text-blue-600 transition"><PencilSquareIcon className="h-3.5 w-3.5" /></button>
                      <button onClick={(e) => { e.stopPropagation(); void deleteFolder(folder.id, folder.name); }} className="p-1 rounded-lg bg-white dark:bg-slate-700 shadow text-gray-500 hover:text-red-600 transition"><TrashIcon className="h-3.5 w-3.5" /></button>
                    </div>
                    <div onClick={() => navigateTo(folder.id)}>
                      <div className="flex justify-center mb-3">
                        <div className="p-3 rounded-xl" style={{ backgroundColor: `${folder.color}20` }}>
                          <FolderIconComp iconName={folder.icon} color={folder.color} />
                        </div>
                      </div>
                      {renaming === folder.id ? (
                        <div onClick={(e) => e.stopPropagation()}>
                          <input autoFocus type="text" value={renameValue} onChange={(e) => setRenameValue(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") void renameFolder(folder.id); if (e.key === "Escape") setRenaming(null); }} className="w-full text-xs text-center border border-teal-400 rounded px-1 py-0.5 focus:outline-none" />
                        </div>
                      ) : (
                        <p className="text-xs font-medium text-center text-gray-800 dark:text-white truncate">{folder.name}</p>
                      )}
                      {folder.childCount > 0 && <p className="text-[10px] text-center text-gray-400 dark:text-slate-500 mt-0.5">{folder.childCount} Unterordner</p>}
                      {dragOverFolder === folder.id && <p className="text-[10px] text-center text-teal-600 mt-0.5 font-medium">Hier ablegen</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {filteredFiles.length > 0 && (
            <div>
              {filteredFolders.length > 0 && <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-slate-500 mb-3">Dateien</p>}
              {filesLoading
                ? <div className="flex justify-center py-6"><div className="animate-spin rounded-full h-7 w-7 border-b-2 border-teal-600" /></div>
                : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {filteredFiles.map((file) => (
                      <div
                        key={file.id}
                        draggable
                        onDragStart={(e) => handleFileDragStart(e, file.id)}
                        className="group bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-3 hover:shadow-sm hover:border-teal-300 dark:hover:border-teal-600 transition cursor-grab active:cursor-grabbing"
                      >
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-lg bg-gray-100 dark:bg-slate-700 flex-shrink-0 text-gray-500 dark:text-slate-400">
                            <FileTypeIcon mimeType={file.fileType} className="h-5 w-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 dark:text-white truncate">{file.name}</p>
                            <p className="text-xs text-gray-400 dark:text-slate-500">{formatBytes(file.fileSize)} · {new Date(file.uploadedAt).toLocaleDateString("de-DE")}</p>
                            {!file.filePath && (
                              <span className="inline-flex items-center gap-1 mt-0.5 text-[10px] text-amber-600 font-medium"><ExclamationTriangleIcon className="h-3 w-3" /> Datei fehlt – neu hochladen</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center justify-end gap-1 mt-2 opacity-0 group-hover:opacity-100 transition">
                          {file.filePath ? (
                            <button title="Vorschau" onClick={() => window.open(file.filePath!, "_blank", "noopener")} className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition"><EyeIcon className="h-4 w-4" /></button>
                          ) : (
                            <span title="Datei auf dem Server nicht vorhanden" className="p-1.5 text-amber-400"><ExclamationTriangleIcon className="h-4 w-4" /></span>
                          )}
                          <button title="Verschieben" onClick={() => void openMoveModal(file)} className="p-1.5 rounded-lg text-gray-400 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/30 transition"><ArrowsRightLeftIcon className="h-4 w-4" /></button>
                          <button title="Löschen" onClick={() => void deleteFile(file)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition"><TrashIcon className="h-4 w-4" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              }
            </div>
          )}
        </div>
      )}

      {/* LIST VIEW */}
      {!loading && viewMode === "list" && (filteredFolders.length > 0 || filteredFiles.length > 0) && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
          {filteredFolders.map((folder, idx) => (
            <div
              key={folder.id}
              className={`group flex items-center gap-3 px-4 py-3 transition cursor-pointer ${idx > 0 ? "border-t border-gray-100 dark:border-slate-700" : ""} ${dragOverFolder === folder.id ? "bg-teal-50 dark:bg-teal-900/20 border-l-4 border-l-teal-500" : "hover:bg-gray-50 dark:hover:bg-slate-700/50"}`}
              onDragOver={(e) => handleFolderDragOver(e, folder.id)}
              onDragLeave={() => setDragOverFolder(null)}
              onDrop={(e) => void handleFolderDrop(e, folder.id)}
            >
              <div className="p-2 rounded-lg flex-shrink-0" style={{ backgroundColor: `${folder.color}20` }} onClick={() => navigateTo(folder.id)}>
                <FolderIconComp iconName={folder.icon} color={folder.color} />
              </div>
              <div className="flex-1 min-w-0" onClick={() => navigateTo(folder.id)}>
                {renaming === folder.id ? (
                  <input autoFocus type="text" value={renameValue} onChange={(e) => setRenameValue(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") void renameFolder(folder.id); if (e.key === "Escape") setRenaming(null); }} className="text-sm border border-teal-400 rounded px-1 py-0.5 focus:outline-none w-40" onClick={(e) => e.stopPropagation()} />
                ) : (
                  <p className="text-sm font-medium text-gray-800 dark:text-white truncate">
                    {folder.name}
                    {dragOverFolder === folder.id && <span className="ml-2 text-xs text-teal-600 font-normal">→ hier ablegen</span>}
                  </p>
                )}
                <p className="text-xs text-gray-400 dark:text-slate-500">{folder.childCount > 0 ? `${folder.childCount} Unterordner` : "Leer"} · {new Date(folder.createdAt).toLocaleDateString("de-DE")}</p>
              </div>
              <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition">
                <button onClick={() => { setRenaming(folder.id); setRenameValue(folder.name); }} className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition"><PencilSquareIcon className="h-4 w-4" /></button>
                <button onClick={() => void deleteFolder(folder.id, folder.name)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition"><TrashIcon className="h-4 w-4" /></button>
              </div>
              <ChevronRightIcon className="h-4 w-4 text-gray-300 dark:text-slate-600 flex-shrink-0" />
            </div>
          ))}

          {filteredFolders.length > 0 && filteredFiles.length > 0 && (
            <div className="border-t-2 border-dashed border-gray-200 dark:border-slate-700" />
          )}

          {filteredFiles.map((file, idx) => (
            <div
              key={file.id}
              draggable
              onDragStart={(e) => handleFileDragStart(e, file.id)}
              className={`group flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition cursor-grab active:cursor-grabbing ${(idx > 0 || filteredFolders.length > 0) ? "border-t border-gray-100 dark:border-slate-700" : ""}`}
            >
              <div className="p-2 rounded-lg bg-gray-100 dark:bg-slate-700 flex-shrink-0 text-gray-500 dark:text-slate-400">
                <FileTypeIcon mimeType={file.fileType} className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 dark:text-white truncate">{file.name}</p>
                <p className="text-xs text-gray-400 dark:text-slate-500">{formatBytes(file.fileSize)} · {new Date(file.uploadedAt).toLocaleDateString("de-DE")}</p>
                {!file.filePath && (
                  <span className="inline-flex items-center gap-1 mt-0.5 text-[10px] text-amber-600 font-medium"><ExclamationTriangleIcon className="h-3 w-3" /> Datei fehlt</span>
                )}
              </div>
              <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition flex-shrink-0">
                {file.filePath ? (
                  <button title="Vorschau" onClick={() => window.open(file.filePath!, "_blank", "noopener")} className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition"><EyeIcon className="h-4 w-4" /></button>
                ) : (
                  <span title="Datei auf Server nicht vorhanden" className="p-1.5 text-amber-400"><ExclamationTriangleIcon className="h-4 w-4" /></span>
                )}
                <button title="Verschieben" onClick={() => void openMoveModal(file)} className="p-1.5 rounded-lg text-gray-400 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/30 transition"><ArrowsRightLeftIcon className="h-4 w-4" /></button>
                <button title="Löschen" onClick={() => void deleteFile(file)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition"><TrashIcon className="h-4 w-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL: Neuer Ordner */}
      {showNewFolder && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm p-6 border border-gray-200 dark:border-slate-700">
            <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <FolderIcon className="h-5 w-5 text-teal-500" /> Neuer Ordner
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">Name</label>
                <input autoFocus type="text" value={newName} onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") void createFolder(); }} placeholder="Ordnername…" className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1.5">Farbe</label>
                <div className="flex flex-wrap gap-2">
                  {FOLDER_COLORS.map((c) => (
                    <button key={c} onClick={() => setNewColor(c)} className="w-7 h-7 rounded-full transition-transform hover:scale-110" style={{ backgroundColor: c, outline: newColor === c ? `3px solid ${c}` : "none", outlineOffset: "2px" }} />
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1.5">Symbol</label>
                <div className="flex flex-wrap gap-2">
                  {FOLDER_ICONS.map((ic) => {
                    const Icon = (ICON_MAP[ic] ?? FolderIcon) as React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
                    return (
                      <button key={ic} onClick={() => setNewIcon(ic)} className={`p-2 rounded-lg border transition ${newIcon === ic ? "border-teal-500 bg-teal-50 dark:bg-teal-900/30" : "border-gray-200 dark:border-slate-700 hover:border-gray-300"}`}>
                        <Icon className="h-5 w-5" style={{ color: newColor }} />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="mt-4 p-3 rounded-xl bg-gray-50 dark:bg-slate-800 flex items-center gap-3">
              <div className="p-2 rounded-lg" style={{ backgroundColor: `${newColor}20` }}>
                {(() => { const Icon = (ICON_MAP[newIcon] ?? FolderIcon) as React.ComponentType<{ className?: string; style?: React.CSSProperties }>; return <Icon className="h-5 w-5" style={{ color: newColor }} />; })()}
              </div>
              <p className="text-sm text-gray-700 dark:text-slate-300 font-medium truncate">{newName || "Ordnername…"}</p>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setShowNewFolder(false)} className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition">Abbrechen</button>
              <button onClick={() => void createFolder()} disabled={!newName.trim() || saving} className="flex-1 px-4 py-2 rounded-lg bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 transition disabled:opacity-60">{saving ? "Erstellen…" : "Erstellen"}</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Datei verschieben */}
      {movingFile && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm p-6 border border-gray-200 dark:border-slate-700">
            <h2 className="text-base font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
              <ArrowsRightLeftIcon className="h-5 w-5 text-teal-500" /> Datei verschieben
            </h2>
            <p className="text-sm text-gray-500 dark:text-slate-400 mb-4 truncate">„{movingFile.name}"</p>
            <div className="space-y-1 max-h-64 overflow-y-auto pr-1">
              <button onClick={() => setMoveTarget(null)} className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition ${moveTarget === null ? "bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 font-medium" : "text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800"}`}>
                <HomeIcon className="h-4 w-4 flex-shrink-0" /> Alle Ordner (Wurzel)
              </button>
              {allFolders.map((folder) => {
                const Icon = (ICON_MAP[folder.icon] ?? FolderIcon) as React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
                return (
                  <button key={folder.id} onClick={() => setMoveTarget(folder.id)} className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition ${moveTarget === folder.id ? "bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 font-medium" : "text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800"}`}>
                    <Icon className="h-4 w-4 flex-shrink-0" style={{ color: folder.color }} />
                    <span className="truncate">{folder.parentId ? "\u00a0\u00a0" : ""}{folder.name}</span>
                  </button>
                );
              })}
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setMovingFile(null)} className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition">Abbrechen</button>
              <button onClick={() => void confirmMove()} className="flex-1 px-4 py-2 rounded-lg bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 transition">Verschieben</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
