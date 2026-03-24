import { NextResponse } from "next/server";
import { scopedPrisma } from "@/lib/security/scope";
import { requireActiveUser } from "@/lib/security/guard";

type Params = { params: Promise<{ id: string }> };

// GET /api/applications/[id]/cover-letters
export async function GET(_req: Request, { params }: Params) {
  try {
    const user = await requireActiveUser().catch(() => null);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: applicationId } = await params;
    const db = scopedPrisma(user.id);

    // Verify ownership
    const app = await db.application.findFirst({ where: { id: applicationId } });
    if (!app) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const coverLetters = await db.coverLetter.findMany({
      where: { applicationId },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(coverLetters);
  } catch (e) {
    console.error("GET cover-letters error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/applications/[id]/cover-letters
export async function POST(req: Request, { params }: Params) {
  try {
    const user = await requireActiveUser().catch(() => null);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: applicationId } = await params;
    const db = scopedPrisma(user.id);

    const app = await db.application.findFirst({ where: { id: applicationId } });
    if (!app) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const { title, itBereich, content } = await req.json();
    if (!content?.trim()) {
      return NextResponse.json({ error: "content is required" }, { status: 400 });
    }

    const coverLetter = await db.coverLetter.create({
      data: {
        title: title?.trim() || "Anschreiben",
        itBereich: itBereich || null,
        content,
        applicationId,
      },
    });

    return NextResponse.json(coverLetter, { status: 201 });
  } catch (e) {
    console.error("POST cover-letters error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT /api/applications/[id]/cover-letters  (body: { letterId, title, itBereich, content })
export async function PUT(req: Request, { params }: Params) {
  try {
    const user = await requireActiveUser().catch(() => null);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: applicationId } = await params;
    const db = scopedPrisma(user.id);

    const app = await db.application.findFirst({ where: { id: applicationId } });
    if (!app) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const { letterId, title, itBereich, content } = await req.json();
    if (!letterId) return NextResponse.json({ error: "letterId is required" }, { status: 400 });

    const existing = await db.coverLetter.findFirst({
      where: { id: letterId, applicationId },
    });
    if (!existing) return NextResponse.json({ error: "Cover letter not found" }, { status: 404 });

    const updated = await db.coverLetter.update({
      where: { id: letterId },
      data: {
        ...(title !== undefined && { title: title.trim() || "Anschreiben" }),
        ...(itBereich !== undefined && { itBereich: itBereich || null }),
        ...(content !== undefined && { content }),
      },
    });

    return NextResponse.json(updated);
  } catch (e) {
    console.error("PUT cover-letters error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/applications/[id]/cover-letters?letterId=xxx
export async function DELETE(req: Request, { params }: Params) {
  try {
    const user = await requireActiveUser().catch(() => null);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: applicationId } = await params;
    const db = scopedPrisma(user.id);

    const app = await db.application.findFirst({ where: { id: applicationId } });
    if (!app) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const { searchParams } = new URL(req.url);
    const letterId = searchParams.get("letterId");
    if (!letterId) return NextResponse.json({ error: "letterId is required" }, { status: 400 });

    const existing = await db.coverLetter.findFirst({
      where: { id: letterId, applicationId },
    });
    if (!existing) return NextResponse.json({ error: "Cover letter not found" }, { status: 404 });

    await db.coverLetter.delete({ where: { id: letterId } });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("DELETE cover-letters error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
