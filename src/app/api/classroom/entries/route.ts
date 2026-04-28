import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database";
import { requireActiveUser, handleGuardError, resolveTargetUserId, blockReadOnlyRoles } from "@/lib/security/guard";
import { enforceRateLimit } from "@/lib/security/rateLimit";
import { ClassroomEntryType } from "@prisma/client";

// GET /api/classroom/entries?week=...&day=...&type=...
export async function GET(req: NextRequest) {
  try {
    const user = await requireActiveUser();
    const { searchParams } = new URL(req.url);
    const viewAs = searchParams.get("viewAs");
    const weekParam = searchParams.get("week");
    const dayParam = searchParams.get("day");
    const typeParam = searchParams.get("type");

    let targetUserId: string;
    try { targetUserId = await resolveTargetUserId(viewAs); }
    catch { return NextResponse.json({ error: "Forbidden" }, { status: 403 }); }

    const where: Record<string, unknown> = { userId: targetUserId };
    if (weekParam !== null) {
      const w = parseInt(weekParam, 10);
      if (!isNaN(w)) where.week = w;
    }
    if (dayParam !== null) {
      const d = parseInt(dayParam, 10);
      if (!isNaN(d)) where.day = d;
    }
    if (typeParam) {
      const validTypes = Object.values(ClassroomEntryType);
      if (validTypes.includes(typeParam as ClassroomEntryType)) {
        where.type = typeParam as ClassroomEntryType;
      }
    }

    const entries = await prisma.classroomEntry.findMany({
      where,
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(entries);
  } catch (err) {
    return handleGuardError(err);
  }
}

// POST /api/classroom/entries — upsert (create or update by unique key)
export async function POST(req: NextRequest) {
  try {
    const rl = enforceRateLimit(req, "classroom:entries", { max: 240, windowMs: 60 * 60_000 });
    if (rl) return rl;
    const user = await blockReadOnlyRoles();
    const body = await req.json();
    const { week, day, type, title, content } = body;

    if (typeof week !== "number" || week < 0 || week > 12) {
      return NextResponse.json({ error: "Gültige Woche (0-12) erforderlich" }, { status: 400 });
    }
    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return NextResponse.json({ error: "Inhalt erforderlich" }, { status: 400 });
    }
    const validTypes = Object.values(ClassroomEntryType);
    if (!type || !validTypes.includes(type as ClassroomEntryType)) {
      return NextResponse.json(
        { error: `Gültiger Typ erforderlich: ${validTypes.join(", ")}` },
        { status: 400 }
      );
    }
    const dayValue = typeof day === "number" ? day : null;

    const entry = await prisma.classroomEntry.upsert({
      where: {
        userId_week_day_type: {
          userId: user.id,
          week,
          day: dayValue as number,
          type: type as ClassroomEntryType,
        },
      },
      update: {
        title: typeof title === "string" ? title.trim() : undefined,
        content: content.trim(),
      },
      create: {
        userId: user.id,
        week,
        day: dayValue,
        type: type as ClassroomEntryType,
        title: typeof title === "string" ? title.trim() : undefined,
        content: content.trim(),
      },
    });

    return NextResponse.json(entry);
  } catch (err) {
    return handleGuardError(err);
  }
}
