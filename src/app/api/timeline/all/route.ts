import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database";
import { requireActiveUser } from "@/lib/security/guard";
import { handleGuardError } from "@/lib/security/guard";

// GET /api/timeline/all – alle Timeline-Einträge des Users (inkl. Bewerbungsdaten)
export async function GET(req: NextRequest) {
  try {
    const user = await requireActiveUser();
    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "200", 10), 500);

    const entries = await prisma.applicationTimeline.findMany({
      where: { userId: user.id },
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
          },
        },
      },
    });

    return NextResponse.json(entries);
  } catch (err) {
    return handleGuardError(err);
  }
}
