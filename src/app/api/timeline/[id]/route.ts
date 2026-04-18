import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database";
import { requireActiveUser } from "@/lib/security/guard";
import { handleGuardError } from "@/lib/security/guard";
import { TimelineEntryType } from "@prisma/client";

// PUT /api/timeline/[id]
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireActiveUser();
    const { id } = await params;
    const body = await req.json();
    const { title, content, status, itBereich, week, date, type } = body;

    // Verify ownership
    const existing = await prisma.applicationTimeline.findFirst({
      where: { id, userId: user.id },
    });
    if (!existing) {
      return NextResponse.json({ error: "Eintrag nicht gefunden" }, { status: 404 });
    }

    const validTypes = Object.values(TimelineEntryType);
    const entryType: TimelineEntryType =
      type && validTypes.includes(type) ? (type as TimelineEntryType) : existing.type;

    const updated = await prisma.applicationTimeline.update({
      where: { id },
      data: {
        ...(title && typeof title === "string" ? { title: title.trim() } : {}),
        ...(typeof content === "string" ? { content: content.trim() } : {}),
        ...(typeof status === "string" ? { status } : {}),
        ...(typeof itBereich === "string" ? { itBereich: itBereich.trim() } : {}),
        ...(typeof week === "number" ? { week } : {}),
        ...(date ? { date: new Date(date) } : {}),
        type: entryType,
      },
    });

    return NextResponse.json(updated);
  } catch (err) {
    return handleGuardError(err);
  }
}

// DELETE /api/timeline/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireActiveUser();
    const { id } = await params;

    // Verify ownership
    const existing = await prisma.applicationTimeline.findFirst({
      where: { id, userId: user.id },
    });
    if (!existing) {
      return NextResponse.json({ error: "Eintrag nicht gefunden" }, { status: 404 });
    }

    await prisma.applicationTimeline.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleGuardError(err);
  }
}
