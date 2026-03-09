import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database";
import { handleGuardError, requireActiveUser } from "@/lib/security/guard";

export const revalidate = 0;

async function assertMembership(userId: string, boardId: string) {
  const board = await prisma.board.findFirst({
    where: {
      id: boardId,
      OR: [
        { ownerId: userId },
        { members: { some: { userId } } },
      ],
    },
    select: { id: true },
  });
  if (!board) {
    const error = new Error("ACCESS_DENIED");
    (error as any).code = "ACCESS_DENIED";
    throw error;
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireActiveUser();
    const body = await req.json();
    const { boardId, cardId, action, approve } = body ?? {};

    if (!boardId || !cardId || !action) {
      return NextResponse.json({ error: "boardId, cardId, action required" }, { status: 400 });
    }

    await assertMembership(user.id, boardId);

    const card = await prisma.card.findFirst({
      where: { id: cardId, boardId },
      include: { column: { select: { title: true } } },
    });

    if (!card) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 });
    }

    const suggestion = `Nächste Aktion für "${card.title}": Kontaktieren, Status aktualisieren (${card.status}). Spalte: ${card.column.title}.`;

    if (action === "view") {
      return NextResponse.json({
        preview: suggestion,
        applyRequiresApproval: true,
      });
    }

    if (action === "apply") {
      if (!approve) {
        return NextResponse.json({ error: "Approval required" }, { status: 403 });
      }
      return NextResponse.json({
        applied: true,
        message: "Vorschlag übernommen (simuliert)",
      });
    }

    return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
  } catch (err) {
    return handleGuardError(err);
  }
}
