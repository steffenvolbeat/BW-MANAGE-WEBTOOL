import { NextResponse } from "next/server";
import { requireActiveUser, handleGuardError } from "@/lib/security/guard";
import { prisma } from "@/lib/database";

/**
 * NOTIZ-SUCHE
 *
 * GET /api/notes/search?q=suchbegriff
 * Gibt Notizen zurück, deren Titel oder Inhalt den Suchbegriff enthalten.
 */

export async function GET(request: Request) {
  let user;
  try {
    user = await requireActiveUser();
  } catch (err) {
    return handleGuardError(err);
  }

  const url = new URL(request.url);
  const query = (url.searchParams.get("q") ?? "").trim();

  if (!query) {
    return NextResponse.json({ error: "Suchbegriff fehlt (Parameter ?q=...)" }, { status: 400 });
  }

  try {
    const notes = await prisma.note.findMany({
      where: {
        userId: user.id,
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { content: { contains: query, mode: "insensitive" } },
          { tags: { has: query } },
        ],
      },
      select: { id: true, title: true, category: true, tags: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
      take: 50,
    });

    return NextResponse.json({ notes });
  } catch (error) {
    console.error("Notes search error:", error);
    return NextResponse.json({ error: "Suche fehlgeschlagen" }, { status: 500 });
  }
}
