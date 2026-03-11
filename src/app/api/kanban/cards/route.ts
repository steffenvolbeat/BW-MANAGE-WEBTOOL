import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database";
import { requireActiveUser, handleGuardError } from "@/lib/security/guard";
import { ApplicationStatus } from "@prisma/client";

export const revalidate = 0;

// Spaltenname → ApplicationStatus
const COLUMN_TO_STATUS: Record<string, ApplicationStatus> = {
  "Offen": ApplicationStatus.APPLIED,
  "In Bearbeitung": ApplicationStatus.REVIEWED,
  "Warte auf Antwort": ApplicationStatus.REVIEWED,
  "Interview": ApplicationStatus.INTERVIEW_SCHEDULED,
  "Angebot": ApplicationStatus.OFFER_RECEIVED,
  "Abgeschlossen": ApplicationStatus.ACCEPTED,
};

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

    // Sync: Wenn Spalte geändert → Application-Status anpassen
    if (columnId !== undefined && existing.columnId !== columnId) {
      const meta = existing.metadata as { applicationId?: string } | null;
      const applicationId = meta?.applicationId;
      if (applicationId) {
        try {
          const newCol = await prisma.boardColumn.findUnique({ where: { id: columnId } });
          if (newCol) {
            const newStatus = COLUMN_TO_STATUS[newCol.title];
            if (newStatus) {
              const app = await prisma.application.findFirst({
                where: { id: applicationId, userId: user.id },
              });
              if (app) {
                await prisma.application.update({
                  where: { id: applicationId },
                  data: { status: newStatus },
                });
              }
            }
          }
        } catch (_) { /* nicht-kritisch */ }
      }
    }

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
