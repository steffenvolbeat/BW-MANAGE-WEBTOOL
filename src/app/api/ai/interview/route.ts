import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/currentUser";
import { prisma } from "@/lib/database";
import { buildSystemPrompt, analyzeMessage, generateFeedback } from "@/lib/ai/interviewSimulator";
import type { InterviewDifficulty } from "@/lib/ai/interviewSimulator";

// POST /api/ai/interview – Startet eine neue Interview-Session
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user.id) {
    return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });
  }

  const { jobTitle, company, difficulty, applicationId, mode } = await req.json() as {
    jobTitle: string;
    company?: string;
    difficulty: InterviewDifficulty;
    applicationId?: string;
    mode: "TEXT" | "VOICE";
  };

  if (!jobTitle) {
    return NextResponse.json({ error: "jobTitle erforderlich" }, { status: 400 });
  }

  // Erstelle Session
  const interviewSession = await prisma.interviewSession.create({
    data: {
      userId: user.id,
      applicationId: applicationId ?? null,
      jobTitle,
      company: company ?? "",
      difficulty,
      mode,
      status: "ACTIVE",
    },
  });

  // Erster Interviewer-Prompt
  const systemPrompt = buildSystemPrompt(
    { jobTitle, company: company ?? "dem Unternehmen", difficulty, mode },
    "INTRO"
  );

  const openingMessage = `Guten Tag! Ich bin Ihr Ansprechpartner für das Gespräch um die Stelle "${jobTitle}"${company ? ` bei ${company}` : ""}. Schön, dass Sie sich die Zeit nehmen.

Bitte stellen Sie sich kurz vor: Wer sind Sie, und was hat Sie dazu bewogen, sich auf diese Position zu bewerben?`;

  const message = await prisma.interviewMessage.create({
    data: {
      sessionId: interviewSession.id,
      role: "interviewer",
      content: openingMessage,
    },
  });


  return NextResponse.json({
    sessionId: interviewSession.id,
    message: {
      id: message.id,
      role: message.role,
      content: message.content,
      createdAt: message.createdAt,
    },
  });
}

// GET /api/ai/interview – Alle Sessions
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user.id) {
    return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });
  }

  const sessions = await prisma.interviewSession.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 20,
    include: {
      _count: { select: { messages: true } },
    },
  });

  return NextResponse.json({ sessions });
}
