import { NextRequest, NextResponse } from "next/server";
import { blockReadOnlyRoles, handleGuardError } from "@/lib/security/guard";
import { prisma } from "@/lib/database";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; cid: string }> }
) {
  let user;
  try {
    user = await blockReadOnlyRoles();
  } catch (err) {
    return handleGuardError(err);
  }

  const { id, cid } = await params;

  const comment = await prisma.timelineComment.findFirst({
    where: { id: cid, timelineId: id, userId: user.id },
    select: { id: true },
  });

  if (!comment) {
    return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
  }

  await prisma.timelineComment.delete({ where: { id: cid } });
  return NextResponse.json({ ok: true });
}
