import { NextRequest, NextResponse } from "next/server";
import { requireActiveUser, handleGuardError } from "@/lib/security/guard";
import { scopedPrisma } from "@/lib/security/scope";

const DEFAULT_FOLDERS = [
  { name: "Bewerbungen",             color: "#3b82f6", icon: "briefcase" },
  { name: "Zeugnisse & Zertifikate", color: "#10b981", icon: "academic-cap" },
  { name: "Anschreiben",             color: "#f59e0b", icon: "document-text" },
  { name: "Lebenslauf",              color: "#8b5cf6", icon: "user" },
  { name: "Verträge",                color: "#ef4444", icon: "clipboard-document" },
];

async function seedDefaultFolders(userId: string) {
  const db = scopedPrisma(userId);
  for (const f of DEFAULT_FOLDERS) {
    await db.fileFolder.create({ data: { name: f.name, color: f.color, icon: f.icon, userId } });
  }
}

// ─── GET /api/files/folders ──────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const user = await requireActiveUser();
    const db = scopedPrisma(user.id);

    const total = await db.fileFolder.count({ where: { userId: user.id } });
    if (total === 0) await seedDefaultFolders(user.id);

    const returnAll = req.nextUrl.searchParams.get("all") === "true";
    const parentId  = req.nextUrl.searchParams.get("parentId") ?? null;

    if (returnAll) {
      const all = await db.fileFolder.findMany({
        where: { userId: user.id },
        include: { _count: { select: { children: true, documents: true } } },
        orderBy: { createdAt: "asc" },
      });
      return NextResponse.json({
        folders: all.map((f: any) => ({ ...f, childCount: f._count.children, fileCount: f._count.documents })),
        breadcrumb: [],
      });
    }

    const folders = await db.fileFolder.findMany({
      where: { userId: user.id, parentId: parentId ?? null },
      include: { _count: { select: { children: true, documents: true } } },
      orderBy: { createdAt: "asc" },
    });

    const breadcrumb: { id: string | null; name: string }[] = [{ id: null, name: "Alle Ordner" }];
    if (parentId) {
      const buildPath = async (id: string): Promise<void> => {
        const folder = await db.fileFolder.findFirst({ where: { id } });
        if (!folder) return;
        if (folder.parentId) await buildPath(folder.parentId);
        breadcrumb.push({ id: folder.id, name: folder.name });
      };
      await buildPath(parentId);
    }

    return NextResponse.json({
      folders: folders.map((f: any) => ({ ...f, childCount: f._count.children, fileCount: f._count.documents })),
      breadcrumb,
    });
  } catch (error) {
    const guardResponse = handleGuardError(error);
    if (guardResponse.status !== 500) return guardResponse;
    console.error("GET /api/files/folders:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─── POST /api/files/folders ─────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const user = await requireActiveUser();
    const db = scopedPrisma(user.id);
    const body = await req.json() as { name?: string; parentId?: string | null; color?: string; icon?: string };
    if (!body.name?.trim()) return NextResponse.json({ error: "Name fehlt" }, { status: 400 });

    const count = await db.fileFolder.count({ where: { userId: user.id } });
    if (count >= 200) return NextResponse.json({ error: "Maximale Ordneranzahl erreicht" }, { status: 429 });

    if (body.parentId) {
      const parent = await db.fileFolder.findFirst({ where: { id: body.parentId, userId: user.id } });
      if (!parent) return NextResponse.json({ error: "Überordner nicht gefunden" }, { status: 404 });
    }

    const folder = await db.fileFolder.create({
      data: { name: body.name.trim().slice(0, 80), parentId: body.parentId ?? null, color: body.color ?? "#6b7280", icon: body.icon ?? "folder", userId: user.id },
    });
    return NextResponse.json(folder, { status: 201 });
  } catch (error) {
    const guardResponse = handleGuardError(error);
    if (guardResponse.status !== 500) return guardResponse;
    console.error("POST /api/files/folders:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─── PATCH /api/files/folders?id=... ─────────────────────────────────────────
export async function PATCH(req: NextRequest) {
  try {
    const user = await requireActiveUser();
    const id = req.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID fehlt" }, { status: 400 });

    const db = scopedPrisma(user.id);
    const existing = await db.fileFolder.findFirst({ where: { id, userId: user.id } });
    if (!existing) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });

    const body = await req.json() as { name?: string; color?: string; icon?: string; parentId?: string | null };
    const folder = await db.fileFolder.update({
      where: { id },
      data: {
        ...(body.name     !== undefined && { name:     body.name.trim().slice(0, 80) }),
        ...(body.color    !== undefined && { color:    body.color }),
        ...(body.icon     !== undefined && { icon:     body.icon }),
        ...(body.parentId !== undefined && { parentId: body.parentId }),
      },
    });
    return NextResponse.json(folder);
  } catch (error) {
    const guardResponse = handleGuardError(error);
    if (guardResponse.status !== 500) return guardResponse;
    console.error("PATCH /api/files/folders:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─── DELETE /api/files/folders?id=... ────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  try {
    const user = await requireActiveUser();
    const id = req.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID fehlt" }, { status: 400 });

    const db = scopedPrisma(user.id);
    const existing = await db.fileFolder.findFirst({ where: { id, userId: user.id } });
    if (!existing) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });

    await db.fileFolder.delete({ where: { id } });
    return NextResponse.json({ deleted: true });
  } catch (error) {
    const guardResponse = handleGuardError(error);
    if (guardResponse.status !== 500) return guardResponse;
    console.error("DELETE /api/files/folders:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
