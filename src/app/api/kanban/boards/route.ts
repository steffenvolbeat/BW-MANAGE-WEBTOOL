import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database";
import { requireActiveUser, handleGuardError, resolveTargetUserId, blockReadOnlyRoles, isReadOnlyRole } from "@/lib/security/guard";

export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const user = await requireActiveUser();
    const { searchParams } = new URL(req.url);
    const viewAs = searchParams.get("viewAs");

    let targetUserId: string;
    try { targetUserId = await resolveTargetUserId(viewAs); }
    catch { return NextResponse.json({ error: "Forbidden" }, { status: 403 }); }

    const boardQuery = isReadOnlyRole(user.role)
      ? { ownerId: targetUserId }
      : { OR: [{ ownerId: targetUserId }, { members: { some: { userId: targetUserId } } }] };

    const boards = await prisma.board.findMany({
      where: boardQuery,
      orderBy: { createdAt: "asc" },
      include: {
        columns: {
          orderBy: { position: "asc" },
          include: {
            cards: {
              orderBy: { createdAt: "desc" },
              take: 500,
              include: {
                assignee: { select: { id: true, name: true, email: true } },
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ boards });
  } catch (err) {
    return handleGuardError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await blockReadOnlyRoles();
    const { name } = await req.json();
    if (!name?.trim()) {
      return NextResponse.json({ error: "Name erforderlich" }, { status: 400 });
    }

    const DEFAULT_COLUMNS = [
      "Offen",
      "In Bearbeitung",
      "Warte auf Antwort",
      "Interview",
      "Angebot",
      "Abgeschlossen",
    ];

    const board = await prisma.board.create({
      data: {
        name: name.trim(),
        ownerId: user.id,
        columns: {
          create: DEFAULT_COLUMNS.map((title, position) => ({ title, position })),
        },
      },
      include: {
        columns: {
          orderBy: { position: "asc" },
          include: { cards: true },
        },
      },
    });

    return NextResponse.json({ board }, { status: 201 });
  } catch (err) {
    return handleGuardError(err);
  }
}

// DELETE /api/kanban/boards?id=xxx — Board löschen (nur Owner)
export async function DELETE(req: NextRequest) {
  try {
    const user = await blockReadOnlyRoles();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id erforderlich" }, { status: 400 });

    const board = await prisma.board.findFirst({
      where: { id, ownerId: user.id },
    });
    if (!board) return NextResponse.json({ error: "Board nicht gefunden oder kein Zugriff" }, { status: 404 });

    // Cascade löscht Columns + Cards automatisch (via Prisma schema onDelete: Cascade)
    await prisma.board.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleGuardError(err);
  }
}
