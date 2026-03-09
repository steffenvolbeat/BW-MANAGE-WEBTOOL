import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "@/lib/database";
import { signToken, COOKIE_NAME, MAX_AGE } from "@/lib/auth/jwt";
import { verifyTotpCode, verifyAndConsumeBackupCode } from "@/lib/auth/mfa";

const MFA_COOKIE = "bw_mfa";

function jwtSecret(): Uint8Array {
  const raw = process.env.JWT_SECRET;
  if (!raw) throw new Error("JWT_SECRET ist nicht gesetzt!");
  return new TextEncoder().encode(raw);
}

/**
 * POST /api/auth/mfa/login-complete
 * Zweiter Login-Schritt: TOTP-Code oder Backup-Code prüfen und Session-Cookie setzen.
 * Erwartet vorher gesetzten bw_mfa-Cookie vom ersten Login-Schritt.
 * Body: { totpCode?: string } | { backupCode?: string }
 */
export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const mfaToken = cookieStore.get(MFA_COOKIE)?.value;

    if (!mfaToken) {
      return NextResponse.json({ error: "Kein MFA-Pending-Token gefunden. Bitte erneut anmelden." }, { status: 401 });
    }

    // MFA-Pending-Token verifizieren
    let userId: string;
    try {
      const { payload } = await jwtVerify(mfaToken, jwtSecret());
      if (payload.type !== "mfa_pending" || !payload.sub) {
        return NextResponse.json({ error: "Ungültiges MFA-Token." }, { status: 401 });
      }
      userId = String(payload.sub);
    } catch {
      return NextResponse.json({ error: "MFA-Token abgelaufen oder ungültig. Bitte erneut anmelden." }, { status: 401 });
    }

    // User aus DB laden (frische Daten)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, email: true, name: true, role: true,
        status: true, mfaEnabled: true, mfaSecret: true, mfaBackupCodes: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Benutzer nicht gefunden." }, { status: 404 });
    }
    if (user.status === "INACTIVE" || user.status === "SUSPENDED") {
      return NextResponse.json({ error: "Konto deaktiviert." }, { status: 403 });
    }
    if (!user.mfaEnabled || !user.mfaSecret) {
      return NextResponse.json({ error: "MFA ist nicht aktiv." }, { status: 400 });
    }

    const { totpCode, backupCode } = (await req.json()) as { totpCode?: string; backupCode?: string };

    let verified = false;

    if (totpCode) {
      verified = verifyTotpCode(String(totpCode), user.mfaSecret);
    } else if (backupCode) {
      const result = verifyAndConsumeBackupCode(String(backupCode), user.mfaBackupCodes);
      if (result.valid) {
        verified = true;
        // Verbrauchten Code aus DB entfernen
        await prisma.user.update({
          where: { id: userId },
          data: { mfaBackupCodes: result.remainingCodes },
        });
      }
    } else {
      return NextResponse.json({ error: "totpCode oder backupCode erforderlich." }, { status: 400 });
    }

    if (!verified) {
      return NextResponse.json({ error: "Ungültiger Code. Bitte erneut versuchen." }, { status: 401 });
    }

    // Code korrekt → vollständigen Session-Cookie setzen
    const token = await signToken({
      sub: user.id, email: user.email, name: user.name ?? "", role: user.role,
    });

    const response = NextResponse.json({
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    });

    // Session-Cookie setzen
    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: MAX_AGE,
      path: "/",
    });

    // MFA-Pending-Cookie löschen
    response.cookies.set(MFA_COOKIE, "", { maxAge: 0, path: "/" });

    return response;
  } catch (error) {
    console.error("MFA login-complete error:", error);
    return NextResponse.json({ error: "Interner Fehler." }, { status: 500 });
  }
}
