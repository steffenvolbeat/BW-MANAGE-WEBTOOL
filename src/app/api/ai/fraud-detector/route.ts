/**
 * Fraud-Detektor API: Erkennt verdächtige/gefälschte Stellenanzeigen
 * POST /api/ai/fraud-detector
 * Body: { text: string; url?: string; company?: string }
 */
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/currentUser";

function sanitizeForPrompt(value: string | undefined, maxLen = 200): string {
  if (!value) return "";
  return value.replace(/[\n\r`<>]/g, " ").trim().slice(0, maxLen);
}

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


export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const { text, url, company } = await req.json();

    if (!text || typeof text !== "string" || text.trim().length < 20) {
      return NextResponse.json({ error: "Text zu kurz oder fehlt" }, { status: 400 });
    }

    const safeUrl = sanitizeForPrompt(url, 300);
    const safeCompany = sanitizeForPrompt(company, 200);

    const prompt = `Du bist ein Experte für Job-Fraud-Erkennung. Analysiere diese Stellenanzeige auf Betrugs-Indikatoren.

Stellenanzeige:
${safeUrl ? `URL: ${safeUrl}` : ""}
${safeCompany ? `Firma: ${safeCompany}` : ""}

<text>
${text.slice(0, 4000)}
</text>

Bekannte Betrugs-Muster:
1. Unrealistisch hohe Gehälter ohne Qualifikationen
2. Vage/fehlerhafte Unternehmensbeschreibung
3. Anforderung persönlicher Daten/Gebühren vorab
4. Zu-gut-um-wahr-zu-sein Angebote
5. Dringende Rekrutierung mit Zeitdruck
6. Fehlende Firmenadresse/Kontaktdaten
7. Grammatikfehler/unprofessionelle Sprache
8. Work-from-home mit extremen Einnahmeversprechen
9. Anforderung von Bankdaten

Antworte NUR mit validem JSON:
{
  "fraudScore": 15,
  "riskLevel": "SAFE|LOW|MEDIUM|HIGH|DANGER",
  "isLikelyFraud": false,
  "redFlags": [
    {
      "type": "RED_FLAG_TYPE",
      "severity": "LOW|MEDIUM|HIGH|CRITICAL",
      "quote": "verdächtiger Text",
      "explanation": "Warum das verdächtig ist"
    }
  ],
  "greenFlags": ["Vertrauenswürdige Merkmale"],
  "recommendation": "APPLY|CAUTION|AVOID|REPORT",
  "summary": "Kurzanalyse auf Deutsch",
  "safetyTips": ["Tipps zum sicheren Umgang mit dieser Anzeige"]
}`;

    const raw = await callClaude(prompt);
    let analysis: Record<string, unknown>;
    try {
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : { raw };
    } catch {
      analysis = { raw, summary: "Analyse konnte nicht geparst werden" };
    }

    return NextResponse.json({
      userId: user.id,
      analysis,
      analyzedAt: new Date().toISOString(),
      url: url ?? null,
      company: company ?? null,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg === "UNAUTHORIZED" || msg === "INACTIVE") {
      return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
    }
    if (msg.includes("ANTHROPIC_API_KEY")) {
      return NextResponse.json({ error: "KI-Analyse nicht verfügbar (API-Key fehlt)" }, { status: 503 });
    }
    console.error("Fraud-Detektor Fehler:", e);
    return NextResponse.json({ error: "Analyse fehlgeschlagen" }, { status: 500 });
  }
}
