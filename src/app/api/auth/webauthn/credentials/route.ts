/**
 * GET /api/auth/webauthn/credentials
 * Gibt alle registrierten WebAuthn-Credentials des aktuellen Nutzers zurück.
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/database";
import { requireActiveUser } from "@/lib/security/guard";

export async function GET() {
  try {
    const user = await requireActiveUser().catch(() => null);
    if (!user) return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });

    const credentials = await prisma.webAuthnCredential.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        name: true,
        deviceType: true,
        createdAt: true,
        lastUsedAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(credentials);
  } catch (err) {
    console.error("webauthn credentials GET error:", err);
    return NextResponse.json({ error: "Interner Fehler" }, { status: 500 });
  }
}
