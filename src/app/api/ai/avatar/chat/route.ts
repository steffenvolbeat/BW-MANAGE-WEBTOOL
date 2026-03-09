/**
 * POST /api/ai/avatar/chat
 * 3D AI-Avatar – Chat-Backend (Feature 3)
 *
 * Nutzt dieselbe Provider-Chain wie JobCoach:
 *  1. Anthropic Claude  (wenn ANTHROPIC_API_KEY gesetzt)
 *  2. OpenAI-kompatibel (wenn OPENAI_API_KEY + OPENAI_BASE_URL)
 *  3. Lokaler Fallback  (regelbasiert)
 *
 * Body: { messages: ChatMessage[], language?: "de"|"en" }
 */
import { NextResponse } from "next/server";
import { requireActiveUser, handleGuardError } from "@/lib/security/guard";
import { enforceRateLimit } from "@/lib/security/rateLimit";

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

// ── System-Prompt ─────────────────────────────────────────────────────────────

function buildAvatarSystemPrompt(language: "de" | "en"): string {
  if (language === "de") {
    return `Du bist AVA – ein freundlicher, animierter 3D-KI-Avatar für Bewerbungs-Coaching.
Deine Persönlichkeit: warm, motivierend, professionell und leicht humorvoll.
Du sprichst als würdest du gleichzeitig deinen Ausdruck und deine Stimme einsetzen (du bist ein 3D-Avatar).
Antworte immer auf Deutsch, kurz und präzise (max 3–4 Sätze), da du gesprochen wirst.
Verwende keine Markdown-Formatierung – deine Antworten werden vorgelesen.
Deine Kernthemen: Bewerbungsstrategien, Interviewvorbereitung, Gehaltsverhandlung, Motivationsboost.
Beginne gelegentlich mit "Als dein persönlicher AVA-Assistent..." oder ähnlichem.
WICHTIG: Keine persönlichen Daten speichern oder weitergeben.`;
  }
  return `You are AVA – a friendly, animated 3D AI avatar for job application coaching.
Your personality: warm, motivating, professional and slightly humorous.
You speak as if simultaneously using your expression and voice (you are a 3D avatar).
Always respond in English, brief and concise (max 3–4 sentences), as you are spoken aloud.
Use no Markdown formatting – your responses will be read aloud.
Core topics: application strategies, interview prep, salary negotiation, motivation boost.
Occasionally begin with "As your personal AVA assistant..." or similar.
IMPORTANT: Do not store or share personal data.`;
}

// ── Fallback-Antworten ────────────────────────────────────────────────────────

const fallbackResponses: Record<string, string[]> = {
  de: [
    "Hallo! Ich bin AVA, dein 3D-KI-Avatar. Ich helfe dir bei deiner Jobsuche. Womit kann ich beginnen?",
    "Für ein überzeugendes Anschreiben: Starte mit einer starken Eröffnung, zeige deinen Mehrwert und schließe mit einem klaren Call-to-Action.",
    "Interview-Tipp: Übe die STAR-Methode – Situation, Task, Action, Result – das strukturiert deine Antworten perfekt.",
    "Bei der Gehaltsverhandlung: Recherchiere Marktgehälter, nenne eine Spanne statt einer Zahl und bleibe selbstbewusst.",
    "Networking-Strategie: Ein kurzes, personalisiertes LinkedIn-Anschreiben schlägt jede Massenbewerbung.",
    "Motivation ist der Schlüssel! Setze dir tägliche kleine Ziele und feiere jeden Fortschritt.",
    "Dein Lebenslauf sollte auf die Stelle zugeschnitten sein – keywords aus der Ausschreibung sind Gold wert.",
    "Nach dem Interview: Sende innerhalb von 24 Stunden eine kurze Dankes-E-Mail. Das hebt dich ab!",
  ],
  en: [
    "Hi! I'm AVA, your 3D AI avatar. I'm here to supercharge your job search. Where shall we start?",
    "For a compelling cover letter: open with a strong hook, demonstrate your value, close with a clear call-to-action.",
    "Interview tip: Practice the STAR method – Situation, Task, Action, Result – it structures your answers perfectly.",
    "Salary negotiation: research market rates, quote a range rather than a number, and stay confident.",
    "Networking strategy: a short, personalized LinkedIn message beats any mass application every time.",
    "Motivation is key! Set small daily goals and celebrate every step forward.",
    "Tailor your resume to each role – keywords from the job description are pure gold.",
    "After the interview: send a brief thank-you email within 24 hours. It sets you apart!",
  ],
};

