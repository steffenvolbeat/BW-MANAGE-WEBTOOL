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
    const { imageBase64, text, mode } = body;

    const prompt = `Du bist ein OCR- und Datenextraktions-Experte. Extrahiere alle Kontaktdaten aus dieser Visitenkarte.

Antworte NUR mit validem JSON (kein Markdown), mit diesen Feldern (null wenn nicht vorhanden):
{
  "name": "Vollständiger Name oder null",
  "company": "Unternehmensname oder null",
  "position": "Berufsbezeichnung oder null",
  "email": "E-Mail-Adresse oder null",
  "phone": "Telefonnummer oder null",
  "website": "Website-URL oder null",
  "linkedin": "LinkedIn-Profil oder null",
  "address": "Adresse oder null"
}`;

    let resultText: string;

    if (mode === "image" && imageBase64) {
      resultText = await callClaude(prompt, imageBase64, "image/jpeg");
    } else if (text) {
      resultText = await callClaude(`${prompt}\n\nText der Visitenkarte:\n${text}`);
    } else {
      return NextResponse.json({ error: "Kein Bild oder Text angegeben" }, { status: 400 });
    }

    const contact = JSON.parse(resultText);

    return NextResponse.json({ contact });
  } catch (error) {
    if (error === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.error("Card scanner error:", error);
    return NextResponse.json({ error: "Scan fehlgeschlagen" }, { status: 500 });
  }
}
