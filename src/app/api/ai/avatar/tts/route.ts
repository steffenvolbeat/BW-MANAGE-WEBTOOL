/**
 * POST /api/ai/avatar/tts
 * Text-to-Speech – ElevenLabs oder Web-Speech-API-Fallback-Hinweis (Feature 3)
 *
 * Body: { text: string, voiceId?: string, language?: "de"|"en" }
 * Response:
 *  - Wenn ELEVENLABS_API_KEY gesetzt: audio/mpeg binary
 *  - Sonst: { useBrowserTTS: true, text } → Client nutzt SpeechSynthesis
 */
import { NextResponse } from "next/server";
import { requireActiveUser, handleGuardError } from "@/lib/security/guard";
import { enforceRateLimit } from "@/lib/security/rateLimit";

// Gute deutsche/englische ElevenLabs Stimmen (Fallback-IDs)
const DEFAULT_VOICE_DE = "EXAVITQu4vr4xnSDxMaL"; // Sarah (klar, professionell)
const DEFAULT_VOICE_EN = "21m00Tcm4TlvDq8ikWAM"; // Rachel (warm, klar)

export async function POST(request: Request) {
  const rlResponse = enforceRateLimit(request, "ai:avatar-tts", { max: 20, windowMs: 60_000 });
  if (rlResponse) return rlResponse;

  try {
    await requireActiveUser();
  } catch (err) {
    return handleGuardError(err);
  }

  try {
    const body = await request.json();
    const text: string = (body.text ?? "").trim().slice(0, 800);
    const language: "de" | "en" = body.language ?? "de";
    const voiceId: string = body.voiceId ?? (language === "de" ? DEFAULT_VOICE_DE : DEFAULT_VOICE_EN);

    if (!text) {
      return NextResponse.json({ error: "Kein Text" }, { status: 400 });
    }

    // ── ElevenLabs TTS ──────────────────────────────────────────────────────
    if (process.env.ELEVENLABS_API_KEY) {
      try {
        const resp = await fetch(
          `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
          {
            method: "POST",
            headers: {
              "xi-api-key": process.env.ELEVENLABS_API_KEY,
              "Content-Type": "application/json",
              Accept: "audio/mpeg",
            },
            body: JSON.stringify({
              text,
              model_id: "eleven_multilingual_v2",
              voice_settings: { stability: 0.5, similarity_boost: 0.75 },
            }),
            signal: AbortSignal.timeout(20000),
          }
        );

        if (resp.ok) {
          const audioBuffer = await resp.arrayBuffer();
          return new Response(audioBuffer, {
            headers: {
              "Content-Type": "audio/mpeg",
              "Cache-Control": "no-store",
            },
          });
        }
      } catch (e) {
        console.warn("[TTS] ElevenLabs fehlgeschlagen, Browser-Fallback:", e);
      }
    }

    // ── Browser-TTS-Fallback ─────────────────────────────────────────────────
    return NextResponse.json({
      useBrowserTTS: true,
      text,
      language,
    });
  } catch (err) {
    console.error("[Avatar TTS]", err);
    return NextResponse.json({ error: "Interner Fehler" }, { status: 500 });
  }
}