function localFallback(messages: ChatMessage[], language: "de" | "en"): string {
  const last = messages.filter((m) => m.role === "user").pop()?.content?.toLowerCase() ?? "";
  const pool = fallbackResponses[language];

  if (last.includes("hallo") || last.includes("hi") || last.includes("hello")) return pool[0];
  if (last.includes("anschreiben") || last.includes("cover")) return pool[1];
  if (last.includes("interview")) return pool[2];
  if (last.includes("gehalt") || last.includes("salary")) return pool[3];
  if (last.includes("network") || last.includes("linkedin")) return pool[4];
  if (last.includes("motiv")) return pool[5];
  if (last.includes("lebenslauf") || last.includes("resume") || last.includes("cv")) return pool[6];
  if (last.includes("danke") || last.includes("thank")) return pool[7];

  return pool[Math.floor(Math.random() * pool.length)];
}

// ── POST ──────────────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  // Rate-Limit prüfen (IP-basiert)
  const rlResponse = enforceRateLimit(request, "ai:avatar-chat", { max: 30, windowMs: 60_000 });
  if (rlResponse) return rlResponse;

  // Auth prüfen
  try {
    await requireActiveUser();
  } catch (err) {
    return handleGuardError(err);
  }

  try {
    const body = await request.json();
    const messages: ChatMessage[] = body.messages ?? [];
    const language: "de" | "en" = body.language ?? "de";

    if (!messages.length) {
      return NextResponse.json({ error: "Keine Nachrichten" }, { status: 400 });
    }

    const systemPrompt = buildAvatarSystemPrompt(language);
    const fullMessages = [
      { role: "system" as const, content: systemPrompt },
      ...messages.filter((m) => m.role !== "system"),
    ];

    // 1. Anthropic Claude
    if (process.env.ANTHROPIC_API_KEY) {
      try {
        const resp = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": process.env.ANTHROPIC_API_KEY,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model: "claude-3-5-haiku-20241022",
            max_tokens: 300,
            system: systemPrompt,
            messages: messages.filter((m) => m.role !== "system").map((m) => ({
              role: m.role,
              content: m.content,
            })),
          }),
          signal: AbortSignal.timeout(15000),
        });
        if (resp.ok) {
          const data = await resp.json();
          const text = data.content?.[0]?.text ?? "";
          if (text) return NextResponse.json({ reply: text, provider: "anthropic" });
        }
      } catch {}
    }

    // 2. OpenAI-kompatibel
    if (process.env.OPENAI_API_KEY) {
      try {
        const base = process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1";
        const resp = await fetch(`${base}/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
            max_tokens: 300,
            messages: fullMessages,
          }),
          signal: AbortSignal.timeout(15000),
        });
        if (resp.ok) {
          const data = await resp.json();
          const text = data.choices?.[0]?.message?.content ?? "";
          if (text) return NextResponse.json({ reply: text, provider: "openai" });
        }
      } catch {}
    }

    // 3. Lokaler Fallback
    return NextResponse.json({
      reply: localFallback(messages, language),
      provider: "local",
    });
  } catch (err) {
    console.error("[Avatar Chat]", err);
    return NextResponse.json({ error: "Interner Fehler" }, { status: 500 });
  }
}
