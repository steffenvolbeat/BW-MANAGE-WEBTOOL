import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { requireActiveUser } from "@/lib/security/guard";
import { prisma } from "@/lib/database";

// Serves uploaded files from /tmp/uploads on Vercel (where public/ is read-only)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  let user;
  try {
    user = await requireActiveUser();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { filename } = await params;

  // Basic path traversal protection
  const safeName = path.basename(filename);
  if (!safeName || safeName !== filename) {
    return NextResponse.json({ error: "Invalid filename" }, { status: 400 });
  }

  // IDOR-Schutz: filePath enthält den safeName (z.B. "/uploads/1234_file.pdf" oder "/api/files/1234_file.pdf")
  // fileName in DB = original name → kein Match mit safeName → deshalb über filePath suchen
  const doc = await prisma.document.findFirst({
    where: { filePath: { contains: safeName } },
    select: { userId: true },
  });
  // Wenn kein DB-Eintrag gefunden → Zugriff verweigern (kein Orphaned-File-Access)
  if (!doc || doc.userId !== user.id) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const filePath = path.join("/tmp", "uploads", safeName);

  try {
    let buffer: Buffer;
    try {
      buffer = await fs.readFile(filePath);
    } catch {
      // Fallback: lokale Entwicklung speichert in public/uploads (kein Vercel)
      const localPath = path.join(process.cwd(), "public", "uploads", safeName);
      buffer = await fs.readFile(localPath);
    }
    // Derive content type from extension
    const ext = safeName.split(".").pop()?.toLowerCase() ?? "";
    const contentTypeMap: Record<string, string> = {
      pdf: "application/pdf",
      png: "image/png",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      gif: "image/gif",
      webp: "image/webp",
      svg: "image/svg+xml",
      doc: "application/msword",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      txt: "text/plain",
    };
    const contentType = contentTypeMap[ext] ?? "application/octet-stream";

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="${safeName}"`,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}
