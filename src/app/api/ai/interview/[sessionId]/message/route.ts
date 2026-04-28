import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/currentUser";
import { prisma } from "@/lib/database";
import { enforceRateLimit } from "@/lib/security/rateLimit";
import {
  analyzeMessage,
  generateFeedback,
  buildSystemPrompt,
  type InterviewMessage,
} from "@/lib/ai/interviewSimulator";

// POST /api/ai/interview/[sessionId]/message – Neue Kandidaten-Nachricht + KI-Antwort
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const rl = enforceRateLimit(req, "ai:interview-message", { max: 60, windowMs: 60 * 60_000 });
  if (rl) return rl;

  let user;
  try {
    user = await getCurrentUser();
  } catch {
    return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });
  }
  if (user.role === "MANAGER" || user.role === "VERMITTLER") {
    return NextResponse.json({ error: "Keine Schreibberechtigung" }, { status: 403 });
  }

  const { sessionId } = await params;
  const { content } = await req.json();

  if (!content || content.trim().length === 0) {
    return NextResponse.json({ error: "Inhalt erforderlich" }, { status: 400 });
  }

  // Session verifizieren
  const ivSession = await prisma.interviewSession.findFirst({
    where: { id: sessionId, userId: user.id, status: "ACTIVE" },
    include: {
      messages: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!ivSession) {
    return NextResponse.json({ error: "Session nicht gefunden" }, { status: 404 });
  }

  // Kandidaten-Nachricht analysieren
  const metrics = analyzeMessage(content);

  // Kandidaten-Nachricht speichern
  await prisma.interviewMessage.create({
    data: {
      sessionId,
      role: "candidate",
      content,
      fillerWords: metrics.fillerWords,
      starMethod: metrics.starMethodDetected,
      sentiment: metrics.sentiment,
    },
  });

  // Phase bestimmen
  const msgCount = ivSession.messages.length;
  const phase =
    msgCount <= 2 ? "INTRO" :
    msgCount <= 6 ? "TECHNICAL" :
    msgCount <= 10 ? "BEHAVIORAL" : "WRAP_UP";

  // LLM-Antwort (lokal über Ollama oder API)
  let interviewerResponse: string;

  try {
    const ollamaUrl = process.env.OLLAMA_URL ?? "http://localhost:11434";
    const model = process.env.INTERVIEW_LLM_MODEL ?? "llama3.2";

    const systemPrompt = buildSystemPrompt(
      {
        jobTitle: ivSession.jobTitle,
        company: ivSession.company ?? "dem Unternehmen",
        difficulty: ivSession.difficulty as "EASY" | "MEDIUM" | "HARD",
        mode: ivSession.mode as "TEXT" | "VOICE",
      },
      phase as "INTRO" | "TECHNICAL" | "BEHAVIORAL" | "WRAP_UP"
    );

    // Kontext aus vorherigen Nachrichten aufbauen
    const historyMessages = ivSession.messages.slice(-6).map((m) => ({
      role: m.role === "interviewer" ? "assistant" : "user",
      content: m.content,
    }));

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    const ollamaRes = await fetch(`${ollamaUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        stream: false,
        messages: [
          { role: "system", content: systemPrompt },
          ...historyMessages,
          { role: "user", content },
        ],
      }),
    });

    clearTimeout(timeout);

    if (ollamaRes.ok) {
      const data = await ollamaRes.json();
      interviewerResponse = data.message?.content ?? getFallbackResponse(phase);
    } else {
      interviewerResponse = getFallbackResponse(phase);
    }
  } catch {
    interviewerResponse = getFallbackResponse(phase);
  }

  // Interviewer-Antwort speichern
  const ivMessage = await prisma.interviewMessage.create({
    data: {
      sessionId,
      role: "interviewer",
      content: interviewerResponse,
    },
  });

  // Auto-Abschluss nach WRAP_UP
  if (phase === "WRAP_UP" && ivSession.messages.length > 10) {
    const allMessages = await prisma.interviewMessage.findMany({
      where: { sessionId },
    });

    const formattedMessages: InterviewMessage[] = allMessages.map((m) => ({
      role: m.role as "interviewer" | "candidate",
      content: m.content,
      metrics: m.role === "candidate" ? analyzeMessage(m.content) : undefined,
    }));

    const feedback = generateFeedback(formattedMessages);

    await prisma.interviewSession.update({
      where: { id: sessionId },
      data: {
        status: "COMPLETED",
        score: feedback.overallScore,
        feedback: feedback as unknown as object,
        durationMin: Math.round(
          (Date.now() - new Date(ivSession.createdAt).getTime()) / 60000
        ),
      },
    });
  }

  return NextResponse.json({
    message: {
      id: ivMessage.id,
      role: ivMessage.role,
      content: ivMessage.content,
      createdAt: ivMessage.createdAt,
    },
    candidateMetrics: metrics,
    phase,
  });
}

function getFallbackResponse(phase: string): string {
  const responses: Record<string, string> = {
    INTRO: "Vielen Dank für die Vorstellung. Können Sie mir mehr über Ihre technische Erfahrung erzählen?",
    TECHNICAL: "Interessant. Können Sie mir ein konkretes Beispiel aus Ihrer beruflichen Praxis nennen, wo Sie diese Technologie eingesetzt haben?",
    BEHAVIORAL: "Erzählen Sie mir von einer Situation, in der Sie mit einem schwierigen Team-Konflikt umgehen mussten. Wie sind Sie vorgegangen?",
    WRAP_UP: "Vielen Dank für dieses aufschlussreiche Gespräch. Haben Sie noch Fragen zu der Position oder zum Unternehmen?",
  };
  return responses[phase] ?? responses.TECHNICAL;
}
