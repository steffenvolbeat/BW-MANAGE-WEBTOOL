/**
 * Stimmungs-Barometer API
 * GET  /api/mood         → letzte 30 Einträge + Auswertung
 * POST /api/mood         → neuen Eintrag speichern
 */
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/currentUser";
import { prisma } from "@/lib/database";
import { enforceRateLimit } from "@/lib/security/rateLimit";

export async function GET() {
  try {
    const user = await getCurrentUser();

    const entries = await prisma.moodEntry.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 30,
    });

    const avg = entries.length
      ? {
          mood: entries.reduce((s, e) => s + e.mood, 0) / entries.length,
          energy: entries.reduce((s, e) => s + e.energy, 0) / entries.length,
          stress: entries.reduce((s, e) => s + e.stress, 0) / entries.length,
        }
      : null;

    // Burnout-Warnung: Stress > 4 + Energy < 2 mindestens 3x in den letzten 7 Einträgen
    const last7 = entries.slice(0, 7);
    const burnoutWarning = last7.filter((e) => e.stress >= 4 && e.energy <= 2).length >= 3;

    return NextResponse.json({ entries, averages: avg, burnoutWarning, count: entries.length });
  } catch (e: unknown) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
    }
    return NextResponse.json({ error: "Fehler" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const rl = enforceRateLimit(req, "mood:create", { max: 20, windowMs: 60_000 });
    if (rl) return rl;

    const user = await getCurrentUser();
    const { mood, energy, stress, note } = await req.json();

    if (
      typeof mood !== "number" || mood < 1 || mood > 5 ||
      typeof energy !== "number" || energy < 1 || energy > 5 ||
      typeof stress !== "number" || stress < 1 || stress > 5
    ) {
      return NextResponse.json({ error: "Ungültige Werte (1-5 erforderlich)" }, { status: 400 });
    }

    if (note !== undefined && note !== null) {
      if (typeof note !== "string" || note.length > 1000) {
        return NextResponse.json({ error: "Notiz darf maximal 1000 Zeichen haben" }, { status: 400 });
      }
    }

    const entry = await prisma.moodEntry.create({
      data: { userId: user.id, mood, energy, stress, note: note ?? null },
    });

    return NextResponse.json({ entry }, { status: 201 });
  } catch (e: unknown) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
    }
    return NextResponse.json({ error: "Fehler" }, { status: 500 });
  }
}
