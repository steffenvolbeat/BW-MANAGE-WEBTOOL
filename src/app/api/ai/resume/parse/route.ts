/**
 * POST /api/ai/resume/parse
 * AI Resume Parser / CV-Scanner – Feature 6
 *
 * Nimmt eine PDF- oder Text-Datei entgegen, extrahiert Text mit pdf-parse
 * und lässt Claude / GPT-4o strukturierte CV-Daten ausgeben.
 *
 * Body: multipart/form-data
 *   pdf   – File (PDF, max 5 MB)
 *   lang? – "de" | "en" (Standard: "de")
 */
import { NextResponse } from "next/server";
import { requireActiveUser, handleGuardError } from "@/lib/security/guard";
import { enforceRateLimit } from "@/lib/security/rateLimit";

// ── Typen ─────────────────────────────────────────────────────────────────────

export interface ParsedResume {
  name: string;
  email: string;
  phone: string;
  location: string;
  summary: string;
  skills: string[];
  languages: { language: string; level: string }[];
  experience: {
    company: string;
    position: string;
    startDate: string;
    endDate: string;
    description: string;
  }[];
  education: {
    institution: string;
    degree: string;
    field: string;
    startDate: string;
    endDate: string;
  }[];
  certifications: string[];
  links: { type: string; url: string }[];
  rawText?: string;
}

// ── PDF-Text-Extraktion ───────────────────────────────────────────────────────

async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  // Dynamischer Import um Next.js-Modul-Bundling-Probleme zu vermeiden
  const pdfParse = (await import("pdf-parse")).default;
  const data = await pdfParse(buffer, { max: 20 }); // max 20 Seiten
  return data.text;
}

// ── AI-Prompt ─────────────────────────────────────────────────────────────────

function buildParsePrompt(text: string, lang: "de" | "en"): string {
  const instruction = lang === "de"
    ? `Analysiere den folgenden Lebenslauf-Text und extrahiere alle Informationen als JSON.
Gib NUR gültiges JSON zurück, kein Markdown, keine Erklärungen.
Falls ein Feld nicht gefunden wird, verwende leeren String "" oder leeres Array [].
Datumsformat: "MM/YYYY" oder "YYYY", unbekannt = "".`
    : `Analyze the following resume text and extract all information as JSON.
Return ONLY valid JSON, no Markdown, no explanations.
If a field is not found, use empty string "" or empty array [].
Date format: "MM/YYYY" or "YYYY", unknown = "".`;

  const schema = `{
  "name": "string",
  "email": "string",
  "phone": "string",
  "location": "string (Stadt, Land)",
  "summary": "string (Zusammenfassung in 2-3 Sätzen)",
  "skills": ["string"],
  "languages": [{"language": "string", "level": "string (z.B. Muttersprache, C1, B2, Grundkenntnisse)"}],
  "experience": [{"company": "string", "position": "string", "startDate": "string", "endDate": "string", "description": "string"}],
  "education": [{"institution": "string", "degree": "string", "field": "string", "startDate": "string", "endDate": "string"}],
  "certifications": ["string"],
  "links": [{"type": "string (LinkedIn|GitHub|Portfolio|Xing|Website)", "url": "string"}]
}`;

  return `${instruction}\n\nJSON-Schema:\n${schema}\n\nLebenslauf-Text:\n${text.slice(0, 8000)}`;
}

// ── AI-Aufruf ─────────────────────────────────────────────────────────────────

async function callAI(prompt: string): Promise<ParsedResume> {
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
          max_tokens: 2048,
          messages: [{ role: "user", content: prompt }],
        }),
        signal: AbortSignal.timeout(30000),
      });
      if (resp.ok) {
        const data = await resp.json();
        const raw = data.content?.[0]?.text ?? "";
        const json = raw.trim().replace(/^```json?\n?/, "").replace(/\n?```$/, "");
        return JSON.parse(json) as ParsedResume;
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
          max_tokens: 2048,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: "Du bist ein CV-Parser. Gib nur JSON zurück." },
            { role: "user", content: prompt },
          ],
        }),
        signal: AbortSignal.timeout(30000),
      });
      if (resp.ok) {
        const data = await resp.json();
        const raw = data.choices?.[0]?.message?.content ?? "{}";
        return JSON.parse(raw) as ParsedResume;
      }
    } catch {}
  }

  // 3. Regex-basierter Fallback (ohne AI)
  return regexFallback(prompt);
}

// ── Regex-Fallback ────────────────────────────────────────────────────────────

function regexFallback(text: string): ParsedResume {
  const emailMatch = text.match(/[\w.+-]+@[\w-]+\.[a-z]{2,}/i);
  const phoneMatch = text.match(/(\+?[\d\s\-().]{7,20})/);
  const urlMatches = [...text.matchAll(/https?:\/\/[^\s"'<>()]+/g)];

  return {
    name: "",
    email: emailMatch?.[0] ?? "",
    phone: phoneMatch?.[0]?.trim() ?? "",
    location: "",
    summary: "Kein KI-Provider konfiguriert. Bitte ANTHROPIC_API_KEY oder OPENAI_API_KEY in .env setzen für vollständiges Parsing.",
    skills: [],
    languages: [],
    experience: [],
    education: [],
    certifications: [],
    links: urlMatches.slice(0, 5).map((m) => ({
      type: m[0].includes("linkedin") ? "LinkedIn" : m[0].includes("github") ? "GitHub" : "Website",
      url: m[0],
    })),
  };
}

// ── POST-Handler ──────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  // Rate-Limit (10 Parse-Anfragen / 60s – PDF-Parsing ist teuer)
  const rl = enforceRateLimit(request, "ai:resume-parse", { max: 10, windowMs: 60_000 });
  if (rl) return rl;

  try {
    await requireActiveUser();
  } catch (err) {
    return handleGuardError(err);
  }

  try {
    const formData = await request.formData();
    const file = formData.get("pdf") as File | null;
    const lang = (formData.get("lang") as string) === "en" ? "en" : "de";

    if (!file) {
      return NextResponse.json({ error: "Keine Datei hochgeladen" }, { status: 400 });
    }

    // Größenprüfung: max 5 MB
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "Datei zu groß (max 5 MB)" }, { status: 413 });
    }

    const mimeOk = file.type === "application/pdf" || file.type === "text/plain";
    if (!mimeOk) {
      return NextResponse.json({ error: "Nur PDF-Dateien erlaubt" }, { status: 415 });
    }

    // PDF → Text
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let extractedText = "";
    if (file.type === "text/plain") {
      extractedText = buffer.toString("utf-8");
    } else {
      try {
        extractedText = await extractTextFromPDF(buffer);
      } catch (e) {
        console.warn("[Resume Parse] PDF-Extraktion fehlgeschlagen:", e);
        return NextResponse.json({ error: "PDF konnte nicht gelesen werden. Bitte prüfe ob die Datei nicht passwortgeschützt ist." }, { status: 422 });
      }
    }

    if (!extractedText.trim()) {
      return NextResponse.json({ error: "PDF enthält keinen extrahierbaren Text (gescanntes/Bild-PDF?)" }, { status: 422 });
    }

    // AI-Parsing
    const prompt = buildParsePrompt(extractedText, lang);
    const parsed = await callAI(prompt);
    parsed.rawText = extractedText.slice(0, 3000); // für Debug/Gap-Analyse

    return NextResponse.json({ parsed, charCount: extractedText.length });
  } catch (err) {
    console.error("[Resume Parse]", err);
    return NextResponse.json({ error: "Interner Fehler beim Parsen" }, { status: 500 });
  }
}
