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

// Feste Kurs-Daten: Woche 0 = 09.02.2026, Woche 1 = 16.02.2026

const fmtDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export async function GET() {
  try {
    const user = await requireActiveUser().catch(() => null);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const db = scopedPrisma(user.id);

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

    // Festes Kurs-Startdatum: Woche 0 beginnt am 09.02.2026
    const courseStart = new Date(2026, 1, 9); // Feb = Monat 1 (0-indexiert)
    courseStart.setHours(0, 0, 0, 0);

    const targets: Record<number, number> = {
      0: 0, 1: 7, 2: 15, 3: 20, 4: 10, 5: 10,
      6: 15, 7: 20, 8: 15, 9: 10, 10: 10, 11: 15, 12: 10,
    };

    // 13 Wochen: W0 (09.02) bis W12
    const weekStats = Array.from({ length: 13 }, (_, i) => {
      const weekStart = new Date(courseStart);
      weekStart.setDate(courseStart.getDate() + i * 7);
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7);
      weekEnd.setHours(0, 0, 0, 0);

      const weekApps = (applications as AppRow[]).filter((a) => {
        const d = new Date(a.appliedAt);
        return d >= weekStart && d < weekEnd;
      });

      // Tages-Statistiken Mo–So
      const dailyStats = Array.from({ length: 7 }, (_, d) => {
        const dayStart = new Date(weekStart);
        dayStart.setDate(weekStart.getDate() + d);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(dayStart);
        dayEnd.setDate(dayStart.getDate() + 1);

        const apps = weekApps.filter((a) => {
          const at = new Date(a.appliedAt);
          return at >= dayStart && at < dayEnd;
        });

        return {
          date: fmtDate(dayStart),
          count: apps.length,
          statuses: {
            applied: apps.filter((a) => a.status === "APPLIED" || a.status === "INITIATIVE" || a.status === "OTHER").length,
            interview: apps.filter((a) => a.status === "INTERVIEW_SCHEDULED" || a.status === "INTERVIEWED").length,
            offer: apps.filter((a) => a.status === "OFFER_RECEIVED" || a.status === "ACCEPTED").length,
            rejected: apps.filter((a) => a.status === "REJECTED").length,
          },
        };
      });

      return {
        week: i, // 0 = Woche 0, 1 = Woche 1, …
        weekStart: fmtDate(weekStart),
        weekEnd: fmtDate(weekEnd),
        count: weekApps.length,
        target: targets[i] ?? 10,
        statuses: {
          applied: weekApps.filter((a) => a.status === "APPLIED" || a.status === "INITIATIVE" || a.status === "OTHER").length,
          interview: weekApps.filter((a) => a.status === "INTERVIEW_SCHEDULED" || a.status === "INTERVIEWED").length,
          offer: weekApps.filter((a) => a.status === "OFFER_RECEIVED" || a.status === "ACCEPTED").length,
          rejected: weekApps.filter((a) => a.status === "REJECTED").length,
        },
        dailyStats,
        applications: weekApps.map((a) => ({
          id: a.id,
          company: a.companyName,
          position: a.position,
          status: a.status,
          appliedAt: a.appliedAt,
        })),
      };
    });

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
      courseStart: "2026-02-09",
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
