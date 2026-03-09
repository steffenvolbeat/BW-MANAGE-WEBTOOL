import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/currentUser";

// ─── PII Stripping (keep text structure, remove identifiable data) ─────────────
const PII_PATTERNS: [RegExp, string][] = [
  [/\b[\w.+-]+@[\w-]+\.[a-z]{2,}\b/gi, "[E-MAIL]"],
  [/\b(?:\+49|0049|0)\s?[\d\s\-/]{7,15}\b/g, "[TELEFON]"],
  [/\b\d{5}\b/g, "[PLZ]"],
  [/\b(https?:\/\/)[^\s"'<>]+/gi, "[URL]"],
];

function stripPII(text: string): string {
  let result = text;
  for (const [pattern, replacement] of PII_PATTERNS) {
    result = result.replace(pattern, replacement);
  }
  return result;
}

// ─── Letter draft prompt builder ───────────────────────────────────────────────

function buildPrompt(
  mode: "full" | "paragraph" | "subject",
  userPrompt: string,
  context: {
    subject?: string;
    salutation?: string;
    existing?: string;
    paragraphIndex?: number;
  }
): string {
  const systemBase = `Du bist ein professioneller Bewerbungsschreiber für die IT-Branche. 
Du schreibst ausschließlich auf Deutsch. 
Dein Stil ist sachlich, kompetent, motiviert und DIN-5008-konform.
Du verwendest keine übertriebenen Superlative. Vermeide Klischees wie "ich bin teamfähig und kommunikativ".
Antworte ausschließlich mit dem angeforderten Text ohne Einleitung oder Metakommentar.`;

  if (mode === "subject") {
    return `${systemBase}

Erstelle einen prägnanten Betreff für ein Bewerbungsanschreiben (DIN 5008).
Max. 2 Zeilen / 120 Zeichen. Keine Anführungszeichen.

Kontext: ${userPrompt}

Antworte im Format: {"subject": "..."} ohne Codeblock.`;
  }

  if (mode === "paragraph") {
    return `${systemBase}

Überarbeite oder erstelle Absatz ${(context.paragraphIndex ?? 0) + 1} eines Bewerbungsanschreibens.
Betreff: ${context.subject || "(nicht angegeben)"}
Anrede: ${context.salutation || "Sehr geehrte Damen und Herren,"}
Vorhandener Text: ${context.existing || "(leer)"}

Nutzeranweisung: ${userPrompt}

Antworte im Format: {"text": "..."} ohne Codeblock.`;
  }

  // full
  return `${systemBase}

Erstelle 4 Absätze für ein vollständiges Bewerbungsanschreiben (DIN 5008) für die IT-Branche.
- Absatz 1: Einleitung / Quelle der Stelle
- Absatz 2: Kernqualifikationen und Berufserfahrung
- Absatz 3: Motivation für das Unternehmen / Mehrwert
- Absatz 4: Abschluss / Gesprächswunsch

Betreff: ${context.subject || "(IT-Position)"}
Anrede: ${context.salutation || "Sehr geehrte Damen und Herren,"}

Nutzeranweisung / Stichpunkte: ${userPrompt}

Antworte im Format: {"paragraphs": ["...", "...", "...", "..."]} ohne Codeblock.`;
}

// ─── Route Handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // Auth check
  const user = await getCurrentUser();
  if (!user.id) {
    return NextResponse.json({ error: "Nicht authentifiziert." }, { status: 401 });
  }

  let body: {
    mode: "full" | "paragraph" | "subject";
    prompt: string;
    context?: {
      subject?: string;
      salutation?: string;
      existing?: string;
      paragraphIndex?: number;
    };
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 400 });
  }

  const { mode, prompt, context = {} } = body;

  if (!prompt?.trim()) {
    return NextResponse.json({ error: "Prompt darf nicht leer sein." }, { status: 400 });
  }

  // Strip PII from prompt before sending to any external service
  const sanitizedPrompt = stripPII(prompt.slice(0, 2000));
  const fullPrompt = buildPrompt(mode, sanitizedPrompt, context);

  // ── Try local LLM first (Ollama), fallback to OpenAI ──────────────────────
  const ollamaUrl = process.env.OLLAMA_URL ?? "http://localhost:11434";
  const ollamaModel = process.env.OLLAMA_MODEL ?? "llama3.2";
  const openaiKey = process.env.OPENAI_API_KEY;

  let rawText = "";

  // 1. Ollama (local, privacy-preserving)
  try {
    const ollamaRes = await fetch(`${ollamaUrl}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: ollamaModel,
        prompt: fullPrompt,
        stream: false,
        options: { temperature: 0.7, num_predict: 800 },
      }),
      signal: AbortSignal.timeout(20_000),
    });

    if (ollamaRes.ok) {
      const data = await ollamaRes.json() as { response?: string };
      rawText = data.response ?? "";
    }
  } catch {
    // Ollama nicht verfügbar – weiter mit OpenAI
  }

  // 2. OpenAI fallback (only if Ollama unavailable and key is set)
  if (!rawText && openaiKey) {
    try {
      const oaRes = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: fullPrompt }],
          max_tokens: 800,
          temperature: 0.7,
        }),
        signal: AbortSignal.timeout(25_000),
      });

      if (oaRes.ok) {
        const data = await oaRes.json() as { choices?: { message?: { content?: string } }[] };
        rawText = data.choices?.[0]?.message?.content ?? "";
      }
    } catch {
      // OpenAI also unavailable
    }
  }

  // 3. Fallback: generate a structured placeholder response
  if (!rawText) {
    if (mode === "subject") {
      rawText = JSON.stringify({ subject: "Bewerbung als [Position] – Ref. [Stellenref.]" });
    } else if (mode === "paragraph") {
      rawText = JSON.stringify({ text: "[KI nicht verfügbar – bitte Text manuell eingeben]" });
    } else {
      rawText = JSON.stringify({
        paragraphs: [
          "hiermit bewerbe ich mich auf die ausgeschriebene Stelle.",
          "[Beschreiben Sie Ihre Kernqualifikationen und Berufserfahrung.]",
          "[Erläutern Sie Ihre Motivation für das Unternehmen.]",
          "Ich freue mich auf ein persönliches Gespräch.",
        ],
      });
    }
  }

  // Parse JSON response
  try {
    // Extract JSON from raw text (model might add markdown fences)
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(jsonMatch?.[0] ?? rawText) as Record<string, unknown>;
    return NextResponse.json(parsed, { status: 200 });
  } catch {
    // If parsing fails, wrap raw text appropriately
    if (mode === "subject") {
      return NextResponse.json({ subject: rawText.trim().slice(0, 200) });
    } else if (mode === "paragraph") {
      return NextResponse.json({ text: rawText.trim() });
    } else {
      // Split by double newline as paragraphs
      const paragraphs = rawText.trim().split(/\n\n+/).filter(Boolean).slice(0, 4);
      return NextResponse.json({ paragraphs });
    }
  }
}
