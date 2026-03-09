import { NextResponse } from "next/server";
import { requireAdmin, handleGuardError } from "@/lib/security/guard";
import { scopedPrisma } from "@/lib/security/scope";
import {
  applyDifferentialPrivacy,
  DP_DEFAULT_CONFIG,
  privatizeCount,
} from "@/lib/analytics/differential";

/**
 * GET /api/admin/analytics/differential
 *
 * Gibt ε-DP-geschützte Aggregate zurück – statistisch korrekt,
 * aber keine Rückschlüsse auf einzelne Nutzer möglich.
 *
 * Query-Parameter:
 *  epsilon   – Datenschutzbudget (Standard: 0.3, Min: 0.05, Max: 2.0)
 *  aggregate – "global" (Admin) | "own" (Nutzer)
 */
export async function GET(request: Request) {
  let user;
  try {
    user = await requireAdmin();
  } catch (err) {
    return handleGuardError(err);
  }

  const url = new URL(request.url);
  const epsilonRaw = parseFloat(url.searchParams.get("epsilon") ?? "0.3");
  const epsilon = Math.min(Math.max(epsilonRaw, 0.05), 2.0);
  const aggregate = url.searchParams.get("aggregate") ?? "own";

  // Globale Aggregate: requireAdmin() hat bereits sichergestellt dass user ADMIN ist
  try {
    const db = scopedPrisma(user.id);
    const whereClause =
      aggregate === "global" ? {} : { userId: user.id };

    const applications = await db.raw.application.findMany({
      where: whereClause as any,
      select: {
        status: true,
        appliedAt: true,
        responseAt: true,
        location: true,
      },
    });

    if (applications.length === 0) {
      return NextResponse.json({
        totalApplications: 0,
        statusDistribution: {},
        avgResponseDays: 0,
        interviewRate: 0,
        offerRate: 0,
        dp: { ...DP_DEFAULT_CONFIG, epsilon },
      });
    }

    // Rohdaten berechnen
    const statusDist: Record<string, number> = {};
    let totalResponseDays = 0;
    let withResponse = 0;

    for (const app of applications) {
      statusDist[app.status] = (statusDist[app.status] ?? 0) + 1;
      if (app.responseAt) {
        const days =
          (new Date(app.responseAt).getTime() - new Date(app.appliedAt).getTime()) /
          86400000;
        totalResponseDays += days;
        withResponse++;
      }
    }

    const total = applications.length;
    const INTERVIEW_STATUSES = new Set([
      "INTERVIEW_SCHEDULED", "INTERVIEWED", "OFFER_RECEIVED", "ACCEPTED",
    ]);
    const OFFER_STATUSES = new Set(["OFFER_RECEIVED", "ACCEPTED"]);

    const interviews = applications.filter((a) =>
      INTERVIEW_STATUSES.has(a.status)
    ).length;

    const offers = applications.filter((a) =>
      OFFER_STATUSES.has(a.status)
    ).length;

    // Durchschnittliche Interviews pro Monat
    const avgInterviewsPerMonth = (() => {
      if (applications.length === 0) return 0;
      const byMonth: Record<string, number> = {};
      for (const app of applications) {
        if (!INTERVIEW_STATUSES.has(app.status)) continue;
        const key = new Date(app.appliedAt).toISOString().slice(0, 7);
        byMonth[key] = (byMonth[key] ?? 0) + 1;
      }
      const months = Object.keys(byMonth).length || 1;
      const totalInterviews = Object.values(byMonth).reduce((a, b) => a + b, 0);
      return totalInterviews / months;
    })();

    // Konvertierungen zwischen Statusstufen
    const conversion = {
      appliedToInterview: total > 0 ? interviews / total : 0,
      interviewToOffer: interviews > 0 ? offers / interviews : 0,
      offerToAccept:
        offers > 0
          ? applications.filter((a) => a.status === "ACCEPTED").length / offers
          : 0,
    };

    const raw = {
      totalApplications: total,
      statusDistribution: statusDist,
      avgResponseDays: withResponse > 0 ? totalResponseDays / withResponse : 0,
      interviewRate: interviews / total,
      offerRate: offers / total,
      avgInterviewsPerMonth,
      conversion,
    };

    // ε-Differential Privacy anwenden
    const dpResult = applyDifferentialPrivacy(raw, { ...DP_DEFAULT_CONFIG, epsilon });

    // Interview-/Offer-Rate pro Standort (Top 10), differenziell privat
    const locations = await db.raw.$queryRaw<
      { location: string; total: number; interviews: number; offers: number }[]
    >`
      SELECT
        "location",
        COUNT(*)::int as total,
        SUM(CASE WHEN status IN ('INTERVIEW_SCHEDULED','INTERVIEWED','OFFER_RECEIVED','ACCEPTED') THEN 1 ELSE 0 END)::int as interviews,
        SUM(CASE WHEN status IN ('OFFER_RECEIVED','ACCEPTED') THEN 1 ELSE 0 END)::int as offers
      FROM "applications"
      WHERE (${aggregate === "global"} OR "userId" = ${user.id})
        AND "location" IS NOT NULL
      GROUP BY "location"
      ORDER BY total DESC
      LIMIT 10
    `;

    const perLocationEpsilon = epsilon / Math.max(locations.length || 1, 1);
    const locationRates = locations.map((loc) => {
      const totalPriv = privatizeCount(loc.total, perLocationEpsilon);
      const interviewsPriv = privatizeCount(loc.interviews, perLocationEpsilon);
      const offersPriv = privatizeCount(loc.offers, perLocationEpsilon);
      const safeTotal = Math.max(totalPriv, 1);
      return {
        location: loc.location,
        total: totalPriv,
        interviewRate: Math.min(1, Math.max(0, interviewsPriv / safeTotal)),
        offerRate: Math.min(1, Math.max(0, offersPriv / safeTotal)),
      };
    });

    return NextResponse.json({
      ...dpResult,
      locationRates,
      aggregate,
      sampleSize: aggregate === "global" ? `≥1` : undefined, // kein exact count leaken
    });
  } catch (err) {
    console.error("DP analytics error:", err);
    return NextResponse.json({ error: "Fehler bei DP-Analytics" }, { status: 500 });
  }
}
