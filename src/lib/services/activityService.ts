import { prisma } from "../database";
import { ActivityType, ActivityStatus } from "@prisma/client";

// Activity service functions
export interface CreateActivityData {
  userId: string;
  applicationId?: string;
  contactId?: string;
  title: string;
  description: string;
  type: ActivityType;
  relatedEntity: string;
  relatedId?: string;
  timestamp?: Date;
  status?: ActivityStatus;
  metadata?: any;
}

export const ActivityService = {
  // Get all activities for a user
  async getByUserId(userId: string) {
    return prisma.activity.findMany({
      where: { userId },
      include: {
        application: {
          select: {
            id: true,
            companyName: true,
            position: true,
            status: true,
          },
        },
        contact: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            company: true,
          },
        },
      },
      orderBy: { timestamp: "asc" },
    });
  },

  // Get activities by application
  async getByApplicationId(userId: string, applicationId: string) {
    return prisma.activity.findMany({
      where: { userId, applicationId },
      include: {
        application: true,
        contact: true,
      },
      orderBy: { timestamp: "asc" },
    });
  },

  // Get activities by contact
  async getByContactId(userId: string, contactId: string) {
    return prisma.activity.findMany({
      where: { userId, contactId },
      include: {
        application: true,
        contact: true,
      },
      orderBy: { timestamp: "asc" },
    });
  },

  // Get single activity by ID
  async getById(id: string, userId: string) {
    return prisma.activity.findFirst({
      where: { id, userId },
      include: {
        application: true,
        contact: true,
      },
    });
  },

  // Create new activity
  async create(data: CreateActivityData) {
    return prisma.activity.create({
      data,
      include: {
        application: true,
        contact: true,
      },
    });
  },

  // Update activity
  async update(id: string, userId: string, data: Partial<CreateActivityData>) {
    // Verify ownership
    const existing = await prisma.activity.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw new Error("Activity not found or access denied");
    }

    return prisma.activity.update({
      where: { id },
      data,
      include: {
        application: true,
        contact: true,
      },
    });
  },

  // Delete activity
  async delete(id: string, userId: string) {
    // Verify ownership
    const existing = await prisma.activity.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw new Error("Activity not found or access denied");
    }

    return prisma.activity.delete({
      where: { id },
    });
  },

  // Mark activity as completed
  async complete(id: string, userId: string) {
    return this.update(id, userId, {
      status: ActivityStatus.COMPLETED,
      timestamp: new Date(),
    });
  },

  // Get pending activities (not completed)
  async getPending(userId: string) {
    return prisma.activity.findMany({
      where: {
        userId,
        status: { not: ActivityStatus.COMPLETED },
      },
      include: {
        application: {
          select: {
            id: true,
            companyName: true,
            position: true,
            status: true,
          },
        },
        contact: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            company: true,
          },
        },
      },
      orderBy: { timestamp: "asc" },
    });
  },

  // Get overdue activities
  async getOverdue(userId: string) {
    const now = new Date();
    return prisma.activity.findMany({
      where: {
        userId,
        status: { not: ActivityStatus.COMPLETED },
        timestamp: { lt: now },
      },
      include: {
        application: true,
        contact: true,
      },
      orderBy: { timestamp: "asc" },
    });
  },
};
