import { NextResponse } from "next/server";
import { scopedPrisma } from "@/lib/security/scope";
import { prisma } from "@/lib/database";
import {
  ActivityStatus,
  Priority,
} from "@prisma/client";
import { requireActiveUser, assertSameUser, resolveTargetUserId, blockReadOnlyRoles, isReadOnlyRole, handleGuardError } from "@/lib/security/guard";

// GET - Retrieve all activities (MANAGER/VERMITTLER via ?viewAs=<userId>)
export async function GET(request: Request) {
  try {
    const user = await requireActiveUser().catch(() => null);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const viewAs = searchParams.get("viewAs");
    const applicationId = searchParams.get("applicationId");
    const contactId = searchParams.get("contactId");

    let targetUserId: string;
    try { targetUserId = await resolveTargetUserId(viewAs); }
    catch { return NextResponse.json({ error: "Forbidden" }, { status: 403 }); }

    if (!isReadOnlyRole(user.role)) {
      assertSameUser(searchParams.get("userId"), user.id);
    }

    const db = scopedPrisma(targetUserId);
    const whereClause: any = { userId: targetUserId };
    if (applicationId) whereClause.applicationId = applicationId;
    if (contactId) whereClause.contactId = contactId;

    const activities = await db.activity.findMany({
      where: whereClause,
      include: { application: true, contact: true },
      orderBy: { timestamp: "asc" },
    });

    return NextResponse.json(activities);
  } catch (error) {
    const guardResponse = handleGuardError(error);
    if (guardResponse) return guardResponse;
    console.error("Error fetching activities:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST - Create new activity (MANAGER/VERMITTLER: 403 Forbidden)
export async function POST(request: Request) {
  try {
    let user: Awaited<ReturnType<typeof blockReadOnlyRoles>>;
    try { user = await blockReadOnlyRoles(); } catch (e) { return handleGuardError(e); }
    const db = scopedPrisma(user.id);

    const data = await request.json();

    const {
      applicationId,
      contactId,
      title,
      description,
      type,
      dueDate,
      completedAt,
      status = ActivityStatus.PENDING,
      priority = Priority.MEDIUM,
    } = data;

    if (!title || !type) {
      return NextResponse.json(
        { error: "Title and type are required" },
        { status: 400 }
      );
    }

    // Verify applicationId belongs to user if provided
    if (applicationId) {
      const application = await db.application.findFirst({
        where: { id: applicationId },
      });

      if (!application) {
        return NextResponse.json(
          { error: "Application not found or access denied" },
          { status: 404 }
        );
      }
    }

    // Verify contactId belongs to user if provided
    if (contactId) {
      const contact = await db.contact.findFirst({
        where: { id: contactId },
      });

      if (!contact) {
        return NextResponse.json(
          { error: "Contact not found or access denied" },
          { status: 404 }
        );
      }
    }

    const activity = await db.activity.create({
      data: {
        applicationId,
        contactId,
        title,
        description,
        type,
        relatedEntity: applicationId
          ? "application"
          : contactId
          ? "contact"
          : "general",
        relatedId: applicationId || contactId,
        timestamp: dueDate ? new Date(dueDate) : new Date(),
        status,
        metadata: completedAt ? { completedAt } : undefined,
      },
      include: {
        application: true,
        contact: true,
      },
    });

    // Timeline-Eintrag: Aktivität einer Bewerbung zugeordnet
    if (applicationId) {
      try {
        await prisma.applicationTimeline.create({
          data: {
            applicationId,
            userId: user.id,
            type: "ACTIVITY",
            title: `Aktivität: ${title}`,
            content: description || null,
            activityId: activity.id,
          },
        });
      } catch (_) { /* nicht-kritisch */ }
    }

    return NextResponse.json(activity, { status: 201 });
  } catch (error) {
    const guardResponse = handleGuardError(error);
    if (guardResponse) return guardResponse;
    console.error("Error creating activity:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT - Update activity (MANAGER/VERMITTLER: 403 Forbidden)
export async function PUT(request: Request) {
  try {
    let user: Awaited<ReturnType<typeof blockReadOnlyRoles>>;
    try { user = await blockReadOnlyRoles(); } catch (e) { return handleGuardError(e); }
    const db = scopedPrisma(user.id);

    const data = await request.json();
    const { id, userId, ...raw } = data;

    if (!id) {
      return NextResponse.json(
        { error: "Activity ID is required" },
        { status: 400 }
      );
    }

    assertSameUser(userId, user.id);

    // Verify the activity belongs to the user
    const existingActivity = await db.activity.findFirst({
      where: { id },
    });

    if (!existingActivity) {
      return NextResponse.json(
        { error: "Activity not found or access denied" },
        { status: 404 }
      );
    }

    // Validate date fields
    let parsedDueDate: Date | undefined;
    if (raw.dueDate !== undefined) {
      parsedDueDate = new Date(raw.dueDate);
      if (isNaN(parsedDueDate.getTime())) {
        return NextResponse.json({ error: "Ungültiges dueDate-Format." }, { status: 400 });
      }
    }
    let parsedCompletedAt: Date | undefined;
    if (raw.completedAt !== undefined) {
      parsedCompletedAt = new Date(raw.completedAt);
      if (isNaN(parsedCompletedAt.getTime())) {
        return NextResponse.json({ error: "Ungültiges completedAt-Format." }, { status: 400 });
      }
    }

    // Validate relation ownership if provided
    if (raw.applicationId !== undefined && raw.applicationId !== null) {
      const app = await db.application.findFirst({ where: { id: raw.applicationId } });
      if (!app) return NextResponse.json({ error: "Application not found or access denied" }, { status: 404 });
    }
    if (raw.contactId !== undefined && raw.contactId !== null) {
      const cnt = await db.contact.findFirst({ where: { id: raw.contactId } });
      if (!cnt) return NextResponse.json({ error: "Contact not found or access denied" }, { status: 404 });
    }

    // Whitelist: only allow explicitly permitted fields
    const VALID_STATUSES = Object.values(ActivityStatus) as string[];
    const VALID_PRIORITIES = Object.values(Priority) as string[];

    const allowedUpdate: Record<string, unknown> = {
      ...(raw.title      !== undefined && { title: String(raw.title).slice(0, 255) }),
      ...(raw.description !== undefined && { description: raw.description }),
      ...(raw.type       !== undefined && { type: raw.type }),
      ...(parsedDueDate  !== undefined && { timestamp: parsedDueDate }),
      ...(parsedCompletedAt !== undefined && { metadata: { completedAt: parsedCompletedAt.toISOString() } }),
      ...(raw.applicationId !== undefined && { applicationId: raw.applicationId }),
      ...(raw.contactId     !== undefined && { contactId: raw.contactId }),
      ...(raw.status !== undefined && VALID_STATUSES.includes(raw.status as string) && { status: raw.status as ActivityStatus }),
      ...(raw.priority !== undefined && VALID_PRIORITIES.includes(raw.priority as string) && { priority: raw.priority as Priority }),
    };

    const updatedActivity = await db.activity.update({
      where: { id },
      data: allowedUpdate,
      include: {
        application: true,
        contact: true,
      },
    });

    return NextResponse.json(updatedActivity);
  } catch (error) {
    const guardResponse = handleGuardError(error);
    if (guardResponse) return guardResponse;
    console.error("Error updating activity:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Delete activity (MANAGER/VERMITTLER: 403 Forbidden)
export async function DELETE(request: Request) {
  try {
    let user: Awaited<ReturnType<typeof blockReadOnlyRoles>>;
    try { user = await blockReadOnlyRoles(); } catch (e) { return handleGuardError(e); }
    const db = scopedPrisma(user.id);

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const userId = searchParams.get("userId");

    if (!id) {
      return NextResponse.json(
        { error: "Activity ID is required" },
        { status: 400 }
      );
    }

    assertSameUser(userId, user.id);

    // Verify the activity belongs to the user
    const existingActivity = await db.activity.findFirst({
      where: { id },
    });

    if (!existingActivity) {
      return NextResponse.json(
        { error: "Activity not found or access denied" },
        { status: 404 }
      );
    }

    await db.activity.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const guardResponse = handleGuardError(error);
    if (guardResponse) return guardResponse;
    console.error("Error deleting activity:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
