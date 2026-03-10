/**
 * Mentoring-Marktplatz API
 * GET  /api/mentoring         → Alle verfügbaren Mentoren
 * POST /api/mentoring         → Mentor-Profil erstellen/aktualisieren
 */
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/currentUser";
import { prisma } from "@/lib/database";

export async function GET() {
  try {
    const user = await getCurrentUser();

    const mentors = await prisma.mentorProfile.findMany({
      where: { isAvailable: true, userId: { not: user.id } },
      include: {
        user: { select: { name: true, avatarUrl: true } },
      },
      orderBy: { rating: "desc" },
    });

    const myProfile = await prisma.mentorProfile.findUnique({
      where: { userId: user.id },
    });

    return NextResponse.json({ mentors, myProfile });
  } catch (e: unknown) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
    }
    return NextResponse.json({ error: "Fehler" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const { headline, bio, skills, industries, hourlyRate, isAvailable } = await req.json();

    if (!headline || !bio) {
      return NextResponse.json({ error: "Headline und Bio erforderlich" }, { status: 400 });
    }

    const profile = await prisma.mentorProfile.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        headline,
        bio,
        skills: skills ?? [],
        industries: industries ?? [],
        hourlyRate: hourlyRate ?? null,
        isAvailable: isAvailable ?? true,
      },
      update: {
        headline,
        bio,
        skills: skills ?? [],
        industries: industries ?? [],
        hourlyRate: hourlyRate ?? null,
        isAvailable: isAvailable ?? true,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ profile }, { status: 201 });
  } catch (e: unknown) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
    }
    return NextResponse.json({ error: "Fehler" }, { status: 500 });
  }
}
