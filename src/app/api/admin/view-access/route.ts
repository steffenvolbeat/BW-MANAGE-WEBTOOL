import { NextResponse } from "next/server";
import { requireAdmin, handleGuardError } from "@/lib/security/guard";
import { prisma } from "@/lib/database";

/**
 * GET /api/admin/view-access
 * Listet alle ViewAccessGrants auf (inkl. grantee- & target-Details).
 */
export async function GET() {
  try {
    await requireAdmin();
  } catch (err) {
    return handleGuardError(err);
  }

  const grants = await prisma.viewAccessGrant.findMany({
    include: {
      grantee: { select: { id: true, name: true, email: true, role: true } },
      target: { select: { id: true, name: true, email: true, role: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ grants });
}

/**
 * POST /api/admin/view-access
 * Body: { granteeId: string, targetId: string }
 * Erstellt einen neuen Lesezugriff-Grant.
 */
export async function POST(request: Request) {
  try {
    await requireAdmin();
  } catch (err) {
    return handleGuardError(err);
  }

  const body = await request.json();
  const { granteeId, targetId } = body ?? {};

  if (!granteeId || typeof granteeId !== "string") {
    return NextResponse.json({ error: "granteeId erforderlich" }, { status: 400 });
  }
  if (!targetId || typeof targetId !== "string") {
    return NextResponse.json({ error: "targetId erforderlich" }, { status: 400 });
  }
  if (granteeId === targetId) {
    return NextResponse.json({ error: "granteeId und targetId dürfen nicht gleich sein" }, { status: 400 });
  }

  // Prüfe, dass grantee MANAGER oder VERMITTLER ist
  const grantee = await prisma.user.findUnique({
    where: { id: granteeId },
    select: { role: true },
  });
  if (!grantee) {
    return NextResponse.json({ error: "Grantee-User nicht gefunden" }, { status: 404 });
  }
  if (!["MANAGER", "VERMITTLER"].includes(grantee.role)) {
    return NextResponse.json(
      { error: "Nur MANAGER oder VERMITTLER können Lesezugriff erhalten" },
      { status: 422 }
    );
  }

  const grant = await prisma.viewAccessGrant.upsert({
    where: { granteeId_targetId: { granteeId, targetId } },
    create: { granteeId, targetId },
    update: {}, // bereits vorhanden → nichts ändern
    include: {
      grantee: { select: { id: true, name: true, email: true, role: true } },
      target: { select: { id: true, name: true, email: true, role: true } },
    },
  });

  return NextResponse.json({ grant }, { status: 201 });
}

/**
 * DELETE /api/admin/view-access?granteeId=x&targetId=y
 * Widerruft einen Lesezugriff-Grant.
 */
export async function DELETE(request: Request) {
  try {
    await requireAdmin();
  } catch (err) {
    return handleGuardError(err);
  }

  const { searchParams } = new URL(request.url);
  const granteeId = searchParams.get("granteeId");
  const targetId = searchParams.get("targetId");

  if (!granteeId || !targetId) {
    return NextResponse.json({ error: "granteeId und targetId als Query-Parameter erforderlich" }, { status: 400 });
  }

  try {
    await prisma.viewAccessGrant.delete({
      where: { granteeId_targetId: { granteeId, targetId } },
    });
  } catch {
    return NextResponse.json({ error: "Grant nicht gefunden" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
