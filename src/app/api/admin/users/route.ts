import { NextResponse } from "next/server";
import { requireAdmin, handleGuardError } from "@/lib/security/guard";
import { prisma } from "@/lib/database";

// GET /api/admin/users – alle User auflisten
export async function GET() {
  try {
    await requireAdmin();
  } catch (err) {
    return handleGuardError(err);
  }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      status: true,
      createdAt: true,
      emailVerified: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ users });
}

const VALID_ROLES = ["USER", "ADMIN"] as const;
const VALID_STATUSES = ["ACTIVE", "INACTIVE", "SUSPENDED"] as const;

// PATCH /api/admin/users – Rolle oder Status eines Users ändern
export async function PATCH(req: Request) {
  try {
    const currentAdmin = await requireAdmin();

    const body = await req.json();
    const { userId, role, status } = body as {
      userId: string;
      role?: "USER" | "ADMIN";
      status?: "ACTIVE" | "INACTIVE" | "SUSPENDED";
    };

    if (!userId) {
      return NextResponse.json({ error: "userId fehlt" }, { status: 400 });
    }

    // Prevent self-demotion / self-lockout
    if (userId === currentAdmin.id) {
      return NextResponse.json({ error: "Eigene Rolle/Status kann nicht geändert werden." }, { status: 400 });
    }

    // Runtime enum validation
    if (role !== undefined && !VALID_ROLES.includes(role as typeof VALID_ROLES[number])) {
      return NextResponse.json({ error: "Ungültige Rolle." }, { status: 400 });
    }
    if (status !== undefined && !VALID_STATUSES.includes(status as typeof VALID_STATUSES[number])) {
      return NextResponse.json({ error: "Ungültiger Status." }, { status: 400 });
    }

    const updateData: Record<string, string> = {};
    if (role)   updateData.role   = role;
    if (status) updateData.status = status;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "Keine Änderungen angegeben" }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: { id: true, email: true, name: true, role: true, status: true },
    });

    return NextResponse.json({ user: updated });
  } catch (err: unknown) {
    if ((err as { code?: string })?.code === "P2025") {
      return NextResponse.json({ error: "User nicht gefunden" }, { status: 404 });
    }
    return handleGuardError(err);
  }
}
