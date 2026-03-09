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

// PATCH /api/admin/users – Rolle oder Status eines Users ändern
export async function PATCH(req: Request) {
  try {
    await requireAdmin();
  } catch (err) {
    return handleGuardError(err);
  }

  const body = await req.json();
  const { userId, role, status } = body as {
    userId: string;
    role?: "USER" | "ADMIN";
    status?: "ACTIVE" | "INACTIVE" | "SUSPENDED";
  };

  if (!userId) {
    return NextResponse.json({ error: "userId fehlt" }, { status: 400 });
  }

  const updateData: Record<string, string> = {};
  if (role) updateData.role = role;
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
}
