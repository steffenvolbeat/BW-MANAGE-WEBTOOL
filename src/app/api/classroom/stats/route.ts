import { NextResponse } from "next/server";
import { scopedPrisma } from "@/lib/security/scope";
import { requireActiveUser } from "@/lib/security/guard";
import { ApplicationStatus } from "@prisma/client";

type AppRow = {
  id: string;
  companyName: string;
  position: string;
  status: ApplicationStatus;
  appliedAt: Date;
  responseAt: Date | null;
  jobUrl: string | null;
};

// DCI Kurs-Startdatum: Woche 1 beginnt am Montag der aktuellen Kurswoche.
// Wir berechnen die Bewerbungen pro Kalenderwoche relativ zum Kurs-Start.
// Falls kein courseStart übergeben wird, nutzen wir die ersten 8 Wochen rückwärts.

export async function GET(request: Request) {
  try {
    const user = await requireActiveUser().catch(() => null);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const db = scopedPrisma(user.id);

    // Alle Bewerbungen laden
    const applications = await db.application.findMany({
      select: {
        id: true,
        companyName: true,
        position: true,
        status: true,
        appliedAt: true,
        responseAt: true,
        jobUrl: true,
      },
      orderBy: { appliedAt: "asc" },
    });

    if (applications.length === 0) {
      return NextResponse.json({ weekStats: [], total: 0, applications: [] });
    }

    // Kurs-Start = Datum der ersten Bewerbung (Montag der entsprechenden Woche)
    const firstDate = new Date(applications[0].appliedAt);
    // Montag der Woche von firstDate
    const dayOfWeek = firstDate.getDay(); // 0=So, 1=Mo, ...
    const diffToMonday = (dayOfWeek === 0 ? -6 : 1 - dayOfWeek);
    const courseStart = new Date(firstDate);
    courseStart.setDate(firstDate.getDate() + diffToMonday);
    courseStart.setHours(0, 0, 0, 0);

    // 12 Wochen Statistiken aufbauen
    const weekStats = Array.from({ length: 12 }, (_, i) => {
      const weekStart = new Date(courseStart);
      weekStart.setDate(courseStart.getDate() + i * 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7);

      const weekApps = (applications as AppRow[]).filter((a) => {
        const d = new Date(a.appliedAt);
        return d >= weekStart && d < weekEnd;
      });

      const targets: Record<number, number> = {
        1: 7, 2: 15, 3: 20, 4: 10, 5: 10,
        6: 15, 7: 20, 8: 15, 9: 10, 10: 10, 11: 15, 12: 10,
      };

      return {
        week: i + 1,
        weekStart: weekStart.toISOString().split("T")[0],
        weekEnd: weekEnd.toISOString().split("T")[0],
        count: weekApps.length,
        target: targets[i + 1] ?? 10,
        statuses: {
          applied: weekApps.filter((a) => a.status === "APPLIED" || a.status === "INITIATIVE" || a.status === "OTHER").length,
          interview: weekApps.filter((a) => a.status === "INTERVIEW_SCHEDULED" || a.status === "INTERVIEWED").length,
          offer: weekApps.filter((a) => a.status === "OFFER_RECEIVED" || a.status === "ACCEPTED").length,
          rejected: weekApps.filter((a) => a.status === "REJECTED").length,
        },
        applications: weekApps.map((a) => ({
          id: a.id,
          company: a.companyName,
          position: a.position,
          status: a.status,
          appliedAt: a.appliedAt,
        })),
      };
    });

    // Gesamtstatistiken
    const typed = applications as AppRow[];
    const total = typed.length;
    const totalInterviews = typed.filter(
      (a) => a.status === "INTERVIEW_SCHEDULED" || a.status === "INTERVIEWED"
    ).length;
    const totalOffers = typed.filter(
      (a) => a.status === "OFFER_RECEIVED" || a.status === "ACCEPTED"
    ).length;
    const totalRejected = typed.filter((a) => a.status === "REJECTED").length;

    return NextResponse.json({
      courseStart: courseStart.toISOString().split("T")[0],
      weekStats,
      total,
      totalInterviews,
      totalOffers,
      totalRejected,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "";
    if (msg === "UNAUTHORIZED" || msg === "INACTIVE") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Classroom stats error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
