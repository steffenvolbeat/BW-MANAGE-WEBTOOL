import { NextResponse } from "next/server";
import { requireActiveUser, handleGuardError } from "@/lib/security/guard";
import { prisma } from "@/lib/database";
import {
  generateTotpSecret,
  encryptSecret,
  decryptSecret,
  getTotpUri,
  generateQrCodeDataUrl,
  generateBackupCodes,
  hashBackupCodes,
  verifyTotpCode,
} from "@/lib/auth/mfa";

/**
 * GET /api/auth/mfa/setup
 * Gibt temporäres TOTP-Secret + QR-Code zurück.
 * Das Secret wird noch NICHT in der DB gespeichert – erst nach Bestätigung via POST.
 */
export async function GET() {
  try {
    const user = await requireActiveUser();
    const secret = generateTotpSecret();
    const uri = getTotpUri(secret, user.email);
    const qrCode = await generateQrCodeDataUrl(uri);
    // Secret temporär verschlüsselt zurückgeben (wird im Client während Setup gehalten)
    const encryptedSecret = encryptSecret(secret);
    return NextResponse.json({ encryptedSecret, qrCode, uri });
  } catch (err) {
    return handleGuardError(err);
  }
}

/**
 * POST /api/auth/mfa/setup
 * Verifiziert den TOTP-Code, aktiviert MFA und speichert Secret + Backup-Codes.
 * Body: { encryptedSecret: string, totpCode: string }
 */
export async function POST(req: Request) {
  try {
    const user = await requireActiveUser();
    const { encryptedSecret, totpCode } = await req.json();

    if (!encryptedSecret || !totpCode) {
      return NextResponse.json({ error: "encryptedSecret und totpCode erforderlich" }, { status: 400 });
    }

    // Code verifizieren
    const valid = verifyTotpCode(String(totpCode), encryptedSecret);
    if (!valid) {
      return NextResponse.json({ error: "Ungültiger TOTP-Code" }, { status: 400 });
    }

    // Backup-Codes generieren (Plaintext → Client, Hash → DB)
    const plainCodes = generateBackupCodes();
    const hashedCodes = hashBackupCodes(plainCodes);

    // In DB speichern
    await prisma.user.update({
      where: { id: user.id },
      data: {
        mfaEnabled: true,
        mfaSecret: encryptedSecret,
        mfaBackupCodes: hashedCodes,
      },
    });

    return NextResponse.json({ success: true, backupCodes: plainCodes });
  } catch (err) {
    return handleGuardError(err);
  }
}

/**
 * DELETE /api/auth/mfa/setup
 * Deaktiviert MFA komplett.
 * Body: { totpCode: string } – Bestätigung per Code
 */
export async function DELETE(req: Request) {
  try {
    const user = await requireActiveUser();
    const { totpCode } = await req.json();

    // Aktuellen DB-User laden
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { mfaEnabled: true, mfaSecret: true },
    });

    if (!dbUser?.mfaEnabled || !dbUser.mfaSecret) {
      return NextResponse.json({ error: "MFA ist nicht aktiv" }, { status: 400 });
    }

    if (!verifyTotpCode(String(totpCode), dbUser.mfaSecret)) {
      return NextResponse.json({ error: "Ungültiger TOTP-Code" }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { mfaEnabled: false, mfaSecret: null, mfaBackupCodes: [] },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    return handleGuardError(err);
  }
}
