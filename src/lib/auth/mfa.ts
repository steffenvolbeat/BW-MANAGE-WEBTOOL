/**
 * MFA / 2FA – TOTP (RFC 6238)
 * Kompatibel mit Google Authenticator, Authy, Microsoft Authenticator, etc.
 */
import { generateSecret as otplibGenerateSecret, generateURI, verifySync } from "otplib";
import QRCode from "qrcode";
import crypto from "crypto";

const APP_NAME = "BW-Manage";
const BACKUP_CODE_COUNT = 10;
const BACKUP_CODE_LENGTH = 10;

// ─── Encryption (AES-256-GCM) für gespeicherte Secrets ───────────────────────

function encryptionKey(): Buffer {
  const key = process.env.MFA_ENCRYPTION_KEY ?? process.env.JWT_SECRET;
  if (!key) {
    throw new Error("MFA_ENCRYPTION_KEY or JWT_SECRET environment variable must be set");
  }
  return crypto.createHash("sha256").update(key).digest();
}

export function encryptSecret(secret: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(secret, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv.toString("hex"), tag.toString("hex"), encrypted.toString("hex")].join(":");
}

export function decryptSecret(stored: string): string {
  const [ivHex, tagHex, encHex] = stored.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const tag = Buffer.from(tagHex, "hex");
  const encrypted = Buffer.from(encHex, "hex");
  const decipher = crypto.createDecipheriv("aes-256-gcm", encryptionKey(), iv);
  decipher.setAuthTag(tag);
  return decipher.update(encrypted) + decipher.final("utf8");
}

// ─── TOTP ─────────────────────────────────────────────────────────────────────

/** Neues TOTP-Secret generieren */
export function generateTotpSecret(): string {
  return otplibGenerateSecret({ length: 20 });
}

/** TOTP-Code verifizieren (akzeptiert ±1 Zeitfenster = 30s Puffer) */
export function verifyTotpCode(token: string, encryptedSecret: string): boolean {
  try {
    const secret = decryptSecret(encryptedSecret);
    const result = verifySync({ token: token.replace(/\s/g, ""), secret, epochTolerance: 30 });
    return result.valid;
  } catch {
    return false;
  }
}

/** otpauth:// URI für QR-Code-Generation */
export function getTotpUri(secret: string, email: string): string {
  return generateURI({ issuer: APP_NAME, label: email, secret });
}

/** QR-Code als Data-URL (PNG) */
export async function generateQrCodeDataUrl(otpauthUri: string): Promise<string> {
  return QRCode.toDataURL(otpauthUri, {
    errorCorrectionLevel: "M",
    margin: 2,
    width: 256,
    color: { dark: "#1e1b4b", light: "#ffffff" },
  });
}

// ─── Backup-Codes ─────────────────────────────────────────────────────────────

/** 10 zufällige alphanumerische Backup-Codes generieren */
export function generateBackupCodes(): string[] {
  const codes: string[] = [];
  for (let i = 0; i < BACKUP_CODE_COUNT; i++) {
    const raw = crypto.randomBytes(BACKUP_CODE_LENGTH).toString("base64url").slice(0, BACKUP_CODE_LENGTH);
    // Lesbare Formatierung: XXXXX-XXXXX
    codes.push(raw.slice(0, 5).toUpperCase() + "-" + raw.slice(5, 10).toUpperCase());
  }
  return codes;
}

/** Backup-Codes hashen (SHA-256) zum sicheren Speichern */
export function hashBackupCodes(codes: string[]): string[] {
  return codes.map((code) =>
    crypto.createHash("sha256").update(code.replace(/-/g, "").toUpperCase()).digest("hex")
  );
}

/** Einen Backup-Code gegen die gespeicherten Hashes prüfen und bei Treffer entfernen */
export function verifyAndConsumeBackupCode(
  inputCode: string,
  hashedCodes: string[]
): { valid: boolean; remainingCodes: string[] } {
  const inputHash = crypto
    .createHash("sha256")
    .update(inputCode.replace(/-/g, "").toUpperCase())
    .digest("hex");

  const idx = hashedCodes.indexOf(inputHash);
  if (idx === -1) return { valid: false, remainingCodes: hashedCodes };

  const remainingCodes = [...hashedCodes];
  remainingCodes.splice(idx, 1);
  return { valid: true, remainingCodes };
}
