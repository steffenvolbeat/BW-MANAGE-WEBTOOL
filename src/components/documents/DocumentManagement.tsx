"use client";
import { useAppUser } from "@/hooks/useAppUser";

import { useEffect, useMemo, useState } from "react";
import {
  DocumentTextIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  CloudArrowUpIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  TrashIcon,
  DocumentIcon,
  PhotoIcon,
  PaperClipIcon,
} from "@heroicons/react/24/outline";

interface DocumentRecord {
  id: string;
  name: string;
  type: "CV" | "COVER_LETTER" | "CERTIFICATE" | "PORTFOLIO" | "REFERENCE" | "OTHER";
  fileName: string;
  fileSize: number;
  fileType: string;
  filePath: string | null;
  uploadedAt: string;
  lastModified: string;
  tags: string[];
  description?: string;
  applications?: {
    application: { id: string; companyName: string; position: string };
  }[];
}

const documentTypes = {
  CV: { label: "Lebenslauf", color: "bg-blue-100 text-blue-800", icon: DocumentTextIcon },
  COVER_LETTER: { label: "Anschreiben", color: "bg-green-100 text-green-800", icon: DocumentIcon },
  CERTIFICATE: { label: "Zertifikat", color: "bg-purple-100 text-purple-800", icon: DocumentTextIcon },
  PORTFOLIO: { label: "Portfolio", color: "bg-yellow-100 text-yellow-800", icon: PhotoIcon },
  REFERENCE: { label: "Referenz", color: "bg-indigo-100 text-indigo-800", icon: DocumentTextIcon },
  OTHER: { label: "Sonstiges", color: "bg-gray-100 text-gray-800", icon: PaperClipIcon },
};

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export default function DocumentManagement() {
  const { id: userId } = useAppUser();
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [type, setType] = useState<DocumentRecord["type"]>("CV");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedTag, setSelectedTag] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadDocuments = async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/documents?userId=${userId}`);
      if (!res.ok) throw new Error(`Fetch failed (${res.status})`);
      const data = (await res.json()) as DocumentRecord[];
      setDocuments(data);
    } catch (err) {
      console.error("Documents fetch failed", err);
      setError("Dokumente konnten nicht geladen werden.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const allTags = useMemo(
    () => [...new Set(documents.flatMap((doc) => doc.tags || []))],
    [documents]
  );

  const filteredDocuments = useMemo(
    () =>
      documents.filter((doc) => {
        const search = searchTerm.toLowerCase();
        const matchesSearch =
          doc.name.toLowerCase().includes(search) ||
          doc.fileName.toLowerCase().includes(search) ||
          doc.tags.some((tag) => tag.toLowerCase().includes(search)) ||
          (doc.description && doc.description.toLowerCase().includes(search));
        const matchesType = selectedType === "all" || doc.type === selectedType;
        const matchesTag = selectedTag === "all" || doc.tags.includes(selectedTag);
        return matchesSearch && matchesType && matchesTag;
      }),
    [documents, searchTerm, selectedType, selectedTag]
  );

  const getFileIcon = (fileType: string, docType: string) => {
    if (fileType?.startsWith("image/")) return PhotoIcon;
    if (fileType === "application/pdf") return DocumentIcon;
    return documentTypes[docType as keyof typeof documentTypes]?.icon || PaperClipIcon;
  };

  const getTypeBadge = (docType: string) => {
    const config = documentTypes[docType as keyof typeof documentTypes];
    if (!config) return null;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) {
      setError("Bitte melden Sie sich an, um Dokumente hochzuladen.");
      return;
    }
    if (!file) {
      setError("Bitte wählen Sie eine Datei aus.");
      return;
    }

    setUploading(true);
    setError(null);
    try {
      const tagsArray = tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("userId", userId);
      formData.append("name", name || file.name);
      formData.append("type", type);
      if (description) formData.append("description", description);
      formData.append("tags", JSON.stringify(tagsArray));

      const res = await fetch("/api/documents", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || "Upload fehlgeschlagen");
      }
      const created = (await res.json()) as DocumentRecord;
      setDocuments((prev) => [created, ...prev]);
      setFile(null);
      setName("");
      setDescription("");
      setTags("");
      showToast("Dokument hochgeladen.", "success");
    } catch (err) {
      console.error("Upload failed", err);
      setError(err instanceof Error ? err.message : "Upload fehlgeschlagen");
      showToast("Upload fehlgeschlagen.", "error");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!userId) return;
    const confirmed = window.confirm("Dokument wirklich löschen?");
    if (!confirmed) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/documents?id=${id}&userId=${userId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error(`Delete failed (${res.status})`);
      setDocuments((prev) => prev.filter((d) => d.id !== id));
      showToast("Dokument gelöscht.");
    } catch (err) {
      console.error("Delete failed", err);
      setError("Dokument konnte nicht gelöscht werden.");
      showToast("Löschen fehlgeschlagen.", "error");
    } finally {
      setDeletingId(null);
    }
  };

  const DocumentGridView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {filteredDocuments.map((doc) => {
        const Icon = getFileIcon(doc.fileType, doc.type);
        const related = doc.applications?.[0]?.application;
        return (
          <div key={doc.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Icon className="w-6 h-6 text-gray-600" />
                </div>
              </div>
              <div className="flex space-x-1">
                <a className="p-1 text-blue-600 hover:text-blue-800" href={doc.filePath || "#"} target="_blank" rel="noreferrer">
                  <EyeIcon className="h-4 w-4" />
                </a>
                <a className="p-1 text-gray-600 hover:text-gray-800" href={doc.filePath || "#"} download>
                  <ArrowDownTrayIcon className="h-4 w-4" />
                </a>
                <button
                  className="p-1 text-red-500 hover:text-red-700"
                  onClick={() => handleDelete(doc.id)}
                  disabled={deletingId === doc.id}
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="mb-2">{getTypeBadge(doc.type)}</div>

            <h3 className="font-medium text-gray-900 mb-1 truncate" title={doc.name}>
              {doc.name}
            </h3>
            <p className="text-sm text-gray-600 mb-2 truncate" title={doc.fileName}>
              {doc.fileName}
            </p>

            {doc.description && (
              <p className="text-xs text-gray-700 mb-3 line-clamp-2">{doc.description}</p>
            )}

            <div className="flex flex-wrap gap-1 mb-3">
              {doc.tags.slice(0, 3).map((tag) => (
                <span key={tag} className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                  {tag}
                </span>
              ))}
              {doc.tags.length > 3 && (
                <span className="text-xs text-gray-700">+{doc.tags.length - 3}</span>
              )}
            </div>

            <div className="text-xs text-gray-700 space-y-1">
              <div>Größe: {formatFileSize(doc.fileSize)}</div>
              <div>Hochgeladen: {formatDate(doc.uploadedAt || doc.lastModified)}</div>
            </div>

            {related && (
              <div className="mt-2 text-xs text-blue-600">
                → {related.companyName} ({related.position})
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  const DocumentListView = () => (
    <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Dokument</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Typ</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Tags</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Größe</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Geändert</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">Aktionen</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredDocuments.map((doc) => {
              const Icon = getFileIcon(doc.fileType, doc.type);
              const related = doc.applications?.[0]?.application;
              return (
                <tr key={doc.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="p-1 bg-gray-100 rounded">
                        <Icon className="w-5 h-5 text-gray-600" />
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">{doc.name}</div>
                        <div className="text-sm text-gray-500">{doc.fileName}</div>
                        {related && (
                          <div className="text-xs text-blue-600">→ {related.companyName}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{getTypeBadge(doc.type)}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {doc.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                          {tag}
                        </span>
                      ))}
                      {doc.tags.length > 3 && (
                        <span className="text-xs text-gray-500">+{doc.tags.length - 3}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatFileSize(doc.fileSize)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(doc.lastModified || doc.uploadedAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <a className="text-blue-600 hover:text-blue-900 p-1" href={doc.filePath || "#"} target="_blank" rel="noreferrer">
                        <EyeIcon className="w-4 h-4" />
                      </a>
                      <a className="text-gray-600 hover:text-gray-900 p-1" href={doc.filePath || "#"} download>
                        <ArrowDownTrayIcon className="w-4 h-4" />
                      </a>
                      <button
                        className="text-red-600 hover:text-red-900 p-1"
                        onClick={() => handleDelete(doc.id)}
                        disabled={deletingId === doc.id}
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dokumente</h1>
          <p className="mt-2 text-gray-600">Verwalten Sie Ihre Bewerbungsdokumente und Vorlagen.</p>
          {false && <p className="text-sm text-gray-500 mt-1">Lade Benutzer...</p>}
          {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
        </div>
      </div>

      {toast && (
        <div
          className={`rounded-lg border px-4 py-3 flex items-center gap-2 ${
            toast.type === "success"
              ? "bg-green-50 border-green-200 text-green-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          <span className="font-medium">
            {toast.type === "success" ? "Erfolg" : "Fehler"}
          </span>
          <span>{toast.message}</span>
        </div>
      )}

      <form onSubmit={handleUpload} className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-50 rounded-lg">
            <CloudArrowUpIcon className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Dokument hochladen</h3>
            <p className="text-sm text-gray-600">PDF, DOCX, PNG, JPG.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Datei *</label>
            <input
              id="doc-file"
              name="file"
              type="file"
              accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <input
              id="doc-name"
              name="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="z.B. Lebenslauf 2026"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Typ</label>
            <select
              id="doc-type"
              name="type"
              value={type}
              onChange={(e) => setType(e.target.value as DocumentRecord["type"])}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {Object.entries(documentTypes).map(([key, value]) => (
                <option key={key} value={key}>
                  {value.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tags (Komma getrennt)</label>
            <input
              id="doc-tags"
              name="tags"
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="cv, 2026, deutsch"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Beschreibung</label>
            <textarea
              id="doc-description"
              name="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Kurzbeschreibung oder Hinweise"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={uploading || !userId}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {uploading ? "Lädt..." : "Hochladen"}
          </button>
        </div>
      </form>

      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                id="doc-search"
                name="search"
                type="text"
                placeholder="Nach Name, Dateiname oder Tag suchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg placeholder-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center">
            <FunnelIcon className="w-4 h-4 text-gray-400 mr-2" />
            <select
              id="doc-type-filter"
              name="typeFilter"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Alle Typen</option>
              {Object.entries(documentTypes).map(([key, value]) => (
                <option key={key} value={key}>
                  {value.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              id="doc-tag-filter"
              name="tagFilter"
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Alle Tags</option>
              {allTags.map((tag) => (
                <option key={tag} value={tag}>
                  {tag}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode("grid")}
              className={`px-3 py-2 rounded-lg border ${viewMode === "grid" ? "bg-gray-100 border-gray-300" : "border-transparent text-gray-500"}`}
            >
              Grid
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`px-3 py-2 rounded-lg border ${viewMode === "list" ? "bg-gray-100 border-gray-300" : "border-transparent text-gray-500"}`}
            >
              Liste
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {loading ? (
          <div className="bg-white border border-gray-200 rounded-lg p-10 text-center text-gray-600">
            Dokumente werden geladen...
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="bg-white border border-dashed border-gray-300 rounded-lg p-10 text-center">
            <DocumentTextIcon className="h-10 w-10 text-gray-400 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">Keine Dokumente gefunden</h3>
            <p className="text-sm text-gray-600 mb-4">Laden Sie Ihr erstes Dokument hoch, um zu starten.</p>
          </div>
        ) : viewMode === "grid" ? (
          <DocumentGridView />
        ) : (
          <DocumentListView />
        )}
      </div>
    </div>
  );
}
