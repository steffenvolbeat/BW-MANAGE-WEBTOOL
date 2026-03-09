import { NextResponse } from "next/server";
import { requireActiveUser, handleGuardError } from "@/lib/security/guard";
import { enforceRateLimit } from "@/lib/security/rateLimit";
import { getCoachSuggestion, CoachRequest } from "@/lib/ai/coach";

const LOCAL_LIMIT = 2_800;

function sanitize(text: string | undefined) {
  if (!text || typeof text !== "string") return "";
  return text.replace(/\s+/g, " ").trim().slice(0, LOCAL_LIMIT);
}

function deriveMissingKeywords(source: string, applicantText: string) {
  const words = source
    .split(/[,;\n\.]/)
    .map((w) => w.trim())
    .filter((w) => w.length > 3)
    .slice(0, 120);
  const unique = Array.from(new Set(words.map((w) => w.toLowerCase())));
  const text = applicantText.toLowerCase();
  return unique.filter((kw) => !text.includes(kw)).slice(0, 25);
}

async function runClaudePrivacyCoach(input: {
  applicantText: string;
  requirements?: string;
  jobDescription?: string;
  position?: string;
  company?: string;
}) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY fehlt" }, { status: 400 });
  }

  const model = process.env.ANTHROPIC_MODEL || "claude-3-haiku-20240307";
  const prompt = `Job: ${input.position || "-"} @ ${input.company || "-"}.
Anforderungen: ${input.requirements || input.jobDescription || "-"}.
Profil/Anschreiben: ${input.applicantText}.
Aufgabe: Gib kurzes Feedback (max 6 Zeilen) und nenne fehlende Keywords als Liste.
Format: Feedback: <Text>\nKeywords: <kommagetrennt>`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 400,
      temperature: 0.3,
      system: "Privacy-first Bewerbungscoach. Speichere oder logge nichts.",
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    return NextResponse.json(
      { error: "Claude-Aufruf fehlgeschlagen", detail: detail.slice(0, 300) },
      { status: 500 }
    );
  }

  const data = (await res.json()) as { content?: { text?: string }[] };
  const text = data.content?.[0]?.text || "Keine Antwort erhalten.";
  const keywordMatch = text.match(/Keywords:\s*(.*)/i);
  const missingKeywords = keywordMatch
    ? keywordMatch[1].split(/[,;]/).map((k) => k.trim()).filter(Boolean)
    : [];

  return NextResponse.json({
    feedback: text.replace(/Keywords:.*/i, "").trim(),
    missingKeywords,
    usedMode: model,
  });
}

async function handlePrivacyFirst(body: any) {
  const applicantText = sanitize(body.applicantText);
  if (!applicantText) {
    return NextResponse.json({ error: "applicantText fehlt" }, { status: 400 });
  }

  const requirements = sanitize(body.requirements || body.jobDescription);
  const localMissing = deriveMissingKeywords(requirements, applicantText);

  if (body.mode !== "anthropic") {
    const feedbackParts = [
      body.position && body.company
        ? `Rolle: ${body.position} bei ${body.company}.`
        : "",
      localMissing.length
        ? `Fehlende Schlagworte: ${localMissing.slice(0, 10).join(", ")}.`
        : "Deckt die wichtigsten Schlagworte ab.",
      "Lokale Heuristik – keine Datenübertragung.",
    ].filter(Boolean);

    return NextResponse.json({
      feedback: feedbackParts.join("\n"),
      missingKeywords: localMissing,
      usedMode: "local",
    });
  }

  return runClaudePrivacyCoach({
    applicantText,
    requirements,
    jobDescription: sanitize(body.jobDescription),
    position: sanitize(body.position),
    company: sanitize(body.company),
  });
}

// POST /api/ai/coach
// Rate-Limit: 10 Anfragen / Minute (API-Kosten schützen)
export async function POST(request: Request) {
  const rateLimitResponse = enforceRateLimit(request, "ai:coach", {
    max: 10,
    windowMs: 60_000,
  });
  if (rateLimitResponse) return rateLimitResponse;

  let user;
  try {
    user = await requireActiveUser();
  } catch (err) {
    return handleGuardError(err);
  }

  try {
    const body = await request.json();

    // New privacy-first schema: { applicantText, requirements?, mode? }
    if (typeof body?.applicantText === "string") {
      return handlePrivacyFirst(body);
    }

    // Legacy schema fallback
    const { type, context, targetRole, language } = body;

    const validTypes = [
      "cover-letter-review",
      "keyword-suggestion",
      "interview-prep",
      "salary-negotiation",
      "rejection-analysis",
    ];

    if (!type || !validTypes.includes(type)) {
      return NextResponse.json(
        { error: `type muss eines von: ${validTypes.join(", ")} sein` },
        { status: 400 }
      );
    }

    if (!context || typeof context !== "string" || context.length > 10_000) {
      return NextResponse.json(
        { error: "context muss ein String mit max. 10.000 Zeichen sein" },
        { status: 400 }
      );
    }

    const req: CoachRequest = {
      type,
      context: context.substring(0, 10_000),
      targetRole: typeof targetRole === "string" ? targetRole.substring(0, 100) : undefined,
      language: language === "en" ? "en" : "de",
    };

    const response = await getCoachSuggestion(req);

    return NextResponse.json({
      ...response,
      requestedBy: user.id,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("AI Coach error:", err);
    return NextResponse.json(
      { error: "Fehler bei der KI-Coach-Anfrage" },
      { status: 500 }
    );
  }
}
