import { prisma } from "../database";
import { ApplicationStatus } from "@prisma/client";

export const AnalyticsService = {
  // Get application statistics for dashboard
  async getApplicationStats(userId: string) {
    const stats = await prisma.application.groupBy({
      by: ["status"],
      where: { userId },
      _count: { status: true },
    });

    const total = await prisma.application.count({
      where: { userId },
    });

    // Transform to expected format
    const result = {
      total,
      pending: 0,
      interview: 0,
      accepted: 0,
      rejected: 0,
    };

    stats.forEach(
      (stat: { status: ApplicationStatus; _count: { status: number } }) => {
        switch (stat.status) {
          case ApplicationStatus.APPLIED:
            result.pending = stat._count.status;
            break;
          case ApplicationStatus.INTERVIEW_SCHEDULED:
            result.interview = stat._count.status;
            break;
          case ApplicationStatus.ACCEPTED:
            result.accepted = stat._count.status;
            break;
          case ApplicationStatus.REJECTED:
            result.rejected = stat._count.status;
            break;
        }
      }
    );

    return result;
  },

  // Get monthly application data for charts
  async getMonthlyData(userId: string) {
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const monthlyData = await prisma.$queryRaw`
      SELECT 
        DATE_TRUNC('month', "createdAt") as month,
        COUNT(*) as applications,
        SUM(CASE WHEN status = 'ACCEPTED' THEN 1 ELSE 0 END) as accepted,
        SUM(CASE WHEN status = 'REJECTED' THEN 1 ELSE 0 END) as rejected
      FROM "Application" 
      WHERE "userId" = ${userId} 
        AND "createdAt" >= ${twelveMonthsAgo}
      GROUP BY DATE_TRUNC('month', "createdAt")
      ORDER BY month DESC
    `;

    return monthlyData;
  },

  // Get location statistics
  async getLocationStats(userId: string) {
    const locationStats = await prisma.$queryRaw`
      SELECT 
        location,
        COUNT(*) as count
      FROM "Application" 
      WHERE "userId" = ${userId} 
        AND location IS NOT NULL
      GROUP BY location
      ORDER BY count DESC
      LIMIT 10
    `;

    return locationStats;
  },

  // Get company statistics
  async getCompanyStats(userId: string) {
    const companyStats = await prisma.$queryRaw`
      SELECT 
        "companyName",
        COUNT(*) as count
      FROM "Application" 
      WHERE "userId" = ${userId}
      GROUP BY "companyName"
      ORDER BY count DESC
      LIMIT 10
    `;

    return companyStats;
  },

  // Get recent activities for dashboard
  async getRecentActivities(userId: string, limit: number = 10) {
    return prisma.activity.findMany({
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
      take: limit,
    });
  },

  // Get upcoming events for dashboard
  async getUpcomingEvents(userId: string, limit: number = 5) {
    const now = new Date();
    return prisma.event.findMany({
      where: {
        userId,
        date: { gte: now },
      },
      include: {
        application: {
          select: { companyName: true, position: true },
        },
      },
      orderBy: { date: "asc" },
      take: limit,
    });
  },

  // Get status distribution for charts
  async getStatusDistribution(userId: string) {
    const statusDistribution = await prisma.application.groupBy({
      by: ["status"],
      where: { userId },
      _count: { status: true },
    });

    return statusDistribution.map(
      (item: { status: ApplicationStatus; _count: { status: number } }) => ({
        status: item.status,
        count: item._count.status,
      })
    );
  },

  // Get comprehensive analytics data
  async getAllAnalytics(userId: string) {
    const [
      applicationStats,
      monthlyData,
      locationStats,
      companyStats,
      recentActivities,
      upcomingEvents,
      statusDistribution,
    ] = await Promise.all([
      this.getApplicationStats(userId),
      this.getMonthlyData(userId),
      this.getLocationStats(userId),
      this.getCompanyStats(userId),
      this.getRecentActivities(userId),
      this.getUpcomingEvents(userId),
      this.getStatusDistribution(userId),
    ]);

    return {
      applicationStats,
      monthlyData,
      locationStats,
      companyStats,
      recentActivities,
      upcomingEvents,
      statusDistribution,
    };
  },
};
