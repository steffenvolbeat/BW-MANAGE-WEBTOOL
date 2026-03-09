/**
 * POST /api/auth/webauthn/register-verify
 * Verifiziert die Registrierungsantwort und speichert den neuen Credential.
 * Body: { response: RegistrationResponseJSON, name?: string }
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database";
import { requireActiveUser } from "@/lib/security/guard";
import {
  verifyRegistrationResponse,
  RP_ID,
  RP_ORIGIN,
} from "@/lib/auth/webauthn";

export async function POST(req: NextRequest) {
  try {
    const user = await requireActiveUser().catch(() => null);
    if (!user) return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });

    const { response, name } = await req.json();

    // Challenge aus DB laden
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { webauthnChallenge: true },
    });

    if (!dbUser?.webauthnChallenge) {
      return NextResponse.json({ error: "Keine aktive Challenge. Bitte neu starten." }, { status: 400 });
    }

    let verification;
    try {
      verification = await verifyRegistrationResponse({
        response,
        expectedChallenge: dbUser.webauthnChallenge,
        expectedOrigin: RP_ORIGIN,
        expectedRPID: RP_ID,
      });
    } catch (e: any) {
      console.error("WebAuthn Verifikation fehlgeschlagen:", e);
      return NextResponse.json({ error: e.message ?? "Verifikation fehlgeschlagen" }, { status: 400 });
    }

    // Challenge löschen (Einmalverwendung)
    await prisma.user.update({
      where: { id: user.id },
      data: { webauthnChallenge: null },
    });

    if (!verification.verified || !verification.registrationInfo) {
      return NextResponse.json({ error: "Verifikation fehlgeschlagen" }, { status: 400 });
    }

    const { credential } = verification.registrationInfo;

    // Credential in DB speichern
    const saved = await prisma.webAuthnCredential.create({
      data: {
        userId: user.id,
        credentialId: credential.id,
        publicKey: Buffer.from(credential.publicKey),
        counter: credential.counter,
        deviceType: verification.registrationInfo.credentialDeviceType ?? "singleDevice",
        backedUp: verification.registrationInfo.credentialBackedUp ?? false,
        transports: response.response?.transports ?? [],
        name: name?.trim() || "Gerät",
      },
    });

    return NextResponse.json({ verified: true, credentialId: saved.id });
  } catch (err) {
    console.error("webauthn register-verify error:", err);
    return NextResponse.json({ error: "Interner Fehler" }, { status: 500 });
  }
}
