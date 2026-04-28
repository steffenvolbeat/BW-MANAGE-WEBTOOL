/**
 * Smart Follow-up API
 * GET  /api/follow-ups        → offene Follow-ups
 * POST /api/follow-ups        → neuen Follow-up erstellen
 * PATCH /api/follow-ups/[id]  → als erledigt markieren
 */
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/currentUser";
import { prisma } from "@/lib/database";

const VALID_FOLLOWUP_TYPES = ["EMAIL", "PHONE", "LINKEDIN", "IN_PERSON"] as const;

async function callClaude(prompt: string, imageBase64?: string, imageMediaType?: string): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not set");
  const content: string | unknown[] = imageBase64
    ? [
        { type: "image", source: { type: "base64", media_type: imageMediaType ?? "image/jpeg", data: imageBase64 } },
        { type: "text", text: prompt },
      ]
    : prompt;
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "Content-Type": "application/json" },
    body: JSON.stringify({ model: "claude-3-5-haiku-20241022", max_tokens: 2048, messages: [{ role: "user", content }] }),
  });
  if (!res.ok) throw new Error(`Anthropic ${res.status}`);
  const data = await res.json();
  return data.content?.[0]?.text ?? "{}";
}


export async function GET() {
  try {
    const user = await getCurrentUser();

    const followUps = await prisma.followUp.findMany({
      where: { userId: user.id, isDone: false },
      orderBy: { dueAt: "asc" },
    });

    // Überfällige markieren
    const now = new Date();
    const enriched = followUps.map((f) => ({
      ...f,
      isOverdue: f.dueAt < now,
      daysUntilDue: Math.ceil((f.dueAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
    }));

    return NextResponse.json({ followUps: enriched, count: followUps.length });
  } catch (e: unknown) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
    }
    return NextResponse.json({ error: "Fehler" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (user.role === "MANAGER" || user.role === "VERMITTLER") {
      return NextResponse.json({ error: "Keine Schreibrechte" }, { status: 403 });
    }
    const { applicationId, contactId, dueAt, type = "EMAIL", subject, generateDraft, context } = await req.json();

    if (!dueAt || !subject) {
      return NextResponse.json({ error: "dueAt und subject erforderlich" }, { status: 400 });
    }

    // Enum-Validierung
    if (type && !VALID_FOLLOWUP_TYPES.includes(type)) {
      return NextResponse.json({ error: `Ungültiger type-Wert. Erlaubt: ${VALID_FOLLOWUP_TYPES.join(", ")}` }, { status: 400 });
    }

    // Invalid-Date-Check
    const parsedDueAt = new Date(dueAt);
    if (isNaN(parsedDueAt.getTime())) {
      return NextResponse.json({ error: "Ungültiges Datumsformat für dueAt" }, { status: 400 });
    }

    // IDOR-Checks: applicationId/contactId müssen dem User gehören
    if (applicationId) {
      const app = await prisma.application.findFirst({ where: { id: applicationId, userId: user.id } });
      if (!app) return NextResponse.json({ error: "Bewerbung nicht gefunden oder kein Zugriff" }, { status: 404 });
    }
    if (contactId) {
      const contact = await prisma.contact.findFirst({ where: { id: contactId, userId: user.id } });
      if (!contact) return NextResponse.json({ error: "Kontakt nicht gefunden oder kein Zugriff" }, { status: 404 });
    }

    let aiDraft: string | null = null;

    if (generateDraft && context) {
      const prompt = `Erstelle einen professionellen, kurzen Follow-up-${type === "EMAIL" ? "E-Mail-Text" : "Nachrichtentext"} auf Deutsch.
      
Kontext: ${context}
Betreff: ${subject}
Art: ${type}

Halte es kurz (max. 3 Absätze), professionell und freundlich. Beginne direkt mit dem Text, ohne Begrüßungsformel oder Signatur.`;

      aiDraft = await callClaude(prompt);
    }

    const followUp = await prisma.followUp.create({
      data: {
        userId: user.id,
        applicationId: applicationId ?? null,
        contactId: contactId ?? null,
        dueAt: parsedDueAt,
        type,
        subject,
        aiDraft,
      },
    });

    return NextResponse.json({ followUp }, { status: 201 });
  } catch (e: unknown) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
    }
    return NextResponse.json({ error: "Fehler" }, { status: 500 });
  }
}
