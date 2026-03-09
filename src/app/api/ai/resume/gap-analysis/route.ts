/**
 * POST /api/ai/resume/gap-analysis
 * Vergleicht Lebenslauf-Skills mit einer Stellenanzeige (Feature 6)
 *
 * Body: { resumeText: string, jobDescription: string, lang?: "de"|"en" }
 */
import { NextResponse } from "next/server";
import { requireActiveUser, handleGuardError } from "@/lib/security/guard";
import { enforceRateLimit } from "@/lib/security/rateLimit";

export interface GapAnalysis {
  score: number;                  // 0–100 Übereinstimmung
  matchingSkills: string[];
  missingSkills: string[];
  bonusSkills: string[];          // Skills im CV, nicht in Stelle aber wertvoll
  recommendations: string[];     // konkrete Handlungsempfehlungen
  keywordsJob: string[];          // erkannte Keywords der Stelle
  summary: string;
}

function buildGapPrompt(resumeText: string, jobDescription: string, lang: "de" | "en"): string {
  const instr = lang === "de"
    ? `Analysiere Lebenslauf und Stellenanzeige. Gib NUR gültiges JSON zurück (kein Markdown).`
    : `Analyze resume and job description. Return ONLY valid JSON (no Markdown).`;

  const schema = `{
  "score": number (0-100, Übereinstimmung zwischen CV und Stelle),
  "matchingSkills": ["skills die CV und Stelle gemeinsam haben"],
  "missingSkills": ["skills die die Stelle fordert aber im CV fehlen"],
  "bonusSkills": ["skills im CV die über die Anforderungen hinausgehen"],
  "keywordsJob": ["20 wichtigste Keywords der Stelle"],
  "recommendations": ["5-7 konkrete Tipps wie der Bewerber die Lücken schließen kann"],
  "summary": "3-4 Sätze Gesamtbewertung"
}`;

  return `${instr}\n\nSchema:\n${schema}\n\nLEBENSLAUF:\n${resumeText.slice(0, 3000)}\n\nSTELLENANZEIGE:\n${jobDescription.slice(0, 2000)}`;
}

async function callGapAI(prompt: string): Promise<GapAnalysis> {
  // 1. Anthropic
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
          max_tokens: 1500,
          messages: [{ role: "user", content: prompt }],
        }),
        signal: AbortSignal.timeout(30000),
      });
      if (resp.ok) {
        const data = await resp.json();
        const raw = (data.content?.[0]?.text ?? "{}").replace(/^```json?\n?/, "").replace(/\n?```$/, "");
        return JSON.parse(raw) as GapAnalysis;
      }
    } catch {}
  }

  // 2. OpenAI
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
          max_tokens: 1500,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: "CV-Gap-Analyst. Nur JSON." },
            { role: "user", content: prompt },
          ],
        }),
        signal: AbortSignal.timeout(30000),
      });
      if (resp.ok) {
        const data = await resp.json();
        return JSON.parse(data.choices?.[0]?.message?.content ?? "{}") as GapAnalysis;
      }
    } catch {}
  }

  // 3. Simpel-Fallback
  return {
    score: 0,
    matchingSkills: [],
    missingSkills: [],
    bonusSkills: [],
    keywordsJob: [],
    recommendations: ["Kein KI-Provider konfiguriert. Bitte ANTHROPIC_API_KEY oder OPENAI_API_KEY in .env setzen."],
    summary: "Kein KI-Provider verfügbar.",
  };
}

export async function POST(request: Request) {
  const rl = enforceRateLimit(request, "ai:resume-gap", { max: 15, windowMs: 60_000 });
  if (rl) return rl;

  try {
    await requireActiveUser();
  } catch (err) {
    return handleGuardError(err);
  }

  try {
    const { resumeText, jobDescription, lang = "de" } = await request.json();

    if (!resumeText?.trim()) return NextResponse.json({ error: "Kein Lebenslauf-Text" }, { status: 400 });
    if (!jobDescription?.trim()) return NextResponse.json({ error: "Keine Stellenanzeige" }, { status: 400 });

    const prompt = buildGapPrompt(resumeText, jobDescription, lang === "en" ? "en" : "de");
    const analysis = await callGapAI(prompt);

    return NextResponse.json({ analysis });
  } catch (err) {
    console.error("[Gap Analysis]", err);
    return NextResponse.json({ error: "Interner Fehler" }, { status: 500 });
  }
}
