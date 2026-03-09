import { NextResponse } from "next/server";
import { getCurrentUser, AppUser } from "@/lib/currentUser";

export type { AppUser as SessionUser };

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
