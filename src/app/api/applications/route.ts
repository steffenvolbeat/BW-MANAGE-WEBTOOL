import { NextResponse } from "next/server";
import { scopedPrisma } from "@/lib/security/scope";
import { prisma } from "@/lib/database";
import {
  ApplicationStatus,
  ActivityType,
  ActivityStatus,
  JobType,
  Priority,
} from "@prisma/client";
import { requireActiveUser, assertSameUser } from "@/lib/security/guard";

// Mapping: ApplicationStatus → Kanban-Spaltenname
const STATUS_TO_COLUMN: Record<string, string> = {
  APPLIED: "Offen",
  INITIATIVE: "Offen",
  OTHER: "Offen",
  REVIEWED: "In Bearbeitung",
  INTERVIEW_SCHEDULED: "Interview",
  INTERVIEWED: "Interview",
  OFFER_RECEIVED: "Angebot",
  ACCEPTED: "Abgeschlossen",
  REJECTED: "Abgeschlossen",
  WITHDRAWN: "Abgeschlossen",
};

function handleGuardError(error: unknown) {
  if ((error as any)?.code === "FORBIDDEN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}

// GET - Retrieve all applications for a user
export async function GET(request: Request) {
  try {
    const user = await requireActiveUser().catch(() => null);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const db = scopedPrisma(user.id);

    const { searchParams } = new URL(request.url);
    const requestedUserId = searchParams.get("userId");
    assertSameUser(requestedUserId, user.id);

    const applications = await db.application.findMany({
      where: {},
      include: {
        documents: true,
        activities: true,
      },
      orderBy: { appliedAt: "desc" },
    });

    return NextResponse.json({ applications });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "";
    if (msg === "UNAUTHORIZED" || msg === "INACTIVE") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if ((error as any)?.code === "FORBIDDEN" || msg === "FORBIDDEN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    console.error("Error fetching applications:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create new application
export async function POST(request: Request) {
  try {
    const user = await requireActiveUser().catch(() => null);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const db = scopedPrisma(user.id);

    const data = await request.json();

    const {
      companyName,
      position,
      description,
      salary,
      location,
      contactEmail,
      contactPhone,
      applicationDeadline,
      jobUrl,
      status = ApplicationStatus.APPLIED,
      jobType = JobType.FULLTIME,
      priority = Priority.MEDIUM,
      requirements: requirementsInput = "",
    } = data;

    if (!companyName || !position) {
      return NextResponse.json(
        { error: "Company name and position are required" },
        { status: 400 }
      );
    }

    const application = await db.application.create({
      data: {
        companyName,
        position,
        location: location || "Unbekannt",
        street: data.street || null,
        zip: data.zip || null,
        country: data.country || "Deutschland",
        state: data.state || null,
        isInland: data.isInland !== undefined ? data.isInland : true,
        salary,
        jobUrl,
        companyUrl: data.companyUrl || null,
        status,
        jobType,
        priority,
        appliedAt: data.appliedAt ? new Date(data.appliedAt) : new Date(),
        notesText: description || data.notesText || "",
        requirements: requirementsInput || "",
      },
      include: {
        documents: true,
        activities: true,
        events: true,
      },
    });

    // Aktivität automatisch erstellen
    try {
      await db.activity.create({
        data: {
          type: ActivityType.APPLICATION_SUBMITTED,
          title: `Bewerbung bei ${companyName} eingereicht`,
          description: `Position: ${position}`,
          relatedEntity: "application",
          relatedId: application.id,
          applicationId: application.id,
          status: ActivityStatus.COMPLETED,
          metadata: { company: companyName, position },
        },
      });
    } catch (_) { /* nicht-kritisch */ }

    // Kanban-Sync: Karte im ersten Board des Users erstellen
    try {
      const firstBoard = await prisma.board.findFirst({
        where: { ownerId: user.id },
        include: { columns: { orderBy: { position: "asc" } } },
      });
      if (firstBoard) {
        const targetTitle = STATUS_TO_COLUMN[status] ?? "Offen";
        const col = firstBoard.columns.find((c) => c.title === targetTitle) ?? firstBoard.columns[0];
        if (col) {
          await prisma.card.create({
            data: {
              boardId: firstBoard.id,
              columnId: col.id,
              title: `${companyName} – ${position}`,
              description: location || null,
              status: "open",
              metadata: { applicationId: application.id },
            },
          });
        }
      }
    } catch (_) { /* nicht-kritisch */ }

    return NextResponse.json(application, { status: 201 });
  } catch (error) {
    const guardResponse = handleGuardError(error);
    if (guardResponse) return guardResponse;
    console.error("Error creating application:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT - Update application
export async function PUT(request: Request) {
  try {
    const user = await requireActiveUser().catch(() => null);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const db = scopedPrisma(user.id);

    const data = await request.json();
    const { id, userId, ...updateData } = data;

    if (!id) {
      return NextResponse.json(
        { error: "Application ID is required" },
        { status: 400 }
      );
    }

    assertSameUser(userId, user.id);

    // Verify the application belongs to the user
    const existingApplication = await db.application.findFirst({
      where: { id },
    });

    if (!existingApplication) {
      return NextResponse.json(
        { error: "Application not found or access denied" },
        { status: 404 }
      );
    }

    // Map legacy status values
    if (updateData.status === "PLANNED") {
      updateData.status = ApplicationStatus.INTERVIEW_SCHEDULED;
    }

    // Convert date strings to Date objects if provided
    if (updateData.applicationDeadline) {
      updateData.applicationDeadline = new Date(updateData.applicationDeadline);
    }
    if (updateData.appliedAt) {
      updateData.appliedAt = new Date(updateData.appliedAt);
    }

    // Validate enum fields to avoid 500 from invalid values
    if (updateData.status) {
      const allowed = Object.values(ApplicationStatus);
      if (!allowed.includes(updateData.status)) {
        console.error("Invalid status", updateData.status, "allowed", allowed);
        return NextResponse.json(
          { error: "Invalid status value", received: updateData.status, allowed },
          { status: 400 }
        );
      }
    }

    if (updateData.jobType) {
      const allowed = Object.values(JobType);
      if (!allowed.includes(updateData.jobType)) {
        console.error("Invalid jobType", updateData.jobType, "allowed", allowed);
        return NextResponse.json(
          { error: "Invalid job type value", received: updateData.jobType, allowed },
          { status: 400 }
        );
      }
    }

    if (updateData.priority) {
      const allowed = Object.values(Priority);
      if (!allowed.includes(updateData.priority)) {
        console.error("Invalid priority", updateData.priority, "allowed", allowed);
        return NextResponse.json(
          { error: "Invalid priority value", received: updateData.priority, allowed },
          { status: 400 }
        );
      }
    }

    if (updateData.requirements === undefined) {
      // keep existing if not provided
      delete updateData.requirements;
    }

    const updatedApplication = await db.application.update({
      where: { id },
      data: updateData,
      include: {
        documents: true,
        activities: true,
        events: true,
      },
    });

    // Kanban-Sync: Karte verschieben wenn Status geändert
    if (updateData.status && existingApplication.status !== updateData.status) {
      try {
        const linkedCard = await prisma.card.findFirst({
          where: {
            board: { ownerId: user.id },
            metadata: { path: ["applicationId"], equals: id },
          },
          include: { board: { include: { columns: { orderBy: { position: "asc" } } } } },
        });
        if (linkedCard) {
          const targetTitle = STATUS_TO_COLUMN[updateData.status] ?? "Offen";
          const targetCol = linkedCard.board.columns.find((c) => c.title === targetTitle);
          if (targetCol && targetCol.id !== linkedCard.columnId) {
            await prisma.card.update({
              where: { id: linkedCard.id },
              data: { columnId: targetCol.id },
            });
          }
        }
      } catch (_) { /* nicht-kritisch */ }
    }

    // Aktivität bei Status-Änderung schreiben
    if (updateData.status && existingApplication.status !== updateData.status) {
      const statusLabels: Record<string, string> = {
        APPLIED: "Beworben", INITIATIVE: "Initiativbewerbung",
        REVIEWED: "Geprüft", INTERVIEW_SCHEDULED: "Interview geplant",
        INTERVIEWED: "Interview geführt", OFFER_RECEIVED: "Angebot erhalten",
        ACCEPTED: "Angenommen", REJECTED: "Abgelehnt",
        WITHDRAWN: "Zurückgezogen", OTHER: "Sonstiges",
      };
      try {
        await db.activity.create({
          data: {
            type: ActivityType.STATUS_CHANGED,
            title: `Status geändert: ${existingApplication.companyName}`,
            description: `${statusLabels[existingApplication.status] ?? existingApplication.status} → ${statusLabels[updateData.status] ?? updateData.status}`,
            relatedEntity: "application",
            relatedId: id,
            applicationId: id,
            status: ActivityStatus.COMPLETED,
            metadata: {
              company: existingApplication.companyName,
              position: existingApplication.position,
              oldStatus: existingApplication.status,
              newStatus: updateData.status,
            },
          },
        });
      } catch (_) { /* nicht-kritisch */ }
    }

    return NextResponse.json(updatedApplication);
  } catch (error) {
    const guardResponse = handleGuardError(error);
    if (guardResponse) return guardResponse;
    console.error("Error updating application:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Delete application
export async function DELETE(request: Request) {
  try {
    const user = await requireActiveUser().catch(() => null);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const db = scopedPrisma(user.id);

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const userId = searchParams.get("userId");

    if (!id) {
      return NextResponse.json(
        { error: "Application ID is required" },
        { status: 400 }
      );
    }

    assertSameUser(userId, user.id);

    // Verify the application belongs to the user
    const existingApplication = await db.application.findFirst({
      where: { id },
    });

    if (!existingApplication) {
      return NextResponse.json(
        { error: "Application not found or access denied" },
        { status: 404 }
      );
    }

    await db.application.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const guardResponse = handleGuardError(error);
    if (guardResponse) return guardResponse;
    console.error("Error deleting application:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
