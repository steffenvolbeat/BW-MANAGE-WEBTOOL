import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/currentUser";
import { isReadOnlyRole, handleGuardError } from "@/lib/security/guard";
import { prisma } from "@/lib/database";

/**
 * GET /api/observer/my-targets
 * Gibt alle Teilnehmer zurück, auf die der eingeloggte MANAGER/VERMITTLER Lesezugriff hat.
 */
export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!isReadOnlyRole(user.role)) {
      return NextResponse.json({ error: "Nur für MANAGER und VERMITTLER" }, { status: 403 });
    }

    const grants = await prisma.viewAccessGrant.findMany({
      where: { granteeId: user.id },
      include: {
        target: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    const targets = grants.map((g) => g.target);
    return NextResponse.json({ targets });
  } catch (err) {
    return handleGuardError(err);
  }
}
