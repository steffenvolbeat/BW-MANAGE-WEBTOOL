import { NextResponse } from "next/server";
import { requireActiveUser, handleGuardError } from "@/lib/security/guard";
import { prisma } from "@/lib/database";

/**
 * GET /api/user/me
 * Gibt Basisinformationen des eingeloggten Benutzers zurück (inkl. mfaEnabled).
 */
export async function GET() {
  try {
    const user = await requireActiveUser();
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, email: true, name: true, role: true, status: true, mfaEnabled: true, createdAt: true },
    });
    if (!dbUser) {
      return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
    }
    return NextResponse.json(dbUser);
  } catch (err) {
    return handleGuardError(err);
  }
}
