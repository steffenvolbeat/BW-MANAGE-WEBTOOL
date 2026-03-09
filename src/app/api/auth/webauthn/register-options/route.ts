/**
 * GET /api/auth/webauthn/register-options
 * Liefert Registrierungsoptionen für einen neuen WebAuthn-Credential.
 * Setzt eine temporäre Challenge in der DB.
 * Erfordert aktive Session.
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/database";
import { requireActiveUser } from "@/lib/security/guard";
import {
  generateRegistrationOptions,
  RP_ID,
  RP_NAME,
} from "@/lib/auth/webauthn";

export async function GET() {
  try {
    const user = await requireActiveUser().catch(() => null);
    if (!user) return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });

    // Bestehende Credentials für excludeCredentials laden
    const existingCredentials = await prisma.webAuthnCredential.findMany({
      where: { userId: user.id },
      select: { credentialId: true, transports: true },
    });

    const options = await generateRegistrationOptions({
      rpName: RP_NAME,
      rpID: RP_ID,
      userName: user.email,
      userDisplayName: user.name,
      attestationType: "none",
      excludeCredentials: existingCredentials.map((c) => ({
        id: c.credentialId,
        transports: c.transports as any,
      })),
      authenticatorSelection: {
        residentKey: "preferred",
        userVerification: "preferred",
      },
    });

    // Challenge temporär in DB speichern
    await prisma.user.update({
      where: { id: user.id },
      data: { webauthnChallenge: options.challenge },
    });

    return NextResponse.json(options);
  } catch (err) {
    console.error("webauthn register-options error:", err);
    return NextResponse.json({ error: "Interner Fehler" }, { status: 500 });
  }
}
