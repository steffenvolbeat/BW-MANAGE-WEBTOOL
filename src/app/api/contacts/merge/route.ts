import { NextResponse } from "next/server";
import { blockReadOnlyRoles, handleGuardError } from "@/lib/security/guard";
import { scopedPrisma } from "@/lib/security/scope";
import { prisma } from "@/lib/database";

function coalesce<T>(a: T | null | undefined, b: T | null | undefined): T | null | undefined {
  return a ?? b;
}

export async function POST(request: Request) {
  let user;
  try {
    user = await blockReadOnlyRoles();
  } catch (err) {
    return handleGuardError(err);
  }

  const body = await request.json();
  const { primaryId, duplicateId } = body as {
    primaryId?: string;
    duplicateId?: string;
  };

  if (!primaryId || !duplicateId) {
    return NextResponse.json({ error: "primaryId und duplicateId sind Pflicht" }, { status: 400 });
  }
  if (primaryId === duplicateId) {
    return NextResponse.json({ error: "IDs müssen unterschiedlich sein" }, { status: 400 });
  }

  const db = scopedPrisma(user.id);

  const [primary, duplicate] = await Promise.all([
    db.contact.findFirst({ where: { id: primaryId } }),
    db.contact.findFirst({ where: { id: duplicateId } }),
  ]);

  if (!primary || !duplicate) {
    return NextResponse.json({ error: "Kontakt nicht gefunden" }, { status: 404 });
  }

  const mergedTags = Array.from(new Set([...(primary.tags ?? []), ...(duplicate.tags ?? [])]));

  const mergedData = {
    firstName: coalesce(primary.firstName, duplicate.firstName)!,
    lastName: coalesce(primary.lastName, duplicate.lastName)!,
    company: coalesce(primary.company, duplicate.company),
    position: coalesce(primary.position, duplicate.position),
    email: coalesce(primary.email, duplicate.email),
    phone: coalesce(primary.phone, duplicate.phone),
    linkedIn: coalesce(primary.linkedIn, duplicate.linkedIn),
    xing: coalesce(primary.xing, duplicate.xing),
    location: coalesce(primary.location, duplicate.location),
    country: coalesce(primary.country, duplicate.country),
    isInland: primary.isInland ?? duplicate.isInland ?? true,
    contactType: coalesce(primary.contactType, duplicate.contactType),
    industry: coalesce(primary.industry, duplicate.industry),
    notesText: coalesce(primary.notesText, duplicate.notesText),
    tags: mergedTags,
    isFavorite: primary.isFavorite || duplicate.isFavorite,
    lastContact: coalesce(primary.lastContact, duplicate.lastContact),
    nextFollowUp: coalesce(primary.nextFollowUp, duplicate.nextFollowUp),
    source: coalesce(primary.source, duplicate.source),
  };

  const updated = await prisma.$transaction(async (tx) => {
    await Promise.all([
      tx.activity.updateMany({ where: { contactId: duplicateId, userId: user.id }, data: { contactId: primaryId } }),
      tx.note.updateMany({ where: { contactId: duplicateId, userId: user.id }, data: { contactId: primaryId } }),
      tx.meeting.updateMany({ where: { contactId: duplicateId, userId: user.id }, data: { contactId: primaryId } }),
      tx.reminder.updateMany({ where: { contactId: duplicateId, userId: user.id }, data: { contactId: primaryId } }),
    ]);
    const result = await tx.contact.update({
      where: { id: primaryId },
      data: mergedData,
      include: { activities: true, notes: true, meetings: true, reminders: true },
    });
    await tx.contact.delete({ where: { id: duplicateId } });
    return result;
  });

  return NextResponse.json({ merged: updated, removedId: duplicateId });
}
