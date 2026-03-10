/**
 * Follow-up [id] API
 * PATCH /api/follow-ups/[id]  → als erledigt markieren oder updaten
 * DELETE /api/follow-ups/[id] → löschen
 */
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/currentUser";
import { prisma } from "@/lib/database";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    const { id } = await params;
    const body = await req.json();

    const existing = await prisma.followUp.findFirst({ where: { id, userId: user.id } });
    if (!existing) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });

    const updated = await prisma.followUp.update({
      where: { id },
      data: {
        isDone: body.isDone ?? existing.isDone,
        sentAt: body.isDone ? new Date() : existing.sentAt,
        subject: body.subject ?? existing.subject,
        aiDraft: body.aiDraft ?? existing.aiDraft,
      },
    });

    return NextResponse.json({ followUp: updated });
  } catch (e: unknown) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
    }
    return NextResponse.json({ error: "Fehler" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    const { id } = await params;

    const existing = await prisma.followUp.findFirst({ where: { id, userId: user.id } });
    if (!existing) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });

    await prisma.followUp.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
    }
    return NextResponse.json({ error: "Fehler" }, { status: 500 });
  }
}
