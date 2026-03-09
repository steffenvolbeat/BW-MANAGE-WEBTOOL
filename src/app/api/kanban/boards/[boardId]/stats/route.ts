import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database";
import { requireActiveUser, handleGuardError } from "@/lib/security/guard";

export const revalidate = 0;

const DEFAULT_K = 5;
const DEFAULT_EPSILON = 1.0;

function laplaceNoise(scale: number) {
  const u = Math.random() - 0.5;
  return -scale * Math.sign(u) * Math.log(1 - 2 * Math.abs(u));
}

export async function GET(_req: NextRequest, context: { params: Promise<{ boardId: string }> }) {
  try {
    const user = await requireActiveUser();
    const { boardId } = await context.params;

    const board = await prisma.board.findFirst({
      where: {
        id: boardId,
        OR: [
          { ownerId: user.id },
          { members: { some: { userId: user.id } } },
        ],
      },
      include: {
        columns: {
          select: { id: true },
        },
        cards: {
          select: { id: true, columnId: true, status: true },
        },
      },
    });

    if (!board) {
      return NextResponse.json({ error: "Board not found" }, { status: 404 });
    }

    const k = DEFAULT_K;
    const epsilon = DEFAULT_EPSILON;
    const total = board.cards.length;

    if (total < k) {
      return NextResponse.json({
        status: "blocked",
        reason: `k-anonymity not met (k=${k})`,
        total,
      }, { status: 200 });
    }

    const countsByColumn: Record<string, number> = {};
    for (const card of board.cards) {
      countsByColumn[card.columnId] = (countsByColumn[card.columnId] ?? 0) + 1;
    }

    const noisyCounts = Object.entries(countsByColumn).map(([colId, count]) => ({
      columnId: colId,
      noisyCount: Math.max(0, Math.round(count + laplaceNoise(1 / epsilon))),
    }));


    return NextResponse.json({
      status: "ok",
      k,
      epsilon,
      total,
      noisyCounts,
    });
  } catch (err) {
    return handleGuardError(err);
  }
}
