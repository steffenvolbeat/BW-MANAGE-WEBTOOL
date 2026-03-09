import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
import { prisma } from "@/lib/database";
import { signToken, COOKIE_NAME, MAX_AGE } from "@/lib/auth/jwt";

const MFA_COOKIE = "bw_mfa";
const MFA_MAX_AGE = 5 * 60; // 5 Minuten

function jwtSecret(): Uint8Array {
  const raw = process.env.JWT_SECRET;
  if (!raw) throw new Error("JWT_SECRET ist nicht gesetzt!");
  return new TextEncoder().encode(raw);
}

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: "E-Mail und Passwort sind erforderlich." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: { id: true, email: true, name: true, role: true, password: true, status: true, mfaEnabled: true },
    });

    if (!user || !user.password) {
      return NextResponse.json({ error: "Ungültige E-Mail-Adresse oder Passwort." }, { status: 401 });
    }

    if (user.status === "INACTIVE" || user.status === "SUSPENDED") {
      return NextResponse.json({ error: "Dieses Konto ist deaktiviert. Bitte kontaktieren Sie den Support." }, { status: 403 });
    }

    const passwordValid = await bcrypt.compare(password, user.password);
    if (!passwordValid) {
      return NextResponse.json({ error: "Ungültige E-Mail-Adresse oder Passwort." }, { status: 401 });
    }

    // ── MFA aktiv: temporäres Pending-Token ausgeben ──────────────────────
    if (user.mfaEnabled) {
      const mfaToken = await new SignJWT({ sub: user.id, type: "mfa_pending" })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("5m")
        .sign(jwtSecret());

      const response = NextResponse.json({ mfaRequired: true });
      response.cookies.set(MFA_COOKIE, mfaToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: MFA_MAX_AGE,
        path: "/",
      });
      return response;
    }

    // ── Kein MFA: direkt Session-Cookie setzen ────────────────────────────
    const token = await signToken({ sub: user.id, email: user.email, name: user.name ?? "", role: user.role });

    const response = NextResponse.json({
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    });
    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: MAX_AGE,
      path: "/",
    });
    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Anmeldung fehlgeschlagen." }, { status: 500 });
  }
}
