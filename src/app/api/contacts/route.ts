import { NextResponse } from "next/server";
import { scopedPrisma } from "@/lib/security/scope";
import { ContactType } from "@prisma/client";
import { requireActiveUser, assertSameUser } from "@/lib/security/guard";

function handleGuardError(error: unknown) {
  if ((error as any)?.code === "FORBIDDEN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}

// GET - Retrieve all contacts for a user
export async function GET(request: Request) {
  try {
    const user = await requireActiveUser().catch(() => null);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const db = scopedPrisma(user.id);

    const { searchParams } = new URL(request.url);
    const requestedUserId = searchParams.get("userId");
    assertSameUser(requestedUserId, user.id);

    const contacts = await db.contact.findMany({
      where: { userId: user.id },
      include: {
        activities: {
          select: {
            id: true,
            title: true,
            type: true,
            status: true,
            timestamp: true,
          },
        },
      },
      orderBy: { addedAt: "desc" },
    });

    return NextResponse.json(contacts);
  } catch (error) {
    const guardResponse = handleGuardError(error);
    if (guardResponse) return guardResponse;
    console.error("Error fetching contacts:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create new contact
export async function POST(request: Request) {
  try {
    const user = await requireActiveUser().catch(() => null);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const db = scopedPrisma(user.id);

    const data = await request.json();

    const {
      firstName,
      lastName,
      email,
      phone,
      company,
      position,
      linkedIn,
      xing,
      notes,
      contactType = ContactType.RECRUITER,
    } = data;

    if (!firstName || !lastName) {
      return NextResponse.json(
        { error: "First name and last name are required" },
        { status: 400 }
      );
    }

    const contact = await db.contact.create({
      data: {
        firstName,
        lastName,
        email,
        phone,
        company,
        position,
        linkedIn,
        xing,
        notes,
        contactType,
      },
      include: {
        activities: true,
      },
    });

    return NextResponse.json(contact, { status: 201 });
  } catch (error) {
    const guardResponse = handleGuardError(error);
    if (guardResponse) return guardResponse;
    console.error("Error creating contact:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT - Update contact
export async function PUT(request: Request) {
  try {
    const user = await requireActiveUser().catch(() => null);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const db = scopedPrisma(user.id);

    const data = await request.json();
    const { id, userId, ...updateData } = data;

    if (!id) {
      return NextResponse.json(
        { error: "Contact ID is required" },
        { status: 400 }
      );
    }

    assertSameUser(userId, user.id);

    // Verify the contact belongs to the user
    const existingContact = await db.contact.findFirst({
      where: { id },
    });

    if (!existingContact) {
      return NextResponse.json(
        { error: "Contact not found or access denied" },
        { status: 404 }
      );
    }

    const updatedContact = await db.contact.update({
      where: { id },
      data: {
        ...(updateData.firstName !== undefined && { firstName: updateData.firstName }),
        ...(updateData.lastName !== undefined && { lastName: updateData.lastName }),
        ...(updateData.email !== undefined && { email: updateData.email }),
        ...(updateData.phone !== undefined && { phone: updateData.phone }),
        ...(updateData.company !== undefined && { company: updateData.company }),
        ...(updateData.position !== undefined && { position: updateData.position }),
        ...(updateData.linkedIn !== undefined && { linkedIn: updateData.linkedIn }),
        ...(updateData.xing !== undefined && { xing: updateData.xing }),
        ...(updateData.notes !== undefined && { notes: updateData.notes }),
        ...(updateData.contactType !== undefined && { contactType: updateData.contactType }),
      },
      include: {
        activities: true,
      },
    });

    return NextResponse.json(updatedContact);
  } catch (error) {
    const guardResponse = handleGuardError(error);
    if (guardResponse) return guardResponse;
    console.error("Error updating contact:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Delete contact
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
        { error: "Contact ID is required" },
        { status: 400 }
      );
    }

    assertSameUser(userId, user.id);

    // Verify the contact belongs to the user
    const existingContact = await db.contact.findFirst({
      where: { id },
    });

    if (!existingContact) {
      return NextResponse.json(
        { error: "Contact not found or access denied" },
        { status: 404 }
      );
    }

    await db.contact.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const guardResponse = handleGuardError(error);
    if (guardResponse) return guardResponse;
    console.error("Error deleting contact:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
