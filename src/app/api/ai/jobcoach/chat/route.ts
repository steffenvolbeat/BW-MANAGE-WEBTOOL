/**
 * POST /api/ai/jobcoach/chat
 * JobCoach AI – Vollständiger KI-Assistent (Feature 4)
 *
 * Unterstützt:
 *  - Anthropic Claude (wenn ANTHROPIC_API_KEY gesetzt)
 *  - OpenAI-kompatibel (wenn OPENAI_API_KEY + OPENAI_BASE_URL)
 *  - Lokaler Fallback (regelbasiert)
 *
 * Body:
 *  { messages: ChatMessage[], applicationId?: string, language?: "de"|"en" }
 */
import { NextResponse } from "next/server";
import { requireActiveUser, handleGuardError } from "@/lib/security/guard";
import { enforceRateLimit } from "@/lib/security/rateLimit";
import { prisma } from "@/lib/database";

// ── Typen ────────────────────────────────────────────────────────────────────

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

// ── System-Prompt ────────────────────────────────────────────────────────────

function buildSystemPrompt(
  language: "de" | "en",
  appContext: string | null
): string {
  const lang = language === "en" ? "English" : "Deutsch";
  const base = language === "de"
    ? `Du bist JobCoach AI – ein persönlicher, professioneller KI-Bewerbungsassistent.
Du hilfst Nutzern bei allen Aspekten ihrer Jobsuche: Bewerbungen, Anschreiben, Interviews, Gehaltsverhandlungen, Netzwerken und Karriereplanung.
Antworte immer auf ${lang}. Sei konkret, praktisch und ermutigend.
Halte Antworten prägnant (max 4–6 Absätze) und formatiere mit Markdown.
Du hast Zugriff auf den Bewerbungskontext des Nutzers (wenn angegeben).
WICHTIG: Speichere oder teile keine persönlichen Daten.`
    : `You are JobCoach AI – a personal, professional AI job application assistant.
You help users with all aspects of their job search: applications, cover letters, interviews, salary negotiations, networking and career planning.
Always respond in ${lang}. Be concrete, practical and encouraging.
Keep answers concise (max 4–6 paragraphs) and format with Markdown.
You have access to the user's application context (if provided).
IMPORTANT: Do not store or share any personal data.`;

  if (appContext) {
    return `${base}\n\n## Bewerbungskontext des Nutzers:\n${appContext}`;
  }
  return base;
}

// ── Anwendungskontext laden ───────────────────────────────────────────────────

async function getApplicationContext(
  userId: string,
  applicationId?: string
): Promise<string | null> {
  try {
    if (applicationId) {
      const app = await prisma.application.findFirst({
        where: { id: applicationId, userId },
        select: {
          companyName: true,
          position: true,
          location: true,
          status: true,
          salary: true,
          requirements: true,
          notesText: true,
          appliedAt: true,
          jobType: true,
        },
      });
      if (!app) return null;
      return [
        `Stelle: ${app.position} bei ${app.companyName}`,
        `Standort: ${app.location} | Typ: ${app.jobType}`,
        `Status: ${app.status} | Beworben am: ${app.appliedAt.toLocaleDateString("de-DE")}`,
        app.salary ? `Gehalt: ${app.salary}` : null,
        app.requirements ? `Anforderungen: ${app.requirements.slice(0, 500)}` : null,
        app.notesText ? `Notizen: ${app.notesText.slice(0, 300)}` : null,
      ]
        .filter(Boolean)
        .join("\n");
    }

    // Zusammenfassung der letzten 10 Bewerbungen als Kontext
    const recent = await prisma.application.findMany({
      where: { userId },
      orderBy: { appliedAt: "desc" },
      take: 10,
      select: {
        companyName: true,
        position: true,
        status: true,
        appliedAt: true,
      },
    });
    if (recent.length === 0) return null;

    const lines = recent.map(
      (a) =>
        `- ${a.position} @ ${a.companyName} | Status: ${a.status} | ${a.appliedAt.toLocaleDateString("de-DE")}`
    );
    return `Letzte Bewerbungen (${recent.length}):\n${lines.join("\n")}`;
  } catch {
    return null;
  }
}

// ── Anthropic Claude ──────────────────────────────────────────────────────────

async function callAnthropic(
  messages: ChatMessage[],
  systemPrompt: string
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey === "set_me") throw new Error("no_anthropic_key");

  const model = process.env.ANTHROPIC_MODEL ?? "claude-3-5-haiku-20241022";

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 1024,
      temperature: 0.7,
      system: systemPrompt,
      messages: messages
        .filter((m) => m.role !== "system")
        .map((m) => ({ role: m.role, content: m.content })),
    }),
  });

  if (!res.ok) throw new Error(`anthropic_error_${res.status}`);
  const data = await res.json();
  return data.content?.[0]?.text ?? "";
}

