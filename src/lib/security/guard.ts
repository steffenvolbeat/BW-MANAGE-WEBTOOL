import { NextResponse } from "next/server";
import { getCurrentUser, AppUser } from "@/lib/currentUser";
import { prisma } from "@/lib/database";

export type { AppUser as SessionUser };

/** Rollen, die ausschließlich Lesezugriff haben (kein Schreiben, Löschen, Bearbeiten). */
export const READ_ONLY_ROLES = ["MANAGER", "VERMITTLER"] as const;
export type ReadOnlyRole = typeof READ_ONLY_ROLES[number];

export function isReadOnlyRole(role: string): role is ReadOnlyRole {
  return (READ_ONLY_ROLES as readonly string[]).includes(role);
}

export async function requireActiveUser(): Promise<AppUser> {
  return getCurrentUser();
}

export async function requireAdmin(): Promise<AppUser> {
  const user = await getCurrentUser();
  if (user.role !== "ADMIN") {
    const error = new Error("FORBIDDEN");
    (error as any).code = "FORBIDDEN";
    throw error;
  }
  return user;
}

/**
 * Wirft FORBIDDEN, wenn der aktuelle User ein MANAGER oder VERMITTLER ist.
 * Für alle schreibenden API-Methoden (POST / PUT / PATCH / DELETE).
 */
export async function blockReadOnlyRoles(): Promise<AppUser> {
  const user = await getCurrentUser();
  if (isReadOnlyRole(user.role)) {
    const err = new Error("FORBIDDEN");
    (err as any).code = "FORBIDDEN";
    throw err;
  }
  return user;
}

/**
 * Für API-GET-Routen mit Observer-Unterstützung.
 * - USER/ADMIN:          Gibt immer die eigene userId zurück (viewAs wird ignoriert).
 * - MANAGER/VERMITTLER:  Prüft den ViewAccessGrant; bei fehlendem Grant → FORBIDDEN.
 */
export async function resolveTargetUserId(viewAs?: string | null): Promise<string> {
  const user = await getCurrentUser();

  if (!isReadOnlyRole(user.role)) {
    return user.id;
  }

  if (!viewAs) {
    const err = new Error("FORBIDDEN");
    (err as any).code = "FORBIDDEN";
    throw err;
  }

  const grant = await prisma.viewAccessGrant.findUnique({
    where: { granteeId_targetId: { granteeId: user.id, targetId: viewAs } },
    select: { targetId: true },
  });

  if (!grant) {
    const err = new Error("FORBIDDEN");
    (err as any).code = "FORBIDDEN";
    throw err;
  }

  return grant.targetId;
}

export function assertSameUser(claimedId: string | null, sessionId: string) {
  if (claimedId && claimedId !== sessionId) {
    const error = new Error("FORBIDDEN");
    (error as any).code = "FORBIDDEN";
    throw error;
  }
}

/** Konvertiert Guard-Fehler in typisierte NextResponse-Antworten. */
export function handleGuardError(err: unknown): NextResponse {
  const msg = err instanceof Error ? err.message : "INTERNAL_ERROR";
  const code = (err as any)?.code ?? msg;

  if (code === "UNAUTHORIZED" || msg === "UNAUTHORIZED") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (code === "FORBIDDEN" || msg === "FORBIDDEN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (code === "ACCESS_DENIED") {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}
