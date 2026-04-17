import { NextResponse } from "next/server";
import { scopedPrisma } from "@/lib/security/scope";
import { requireActiveUser, assertSameUser } from "@/lib/security/guard";

function handleGuardError(error: unknown) {
  if ((error as any)?.code === "FORBIDDEN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}

// GET - Retrieve all events for a user
export async function GET(request: Request) {
  try {
    const user = await requireActiveUser().catch(() => null);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const db = scopedPrisma(user.id);

    const { searchParams } = new URL(request.url);
    const userIdParam = searchParams.get("userId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    assertSameUser(userIdParam, user.id);

    const whereClause: any = { userId: user.id };

    // Filter by date range if provided
    if (startDate || endDate) {
      whereClause.date = {};

      if (startDate) {
        const parsed = new Date(startDate);
        if (isNaN(parsed.getTime())) return NextResponse.json({ error: "Invalid startDate" }, { status: 400 });
        whereClause.date.gte = parsed;
      }

      if (endDate) {
        const parsed = new Date(endDate);
        if (isNaN(parsed.getTime())) return NextResponse.json({ error: "Invalid endDate" }, { status: 400 });
        whereClause.date.lte = parsed;
      }
    }

    const events = await db.event.findMany({
      where: whereClause,
      include: {
        application: true,
      },
      orderBy: { date: "asc" },
    });

    return NextResponse.json(events);
  } catch (error) {
    const guardResponse = handleGuardError(error);
    if (guardResponse) return guardResponse;
    console.error("Error fetching events:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create new event
export async function POST(request: Request) {
  try {
    const user = await requireActiveUser().catch(() => null);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const db = scopedPrisma(user.id);

    const data = await request.json();

    const {
      userId,
      applicationId,
      title,
      description,
      type,
      date,
      time,
      duration,
      location,
      company,
      notes,
    } = data;

    assertSameUser(userId, user.id);

    if (!title || !type || !date) {
      return NextResponse.json(
        { error: "Title, type and date are required" },
        { status: 400 }
      );
    }

    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      return NextResponse.json({ error: "Invalid date" }, { status: 400 });
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

    const event = await db.event.create({
      data: {
        applicationId,
        title,
        company: company || null,
        type,
        date: parsedDate,
        time: time || "",
        duration: duration ?? null,
        location,
        notes: notes || description || null,
      },
      include: {
        application: true,
      },
    });

    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    const guardResponse = handleGuardError(error);
    if (guardResponse) return guardResponse;
    console.error("Error creating event:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT - Update event
export async function PUT(request: Request) {
  try {
    const user = await requireActiveUser().catch(() => null);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const db = scopedPrisma(user.id);

    const data = await request.json();
    const { id, userId, ...updateData } = data;

    if (!id) {
      return NextResponse.json(
        { error: "Event ID is required" },
        { status: 400 }
      );
    }

    assertSameUser(userId, user.id);

    // Verify the event belongs to the user
    const existingEvent = await db.event.findFirst({
      where: { id },
    });

    if (!existingEvent) {
      return NextResponse.json(
        { error: "Event not found or access denied" },
        { status: 404 }
      );
    }

    // Convert date strings to Date objects if provided
    if (updateData.date) {
      updateData.date = new Date(updateData.date);
    }

    const updatedEvent = await db.event.update({
      where: { id },
      data: updateData,
      include: {
        application: true,
      },
    });

    return NextResponse.json(updatedEvent);
  } catch (error) {
    const guardResponse = handleGuardError(error);
    if (guardResponse) return guardResponse;
    console.error("Error updating event:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Delete event
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
        { error: "Event ID is required" },
        { status: 400 }
      );
    }

    assertSameUser(userId, user.id);

    // Verify the event belongs to the user
    const existingEvent = await db.event.findFirst({
      where: { id },
    });

    if (!existingEvent) {
      return NextResponse.json(
        { error: "Event not found or access denied" },
        { status: 404 }
      );
    }

    await db.event.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const guardResponse = handleGuardError(error);
    if (guardResponse) return guardResponse;
    console.error("Error deleting event:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
