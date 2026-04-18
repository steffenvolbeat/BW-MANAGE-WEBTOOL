import { NextRequest, NextResponse } from "next/server";
import { requireActiveUser, handleGuardError } from "@/lib/security/guard";
import { prisma } from "@/lib/database";
import { enforceRateLimit } from "@/lib/security/rateLimit";

// POST /api/timeline/share — Share-Link erstellen
export async function POST(req: NextRequest) {
  let user;
  try {
    user = await requireActiveUser();
  } catch (err) {
    return handleGuardError(err);
  }

  try {
    await enforceRateLimit(req, "timeline-share", { max: 20, windowMs: 60 * 60 * 1000 });
  } catch {
    return NextResponse.json({ error: "Zu viele Anfragen" }, { status: 429 });
  }

  const body = await req.json().catch(() => ({}));
  const companyFilter = body.companyFilter?.toString().trim().slice(0, 200) || null;
  const typeFilter = body.typeFilter?.toString().trim().slice(0, 50) || null;

  const share = await prisma.timelineShare.create({
    data: { userId: user.id, companyFilter, typeFilter },
    select: { token: true, createdAt: true },
  });

  return NextResponse.json({ token: share.token, url: `/timeline/share/${share.token}` });
}

// GET /api/timeline/share?token=XYZ — Öffentlicher Share abrufen
export async function GET(req: NextRequest) {
  const token = new URL(req.url).searchParams.get("token");
  if (!token) {
    return NextResponse.json({ error: "Token fehlt" }, { status: 400 });
  }

  const share = await prisma.timelineShare.findUnique({
    where: { token },
    select: { userId: true, companyFilter: true, typeFilter: true, expiresAt: true },
  });

  if (!share) {
    return NextResponse.json({ error: "Share nicht gefunden" }, { status: 404 });
  }

  if (share.expiresAt && new Date() > share.expiresAt) {
    return NextResponse.json({ error: "Share abgelaufen" }, { status: 410 });
  }

  const where: Record<string, unknown> = { userId: share.userId };
  if (share.typeFilter) where.type = share.typeFilter;
  const companyFilter = share.companyFilter ?? null;

  const allEntries = await prisma.applicationTimeline.findMany({
    where,
    orderBy: { date: "desc" },
    take: 300,
    include: {
      application: {
        select: { companyName: true, position: true, status: true },
      },
    },
  });

  const entries = companyFilter
    ? allEntries.filter((e) => e.application.companyName.toLowerCase().includes(companyFilter.toLowerCase()))
    : allEntries;

  return NextResponse.json({ entries, companyFilter: share.companyFilter, typeFilter: share.typeFilter });
}
