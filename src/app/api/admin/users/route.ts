import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
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

const VALID_ROLES = ["USER", "ADMIN", "MANAGER", "VERMITTLER"] as const;
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

    // Letzten aktiven Admin schützen
    if (role === "USER" || status === "INACTIVE" || status === "SUSPENDED") {
      const targetUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true, status: true },
      });
      if (targetUser?.role === "ADMIN" && targetUser.status === "ACTIVE") {
        const activeAdminCount = await prisma.user.count({
          where: { role: "ADMIN", status: "ACTIVE" },
        });
        if (activeAdminCount <= 1) {
          return NextResponse.json(
            { error: "Kann nicht den letzten aktiven Admin sperren oder degradieren." },
            { status: 400 }
          );
        }
      }
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

/**
 * POST /api/admin/users
 * Legt einen neuen Benutzer an (nur Admin).
 * Body: { name, email, password, role }
 */
export async function POST(req: Request) {
  try {
    await requireAdmin();
  } catch (err) {
    return handleGuardError(err);
  }

  const body = await req.json();
  const { name, email, password, role } = body ?? {};

  if (!name || typeof name !== "string" || name.trim().length < 2 || name.length > 100) {
    return NextResponse.json({ error: "Name muss 2\u2013100 Zeichen lang sein." }, { status: 400 });
  }

  const EMAIL_REGEX = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
  if (!email || typeof email !== "string" || !EMAIL_REGEX.test(email) || email.length > 254) {
    return NextResponse.json({ error: "Ung\u00fcltige E-Mail-Adresse." }, { status: 400 });
  }

  if (!password || typeof password !== "string" || password.length < 8 || password.length > 128) {
    return NextResponse.json({ error: "Passwort muss 8\u2013128 Zeichen lang sein." }, { status: 400 });
  }

  if (!VALID_ROLES.includes(role)) {
    return NextResponse.json({ error: "Ung\u00fcltige Rolle." }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
  if (existing) {
    return NextResponse.json({ error: "Diese E-Mail-Adresse ist bereits registriert." }, { status: 409 });
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      email: email.toLowerCase().trim(),
      name: name.trim(),
      password: hashedPassword,
      role,
      status: "ACTIVE",
      emailVerified: false,
    },
    select: { id: true, email: true, name: true, role: true, status: true, createdAt: true, emailVerified: true },
  });

  return NextResponse.json({ user }, { status: 201 });
}
