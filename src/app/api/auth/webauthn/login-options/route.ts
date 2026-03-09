/**
 * POST /api/auth/webauthn/login-options
 * Öffentlich – liefert Authentication-Optionen für eine E-Mail-Adresse.
 * Body: { email: string }
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database";
import {
  generateAuthenticationOptions,
  RP_ID,
} from "@/lib/auth/webauthn";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ error: "E-Mail erforderlich" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: { id: true, status: true, webauthnCredentials: { select: { credentialId: true, transports: true } } },
    });

    // Keine Informationen über nicht existierende Nutzer preisgeben
    if (!user || user.status !== "ACTIVE") {
      return NextResponse.json({ error: "Keine WebAuthn-Geräte für diese E-Mail." }, { status: 404 });
    }

    if (user.webauthnCredentials.length === 0) {
      return NextResponse.json({ error: "Keine WebAuthn-Geräte für diese E-Mail." }, { status: 404 });
    }

    const options = await generateAuthenticationOptions({
      rpID: RP_ID,
      userVerification: "preferred",
      allowCredentials: user.webauthnCredentials.map((c) => ({
        id: c.credentialId,
        transports: c.transports as any,
      })),
    });

    // Challenge in DB speichern
    await prisma.user.update({
      where: { id: user.id },
      data: { webauthnChallenge: options.challenge },
    });

    return NextResponse.json(options);
  } catch (err) {
    console.error("webauthn login-options error:", err);
    return NextResponse.json({ error: "Interner Fehler" }, { status: 500 });
  }
}
