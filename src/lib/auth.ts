/**
 * auth.ts – Kompatibilitäts-Shim (next-auth entfernt)
 *
 * JWT-Auth läuft jetzt über:
 *   src/lib/auth/jwt.ts       – Token sign/verify
 *   src/app/api/auth/*        – Login / Register / Logout / Me
 *   src/components/AuthProvider.tsx – Client-Context
 */

// Re-exports für bestehende Imports, die noch auf dieses Modul zeigen könnten
export { prisma } from "@/lib/database";
export {
  rateLimitSignin,
  recordFailedSignin,
  clearFailedAuth,
  getClientIp,
} from "@/lib/security/rateLimit";
