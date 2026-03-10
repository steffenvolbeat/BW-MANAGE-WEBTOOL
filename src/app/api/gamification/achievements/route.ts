/**
 * Achievements API
 * GET  /api/gamification/achievements  → Liste aller Achievements des Users
 * POST /api/gamification/achievements  → Achievement prüfen/vergeben
 */
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/currentUser";
import { prisma } from "@/lib/database";

const ACHIEVEMENT_DEFINITIONS = [
  { type: "FIRST_APPLICATION", title: "Erste Bewerbung", description: "Du hast deine erste Bewerbung eingereicht!", icon: "🚀", xp: 50 },
  { type: "TEN_APPLICATIONS", title: "Fleißig bewerben", description: "10 Bewerbungen eingereicht!", icon: "📨", xp: 100 },
  { type: "FIFTY_APPLICATIONS", title: "Power-Bewerber", description: "50 Bewerbungen eingereicht!", icon: "💪", xp: 500 },
  { type: "FIRST_INTERVIEW", title: "Erstes Interview", description: "Zu einem Interview eingeladen!", icon: "🎯", xp: 200 },
  { type: "FIRST_OFFER", title: "Angebot erhalten!", description: "Du hast dein erstes Jobangebot erhalten!", icon: "🎉", xp: 1000 },
  { type: "PROFILE_COMPLETE", title: "Vollständiges Profil", description: "Profil vollständig ausgefüllt!", icon: "✅", xp: 75 },
  { type: "FIRST_CONTACT", title: "Erster Kontakt", description: "Ersten Kontakt im Netzwerk hinzugefügt!", icon: "🤝", xp: 30 },
  { type: "FIVE_CONTACTS", title: "Netzwerker", description: "5 Kontakte hinzugefügt!", icon: "👥", xp: 80 },
  { type: "FIRST_NOTE", title: "Erste Notiz", description: "Erste Notiz erstellt!", icon: "📝", xp: 20 },
  { type: "FIRST_INTERVIEW_SESSION", title: "Interview-Training", description: "Erstes KI-Interview-Training absolviert!", icon: "🎤", xp: 150 },
  { type: "MOOD_TRACKER_7", title: "Stimmungs-Held", description: "7 Tage Stimmung getrackt!", icon: "😊", xp: 100 },
  { type: "FIRST_DOCUMENT", title: "Erster Lebenslauf", description: "Erstes Dokument hochgeladen!", icon: "📄", xp: 40 },
];

export async function GET() {
  try {
    const user = await getCurrentUser();

    const unlocked = await prisma.achievement.findMany({
      where: { userId: user.id },
      orderBy: { unlockedAt: "desc" },
    });

    const totalXP = unlocked.reduce((sum, a) => sum + a.xp, 0);
    const unlockedTypes = new Set(unlocked.map((a) => a.type));
    const allAchievements = ACHIEVEMENT_DEFINITIONS.map((def) => ({
      ...def,
      unlocked: unlockedTypes.has(def.type),
      unlockedAt: unlocked.find((u) => u.type === def.type)?.unlockedAt ?? null,
    }));

    return NextResponse.json({ achievements: allAchievements, totalXP, unlockedCount: unlocked.length });
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
    const { type } = await req.json();

    const def = ACHIEVEMENT_DEFINITIONS.find((d) => d.type === type);
    if (!def) return NextResponse.json({ error: "Unbekanntes Achievement" }, { status: 400 });

    const existing = await prisma.achievement.findUnique({
      where: { userId_type: { userId: user.id, type } },
    });
    if (existing) return NextResponse.json({ alreadyUnlocked: true, achievement: existing });

    const achievement = await prisma.achievement.create({
      data: { userId: user.id, type, title: def.title, description: def.description, icon: def.icon, xp: def.xp },
    });

    return NextResponse.json({ newlyUnlocked: true, achievement }, { status: 201 });
  } catch (e: unknown) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
    }
    return NextResponse.json({ error: "Fehler" }, { status: 500 });
  }
}
