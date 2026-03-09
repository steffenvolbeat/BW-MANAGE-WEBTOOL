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
        whereClause.date.gte = new Date(startDate);
      }

      if (endDate) {
        whereClause.date.lte = new Date(endDate);
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
      contactId,
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

    const event = await db.event.create({
      data: {
        applicationId,
        title,
        company: company || null,
        type,
        date: new Date(date),
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
