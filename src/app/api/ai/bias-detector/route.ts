/**
 * Bias-Detektor API: Analysiert Stellenanzeigen auf Bias und Diskriminierung
 * POST /api/ai/bias-detector
 * Body: { text: string; type: "job_posting" | "cover_letter" | "cv" }
 */
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/currentUser";

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
    const { text, type = "job_posting" } = await req.json();

    if (!text || typeof text !== "string" || text.trim().length < 20) {
      return NextResponse.json({ error: "Text zu kurz oder fehlt" }, { status: 400 });
    }

    const typeLabel =
      type === "job_posting" ? "Stellenanzeige"
      : type === "cover_letter" ? "Anschreiben"
      : "Lebenslauf";

    const prompt = `Du bist ein Experte für Diskriminierungsfreiheit und faire Personalauswahl (AGG/DSGVO-konform).

Analysiere folgenden ${typeLabel}-Text auf potenzielle **Bias-Indikatoren**:

<text>
${text.slice(0, 4000)}
</text>

Identifiziere folgende Bias-Typen und gib strukturierte JSON-Antwort zurück:
1. **Alters-Bias**: Begriffe wie "jung", "frisch", "erfahren", Jahreszahlen die Alter implizieren
2. **Gender-Bias**: Nicht-inklusive Sprache, stereotype Anforderungen
3. **Herkunfts-Bias**: Anforderungen die bestimmte Gruppen ausschließen
4. **Qualifikations-Bias**: Übertriebene/unrealistische Anforderungen
5. **Kultur-Bias**: Kulturell exklusive Formulierungen

Antworte NUR mit validem JSON:
{
  "overallScore": 85,
  "riskLevel": "LOW|MEDIUM|HIGH",
  "issues": [
    {
      "type": "GENDER_BIAS|AGE_BIAS|ORIGIN_BIAS|QUALIFICATION_BIAS|CULTURE_BIAS",
      "severity": "LOW|MEDIUM|HIGH",
      "quote": "gefundener Text-Ausschnitt",
      "suggestion": "Verbesserungsvorschlag",
      "explanation": "Erklärung warum dies problematisch ist"
    }
  ],
  "strengths": ["Positive Aspekte des Texts"],
  "summary": "Kurzfassung der Analyse auf Deutsch",
  "improvedVersion": "Verbesserte Version des problematischsten Satzes (optional)"
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
      textLength: text.length,
      type,
    });
  } catch (e: unknown) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
    }
    console.error("Bias-Detektor Fehler:", e);
    return NextResponse.json({ error: "Analyse fehlgeschlagen" }, { status: 500 });
  }
}
