import { NextResponse } from "next/server";
import { scopedPrisma } from "@/lib/security/scope";
import { promises as fs } from "fs";
import path from "path";
import { DocumentType } from "@prisma/client";
import { requireActiveUser, handleGuardError } from "@/lib/security/guard";
import { put } from "@vercel/blob"; // Vercel Blob Storage SDK

// GET
export async function GET(request: Request) {
  try {
    const user = await requireActiveUser().catch(() => null);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const applicationId = searchParams.get("applicationId");

    if (userId && userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const whereClause: any = { userId: user.id };
    if (applicationId) {
      whereClause.applications = { some: { applicationId } };
    }

    const db = scopedPrisma(user.id);

    const documents = await db.document.findMany({
      where: whereClause,
      include: {
        applications: {
          include: {
            application: { select: { id: true, companyName: true, position: true } },
          },
        },
      },
      orderBy: { uploadedAt: "desc" },
    });

    return NextResponse.json(documents);
  } catch (error) {
    const guardResponse = handleGuardError(error);
    if (guardResponse.status !== 500) return guardResponse;
    console.error("Error fetching documents:", error instanceof Error ? error.message : String(error));
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST
export async function POST(request: Request) {
  try {
    const user = await requireActiveUser().catch(() => null);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const db = scopedPrisma(user.id);

    const form = await request.formData();
    const file = form.get("file") as File | null;
    const applicationId = form.get("applicationId")?.toString() || undefined;
    const type = (form.get("type")?.toString() || "OTHER") as DocumentType;
    const name = form.get("name")?.toString() || file?.name;
    const description = form.get("description")?.toString() || undefined;
    const tagsRaw = form.get("tags")?.toString();
    const tags = tagsRaw ? JSON.parse(tagsRaw) : [];
    const fileBrowserFolderId = form.get("fileBrowserFolderId")?.toString() || null;

    if (!name) {
      return NextResponse.json({ error: "Name ist erforderlich" }, { status: 400 });
    }

    if (!file) {
      return NextResponse.json({ error: "Datei ist erforderlich" }, { status: 400 });
    }

    if (applicationId) {
      const application = await db.application.findFirst({ where: { id: applicationId } });
      if (!application) {
        return NextResponse.json({ error: "Application not found or access denied" }, { status: 404 });
      }
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Validate file size (max 25 MB)
    const MAX_FILE_SIZE = 25 * 1024 * 1024;
    if (buffer.length > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "Datei zu groß. Maximum: 25 MB." }, { status: 413 });
    }

    // Sanitize filename
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin";

    // Validate file extension whitelist
    const ALLOWED_EXTENSIONS = new Set([
      "pdf", "doc", "docx", "txt", "odt", "rtf",
      "jpg", "jpeg", "png", "gif", "webp", "svg",
      "xls", "xlsx", "csv", "ppt", "pptx", "zip",
    ]);
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      return NextResponse.json({ error: `Dateityp .${ext} ist nicht erlaubt.` }, { status: 415 });
    }
    const baseName = file.name
      .replace(/\.[^.]+$/, "")
      .replace(/\s+/g, "_")
      .replace(/[^a-zA-Z0-9_\-]/g, "")
      .slice(0, 80);
    const safeName = `${Date.now()}_${baseName || "file"}.${ext}`;

    let persistedFilePath: string;

    if (process.env.BLOB_READ_WRITE_TOKEN) {
      // Vercel Blob Storage
      const blob = await put(`uploads/${safeName}`, buffer, {
        access: "public",
        contentType: file.type || "application/octet-stream",
      });
      persistedFilePath = blob.url;
    } else if (process.env.VERCEL) {
      // Vercel ohne Blob-Token – Filesystem ist read-only, Upload nicht möglich
      return NextResponse.json(
        { error: "Datei-Upload nicht verfügbar: Bitte Vercel Blob Storage einrichten (BLOB_READ_WRITE_TOKEN fehlt)." },
        { status: 503 }
      );
    } else {
      // Lokale Entwicklung → public/uploads/
      const uploadDir = path.join(process.cwd(), "public", "uploads");
      await fs.mkdir(uploadDir, { recursive: true });
      await fs.writeFile(path.join(uploadDir, safeName), buffer);
      persistedFilePath = `/uploads/${safeName}`;
    }

    const document = await db.document.create({
      data: {
        name,
        fileName: file.name,
        fileSize: buffer.length,
        fileType: file.type || "application/octet-stream",
        filePath: persistedFilePath,
        type,
        description,
        tags,
        fileBrowserFolderId: fileBrowserFolderId ?? null,
        applications: applicationId ? { create: { applicationId } } : undefined,
      },
      include: {
        applications: {
          include: { application: true },
        },
      },
    });

    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    const guardResponse = handleGuardError(error);
    if (guardResponse.status !== 500) return guardResponse;
    console.error("Error creating document:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT
export async function PUT(request: Request) {
  try {
    const user = await requireActiveUser().catch(() => null);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const data = await request.json();
    const { id, userId, ...updateData } = data;

    if (!id) {
      return NextResponse.json({ error: "Document ID is required" }, { status: 400 });
    }

    if (userId && userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const db = scopedPrisma(user.id);
    const existing = await db.document.findFirst({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Document not found or access denied" }, { status: 404 });
    }

    const VALID_DOC_TYPES = Object.values(DocumentType);
    const allowedUpdate = {
      ...(updateData.name !== undefined && { name: updateData.name }),
      ...(updateData.description !== undefined && { description: updateData.description }),
      ...(updateData.tags !== undefined && { tags: updateData.tags }),
      ...(updateData.type !== undefined &&
        VALID_DOC_TYPES.includes(updateData.type as DocumentType) &&
        { type: updateData.type as DocumentType }),
    };

    const updatedDocument = await db.document.update({
      where: { id },
      data: allowedUpdate,
      include: {
        applications: { include: { application: true } },
      },
    });

    return NextResponse.json(updatedDocument);
  } catch (error) {
    console.error("Error updating document:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE
export async function DELETE(request: Request) {
  try {
    const user = await requireActiveUser().catch(() => null);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const userId = searchParams.get("userId");

    if (!id) {
      return NextResponse.json({ error: "Document ID is required" }, { status: 400 });
    }

    if (userId && userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const db = scopedPrisma(user.id);
    const existing = await db.document.findFirst({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Document not found or access denied" }, { status: 404 });
    }

    await db.document.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting document:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
