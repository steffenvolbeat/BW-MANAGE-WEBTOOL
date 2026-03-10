/**
 * Predictive Rejection Analysis API
 * GET /api/ai/rejection-analysis
 * Analysiert historische Bewerbungsdaten um Ablehnungs-Muster zu erkennen
 */
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/currentUser";
import { prisma } from "@/lib/database";

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

    const applications = await prisma.application.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        companyName: true,
        position: true,
        status: true,
        appliedAt: true,
        responseAt: true,
        salary: true,
        jobType: true,
        location: true,
        country: true,
        priority: true,
        requirements: true,
        notesText: true,
      },
    });

    if (applications.length < 3) {
      return NextResponse.json({
        insight: null,
        message: "Mindestens 3 Bewerbungen erforderlich für die Analyse.",
        applications: applications.length,
      });
    }

    const rejected = applications.filter((a) =>
      ["REJECTED", "WITHDRAWN"].includes(a.status)
    );
    const successful = applications.filter((a) =>
      ["INTERVIEW_SCHEDULED", "INTERVIEWED", "OFFER_RECEIVED", "ACCEPTED"].includes(a.status)
    );

    const stats = {
      total: applications.length,
      rejected: rejected.length,
      successful: successful.length,
      pending: applications.filter((a) => ["APPLIED", "REVIEWED"].includes(a.status)).length,
      rejectionRate: Math.round((rejected.length / applications.length) * 100),
    };

    const prompt = `Du bist ein Karriere-Analyst. Analysiere diese Bewerbungshistorie und erkenne Muster.

Statistiken:
- Gesamt: ${stats.total} Bewerbungen
- Abgelehnt: ${stats.rejected} (${stats.rejectionRate}%)
- Erfolgreich (Interview+): ${stats.successful}
- Ausstehend: ${stats.pending}

Abgelehnte Bewerbungen (Sample):
${JSON.stringify(rejected.slice(0, 10), null, 2)}

Erfolgreiche Bewerbungen (Sample):
${JSON.stringify(successful.slice(0, 5), null, 2)}

Analysiere: Warum wurden Bewerbungen abgelehnt? Welche Muster erkennst du?
Antworte NUR mit validem JSON:
{
  "patterns": [
    { "type": "MUSTER_TYP", "description": "Beschreibung des Musters", "affected": 5, "severity": "HIGH|MEDIUM|LOW" }
  ],
  "topIssues": ["Problem 1", "Problem 2", "Problem 3"],
  "successFactors": ["Faktor 1 der bei erfolgreichen Bewerbungen zutraf"],
  "recommendations": [
    { "priority": "HIGH|MEDIUM|LOW", "action": "Konkrete Handlungsempfehlung", "expectedImpact": "Erwartete Verbesserung" }
  ],
  "predictedOutcome": {
    "currentSuccessRate": 25,
    "improvedSuccessRate": 45,
    "timeToNextInterview": "2-4 Wochen"
  },
  "summary": "Zusammenfassung der Analyse auf Deutsch"
}`;

    const raw = await callClaude(prompt);
    let insight: Record<string, unknown>;
    try {
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      insight = jsonMatch ? JSON.parse(jsonMatch[0]) : { raw };
    } catch {
      insight = { raw, summary: "Analyse konnte nicht geparst werden" };
    }

    return NextResponse.json({ insight, stats, analyzedAt: new Date().toISOString() });
  } catch (e: unknown) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
    }
    return NextResponse.json({ error: "Fehler" }, { status: 500 });
  }
}
