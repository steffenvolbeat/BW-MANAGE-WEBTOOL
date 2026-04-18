/**
 * Gehalts-Verhandlungs-Coach API
 * POST /api/ai/salary-coach
 * Body: { position, currentSalary, targetSalary, yearsXP, skills, region, company?, industry? }
 */
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/currentUser";
import { enforceRateLimit } from "@/lib/security/rateLimit";

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
    const rl = enforceRateLimit(req, "ai:salary-coach", { max: 5, windowMs: 60_000 });
    if (rl) return rl;
    const user = await getCurrentUser();
    const body = await req.json();
    const { position, currentSalary, targetSalary, yearsXP, skills = [], region = "Deutschland", company, industry, offerReceived } = body;

    if (!position) return NextResponse.json({ error: "Position fehlt" }, { status: 400 });

    // Input length validation
    if (typeof position !== "string" || position.length > 200)
      return NextResponse.json({ error: "position: maximal 200 Zeichen" }, { status: 400 });
    if (region !== undefined && (typeof region !== "string" || region.length > 100))
      return NextResponse.json({ error: "region: maximal 100 Zeichen" }, { status: 400 });
    if (company !== undefined && (typeof company !== "string" || company.length > 100))
      return NextResponse.json({ error: "company: maximal 100 Zeichen" }, { status: 400 });
    if (industry !== undefined && (typeof industry !== "string" || industry.length > 100))
      return NextResponse.json({ error: "industry: maximal 100 Zeichen" }, { status: 400 });
    if (!Array.isArray(skills) || skills.length > 20 || skills.some((s: unknown) => typeof s !== "string" || s.length > 50))
      return NextResponse.json({ error: "skills: maximal 20 Eintr\u00e4ge, jeder max. 50 Zeichen" }, { status: 400 });

    const prompt = `Du bist ein erfahrener Gehaltsverhandlungs-Coach für IT-Profis in Deutschland.

Der Kandidat möchte eine Gehaltsverhandlung führen.

**Details:**
- Position: ${position}
- Aktuelle Vergütung: ${currentSalary ? `${currentSalary} €/Jahr` : "nicht angegeben"}
- Zielgehalt: ${targetSalary ? `${targetSalary} €/Jahr` : "nicht angegeben"}
- Berufserfahrung: ${yearsXP ?? "?"} Jahre
- Fähigkeiten: ${skills.length > 0 ? skills.join(", ") : "nicht angegeben"}
- Region: ${region}
- Firma: ${company ?? "nicht angegeben"}
- Branche: ${industry ?? "IT/Tech"}
- Angebot bereits erhalten: ${offerReceived ? "Ja" : "Nein"}

Erstelle einen detaillierten Verhandlungsplan. Antworte NUR mit validem JSON:
{
  "marketRange": { "min": 0, "max": 0, "median": 0, "currency": "EUR" },
  "negotiationStrategy": "CONSERVATIVE|MODERATE|AGGRESSIVE",
  "openingOffer": 0,
  "walkAwayPoint": 0,
  "keyArguments": ["Argument 1", "Argument 2", "Argument 3"],
  "scripts": {
    "opening": "Einstiegssatz für das Gespräch",
    "counteroffer": "Reaktion auf ein niedrigeres Angebot",
    "closing": "Abschlusssatz wenn Einigung erreicht"
  },
  "commonMistakes": ["Fehler 1", "Fehler 2"],
  "bonusItems": ["Bonus-Leistungen die man verhandeln kann"],
  "tips": ["Konkreter Tipp 1", "Konkreter Tipp 2"],
  "summary": "Kurzfassung der Empfehlung auf Deutsch",
  "confidenceScore": 75
}`;

    const raw = await callClaude(prompt);
    let analysis: Record<string, unknown>;
    try {
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : { raw };
    } catch {
      analysis = { raw, summary: "Analyse konnte nicht geparst werden" };
    }

    return NextResponse.json({ userId: user.id, analysis, generatedAt: new Date().toISOString() });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg === "UNAUTHORIZED" || msg === "INACTIVE") {
      return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
    }
    if (msg.includes("ANTHROPIC_API_KEY")) {
      return NextResponse.json({ error: "KI-Analyse nicht verfügbar (API-Key fehlt)" }, { status: 503 });
    }
    console.error("Salary-coach Fehler:", e);
    return NextResponse.json({ error: "Fehler" }, { status: 500 });
  }
}
