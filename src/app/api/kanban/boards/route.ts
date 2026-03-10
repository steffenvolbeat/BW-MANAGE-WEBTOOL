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

export async function POST(req: NextRequest) {
  try {
    const user = await requireActiveUser();
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
