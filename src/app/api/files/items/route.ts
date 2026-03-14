import { NextRequest, NextResponse } from "next/server";
import { requireActiveUser } from "@/lib/security/guard";
import { scopedPrisma } from "@/lib/security/scope";
import { promises as fs } from "fs";
import path from "path";
import { del } from "@vercel/blob";

async function fileExistsOnDisk(filePath: string | null): Promise<boolean> {
  if (!filePath) return false;
  // Blob-URL → immer verfügbar
  if (filePath.startsWith("https://")) return true;
  // /uploads/filename → public/uploads/filename (lokal)
  let diskPath: string;
  if (filePath.startsWith("/uploads/")) {
    diskPath = path.join(process.cwd(), "public", filePath);
  } else if (filePath.startsWith("/api/files/")) {
    // Altes Schema: Vercel /tmp — wird nicht mehr genutzt, aber für bestehende Einträge
    diskPath = path.join("/tmp", "uploads", path.basename(filePath));
  } else {
    return true;
  }
  try {
    await fs.access(diskPath);
    return true;
  } catch {
    return false;
  }
}

// GET /api/files/items?folderId=xxx  (folderId absent or empty = root)
export async function GET(req: NextRequest) {
  const user = await requireActiveUser().catch(() => null);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const folderId = req.nextUrl.searchParams.get("folderId") || null;
  const db = scopedPrisma(user.id);

  const rawFiles = await db.document.findMany({
    where: { fileBrowserFolderId: folderId },
    orderBy: { uploadedAt: "desc" },
    select: {
      id: true,
      name: true,
      fileName: true,
      fileSize: true,
      fileType: true,
      filePath: true,
      type: true,
      uploadedAt: true,
      fileBrowserFolderId: true,
    },
  });

  // Prüfe für jede Datei ob sie wirklich auf der Festplatte vorhanden ist
  const files = await Promise.all(
    rawFiles.map(async (f: typeof rawFiles[number]) => ({
      ...f,
      filePath: (await fileExistsOnDisk(f.filePath)) ? f.filePath : null,
    }))
  );

  return NextResponse.json({ files });
}

// PATCH /api/files/items — Datei in anderen Ordner verschieben
export async function PATCH(req: NextRequest) {
  const user = await requireActiveUser().catch(() => null);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as { id?: string; fileBrowserFolderId?: string | null };
  const { id, fileBrowserFolderId } = body;

  if (!id) return NextResponse.json({ error: "ID fehlt" }, { status: 400 });

  const db = scopedPrisma(user.id);
  const existing = await db.document.findFirst({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Dokument nicht gefunden" }, { status: 404 });

  const updated = await db.document.update({
    where: { id },
    data: { fileBrowserFolderId: fileBrowserFolderId ?? null },
    select: { id: true, name: true, fileBrowserFolderId: true },
  });

  return NextResponse.json(updated);
}

// DELETE /api/files/items?id=xxx
export async function DELETE(req: NextRequest) {
  const user = await requireActiveUser().catch(() => null);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID fehlt" }, { status: 400 });

  const db = scopedPrisma(user.id);
  const existing = await db.document.findFirst({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Dokument nicht gefunden" }, { status: 404 });

  // Datei aus Blob oder Disk löschen
  if (existing.filePath?.startsWith("https://")) {
    try { await del(existing.filePath); } catch { /* ignorieren falls bereits weg */ }
  } else if (existing.filePath?.startsWith("/uploads/")) {
    try { await fs.unlink(path.join(process.cwd(), "public", existing.filePath)); } catch { /* ignorieren */ }
  }

  await db.document.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
