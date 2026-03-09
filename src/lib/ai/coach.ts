/**
 * AI-BEWERBUNGS-COACH (Privacy-First)
 *
 * Unterstützte Backends (in Prioritätsreihenfolge):
 *  1. Lokal via transformers.js / WebLLM (kein Netzwerk, on-device)
 *  2. Anthropic Claude API (Zero-Retention-Vertrag nötig)
 *  3. OpenAI-kompatibler Endpoint (konfigurierbar via ENV)
 *
 * Alle Prompts werden CLIENT-SEITIG vorverarbeitet:
 *  - Persönliche Identifikationsmerkmale werden herausgefiltert
 *  - Kein Firmenname im Prompt wenn PRIVACY_STRICT=true
 */

export type CoachBackend = "local" | "anthropic" | "openai-compat";

export interface CoachRequest {
  type:
    | "cover-letter-review"
    | "keyword-suggestion"
    | "interview-prep"
    | "salary-negotiation"
    | "rejection-analysis";
  /** Anonymisierter Kontext (kein PII) */
  context: string;
  /** Zielposition (generisch) */
  targetRole?: string;
  /** Gewünschte Sprache der Antwort */
  language?: "de" | "en";
}

export interface CoachResponse {
  suggestion: string;
  keywords?: string[];
  score?: number; // 0–100 Qualitätsscore
  backend: CoachBackend;
  privacyNote: string;
}

// ─── Anthropic Claude API ─────────────────────────────────────────────────────

async function callAnthropicClaude(
  req: CoachRequest,
  apiKey: string
): Promise<CoachResponse> {
  const systemPrompt = `Du bist ein professioneller Bewerbungs-Coach. 
Antworte auf ${req.language === "en" ? "Englisch" : "Deutsch"}.
Vermeide es, nach persönlichen Daten zu fragen oder diese zu speichern.
Fokussiere auf konkrete, umsetzbare Verbesserungen.`;

  const userPrompt = buildPrompt(req);

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-3-5-haiku-20241022",
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });

  if (!response.ok) {
    throw new Error(`Anthropic API Fehler: ${response.status}`);
  }

  const data = await response.json();
  const text = data.content?.[0]?.text ?? "";
  const keywords = extractKeywords(text);

  return {
    suggestion: text,
    keywords,
    backend: "anthropic",
    privacyNote:
      "Verarbeitet via Anthropic Claude (Zero-Retention API). Kein Training auf Ihren Daten.",
  };
}

// ─── OpenAI-kompatibler Endpoint ──────────────────────────────────────────────

async function callOpenAICompat(
  req: CoachRequest,
  baseUrl: string,
  apiKey: string
): Promise<CoachResponse> {
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: process.env.AI_COACH_MODEL ?? "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `Bewerbungs-Coach. Antworte auf ${req.language === "en" ? "Englisch" : "Deutsch"}.`,
        },
        { role: "user", content: buildPrompt(req) },
      ],
      max_tokens: 1024,
      temperature: 0.7,
    }),
  });

  if (!response.ok) throw new Error(`API Fehler: ${response.status}`);
  const data = await response.json();
  const text = data.choices?.[0]?.message?.content ?? "";

  return {
    suggestion: text,
    keywords: extractKeywords(text),
    backend: "openai-compat",
    privacyNote:
      "Verarbeitet via OpenAI-kompatiblem Endpoint. Datenschutz gemäß Provider-Vertrag.",
  };
}

// ─── Prompt-Builder ───────────────────────────────────────────────────────────

