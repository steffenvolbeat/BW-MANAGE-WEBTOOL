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
    if (user.role === "MANAGER" || user.role === "VERMITTLER") {
      return NextResponse.json({ error: "Keine Schreibrechte" }, { status: 403 });
    }
    const { type } = await req.json();

    const def = ACHIEVEMENT_DEFINITIONS.find((d) => d.type === type);
    if (!def) return NextResponse.json({ error: "Unbekanntes Achievement" }, { status: 400 });

    // Serverseitige Voraussetzungs-Prüfung – kein Self-Service für Achievements
    const eligible = await checkAchievementEligibility(user.id, type);
    if (!eligible) {
      return NextResponse.json({ error: "Voraussetzungen nicht erfüllt" }, { status: 403 });
    }

    // Atomar via upsert – verhindert auch Race-Condition P2002
    const achievement = await prisma.achievement.upsert({
      where: { userId_type: { userId: user.id, type } },
      create: { userId: user.id, type, title: def.title, description: def.description, icon: def.icon, xp: def.xp },
      update: {},
    });

    return NextResponse.json({ newlyUnlocked: true, achievement }, { status: 201 });
  } catch (e: unknown) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
    }
    return NextResponse.json({ error: "Fehler" }, { status: 500 });
  }
}

async function checkAchievementEligibility(userId: string, type: string): Promise<boolean> {
  switch (type) {
    case "FIRST_APPLICATION": {
      const count = await prisma.application.count({ where: { userId } });
      return count >= 1;
    }
    case "TEN_APPLICATIONS": {
      const count = await prisma.application.count({ where: { userId } });
      return count >= 10;
    }
    case "FIFTY_APPLICATIONS": {
      const count = await prisma.application.count({ where: { userId } });
      return count >= 50;
    }
    case "FIRST_INTERVIEW": {
      const count = await prisma.application.count({
        where: { userId, status: { in: ["INTERVIEW_SCHEDULED", "INTERVIEWED", "OFFER_RECEIVED", "ACCEPTED"] } },
      });
      return count >= 1;
    }
    case "FIRST_OFFER": {
      const count = await prisma.application.count({
        where: { userId, status: { in: ["OFFER_RECEIVED", "ACCEPTED"] } },
      });
      return count >= 1;
    }
    case "FIRST_CONTACT": {
      const count = await prisma.contact.count({ where: { userId } });
      return count >= 1;
    }
    case "FIVE_CONTACTS": {
      const count = await prisma.contact.count({ where: { userId } });
      return count >= 5;
    }
    case "FIRST_NOTE": {
      const count = await prisma.note.count({ where: { userId } });
      return count >= 1;
    }
    case "FIRST_DOCUMENT": {
      const count = await prisma.document.count({ where: { userId } });
      return count >= 1;
    }
    case "MOOD_TRACKER_7": {
      const count = await prisma.moodEntry.count({ where: { userId } });
      return count >= 7;
    }
    case "FIRST_INTERVIEW_SESSION": {
      const count = await prisma.interviewSession.count({ where: { userId } });
      return count >= 1;
    }
    case "PROFILE_COMPLETE": {
      const u = await prisma.user.findUnique({ where: { id: userId }, select: { name: true, email: true } });
      return !!(u?.name && u?.email);
    }
    default:
      return false;
  }
}
