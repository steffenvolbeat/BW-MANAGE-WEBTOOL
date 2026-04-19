import { NextResponse } from "next/server";
import { scopedPrisma } from "@/lib/security/scope";
import {
  requireActiveUser,
  assertSameUser,
  resolveTargetUserId,
  blockReadOnlyRoles,
  isReadOnlyRole,
  handleGuardError,
} from "@/lib/security/guard";

// GET - Retrieve all events (MANAGER/VERMITTLER via ?viewAs=<userId>)
export async function GET(request: Request) {
  try {
    const user = await requireActiveUser().catch(() => null);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const viewAs = searchParams.get("viewAs");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    let targetUserId: string;
    try { targetUserId = await resolveTargetUserId(viewAs); }
    catch { return NextResponse.json({ error: "Forbidden" }, { status: 403 }); }

    if (!isReadOnlyRole(user.role)) {
      assertSameUser(searchParams.get("userId"), user.id);
    }

    const whereClause: Record<string, unknown> = { userId: targetUserId };
    if (startDate || endDate) {
      const dateFilter: Record<string, Date> = {};
      if (startDate) {
        const p = new Date(startDate);
        if (isNaN(p.getTime())) return NextResponse.json({ error: "Invalid startDate" }, { status: 400 });
        dateFilter.gte = p;
      }
      if (endDate) {
        const p = new Date(endDate);
        if (isNaN(p.getTime())) return NextResponse.json({ error: "Invalid endDate" }, { status: 400 });
        dateFilter.lte = p;
      }
      whereClause.date = dateFilter;
    }

    const db = scopedPrisma(targetUserId);
    const events = await db.event.findMany({
      where: whereClause,
      include: { application: true },
      orderBy: { date: "asc" },
    });

    return NextResponse.json(events);
  } catch (error) {
    return handleGuardError(error);
  }
}

// POST - Create new event (MANAGER/VERMITTLER blockiert)
export async function POST(request: Request) {
  try {
    let user;
    try { user = await blockReadOnlyRoles(); }
    catch (err) { return handleGuardError(err); }
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

    if (applicationId) {
      const application = await db.application.findFirst({ where: { id: applicationId } });
      if (!application) {
        return NextResponse.json({ error: "Application not found or access denied" }, { status: 404 });
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
      include: { application: true },
    });

    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    return handleGuardError(error);
  }
}

// PUT - Update event (MANAGER/VERMITTLER blockiert)
export async function PUT(request: Request) {
  try {
    let user;
    try { user = await blockReadOnlyRoles(); }
    catch (err) { return handleGuardError(err); }
    const db = scopedPrisma(user.id);

    const data = await request.json();
    const { id, userId, ...updateData } = data;

    if (!id) {
      return NextResponse.json({ error: "Event ID is required" }, { status: 400 });
    }

    assertSameUser(userId, user.id);

    const existingEvent = await db.event.findFirst({ where: { id } });
    if (!existingEvent) {
      return NextResponse.json({ error: "Event not found or access denied" }, { status: 404 });
    }

    if (updateData.date) updateData.date = new Date(updateData.date);

    const updatedEvent = await db.event.update({
      where: { id },
      data: updateData,
      include: { application: true },
    });

    return NextResponse.json(updatedEvent);
  } catch (error) {
    return handleGuardError(error);
  }
}

// DELETE - Delete event (MANAGER/VERMITTLER blockiert)
export async function DELETE(request: Request) {
  try {
    let user;
    try { user = await blockReadOnlyRoles(); }
    catch (err) { return handleGuardError(err); }
    const db = scopedPrisma(user.id);

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const userId = searchParams.get("userId");

    if (!id) {
      return NextResponse.json({ error: "Event ID is required" }, { status: 400 });
    }

    assertSameUser(userId, user.id);

    const existingEvent = await db.event.findFirst({ where: { id } });
    if (!existingEvent) {
      return NextResponse.json({ error: "Event not found or access denied" }, { status: 404 });
    }

    await db.event.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleGuardError(error);
  }
}
