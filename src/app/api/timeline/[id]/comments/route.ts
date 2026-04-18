import { NextRequest, NextResponse } from "next/server";
import { requireActiveUser, handleGuardError } from "@/lib/security/guard";
import { prisma } from "@/lib/database";
import { enforceRateLimit } from "@/lib/security/rateLimit";

// GET /api/timeline/[id]/comments — Kommentare laden
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let user;
  try {
    user = await requireActiveUser();
  } catch (err) {
    return handleGuardError(err);
  }

  const { id } = await params;

  // Prüfe Ownership des Timeline-Eintrags
  const entry = await prisma.applicationTimeline.findFirst({
    where: { id, userId: user.id },
    select: { id: true },
  });
  if (!entry) {
    return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
  }

  const comments = await prisma.timelineComment.findMany({
    where: { timelineId: id },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      content: true,
      createdAt: true,
      user: { select: { name: true, email: true } },
    },
  });

  return NextResponse.json(comments);
}

// POST /api/timeline/[id]/comments — Kommentar erstellen
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let user;
  try {
    user = await requireActiveUser();
  } catch (err) {
    return handleGuardError(err);
  }

  try {
    await enforceRateLimit(req, "timeline-comments", { max: 60, windowMs: 60 * 60 * 1000 });
  } catch {
    return NextResponse.json({ error: "Zu viele Anfragen" }, { status: 429 });
  }

  const { id } = await params;
  const body = await req.json();
  const content = (body.content ?? "").toString().trim().slice(0, 2000);

  if (!content) {
    return NextResponse.json({ error: "Inhalt fehlt" }, { status: 400 });
  }

  const entry = await prisma.applicationTimeline.findFirst({
    where: { id, userId: user.id },
    select: { id: true },
  });
  if (!entry) {
    return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
  }

  const comment = await prisma.timelineComment.create({
    data: { timelineId: id, userId: user.id, content },
    select: {
      id: true,
      content: true,
      createdAt: true,
      user: { select: { name: true, email: true } },
    },
  });

  return NextResponse.json(comment, { status: 201 });
}
