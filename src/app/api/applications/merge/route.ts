import { NextResponse } from "next/server";
import { requireActiveUser, handleGuardError } from "@/lib/security/guard";
import { scopedPrisma } from "@/lib/security/scope";

function coalesce<T>(a: T | null | undefined, b: T | null | undefined): T | null | undefined {
  return a ?? b;
}

export async function POST(request: Request) {
  let user;
  try {
    user = await requireActiveUser();
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
    db.application.findFirst({ where: { id: primaryId } }),
    db.application.findFirst({ where: { id: duplicateId } }),
  ]);

  if (!primary || !duplicate) {
    return NextResponse.json({ error: "Bewerbung nicht gefunden" }, { status: 404 });
  }

  const mergedData = {
    companyName: coalesce(primary.companyName, duplicate.companyName)!,
    position: coalesce(primary.position, duplicate.position)!,
    location: coalesce(primary.location, duplicate.location)!,
    country: coalesce(primary.country, duplicate.country)!,
    isInland: primary.isInland ?? duplicate.isInland ?? true,
    status: coalesce(primary.status, duplicate.status),
    priority: coalesce(primary.priority, duplicate.priority),
    jobType: coalesce(primary.jobType, duplicate.jobType),
    salary: coalesce(primary.salary, duplicate.salary),
    jobUrl: coalesce(primary.jobUrl, duplicate.jobUrl),
    companyUrl: coalesce(primary.companyUrl, duplicate.companyUrl),
    appliedAt: coalesce(primary.appliedAt, duplicate.appliedAt),
    responseAt: coalesce(primary.responseAt, duplicate.responseAt),
    notesText: coalesce(primary.notesText, duplicate.notesText),
    requirements: coalesce(primary.requirements, duplicate.requirements),
  };

  // Relations auf primary verschieben
  await Promise.all([
    db.raw.activity.updateMany({ where: { applicationId: duplicateId, userId: user.id }, data: { applicationId: primaryId } }),
    db.raw.note.updateMany({ where: { applicationId: duplicateId, userId: user.id }, data: { applicationId: primaryId } }),
    db.raw.meeting.updateMany({ where: { applicationId: duplicateId, userId: user.id }, data: { applicationId: primaryId } }),
    db.raw.reminder.updateMany({ where: { applicationId: duplicateId, userId: user.id }, data: { applicationId: primaryId } }),
    db.raw.event.updateMany({ where: { applicationId: duplicateId, userId: user.id }, data: { applicationId: primaryId } }),
    db.raw.applicationDocument.updateMany({ where: { applicationId: duplicateId }, data: { applicationId: primaryId } }),
  ]);

  const updated = await db.application.update({
    where: { id: primaryId },
    data: mergedData,
    include: {
      documents: true,
      activities: true,
      events: true,
      notes: true,
      meetings: true,
      reminders: true,
    },
  });

  await db.application.delete({ where: { id: duplicateId } });

  return NextResponse.json({ merged: updated, removedId: duplicateId });
}
