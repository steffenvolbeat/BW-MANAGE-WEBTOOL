/**
 * DSGVO-Export: Alle Benutzerdaten als JSON exportieren
 * GET /api/user/export
 */
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/currentUser";
import { prisma } from "@/lib/database";

export async function GET() {
  try {
    const user = await getCurrentUser();

    const [
      applications,
      documents,
      contacts,
      activities,
      events,
      notes,
      meetings,
      reminders,
      interviewSessions,
      legalContracts,
      moodEntries,
      achievements,
      followUps,
    ] = await Promise.all([
      prisma.application.findMany({ where: { userId: user.id } }),
      prisma.document.findMany({ where: { userId: user.id }, select: { id: true, name: true, type: true, uploadedAt: true, tags: true, description: true } }),
      prisma.contact.findMany({ where: { userId: user.id } }),
      prisma.activity.findMany({ where: { userId: user.id } }),
      prisma.event.findMany({ where: { userId: user.id } }),
      prisma.note.findMany({ where: { userId: user.id } }),
      prisma.meeting.findMany({ where: { userId: user.id } }),
      prisma.reminder.findMany({ where: { userId: user.id } }),
      prisma.interviewSession.findMany({ where: { userId: user.id }, include: { messages: true } }),
      prisma.legalContract.findMany({ where: { userId: user.id } }),
      prisma.moodEntry.findMany({ where: { userId: user.id } }),
      prisma.achievement.findMany({ where: { userId: user.id } }),
      prisma.followUp.findMany({ where: { userId: user.id } }),
    ]);

    const exportData = {
      exportDate: new Date().toISOString(),
      exportVersion: "1.0",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      data: {
        applications,
        documents,
        contacts,
        activities,
        events,
        notes,
        meetings,
        reminders,
        interviewSessions,
        legalContracts,
        moodEntries,
        achievements,
        followUps,
      },
      summary: {
        totalApplications: applications.length,
        totalContacts: contacts.length,
        totalDocuments: documents.length,
        totalNotes: notes.length,
        totalActivities: activities.length,
        totalMoodEntries: moodEntries.length,
        totalAchievements: achievements.length,
      },
    };

    const json = JSON.stringify(exportData, null, 2);
    const filename = `bw-manage-export-${new Date().toISOString().slice(0, 10)}.json`;

    return new NextResponse(json, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (e: unknown) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
    }
    return NextResponse.json({ error: "Export fehlgeschlagen" }, { status: 500 });
  }
}
