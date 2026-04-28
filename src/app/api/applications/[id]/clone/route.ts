import { NextResponse } from "next/server";
import { prisma } from "@/lib/database";
import { requireActiveUser } from "@/lib/security/guard";
import { scopedPrisma } from "@/lib/security/scope";

type Params = { params: Promise<{ id: string }> };

// POST /api/applications/[id]/clone  – Bewerbung klonen ("Erneut bewerben")
export async function POST(_req: Request, { params }: Params) {
  try {
    const user = await requireActiveUser().catch(() => null);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: applicationId } = await params;
    const db = scopedPrisma(user.id);

    const original = await db.application.findFirst({ where: { id: applicationId } });
    if (!original) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const cloned = await prisma.application.create({
      data: {
        companyName: original.companyName,
        position: original.position,
        location: original.location,
        street: original.street,
        zip: original.zip,
        country: original.country,
        state: original.state,
        isInland: original.isInland,
        status: "APPLIED",
        priority: original.priority,
        jobType: original.jobType,
        salary: original.salary,
        jobUrl: original.jobUrl,
        companyUrl: original.companyUrl,
        appliedAt: new Date(),
        notesText: original.notesText,
        requirements: original.requirements,
        itBereich: original.itBereich,
        userId: user.id,
      },
    });

    return NextResponse.json(cloned, { status: 201 });
  } catch (e) {
    console.error("POST clone error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
