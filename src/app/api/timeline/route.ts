import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database";
import { scopedPrisma } from "@/lib/security/scope";
import { requireActiveUser } from "@/lib/security/guard";
import { handleGuardError } from "@/lib/security/guard";
import { enforceRateLimit } from "@/lib/security/rateLimit";
import { TimelineEntryType } from "@prisma/client";

// GET /api/timeline?applicationId=...
export async function GET(req: NextRequest) {
  try {
    const user = await requireActiveUser();
    const { searchParams } = new URL(req.url);
    const applicationId = searchParams.get("applicationId");

    if (!applicationId) {
      return NextResponse.json({ error: "applicationId erforderlich" }, { status: 400 });
    }

    // Verify ownership of application
    const db = scopedPrisma(user.id);
    const application = await db.application.findFirst({
      where: { id: applicationId },
    });
    if (!application) {
      return NextResponse.json({ error: "Bewerbung nicht gefunden" }, { status: 404 });
    }

    const entries = await prisma.applicationTimeline.findMany({
      where: { applicationId, userId: user.id },
      orderBy: { date: "desc" },
    });

    return NextResponse.json(entries);
  } catch (err) {
    return handleGuardError(err);
  }
}

// POST /api/timeline
export async function POST(req: NextRequest) {
  try {
    await enforceRateLimit(req, "timeline:create", { max: 120, windowMs: 60 * 60_000 });
    const user = await requireActiveUser();
    const body = await req.json();
    const { applicationId, type, title, content, status, itBereich, week, date, noteId, coverId, eventId, activityId } = body;

    if (!applicationId || typeof applicationId !== "string") {
      return NextResponse.json({ error: "applicationId erforderlich" }, { status: 400 });
    }
    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return NextResponse.json({ error: "Titel erforderlich" }, { status: 400 });
    }
    const validTypes = Object.values(TimelineEntryType);
    const entryType: TimelineEntryType =
      validTypes.includes(type) ? (type as TimelineEntryType) : TimelineEntryType.MANUAL;

    // Verify ownership of application
    const db = scopedPrisma(user.id);
    const application = await db.application.findFirst({
      where: { id: applicationId },
    });
    if (!application) {
      return NextResponse.json({ error: "Bewerbung nicht gefunden" }, { status: 404 });
    }

    const entry = await prisma.applicationTimeline.create({
      data: {
        applicationId,
        userId: user.id,
        type: entryType,
        title: title.trim(),
        content: typeof content === "string" ? content.trim() : undefined,
        status: typeof status === "string" ? status : undefined,
        itBereich: typeof itBereich === "string" ? itBereich.trim() : undefined,
        week: typeof week === "number" ? week : undefined,
        date: date ? new Date(date) : new Date(),
        noteId: typeof noteId === "string" ? noteId : undefined,
        coverId: typeof coverId === "string" ? coverId : undefined,
        eventId: typeof eventId === "string" ? eventId : undefined,
        activityId: typeof activityId === "string" ? activityId : undefined,
      },
    });

    return NextResponse.json(entry, { status: 201 });
  } catch (err) {
    return handleGuardError(err);
  }
}