// ── OpenAI-kompatibel (Ollama, OpenAI, etc.) ─────────────────────────────────

async function callOpenAICompat(
  messages: ChatMessage[],
  systemPrompt: string
): Promise<string> {
  const baseUrl =
    process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1";
  const apiKey = process.env.OPENAI_API_KEY ?? "ollama";
  const model = process.env.AI_COACH_MODEL ?? "gpt-4o-mini";

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      max_tokens: 1024,
      temperature: 0.7,
      messages: [
        { role: "system", content: systemPrompt },
        ...messages
          .filter((m) => m.role !== "system")
          .map((m) => ({ role: m.role, content: m.content })),
      ],
    }),
  });

  if (!res.ok) throw new Error(`openai_error_${res.status}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

// ── Lokaler Fallback ─────────────────────────────────────────────────────────

function localFallback(userMessage: string, language: "de" | "en"): string {
  const msg = userMessage.toLowerCase();
  const de = language === "de";

  if (msg.includes("anschreiben") || msg.includes("cover letter")) {
    return de
      ? `## Anschreiben-Tipps\n\n**Struktur:**\n1. **Einstieg** – Persönlicher Bezug zur Stelle\n2. **Hauptteil** – Konkrete Erfahrungen + Mehrwert\n3. **Schluss** – Gesprächswunsch, selbstbewusst\n\n**Wichtig:**\n- Max. 1 DIN-A4-Seite\n- Keine Floskeln wie "Mit freundlichen Grüßen"\n- Schlüsselwörter aus der Stellenanzeige einbauen\n\n*Tipp: Nutze das Anschreiben-Studio für DIN-5008-konforme Briefe.*`
      : `## Cover Letter Tips\n\n**Structure:**\n1. **Opening** – Personal connection to the role\n2. **Main part** – Concrete experience + value\n3. **Closing** – Request for interview, confident tone\n\n**Important:**\n- Max 1 page\n- Use keywords from the job posting\n- Show impact with numbers`;
  }

  if (msg.includes("gehalt") || msg.includes("salary") || msg.includes("vergütung")) {
    return de
      ? `## Gehaltsverhandlung\n\n**Vorbereitung:**\n- Marktrecherche (Glassdoor, LinkedIn Salary, Stepstone)\n- Eigene Untergrenze festlegen (nicht nennen)\n- Bewerbungsunterlagen = Leistungen, nicht Bedarf\n\n**Im Gespräch:**\n- Erst Angebot des Unternehmens abwarten\n- Mit 10–15% über Zielgehalt starten\n- Paket bewerten: Bonus, Remote, Urlaub, Weiterbildung\n\n**Formulierung:** *"Basierend auf meiner Erfahrung und dem Markt erwarte ich X–Y €."*`
      : `## Salary Negotiation\n\n**Preparation:**\n- Research market rates (Glassdoor, LinkedIn Salary)\n- Define your minimum (don't reveal it)\n\n**In the negotiation:**\n- Wait for their offer first\n- Start 10–15% above target\n- Consider full package: bonus, remote, vacation, training`;
  }

  if (msg.includes("interview") || msg.includes("vorstellungsgespräch")) {
    return de
      ? `## Interview-Vorbereitung\n\n**Klassische Fragen:**\n- "Erzählen Sie von sich" → 2-Min-Pitch vorbereiten\n- "Stärken/Schwächen" → Authentisch + lösungsorientiert\n- "Warum wir?" → Unternehmensrecherche zeigen\n\n**STAR-Methode für Verhaltensfragen:**\n**S**ituation → **T**ask → **A**ction → **R**esult\n\n**Eigene Fragen vorbereiten:**\n- Teamstruktur, Onboarding, Entwicklungsmöglichkeiten\n\n*Nutze den KI-Interview-Simulator für realistische Übungen!*`
      : `## Interview Preparation\n\n**Classic questions:**\n- "Tell me about yourself" → 2-min elevator pitch\n- "Strengths/Weaknesses" → Authentic + solution-focused\n- "Why us?" → Show company research\n\n**STAR method for behavioral questions:**\n**S**ituation → **T**ask → **A**ction → **R**esult`;
  }

  if (msg.includes("ablehnung") || msg.includes("absage") || msg.includes("rejection")) {
    return de
      ? `## Absage konstruktiv nutzen\n\n**Sofort:**\n- Professionell antworten, Feedback anfragen\n- Kontakt auf LinkedIn halten\n\n**Analyse:**\n- Was fehlte? Skills, Erfahrung, Cultural Fit?\n- Lücken schließen oder spezifischere Stellen suchen\n\n**Weiter:**\n- Absagen sind kein Urteil über deinen Wert\n- Statistik: Durchschnittlich 5–20 Bewerbungen bis zum Angebot\n\n*Eine Absage = eine Lektion. Du wirst besser.*`
      : `## Handling a Rejection\n\nReach out professionally, ask for feedback. A rejection is data, not judgment. Keep the contact on LinkedIn and analyze what you can improve.`;
  }

  if (msg.includes("netzwerk") || msg.includes("networking") || msg.includes("linkedin")) {
    return de
      ? `## Netzwerken effektiv\n\n**LinkedIn-Optimierung:**\n- Professionelles Foto + aussagekräftige Headline\n- "About"-Sektion mit deiner Story\n- Regelmäßig relevante Inhalte teilen\n\n**Aktives Netzwerken:**\n- Personalisierte Verbindungsanfragen (kurze Nachricht!)\n- Meetups, Konferenzen, Fachgruppen\n- Informational Interviews anfragen\n\n**Warm Outreach:** *"Ich habe Ihren Artikel über [Thema] gelesen und würde mich über 15 Min. Austausch freuen."*`
      : `## Networking Effectively\n\n- Optimize LinkedIn: professional photo, clear headline\n- Send personalized connection requests\n- Attend meetups and conferences\n- Request informational interviews`;
  }

  // Allgemeine Antwort
  return de
    ? `## JobCoach AI 🧠\n\nIch bin dein persönlicher KI-Bewerbungsassistent! Ich helfe dir bei:\n\n- 📝 **Anschreiben** – Überprüfung, Optimierung, Vorlagen\n- 🎯 **Keywords** – Stellenanzeigen analysieren\n- 🎤 **Interview-Vorbereitung** – Typische Fragen, STAR-Methode\n- 💰 **Gehaltsverhandlung** – Marktgerechte Argumentation\n- 🌐 **Netzwerken** – LinkedIn, Outreach-Strategien\n- 📊 **Bewerbungsstrategie** – Priorisierung, Timeout-Management\n\nWomit kann ich dir helfen?`
    : `## JobCoach AI 🧠\n\nI'm your personal AI job application assistant! I can help with:\n\n- 📝 **Cover letters** – Review, optimization, templates\n- 🎯 **Keywords** – Analyzing job postings\n- 🎤 **Interview prep** – Typical questions, STAR method\n- 💰 **Salary negotiation** – Market-based arguments\n- 🌐 **Networking** – LinkedIn, outreach strategies\n\nWhat can I help you with?`;
}

