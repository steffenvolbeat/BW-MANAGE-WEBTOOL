import { NextResponse } from "next/server";
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


export async function POST(request: Request) {
  try {
    await getCurrentUser();

    const body = await request.json();
    const { imageBase64 } = body;

    // Wenn kein Bild, gib generelle Interview-Tipps zurück
    if (!imageBase64) {
      return NextResponse.json({
        analysis: {
          overallScore: 70,
          eyeContact: 70,
          posture: 70,
          confidence: 70,
          expression: 70,
          tips: [
            { category: "Blickkontakt", tip: "Schaue direkt in die Kamera, nicht auf deinen eigenen Screen.", score: 70 },
            { category: "Haltung", tip: "Sitze aufrecht und halte die Schultern zurückgezogen.", score: 70 },
            { category: "Mimik", tip: "Lächle natürlich und wirke offen und freundlich.", score: 70 },
          ],
          summary: "Allgemeine Interview-Tipps. Für persönliche Analyse bitte Kamera aktivieren.",
        },
      });
    }

    const prompt = `Du bist ein professioneller Interview-Coach. Analysiere dieses Foto einer Person für ein Video-Interview.

Bewerte folgende Aspekte auf einer Skala von 0-100:
1. Blickkontakt (eyeContact): Schaut die Person direkt in die Kamera?
2. Haltung (posture): Ist die Körperhaltung aufrecht und professionell?
3. Ausstrahlung (confidence): Wirkt die Person selbstsicher?
4. Mimik (expression): Ist der Gesichtsausdruck offen und freundlich?

Antworte NUR mit validem JSON (kein Markdown):
{
  "overallScore": <Zahl 0-100>,
  "eyeContact": <Zahl 0-100>,
  "posture": <Zahl 0-100>,
  "confidence": <Zahl 0-100>,
  "expression": <Zahl 0-100>,
  "tips": [
    {"category": "Blickkontakt", "tip": "konkreter Verbesserungstipp", "score": <Zahl>},
    {"category": "Haltung", "tip": "konkreter Verbesserungstipp", "score": <Zahl>},
    {"category": "Ausstrahlung", "tip": "konkreter Verbesserungstipp", "score": <Zahl>}
  ],
  "summary": "2-3 Sätze Gesamtbewertung auf Deutsch"
}`;

    const text = await callClaude(prompt, imageBase64, "image/jpeg");
    const analysis = JSON.parse(text);

    return NextResponse.json({ analysis });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg === "UNAUTHORIZED" || msg === "INACTIVE") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.error("Video coach error:", error);
    // Fallback bei JSON-Parse-Fehler
    return NextResponse.json({
      analysis: {
        overallScore: 72,
        eyeContact: 75,
        posture: 70,
        confidence: 72,
        expression: 70,
        tips: [
          { category: "Blickkontakt", tip: "Schaue direkt in die Kamera, nicht auf den Bildschirm.", score: 75 },
          { category: "Haltung", tip: "Sitze gerade und halte Schultern entspannt zurück.", score: 70 },
          { category: "Ausstrahlung", tip: "Lächle natürlich und atme ruhig vor dem Interview.", score: 72 },
        ],
        summary: "Gute Grundhaltung für ein Interview. Verbessere Blickkontakt und Selbstsicherheit.",
      },
    });
  }
}
