/**
 * PATCH /api/auth/webauthn/credential/[id]  – Gerät umbenennen
 * DELETE /api/auth/webauthn/credential/[id] – Gerät entfernen
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database";
import { requireActiveUser } from "@/lib/security/guard";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const user = await requireActiveUser().catch(() => null);
    if (!user) return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });

    const { id } = await params;
    const { name } = await req.json();
    if (!name?.trim()) return NextResponse.json({ error: "Name erforderlich" }, { status: 400 });

    const credential = await prisma.webAuthnCredential.findFirst({
      where: { id, userId: user.id },
    });
    if (!credential) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });

    const updated = await prisma.webAuthnCredential.update({
      where: { id },
      data: { name: name.trim() },
    });

    return NextResponse.json({ id: updated.id, name: updated.name });
  } catch (err) {
    console.error("webauthn credential PATCH error:", err);
    return NextResponse.json({ error: "Interner Fehler" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const user = await requireActiveUser().catch(() => null);
    if (!user) return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });

    const { id } = await params;

    const credential = await prisma.webAuthnCredential.findFirst({
      where: { id, userId: user.id },
    });
    if (!credential) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });

    await prisma.webAuthnCredential.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("webauthn credential DELETE error:", err);
    return NextResponse.json({ error: "Interner Fehler" }, { status: 500 });
  }
}
