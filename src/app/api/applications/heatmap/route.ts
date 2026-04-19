/**
 * GET /api/applications/heatmap
 * Gibt Daten für die Bewerbungs-Heatmap zurück:
 * - calendarData: Bewerbungen pro Tag (letztes Jahr)
 * - statusBreakdown: Gesamtverteilung nach Status
 * - locations: Top-Bewerbungsorte
 * - maxStreak: Längste zusammenhängende Bewerbungsphase
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database";
import { requireActiveUser, resolveTargetUserId, handleGuardError } from "@/lib/security/guard";

export async function GET(request: NextRequest) {
  try {
    const user = await requireActiveUser().catch(() => null);
    if (!user)
      return NextResponse.json(
        { error: "Nicht authentifiziert" },
        { status: 401 }
      );

    const { searchParams } = new URL(request.url);
    const viewAs = searchParams.get("viewAs");

    let targetUserId: string;
    try { targetUserId = await resolveTargetUserId(viewAs); }
    catch { return NextResponse.json({ error: "Forbidden" }, { status: 403 }); }

    const now = new Date();
    const oneYearAgo = new Date(now);
    oneYearAgo.setFullYear(now.getFullYear() - 1);

    const [recent, allApps] = await Promise.all([
      prisma.application.findMany({
        where: { userId: targetUserId, appliedAt: { gte: oneYearAgo } },
        select: { appliedAt: true, status: true, location: true, country: true },
        orderBy: { appliedAt: "asc" },
      }),
      prisma.application.findMany({
        where: { userId: targetUserId },
        select: { status: true, location: true, country: true },
      }),
    ]);

    // ── Calendar data: Bewerbungen pro Tag ──────────────────────────────
    const dateMap = new Map<string, number>();
    for (const app of recent) {
      const d = app.appliedAt.toISOString().split("T")[0];
      dateMap.set(d, (dateMap.get(d) ?? 0) + 1);
    }
    const calendarData = Array.from(dateMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // ── Status-Breakdown ────────────────────────────────────────────────
    const statusMap = new Map<string, number>();
    for (const app of allApps) {
      statusMap.set(app.status, (statusMap.get(app.status) ?? 0) + 1);
    }
    const statusBreakdown = Array.from(statusMap.entries())
      .map(([status, count]) => ({ status, count }))
      .sort((a, b) => b.count - a.count);

    // ── Top-Standorte ───────────────────────────────────────────────────
    const locMap = new Map<
      string,
      { location: string; country: string; count: number }
    >();
    for (const app of allApps) {
      const key = `${app.location}||${app.country}`;
      if (locMap.has(key)) {
        locMap.get(key)!.count++;
      } else {
        locMap.set(key, {
          location: app.location,
          country: app.country,
          count: 1,
        });
      }
    }
    const locations = Array.from(locMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);

    // ── Längster Streak ─────────────────────────────────────────────────
    let maxStreak = 0;
    let currentStreak = 0;
    let prevDate: string | null = null;
    for (const { date } of calendarData) {
      if (prevDate) {
        const diff =
          (new Date(date).getTime() - new Date(prevDate).getTime()) /
          86_400_000;
        if (diff === 1) {
          currentStreak++;
        } else {
          maxStreak = Math.max(maxStreak, currentStreak);
          currentStreak = 1;
        }
      } else {
        currentStreak = 1;
      }
      prevDate = date;
    }
    maxStreak = Math.max(maxStreak, currentStreak);

    return NextResponse.json({
      calendarData,
      statusBreakdown,
      locations,
      total: allApps.length,
      last365: recent.length,
      maxStreak,
    });
  } catch (err) {
    console.error("heatmap GET error:", err);
    return NextResponse.json({ error: "Interner Fehler" }, { status: 500 });
  }
}
