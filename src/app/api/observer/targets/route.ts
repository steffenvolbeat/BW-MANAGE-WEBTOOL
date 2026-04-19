import { NextResponse } from "next/server";
import { requireActiveUser, isReadOnlyRole, handleGuardError } from "@/lib/security/guard";
import { prisma } from "@/lib/database";

/**
 * GET /api/observer/targets
 * Gibt alle Teilnehmer zurück, auf die der aktuelle MANAGER/VERMITTLER Lesezugriff hat.
 * Nur für Rollen MANAGER und VERMITTLER zugänglich.
 */
export async function GET() {
  let user;
  try {
    user = await requireActiveUser();
  } catch (err) {
    return handleGuardError(err);
  }

  if (!isReadOnlyRole(user.role)) {
    return NextResponse.json(
      { error: "Nur für MANAGER oder VERMITTLER zugänglich." },
      { status: 403 }
    );
  }

  const grants = await prisma.viewAccessGrant.findMany({
    where: { granteeId: user.id },
    include: {
      target: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ targets: grants.map((g) => g.target) });
}
