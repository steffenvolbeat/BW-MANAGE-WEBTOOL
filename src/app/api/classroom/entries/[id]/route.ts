import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database";
import { blockReadOnlyRoles } from "@/lib/security/guard";
import { handleGuardError } from "@/lib/security/guard";

// DELETE /api/classroom/entries/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await blockReadOnlyRoles();
    const { id } = await params;

    const existing = await prisma.classroomEntry.findFirst({
      where: { id, userId: user.id },
    });
    if (!existing) {
      return NextResponse.json({ error: "Eintrag nicht gefunden" }, { status: 404 });
    }

    await prisma.classroomEntry.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleGuardError(err);
  }
}

// PUT /api/classroom/entries/[id]
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await blockReadOnlyRoles();
    const { id } = await params;
    const body = await req.json();
    const { title, content } = body;

    const existing = await prisma.classroomEntry.findFirst({
      where: { id, userId: user.id },
    });
    if (!existing) {
      return NextResponse.json({ error: "Eintrag nicht gefunden" }, { status: 404 });
    }

    const updated = await prisma.classroomEntry.update({
      where: { id },
      data: {
        ...(typeof title === "string" ? { title: title.trim() } : {}),
        ...(typeof content === "string" && content.trim().length > 0
          ? { content: content.trim() }
          : {}),
      },
    });

    return NextResponse.json(updated);
  } catch (err) {
    return handleGuardError(err);
  }
}
