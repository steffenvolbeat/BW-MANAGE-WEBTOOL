import { NextResponse } from "next/server";
import { requireActiveUser, handleGuardError } from "@/lib/security/guard";
import { scopedPrisma } from "@/lib/security/scope";
import { ApplicationStatus } from "@prisma/client";

// GET - Analytics endpoint for dashboard reports
// SECURITY: userId wird AUSSCHLIESSLICH aus der authentifizierten Session gelesen,
// niemals aus Query-Params (verhindert IDOR / Cross-User Data Leakage).
export async function GET(request: Request) {
  let user;
  try {
    user = await requireActiveUser();
  } catch (err) {
    return handleGuardError(err);
  }

  try {
  } catch (err) {
    return handleGuardError(err);
  }

  try {
    const userId = user.id; // NEVER from query params
    const db = scopedPrisma(userId);

    const now = new Date();
    const twelveMonthsAgo = new Date(now);
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const [
      allApplications,
      statusDistribution,
      recentActivities,
      upcomingEvents,
    ] = await Promise.all([
      db.raw.application.findMany({ where: { userId } }),
      db.raw.application.groupBy({
        by: ["status"],
        where: { userId },
        _count: true,
      }),
      db.raw.activity.findMany({
        where: { userId },
        include: {
          application: {
            select: { companyName: true, position: true },
          },
          contact: {
            select: { firstName: true, lastName: true },
          },
        },
        orderBy: { timestamp: "desc" },
        take: 10,
      }),
      db.raw.event.findMany({
        where: { userId, date: { gte: now } },
        include: {
          application: {
            select: { companyName: true, position: true },
          },
        },
        orderBy: { date: "asc" },
        take: 5,
      }),
    ]);

    const totalApplications = allApplications.length;
    const pendingApplications = allApplications.filter(
      (a) => a.status === ApplicationStatus.APPLIED
    ).length;
    const rejectedApplications = allApplications.filter(
      (a) => a.status === ApplicationStatus.REJECTED
    ).length;
    const acceptedApplications = allApplications.filter(
      (a) => a.status === ApplicationStatus.ACCEPTED
    ).length;
    const interviewApplications = allApplications.filter(
      (a) => a.status === ApplicationStatus.INTERVIEW_SCHEDULED
    ).length;

    let monthlyData: unknown[] = [];
    let locationStats: unknown[] = [];
    let companyStats: unknown[] = [];

    try {
      monthlyData = await db.raw.$queryRaw`
        SELECT 
          DATE_TRUNC('month', "appliedAt") as month,
          COUNT(*)::int as applications,
          SUM(CASE WHEN status = 'ACCEPTED' THEN 1 ELSE 0 END)::int as accepted,
          SUM(CASE WHEN status = 'REJECTED' THEN 1 ELSE 0 END)::int as rejected
        FROM "applications" 
        WHERE "userId" = ${userId} 
          AND "appliedAt" >= ${twelveMonthsAgo}
        GROUP BY DATE_TRUNC('month', "appliedAt")
        ORDER BY month DESC
      `;
    } catch (err) {
      console.error("Analytics monthlyData query failed", err);
      monthlyData = [];
    }

    try {
      locationStats = await db.raw.$queryRaw`
        SELECT 
          "location",
          COUNT(*)::int as count
        FROM "applications" 
        WHERE "userId" = ${userId} 
          AND "location" IS NOT NULL
        GROUP BY "location"
        ORDER BY count DESC
        LIMIT 10
      `;
    } catch (err) {
      console.error("Analytics locationStats query failed", err);
      locationStats = [];
    }

    try {
      companyStats = await db.raw.$queryRaw`
        SELECT 
          "companyName",
          COUNT(*)::int as count
        FROM "applications" 
        WHERE "userId" = ${userId}
        GROUP BY "companyName"
        ORDER BY count DESC
        LIMIT 10
      `;
    } catch (err) {
      console.error("Analytics companyStats query failed", err);
      companyStats = [];
    }

    return NextResponse.json({
      applicationStats: {
        total: totalApplications,
        pending: pendingApplications,
        rejected: rejectedApplications,
        accepted: acceptedApplications,
        interview: interviewApplications,
      },
      monthlyData,
      locationStats,
      companyStats,
      recentActivities,
      upcomingEvents,
      statusDistribution: statusDistribution.map((item) => ({
        status: item.status,
        count: item._count,
      })),
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