// ── Handler ───────────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  const rateLimitResponse = enforceRateLimit(request, "ai:jobcoach", {
    max: 20,
    windowMs: 60_000,
  });
  if (rateLimitResponse) return rateLimitResponse;

  let user;
  try {
    user = await requireActiveUser();
  } catch (err) {
    return handleGuardError(err);
  }

  try {
    const body = await request.json();
    const messages: ChatMessage[] = Array.isArray(body.messages)
      ? body.messages.slice(-12) // Max 12 Nachrichten History
      : [];
    const language: "de" | "en" =
      body.language === "en" ? "en" : "de";
    const applicationId: string | undefined = body.applicationId;

    const lastUserMessage =
      messages.filter((m) => m.role === "user").pop()?.content ?? "";

    if (!lastUserMessage) {
      return NextResponse.json({ error: "Keine Nachricht" }, { status: 400 });
    }

    // Anwendungskontext laden
    const appContext = await getApplicationContext(user.id, applicationId);
    const systemPrompt = buildSystemPrompt(language, appContext);

    let reply = "";
    let backend = "local";

    // Providerreihenfolge: Anthropic → OpenAI-compat → lokal
    try {
      reply = await callAnthropic(messages, systemPrompt);
      backend = process.env.ANTHROPIC_MODEL ?? "claude-3-5-haiku-20241022";
    } catch (e1) {
      const err1 = e1 as Error;
      if (
        err1.message !== "no_anthropic_key" &&
        (process.env.OPENAI_API_KEY || process.env.OPENAI_BASE_URL)
      ) {
        try {
          reply = await callOpenAICompat(messages, systemPrompt);
          backend = process.env.AI_COACH_MODEL ?? "openai-compat";
        } catch {
          // fall through to local
        }
      }
    }

    if (!reply) {
      reply = localFallback(lastUserMessage, language);
      backend = "local";
    }

    return NextResponse.json({
      reply,
      backend,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("JobCoach chat error:", err);
    return NextResponse.json({ error: "Interner Fehler" }, { status: 500 });
  }
}
