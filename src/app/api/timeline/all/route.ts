import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database";
import { resolveTargetUserId } from "@/lib/security/guard";
import { handleGuardError } from "@/lib/security/guard";

// GET /api/timeline/all – alle Timeline-Einträge des Users (inkl. Bewerbungsdaten)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const viewAs = searchParams.get("viewAs");
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "200", 10), 500);

    let targetUserId: string;
    try { targetUserId = await resolveTargetUserId(viewAs); }
    catch { return NextResponse.json({ error: "Forbidden" }, { status: 403 }); }

    const entries = await prisma.applicationTimeline.findMany({
      where: { userId: targetUserId },
      orderBy: { date: "desc" },
      take: limit,
      include: {
        application: {
          select: {
            id: true,
            companyName: true,
            position: true,
            status: true,
            itBereich: true,
            appliedAt: true,
          },
        },
      },
    });

    return NextResponse.json(entries);
  } catch (err) {
    return handleGuardError(err);
  }
}
