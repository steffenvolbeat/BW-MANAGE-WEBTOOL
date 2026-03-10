import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database";
import { requireActiveUser, handleGuardError } from "@/lib/security/guard";

export const revalidate = 0;

// POST /api/kanban/cards — Karte erstellen
export async function POST(req: NextRequest) {
  try {
    const user = await requireActiveUser();
    const { boardId, columnId, title, description } = await req.json();

    if (!boardId || !columnId || !title?.trim()) {
      return NextResponse.json({ error: "boardId, columnId und title erforderlich" }, { status: 400 });
    }

    // Sicherstellen, dass Board dem User gehört
    const board = await prisma.board.findFirst({
      where: { id: boardId, OR: [{ ownerId: user.id }, { members: { some: { userId: user.id } } }] },
    });
    if (!board) return NextResponse.json({ error: "Board nicht gefunden" }, { status: 404 });

    const card = await prisma.card.create({
      data: {
        boardId,
        columnId,
        title: title.trim(),
        description: description?.trim() || null,
        status: "open",
      },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json({ card }, { status: 201 });
  } catch (err) {
    return handleGuardError(err);
  }
}

// PUT /api/kanban/cards — Karte verschieben oder aktualisieren
export async function PUT(req: NextRequest) {
  try {
    const user = await requireActiveUser();
    const { id, columnId, title, description, status } = await req.json();

    if (!id) return NextResponse.json({ error: "id erforderlich" }, { status: 400 });

    // Sicherstellen, dass Karte dem User gehört
    const existing = await prisma.card.findFirst({
      where: { id, board: { OR: [{ ownerId: user.id }, { members: { some: { userId: user.id } } }] } },
    });
    if (!existing) return NextResponse.json({ error: "Karte nicht gefunden" }, { status: 404 });

    const card = await prisma.card.update({
      where: { id },
      data: {
        ...(columnId !== undefined ? { columnId } : {}),
        ...(title !== undefined ? { title: title.trim() } : {}),
        ...(description !== undefined ? { description: description?.trim() || null } : {}),
        ...(status !== undefined ? { status } : {}),
      },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json({ card });
  } catch (err) {
    return handleGuardError(err);
  }
}

// DELETE /api/kanban/cards?id=xxx
export async function DELETE(req: NextRequest) {
  try {
    const user = await requireActiveUser();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id erforderlich" }, { status: 400 });

    const existing = await prisma.card.findFirst({
      where: { id, board: { OR: [{ ownerId: user.id }, { members: { some: { userId: user.id } } }] } },
    });
    if (!existing) return NextResponse.json({ error: "Karte nicht gefunden" }, { status: 404 });

    await prisma.card.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleGuardError(err);
  }
}
