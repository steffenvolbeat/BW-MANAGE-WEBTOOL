import { NextRequest, NextResponse } from "next/server";
import { requireActiveUser, handleGuardError } from "@/lib/security/guard";
import { prisma } from "@/lib/database";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let user;
  try {
    user = await requireActiveUser();
  } catch (err) {
    return handleGuardError(err);
  }

  const { id } = await params;

  const entry = await prisma.applicationTimeline.findFirst({
    where: { id, userId: user.id },
    select: { id: true, pinned: true },
  });

  if (!entry) {
    return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
  }

  const updated = await prisma.applicationTimeline.update({
    where: { id },
    data: { pinned: !entry.pinned },
    select: { id: true, pinned: true },
  });

  return NextResponse.json(updated);
}
