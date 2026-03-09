/**
 * Server-only: Liest den aktuellen Benutzer aus dem JWT-Session-Cookie.
 */
import { prisma } from "@/lib/database";
import { getSessionFromCookie } from "@/lib/auth/jwt";

export interface AppUser {
  id: string;
  email: string;
  name: string;
  role: string;
  avatarUrl?: string | null;
}

export async function getCurrentUser(): Promise<AppUser> {
  const session = await getSessionFromCookie();
  if (!session?.sub) throw new Error("UNAUTHORIZED");

  const u = await prisma.user.findUnique({
    where: { id: session.sub },
    select: { id: true, email: true, name: true, role: true, avatarUrl: true, status: true },
  });

  if (!u || u.status === "INACTIVE" || u.status === "SUSPENDED") {
    throw new Error("UNAUTHORIZED");
  }

  return {
    id: u.id,
    email: u.email,
    name: u.name ?? "Nutzer",
    role: u.role,
    avatarUrl: u.avatarUrl,
  };
}
