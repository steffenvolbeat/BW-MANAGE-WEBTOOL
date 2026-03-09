import { prisma } from "@/lib/database";
import type {
  Application,
  ApplicationStatus,
  JobType,
  Priority,
} from "@prisma/client";

export const applicationService = {
  // Get all applications for a user
  async getAll(userId: string) {
    return prisma.application.findMany({
      where: { userId },
      include: {
        documents: true,
        activities: true,
        events: true,
      },
      orderBy: { appliedAt: "desc" },
    });
  },

  // Get application by ID
  async getById(id: string, userId: string) {
    return prisma.application.findFirst({
      where: { id, userId },
      include: {
        documents: true,
        activities: true,
        events: true,
      },
    });
  },

  // Create new application
  async create(data: any) {
    return prisma.application.create({
      data,
      include: {
        documents: true,
        activities: true,
        events: true,
      },
    });
  },

  // Update application
  async update(id: string, userId: string, data: any) {
    // Verify ownership
    const existing = await prisma.application.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw new Error("Application not found or access denied");
    }

    return prisma.application.update({
      where: { id },
      data,
      include: {
        documents: true,
        activities: true,
        events: true,
      },
    });
  },

  // Delete application
  async delete(id: string, userId: string) {
    // Verify ownership
    const existing = await prisma.application.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw new Error("Application not found or access denied");
    }

    return prisma.application.delete({
      where: { id },
    });
  },

  // Get applications by status
  async getByStatus(userId: string, status: ApplicationStatus) {
    return prisma.application.findMany({
      where: { userId, status },
      include: {
        documents: true,
        activities: true,
        events: true,
      },
      orderBy: { appliedAt: "desc" },
    });
  },

  // Get applications statistics
  async getStats(userId: string) {
    const total = await prisma.application.count({
      where: { userId },
    });

    const pending = await prisma.application.count({
      where: { userId, status: "APPLIED" },
    });

    const interviews = await prisma.application.count({
      where: { userId, status: "INTERVIEWED" },
    });

    const offers = await prisma.application.count({
      where: { userId, status: "OFFER_RECEIVED" },
    });

    const rejections = await prisma.application.count({
      where: { userId, status: "REJECTED" },
    });

    return {
      total,
      pending,
      interviews,
      offers,
      rejections,
    };
  },

  // Get recent applications
  async getRecent(userId: string, limit = 5) {
    return prisma.application.findMany({
      where: { userId },
      include: {
        documents: true,
        activities: true,
        events: true,
      },
      orderBy: { appliedAt: "desc" },
      take: limit,
    });
  },
};

export default applicationService;
