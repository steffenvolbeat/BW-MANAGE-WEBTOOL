import { NextResponse } from "next/server";
import { scopedPrisma } from "@/lib/security/scope";
import { prisma } from "@/lib/database";
import { requireActiveUser, assertSameUser, handleGuardError, blockReadOnlyRoles } from "@/lib/security/guard";

// GET - Retrieve notes for a user with optional filters
export async function GET(request: Request) {
  try {
    const user = await requireActiveUser().catch(() => null);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const db = scopedPrisma(user.id);

    const { searchParams } = new URL(request.url);
    const userIdParam = searchParams.get("userId");
    const applicationId = searchParams.get("applicationId");
    const contactId = searchParams.get("contactId");
    const category = searchParams.get("category");
    const search = searchParams.get("search");

    assertSameUser(userIdParam, user.id);

    const where: any = { userId: user.id };

    if (applicationId) where.applicationId = applicationId;
    if (contactId) where.contactId = contactId;
    if (category && category !== "all") where.category = category;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { content: { contains: search, mode: "insensitive" } },
        { tags: { has: search.toLowerCase() } },
      ];
    }

    const notes = await db.note.findMany({
      where,
      include: {
        application: { select: { companyName: true, position: true } },
        contact: { select: { firstName: true, lastName: true } },
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json(notes);
  } catch (error) {
    const guardResponse = handleGuardError(error);
    if (guardResponse) return guardResponse;
    console.error("Error fetching notes:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST - Create a note
export async function POST(request: Request) {
  try {
    const user = await blockReadOnlyRoles();
    const db = scopedPrisma(user.id);

    const data = await request.json();
    const {
      userId,
      title,
      content,
      category = "general",
      tags = [],
      applicationId,
      contactId,
    } = data;

    assertSameUser(userId, user.id);

    if (!title || !content) {
      return NextResponse.json(
        { error: "Title and content are required" },
        { status: 400 }
      );
    }

    if (typeof title !== "string" || title.length < 1 || title.length > 500) {
      return NextResponse.json({ error: "Titel muss 1-500 Zeichen haben" }, { status: 400 });
    }
    if (typeof content !== "string" || content.length > 100_000) {
      return NextResponse.json({ error: "Inhalt darf maximal 100.000 Zeichen haben" }, { status: 400 });
    }
    if (!Array.isArray(tags) || tags.length > 50 || tags.some((t: unknown) => typeof t !== "string" || t.length > 100)) {
      return NextResponse.json({ error: "Tags: maximal 50 Tags, jeder max. 100 Zeichen" }, { status: 400 });
    }
    if (applicationId) {
      const application = await db.application.findFirst({
        where: { id: applicationId },
      });
      if (!application) {
        return NextResponse.json({ error: "Application not found or access denied" }, { status: 404 });
      }
    }

    if (contactId) {
      const contact = await db.contact.findFirst({
        where: { id: contactId },
      });
      if (!contact) {
        return NextResponse.json({ error: "Contact not found or access denied" }, { status: 404 });
      }
    }

    const note = await db.note.create({
      data: {
        title,
        content,
        category,
        tags,
        applicationId,
        contactId,
      },
    });

    // Timeline-Eintrag: Notiz einer Bewerbung zugeordnet
    if (applicationId) {
      try {
        await prisma.applicationTimeline.create({
          data: {
            applicationId,
            userId: user.id,
            type: "NOTE",
            title: `Notiz: ${title}`,
            content: content.length > 300 ? content.slice(0, 300) + "…" : content,
            noteId: note.id,
          },
        });
      } catch (_) { /* nicht-kritisch */ }
    }

    return NextResponse.json(note, { status: 201 });
  } catch (error) {
    const guardResponse = handleGuardError(error);
    if (guardResponse) return guardResponse;
    console.error("Error creating note:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT - Update a note
export async function PUT(request: Request) {
  try {
    const user = await blockReadOnlyRoles();
    const db = scopedPrisma(user.id);

    const data = await request.json();
    const { id, userId, ...updateData } = data;

    if (!id) {
      return NextResponse.json(
        { error: "Note ID is required" },
        { status: 400 }
      );
    }

    assertSameUser(userId, user.id);

    const existing = await db.note.findFirst({
      where: { id },
    });
    if (!existing) {
      return NextResponse.json({ error: "Note not found or access denied" }, { status: 404 });
    }

    if (updateData.title !== undefined && (typeof updateData.title !== "string" || updateData.title.length < 1 || updateData.title.length > 500)) {
      return NextResponse.json({ error: "Titel muss zwischen 1 und 500 Zeichen lang sein" }, { status: 400 });
    }
    if (updateData.content !== undefined && typeof updateData.content === "string" && updateData.content.length > 100000) {
      return NextResponse.json({ error: "Inhalt darf maximal 100.000 Zeichen haben" }, { status: 400 });
    }
    if (Array.isArray(updateData.tags)) {
      if (updateData.tags.length > 50) return NextResponse.json({ error: "Maximal 50 Tags erlaubt" }, { status: 400 });
      if (updateData.tags.some((t: unknown) => typeof t !== "string" || (t as string).length > 100)) {
        return NextResponse.json({ error: "Jeder Tag darf maximal 100 Zeichen haben" }, { status: 400 });
      }
    }

    // Ownership checks for relations
    if (updateData.applicationId) {
      const application = await db.application.findFirst({
        where: { id: updateData.applicationId },
      });
      if (!application) {
        return NextResponse.json({ error: "Application not found or access denied" }, { status: 404 });
      }
    }

    if (updateData.contactId) {
      const contact = await db.contact.findFirst({
        where: { id: updateData.contactId },
      });
      if (!contact) {
        return NextResponse.json({ error: "Contact not found or access denied" }, { status: 404 });
      }
    }

    // Nur erlaubte Felder weitergeben
    if (updateData.title !== undefined) {
      if (typeof updateData.title !== "string" || updateData.title.length < 1 || updateData.title.length > 500) {
        return NextResponse.json({ error: "Titel muss 1-500 Zeichen haben" }, { status: 400 });
      }
    }
    if (updateData.content !== undefined) {
      if (typeof updateData.content !== "string" || updateData.content.length > 100_000) {
        return NextResponse.json({ error: "Inhalt darf maximal 100.000 Zeichen haben" }, { status: 400 });
      }
    }
    if (updateData.tags !== undefined) {
      if (!Array.isArray(updateData.tags) || updateData.tags.length > 50 || updateData.tags.some((t: unknown) => typeof t !== "string" || t.length > 100)) {
        return NextResponse.json({ error: "Tags: maximal 50 Tags, jeder max. 100 Zeichen" }, { status: 400 });
      }
    }

    const allowedUpdate = {
      ...(updateData.title !== undefined && { title: updateData.title }),
      ...(updateData.content !== undefined && { content: updateData.content }),
      ...(updateData.category !== undefined && { category: updateData.category }),
      ...(updateData.tags !== undefined && { tags: updateData.tags }),
      ...(updateData.applicationId !== undefined && { applicationId: updateData.applicationId }),
      ...(updateData.contactId !== undefined && { contactId: updateData.contactId }),
    };

    const note = await db.note.update({
      where: { id },
      data: allowedUpdate,
    });

    return NextResponse.json(note);
  } catch (error) {
    const guardResponse = handleGuardError(error);
    if (guardResponse) return guardResponse;
    console.error("Error updating note:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE - Remove a note
export async function DELETE(request: Request) {
  try {
    const user = await blockReadOnlyRoles();
    const db = scopedPrisma(user.id);

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const userIdParam = searchParams.get("userId");

    if (!id) {
      return NextResponse.json(
        { error: "Note ID is required" },
        { status: 400 }
      );
    }

    assertSameUser(userIdParam, user.id);

    const existing = await db.note.findFirst({
      where: { id },
    });
    if (!existing) {
      return NextResponse.json({ error: "Note not found or access denied" }, { status: 404 });
    }

    await db.note.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    const guardResponse = handleGuardError(error);
    if (guardResponse) return guardResponse;
    console.error("Error deleting note:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