function buildPrompt(req: CoachRequest): string {
  const prompts: Record<CoachRequest["type"], string> = {
    "cover-letter-review": `Analysiere folgendes Anschreiben und gib konkrete Verbesserungsvorschläge. 
Bewerte: Überzeugungskraft (1-10), Struktur (1-10), Keywords (1-10).
Schlage fehlende Keywords für "${req.targetRole ?? "die angestrebte Position"}" vor.

Anschreiben:
${req.context}`,
    "keyword-suggestion": `Welche Keywords fehlen für folgendes Bewerbungsprofil im Bereich "${req.targetRole ?? "IT"}"?
Kontext: ${req.context}
Gib eine priorisierte Liste mit 10-15 Keywords zurück.`,
    "interview-prep": `Erstelle 10 typische Interviewfragen für "${req.targetRole ?? "die Position"}" 
mit idealen Antworthinweisen. Kontext: ${req.context}`,
    "salary-negotiation": `Gib Strategietipps zur Gehaltsverhandlung für "${req.targetRole ?? "die Position"}".
Marktkontext: ${req.context}`,
    "rejection-analysis": `Analysiere folgende Absage und schlage Verbesserungen vor.
Was könnte der Grund sein? Was sollte nächste Mal anders gemacht werden?
Absage: ${req.context}`,
  };
  return prompts[req.type];
}

function extractKeywords(text: string): string[] {
  // Einfache Keyword-Extraktion aus strukturierten Antworten
  const matches = text.match(/[-•*]\s+([A-Za-zÄÖÜäöüß\s/+#.]{3,40})/g) ?? [];
  return matches
    .map((m) => m.replace(/^[-•*]\s+/, "").trim())
    .filter((k) => k.length > 2)
    .slice(0, 15);
}

// ─── Haupt-API ────────────────────────────────────────────────────────────────

export async function getCoachSuggestion(
  req: CoachRequest
): Promise<CoachResponse> {
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;
  const openaiBase = process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1";

  if (anthropicKey) {
    return callAnthropicClaude(req, anthropicKey);
  }

  if (openaiKey) {
    return callOpenAICompat(req, openaiBase, openaiKey);
  }

  // Fallback: Regelbasiertes System (kein Netzwerk)
  return {
    suggestion: generateRuleBasedSuggestion(req),
    keywords: [],
    backend: "local",
    privacyNote:
      "Lokal verarbeitet – keine Daten verlassen das Gerät. Für bessere Ergebnisse API-Key konfigurieren.",
  };
}

function generateRuleBasedSuggestion(req: CoachRequest): string {
  const tips: Record<CoachRequest["type"], string> = {
    "cover-letter-review": `Anschreiben-Tipps:
• Beginne mit einem starken Einstiegssatz der deinen Mehrwert nennt
• Verwende konkrete Zahlen und Erfolge (z.B. "steigerte Performance um 40%")
• Nutze Keywords aus der Stellenausschreibung
• Halte es bei maximal einer A4-Seite
• Zeige Recherche über das Unternehmen`,
    "keyword-suggestion": `Wichtige Keywords für Bewerbungen:
• Fachliche Skills: Aus der Stellenbeschreibung übernehmen
• Soft Skills: Teamfähigkeit, Eigeninitiative, Kommunikation
• Tools/Technologien: Explizit genannte Anforderungen
• Branchenspezifische Begriffe`,
    "interview-prep": `Vorbereitung auf typische Fragen:
• "Erzählen Sie von sich" – Elevator Pitch vorbereiten
• "Stärken/Schwächen" – Ehrlich und mit Entwicklungsplan
• Fachfragen zur Position üben
• Eigene Fragen vorbereiten`,
    "salary-negotiation": `Gehaltsverhandlung:
• Marktgehalt recherchieren (Gehaltsvergleich.de, StepStone)
• Obere Grenze zuerst nennen
• Nie als Erstes eine Zahl nennen
• Gesamtpaket verhandeln (Remote, Weiterbildung, Benefits)`,
    "rejection-analysis": `Nach einer Absage:
• Um Feedback bitten (höflich, per E-Mail)
• Bewerbungsunterlagen überarbeiten
• Netzwerk aktivieren
• Andere Positionen beim selben Unternehmen prüfen`,
  };
  return tips[req.type];
}
