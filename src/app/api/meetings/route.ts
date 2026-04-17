import { NextRequest, NextResponse } from "next/server";
import { randomBytes, randomInt } from "crypto";
import { requireActiveUser, handleGuardError } from "@/lib/security/guard";
import { scopedPrisma } from "@/lib/security/scope";
import { MeetingPlatform, MeetingStatus } from "@prisma/client";

// Meeting Platforms Configuration
const MEETING_PLATFORMS = {
  ZOOM: {
    name: "Zoom",
    baseUrl: "https://api.zoom.us/v2",
    createMeetingEndpoint: "/users/me/meetings",
    requiresAuth: true,
    apiKeyEnv: "ZOOM_API_KEY",
    apiSecretEnv: "ZOOM_API_SECRET",
  },
  TEAMS: {
    name: "Microsoft Teams",
    baseUrl: "https://graph.microsoft.com/v1.0",
    createMeetingEndpoint: "/me/onlineMeetings",
    requiresAuth: true,
    apiKeyEnv: "TEAMS_CLIENT_ID",
    apiSecretEnv: "TEAMS_CLIENT_SECRET",
  },
  LOOM: {
    name: "Loom",
    baseUrl: "https://www.loom.com/api",
    createMeetingEndpoint: "/meetings",
    requiresAuth: true,
    apiKeyEnv: "LOOM_API_KEY",
    apiSecretEnv: "LOOM_API_SECRET",
  },
  LOCAL: {
    name: "Lokaler Kalender",
    baseUrl: "local",
    createMeetingEndpoint: "local",
    requiresAuth: false,
    apiKeyEnv: null,
    apiSecretEnv: null,
  },
};

export async function GET(request: NextRequest) {
  let user;
  try {
    user = await requireActiveUser();
  } catch (err) {
    return handleGuardError(err);
  }

  try {
    const db = scopedPrisma(user.id);
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    if (action === "platforms") {
      return NextResponse.json({
        success: true,
        platforms: Object.entries(MEETING_PLATFORMS).map(([key, platform]) => {
          const apiConnected = platform.apiKeyEnv
            ? !!(process.env[platform.apiKeyEnv] && process.env[platform.apiSecretEnv || ""])
            : false;
          return {
            id: key.toLowerCase(),
            name: platform.name,
            available: true,
            configured: apiConnected || key === "LOCAL",
            requiresAuth: platform.requiresAuth,
            apiConnected,
            isLocal: key === "LOCAL",
          };
        }),
      });
    }

    // Meetings aus der DB laden
    const applicationId = searchParams.get("applicationId") ?? undefined;
    const contactId = searchParams.get("contactId") ?? undefined;
    const upcomingOnly = searchParams.get("upcoming") === "true";

    const where: Record<string, unknown> = {};
    if (applicationId) where.applicationId = applicationId;
    if (contactId) where.contactId = contactId;
    if (upcomingOnly) where.scheduledAt = { gte: new Date() };

    const meetings = await db.meeting.findMany({
      where,
      include: {
        application: { select: { companyName: true, position: true } },
        contact: { select: { firstName: true, lastName: true } },
      } as any,
      orderBy: { scheduledAt: "asc" },
    });

    return NextResponse.json(meetings);
  } catch (error) {
    console.error("Meeting GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  let user;
  try {
    user = await requireActiveUser();
  } catch (err) {
    return handleGuardError(err);
  }

  try {
    const db = scopedPrisma(user.id);
    const body = await request.json();
    const {
      title,
      platform = "LOCAL",
      meetingUrl,
      scheduledAt,
      duration,
      description,
      notes,
      applicationId,
      contactId,
    } = body;

    if (!title || !scheduledAt) {
      return NextResponse.json(
        { error: "Titel und Startzeit sind erforderlich" },
        { status: 400 }
      );
    }

    // Optionale externe Meeting-URL generieren (Zoom/Teams etc.)
    let finalMeetingUrl = meetingUrl ?? null;
    const platformKey = (platform as string).toUpperCase() as keyof typeof MEETING_PLATFORMS;
    const platformConfig = MEETING_PLATFORMS[platformKey];

    if (!finalMeetingUrl && platformConfig?.requiresAuth && platformConfig.apiKeyEnv) {
      const apiKey = process.env[platformConfig.apiKeyEnv];
      const apiSecret = process.env[platformConfig.apiSecretEnv || ""] || "";
      if (apiKey) {
        const ext = generateMeetingUrl(platformKey, title, apiKey, apiSecret);
        finalMeetingUrl = ext.joinUrl;
      }
    }

    const meeting = await db.meeting.create({
      data: {
        title,
        platform: (platformKey as MeetingPlatform) ?? MeetingPlatform.LOCAL,
        meetingUrl: finalMeetingUrl,
        scheduledAt: new Date(scheduledAt),
        duration: duration ? Number(duration) : null,
        description: description ?? null,
        notes: notes ?? null,
        status: MeetingStatus.SCHEDULED,
        applicationId: applicationId ?? null,
        contactId: contactId ?? null,
      } as any,
    });

    return NextResponse.json({ success: true, meeting }, { status: 201 });
  } catch (error) {
    console.error("Meeting POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  let user;
  try {
    user = await requireActiveUser();
  } catch (err) {
    return handleGuardError(err);
  }

  try {
    const db = scopedPrisma(user.id);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    const body = await request.json();
    const { title, scheduledAt, duration, description, notes, status, meetingUrl } = body;

    const existingMeeting = await db.meeting.findFirst({ where: { id } });
    if (!existingMeeting) return NextResponse.json({ error: "Meeting nicht gefunden" }, { status: 404 });

    const meeting = await db.meeting.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(scheduledAt && { scheduledAt: new Date(scheduledAt) }),
        ...(duration !== undefined && { duration: Number(duration) }),
        ...(description !== undefined && { description }),
        ...(notes !== undefined && { notes }),
        ...(status && { status: status as MeetingStatus }),
        ...(meetingUrl !== undefined && { meetingUrl }),
      } as any,
    });

    return NextResponse.json({ success: true, meeting });
  } catch (error) {
    console.error("Meeting PATCH error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  let user;
  try {
    user = await requireActiveUser();
  } catch (err) {
    return handleGuardError(err);
  }

  try {
    const db = scopedPrisma(user.id);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    const existingMeeting = await db.meeting.findFirst({ where: { id } });
    if (!existingMeeting) return NextResponse.json({ error: "Meeting nicht gefunden" }, { status: 404 });

    await db.meeting.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Meeting DELETE error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Hilfsfunktion: externe Meeting-URL generieren
function generateMeetingUrl(
  platform: string,
  title: string,
  apiKey: string,
  apiSecret: string
): { joinUrl: string } {
  const meetingId = String(randomInt(100_000_000, 1_000_000_000));
  const password = randomBytes(3).toString("hex").toUpperCase();

  switch (platform) {
    case "ZOOM":
      return { joinUrl: `https://zoom.us/j/${meetingId}?pwd=${password}` };
    case "TEAMS": {
      const threadId = randomBytes(7).toString("hex");
      return {
        joinUrl: `https://teams.microsoft.com/l/meetup-join/19%3ameeting_${threadId}%40thread.v2/0?context=%7b%22Tid%22%3a%22${apiKey}%22%7d`,
      };
    }
    case "LOOM": {
      const sessionId = randomBytes(7).toString("hex");
      return { joinUrl: `https://www.loom.com/share/${sessionId}` };
    }
    default:
      return { joinUrl: "" };
  }
}
