import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/currentUser";
import { prisma } from "@/lib/database";
import path from "path";
import fs from "fs";

// ─── In-memory folder store (replace with Prisma model in production) ──────────

export interface FileFolder {
  id: string;
  name: string;
  parentId: string | null;
  userId: string;
  color: string;
  icon: string;
  createdAt: string;
  childCount?: number;
  fileCount?: number;
}

const folderStore = new Map<string, FileFolder[]>();

function getUserFolders(userId: string): FileFolder[] {
  if (!folderStore.has(userId)) {
    // Create default folders for new users
    const defaults: FileFolder[] = [
      { id: `${userId}-f1`, name: "Bewerbungen", parentId: null, userId, color: "#3b82f6", icon: "briefcase", createdAt: new Date().toISOString() },
      { id: `${userId}-f2`, name: "Zeugnisse & Zertifikate", parentId: null, userId, color: "#10b981", icon: "academic-cap", createdAt: new Date().toISOString() },
      { id: `${userId}-f3`, name: "Anschreiben", parentId: null, userId, color: "#f59e0b", icon: "document-text", createdAt: new Date().toISOString() },
      { id: `${userId}-f4`, name: "Lebenslauf", parentId: null, userId, color: "#8b5cf6", icon: "user", createdAt: new Date().toISOString() },
      { id: `${userId}-f5`, name: "Verträge", parentId: null, userId, color: "#ef4444", icon: "clipboard-document", createdAt: new Date().toISOString() },
      { id: `${userId}-f1-1`, name: "2025", parentId: `${userId}-f1`, userId, color: "#3b82f6", icon: "folder", createdAt: new Date().toISOString() },
      { id: `${userId}-f1-2`, name: "Abgelehnt", parentId: `${userId}-f1`, userId, color: "#6b7280", icon: "folder", createdAt: new Date().toISOString() },
    ];
    folderStore.set(userId, defaults);
  }
  return folderStore.get(userId)!;
}

// ─── GET /api/files/folders ────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parentId = req.nextUrl.searchParams.get("parentId") ?? null;
  const all = getUserFolders(user.id);

  // Attach child/file counts
  const enriched = all
    .filter((f) => f.parentId === parentId)
    .map((f) => ({
      ...f,
      childCount: all.filter((c) => c.parentId === f.id).length,
    }));

  // Breadcrumb path
  const breadcrumb: { id: string | null; name: string }[] = [{ id: null, name: "Alle Ordner" }];
  if (parentId) {
    const buildPath = (id: string): void => {
      const folder = all.find((f) => f.id === id);
      if (!folder) return;
      if (folder.parentId) buildPath(folder.parentId);
      breadcrumb.push({ id: folder.id, name: folder.name });
    };
    buildPath(parentId);
  }

  return NextResponse.json({ folders: enriched, breadcrumb });
}

// ─── POST /api/files/folders ───────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as { name?: string; parentId?: string | null; color?: string; icon?: string };
  if (!body.name?.trim()) return NextResponse.json({ error: "Name fehlt" }, { status: 400 });

  const all = getUserFolders(user.id);
  if (all.length >= 200) return NextResponse.json({ error: "Maximale Ordneranzahl erreicht" }, { status: 429 });

  const folder: FileFolder = {
    id: crypto.randomUUID(),
    name: body.name.trim().slice(0, 80),
    parentId: body.parentId ?? null,
    userId: user.id,
    color: body.color ?? "#6b7280",
    icon: body.icon ?? "folder",
    createdAt: new Date().toISOString(),
  };

  folderStore.set(user.id, [...all, folder]);

  return NextResponse.json(folder, { status: 201 });
}

// ─── PATCH /api/files/folders?id=... ──────────────────────────────────────────

export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID fehlt" }, { status: 400 });

  const body = await req.json() as Partial<FileFolder>;
  const all = getUserFolders(user.id);
  const idx = all.findIndex((f) => f.id === id && f.userId === user.id);
  if (idx === -1) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });

  all[idx] = { ...all[idx], ...body, id, userId: user.id };
  folderStore.set(user.id, all);

  return NextResponse.json(all[idx]);
}

// ─── DELETE /api/files/folders?id=... ─────────────────────────────────────────

export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID fehlt" }, { status: 400 });

  const all = getUserFolders(user.id);
  const folder = all.find((f) => f.id === id && f.userId === user.id);
  if (!folder) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });

  // Recursively collect IDs to delete
  const toDelete = new Set<string>();
  const collectIds = (fid: string) => {
    toDelete.add(fid);
    all.filter((f) => f.parentId === fid).forEach((f) => collectIds(f.id));
  };
  collectIds(id);

  folderStore.set(user.id, all.filter((f) => !toDelete.has(f.id)));
  return NextResponse.json({ deleted: toDelete.size });
}
