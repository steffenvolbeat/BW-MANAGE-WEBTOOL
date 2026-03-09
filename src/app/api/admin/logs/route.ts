import { NextResponse } from "next/server";
import { requireAdmin, handleGuardError } from "@/lib/security/guard";
import { prisma } from "@/lib/database";

// GET /api/admin/logs – Systemaktivitäten aller Nutzer (Admin only)
export async function GET(req: Request) {
  try {
    await requireAdmin();
  } catch (err) {
    return handleGuardError(err);
  }

  const url = new URL(req.url);
  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10));
  const limit = 50;
  const skip = (page - 1) * limit;

  const [activities, total] = await Promise.all([
    prisma.activity.findMany({
      skip,
      take: limit,
      orderBy: { timestamp: "desc" },
      select: {
        id: true,
        type: true,
        title: true,
        description: true,
        relatedEntity: true,
        timestamp: true,
        status: true,
        user: { select: { id: true, email: true, name: true } },
      },
    }),
    prisma.activity.count(),
  ]);

  return NextResponse.json({ activities, total, page, pages: Math.ceil(total / limit) });
}
