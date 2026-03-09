/**
 * POST /api/auth/webauthn/login-verify
 * Öffentlich – verifiziert die Authentifizierungsantwort und setzt den Session-Cookie.
 * Body: { email: string, response: AuthenticationResponseJSON }
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database";
import { signToken, COOKIE_NAME, MAX_AGE } from "@/lib/auth/jwt";
import {
  verifyAuthenticationResponse,
  RP_ID,
  RP_ORIGIN,
} from "@/lib/auth/webauthn";

export async function POST(req: NextRequest) {
  try {
    const { email, response } = await req.json();
    if (!email || !response) {
      return NextResponse.json({ error: "E-Mail und Antwort erforderlich" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: { id: true, email: true, name: true, role: true, status: true, webauthnChallenge: true },
    });

    if (!user || user.status !== "ACTIVE") {
      return NextResponse.json({ error: "Ungültige Anfrage" }, { status: 401 });
    }

    if (!user.webauthnChallenge) {
      return NextResponse.json({ error: "Keine aktive Challenge. Bitte neu starten." }, { status: 400 });
    }

    // Matching credential in DB suchen
    const credentialId: string = response.id;
    const credential = await prisma.webAuthnCredential.findFirst({
      where: { credentialId, userId: user.id },
    });

    if (!credential) {
      return NextResponse.json({ error: "Unbekanntes Gerät" }, { status: 401 });
    }

    let verification;
    try {
      verification = await verifyAuthenticationResponse({
        response,
        expectedChallenge: user.webauthnChallenge,
        expectedOrigin: RP_ORIGIN,
        expectedRPID: RP_ID,
        credential: {
          id: credential.credentialId,
          publicKey: new Uint8Array(credential.publicKey),
          counter: Number(credential.counter),
          transports: credential.transports as any,
        },
      });
    } catch (e: any) {
      console.error("WebAuthn Authentifizierung fehlgeschlagen:", e);
      return NextResponse.json({ error: "Authentifizierung fehlgeschlagen" }, { status: 401 });
    }

    // Challenge löschen (Einmalverwendung)
    await prisma.user.update({
      where: { id: user.id },
      data: { webauthnChallenge: null },
    });

    if (!verification.verified) {
      return NextResponse.json({ error: "Verifikation fehlgeschlagen" }, { status: 401 });
    }

    // Counter aktualisieren (Replay-Schutz)
    await prisma.webAuthnCredential.update({
      where: { id: credential.id },
      data: {
        counter: verification.authenticationInfo.newCounter,
        lastUsedAt: new Date(),
      },
    });

    // Vollständigen Session-Cookie setzen
    const token = await signToken({
      sub: user.id,
      email: user.email,
      name: user.name ?? "",
      role: user.role,
    });

    const res = NextResponse.json({
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    });

    res.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: MAX_AGE,
      path: "/",
    });

    return res;
  } catch (err) {
    console.error("webauthn login-verify error:", err);
    return NextResponse.json({ error: "Interner Fehler" }, { status: 500 });
  }
}
