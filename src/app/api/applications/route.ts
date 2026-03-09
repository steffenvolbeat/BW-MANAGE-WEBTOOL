import { NextResponse } from "next/server";
import { scopedPrisma } from "@/lib/security/scope";
import {
  ApplicationStatus,
  JobType,
  Priority,
} from "@prisma/client";
import { requireActiveUser, assertSameUser } from "@/lib/security/guard";

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

    return NextResponse.json(applications);
  } catch (error) {
    const guardResponse = handleGuardError(error);
    if (guardResponse) return guardResponse;
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
        country: data.country || "Deutschland",
        salary,
        jobUrl,
        status,
        jobType,
        priority,
        notesText: description || "",
        requirements: requirementsInput || "",
      },
      include: {
        documents: true,
        activities: true,
        events: true,
      },
    });

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
