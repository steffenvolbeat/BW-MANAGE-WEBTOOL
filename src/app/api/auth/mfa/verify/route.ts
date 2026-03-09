import { NextResponse } from "next/server";
import { requireActiveUser, handleGuardError } from "@/lib/security/guard";
import { prisma } from "@/lib/database";
import { verifyTotpCode, verifyAndConsumeBackupCode } from "@/lib/auth/mfa";

/**
 * POST /api/auth/mfa/verify
 * Wird beim Login-Zweiten-Schritt aufgerufen, wenn mfaEnabled === true.
 * Body: { totpCode?: string } | { backupCode?: string }
 * Voraussetzung: Benutzer muss in der Session als "mfa_pending" markiert sein.
 * Diese Methode prüft den Code – der eigentliche Cookie wird im Login-Flow gesetzt.
 */
export async function POST(req: Request) {
  try {
    const user = await requireActiveUser();
    const body = await req.json();
    const { totpCode, backupCode } = body as { totpCode?: string; backupCode?: string };

    // User aus DB laden (frische MFA-Daten)
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { mfaEnabled: true, mfaSecret: true, mfaBackupCodes: true },
    });

    if (!dbUser?.mfaEnabled || !dbUser.mfaSecret) {
      return NextResponse.json({ error: "MFA ist nicht aktiviert" }, { status: 400 });
    }

    // TOTP-Code prüfen
    if (totpCode) {
      const valid = verifyTotpCode(String(totpCode), dbUser.mfaSecret);
      if (!valid) {
        return NextResponse.json({ error: "Ungültiger TOTP-Code" }, { status: 401 });
      }
      return NextResponse.json({ success: true });
    }

    // Backup-Code prüfen
    if (backupCode) {
      const result = verifyAndConsumeBackupCode(String(backupCode), dbUser.mfaBackupCodes);
      if (!result.valid) {
        return NextResponse.json({ error: "Ungültiger Backup-Code" }, { status: 401 });
      }
      // Verbrauchten Code aus DB entfernen
      await prisma.user.update({
        where: { id: user.id },
        data: { mfaBackupCodes: result.remainingCodes },
      });
      return NextResponse.json({ success: true, codesRemaining: result.remainingCodes.length });
    }

    return NextResponse.json({ error: "totpCode oder backupCode erforderlich" }, { status: 400 });
  } catch (err) {
    return handleGuardError(err);
  }
}
