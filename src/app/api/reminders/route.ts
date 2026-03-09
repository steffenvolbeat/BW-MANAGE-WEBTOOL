import { NextRequest, NextResponse } from "next/server";
import { requireActiveUser, handleGuardError } from "@/lib/security/guard";
import { scopedPrisma } from "@/lib/security/scope";
import { Priority } from "@prisma/client";

export async function GET(request: NextRequest) {
  let user;
  try {
    user = await requireActiveUser();
  } catch (err) {
    return handleGuardError(err);
  }

  try {
    const db = scopedPrisma(user.id);
    const { searchParams } = new URL(request.url);
    const applicationId = searchParams.get("applicationId") ?? undefined;
    const contactId = searchParams.get("contactId") ?? undefined;
    const pendingOnly = searchParams.get("pending") === "true";

    const where: Record<string, unknown> = {};
    if (applicationId) where.applicationId = applicationId;
    if (contactId) where.contactId = contactId;
    if (pendingOnly) where.isDone = false;

    const reminders = await db.reminder.findMany({
      where,
      include: {
        application: { select: { companyName: true, position: true } },
        contact: { select: { firstName: true, lastName: true } },
      } as any,
      orderBy: { dueAt: "asc" },
    });

    return NextResponse.json(reminders);
  } catch (error) {
    console.error("Reminders GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  let user;
  try {
    user = await requireActiveUser();
  } catch (err) {
    return handleGuardError(err);
  }

  try {
    const db = scopedPrisma(user.id);
    const body = await request.json();
    const { title, description, dueAt, priority, applicationId, contactId } = body;

    if (!title || !dueAt) {
      return NextResponse.json(
        { error: "Titel und Fälligkeitsdatum sind erforderlich" },
        { status: 400 }
      );
    }

    const reminder = await db.reminder.create({
      data: {
        title,
        description: description ?? null,
        dueAt: new Date(dueAt),
        priority: (priority as Priority) ?? Priority.MEDIUM,
        isDone: false,
        applicationId: applicationId ?? null,
        contactId: contactId ?? null,
      } as any,
    });

    return NextResponse.json({ success: true, reminder }, { status: 201 });
  } catch (error) {
    console.error("Reminder POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  let user;
  try {
    user = await requireActiveUser();
  } catch (err) {
    return handleGuardError(err);
  }

  try {
    const db = scopedPrisma(user.id);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    const body = await request.json();
    const { title, description, dueAt, priority, isDone } = body;

    const reminder = await db.reminder.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(dueAt !== undefined && { dueAt: new Date(dueAt) }),
        ...(priority !== undefined && { priority: priority as Priority }),
        ...(isDone !== undefined && { isDone: Boolean(isDone) }),
      } as any,
    });

    return NextResponse.json({ success: true, reminder });
  } catch (error) {
    console.error("Reminder PATCH error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  let user;
  try {
    user = await requireActiveUser();
  } catch (err) {
    return handleGuardError(err);
  }

  try {
    const db = scopedPrisma(user.id);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    await db.reminder.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Reminder DELETE error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
