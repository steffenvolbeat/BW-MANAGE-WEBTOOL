import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database";
import { requireActiveUser, handleGuardError } from "@/lib/security/guard";

export const revalidate = 0;

export async function GET(_req: NextRequest) {
  try {
    const user = await requireActiveUser();

    const boards = await prisma.board.findMany({
      where: {
        OR: [
          { ownerId: user.id },
          { members: { some: { userId: user.id } } },
        ],
      },
      orderBy: { createdAt: "asc" },
      include: {
        columns: {
          orderBy: { position: "asc" },
          include: {
            cards: {
              orderBy: { createdAt: "desc" },
              take: 100,
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
