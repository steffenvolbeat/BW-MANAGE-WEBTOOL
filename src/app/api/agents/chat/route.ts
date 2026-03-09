/**
 * POST /api/agents/chat
 * Autonomer Bewerbungs-Agent – KI-Chat-Backend (Feature 7)
 *
 * Der Agent analysiert die Nutzereingabe und schlägt strukturierte
 * AgentTasks vor, die der Nutzer einzeln genehmigen muss (Human-in-the-Loop).
 *
 * Provider-Chain:
 *  1. Anthropic Claude  (ANTHROPIC_API_KEY)
 *  2. OpenAI-kompatibel (OPENAI_API_KEY + OPENAI_BASE_URL)
 *  3. Regelbasierter Fallback
 */

import { NextResponse } from "next/server";
import { requireActiveUser, handleGuardError } from "@/lib/security/guard";
import { enforceRateLimit } from "@/lib/security/rateLimit";
import type { AgentAction } from "@/lib/agents/mcp";

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface ProposedTask {
  action: AgentAction;
  payload: Record<string, unknown>;
  reasoning: string;
  label: string;
}

// ── System-Prompt ─────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `Du bist ein autonomer Bewerbungsassistent (KI-Agent).
Deine Aufgabe: Analysiere die Anfrage des Nutzers und schlage KONKRETE, AUSFÜHRBARE Agent-Aktionen vor.

Verfügbare Aktionen (action-Typen):
- submit_application  → Bewerbung über ein Jobportal einreichen
- schedule_followup   → Follow-up E-Mail nach X Tagen planen
- create_calendar_event → Termin/Vorstellungsgespräch im Kalender anlegen
- set_reminder        → Erinnerung setzen
- draft_email         → E-Mail-Entwurf erstellen
- update_status       → Bewerbungsstatus aktualisieren

WICHTIG: Antworte IMMER als valides JSON in folgendem Format:
{
  "message": "Kurze Erklärung was du tun wirst (1-2 Sätze)",
  "tasks": [
    {
      "action": "ACTION_TYPE",
      "label": "Kurzer Aktionsname für die UI",
      "reasoning": "Warum diese Aktion sinnvoll ist",
      "payload": { /* aktionsspezifische Daten */ }
    }
  ]
}

Payload-Beispiele:
- submit_application: { "company": "ACME GmbH", "position": "Senior Dev", "portalUrl": "https://...", "deadline": "2026-03-15" }
- schedule_followup: { "applicationId": "...", "daysAfter": 7, "template": "Kurztext der Mail" }
- create_calendar_event: { "title": "Vorstellungsgespräch ACME", "date": "2026-03-10T10:00:00", "location": "Online / Adresse" }
- set_reminder: { "title": "Bewerbungsfrist ACME", "dueAt": "2026-03-14T09:00:00", "note": "Unterlagen fertigstellen" }
- draft_email: { "to": "hr@firma.de", "subject": "Betreff", "body": "E-Mail-Text" }
- update_status: { "applicationId": "...", "from": "Applied", "to": "Interview" }

Wenn der Nutzer unklar ist, stelle eine präzise Rückfrage und gib tasks: [] zurück.
Keine Aktionen ohne explizite Nutzer-Angaben zu Company/Position ausführen.`;

// ── Regelbasierter Fallback ────────────────────────────────────────────────────

function localFallback(userMessage: string): { message: string; tasks: ProposedTask[] } {
  const lower = userMessage.toLowerCase();

  if (lower.includes("bewerb") || lower.includes("stelle") || lower.includes("job")) {
    return {
      message: "Ich habe deine Anfrage zu einer Bewerbung erkannt. Bitte gib mir den Firmennamen und die Stellenbezeichnung, damit ich konkrete Aktionen vorschlagen kann.",
      tasks: [],
    };
  }
  if (lower.includes("follow") || lower.includes("nachfassen")) {
    return {
      message: "Ich schlage vor, ein Follow-up für deine offenen Bewerbungen zu planen.",
      tasks: [
        {
          action: "set_reminder",
          label: "Erinnerung: Follow-up",
          reasoning: "Kein Update nach 7 Tagen → freundlich nachfragen",
          payload: { title: "Follow-up Bewerbung", dueAt: new Date(Date.now() + 7 * 86400000).toISOString(), note: "Bewerbungsstatus erfragen" },
        },
      ],
    };
  }
  if (lower.includes("termin") || lower.includes("interview") || lower.includes("gespräch")) {
    return {
      message: "Ich lege gerne einen Kalender-Eintrag für dein Vorstellungsgespräch an. Gib mir Datum, Uhrzeit und Firmenname.",
      tasks: [],
    };
  }
  return {
    message: "Beschreibe mir, was du erledigen möchtest – z.B. 'Bewerbung bei ACME als Entwickler einreichen' oder 'Termin für Interview morgen um 10 Uhr anlegen'.",
    tasks: [],
  };
}

// ── Anthropic Claude ──────────────────────────────────────────────────────────

async function callAnthropic(
  messages: ChatMessage[],
): Promise<{ message: string; tasks: ProposedTask[] }> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("no key");

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-3-5-haiku-20241022",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: messages.filter((m) => m.role !== "system").map((m) => ({
        role: m.role,
        content: m.content,
      })),
    }),
  });

  if (!res.ok) throw new Error(`Anthropic ${res.status}`);
  const data = await res.json();
  const text = data.content?.[0]?.text ?? "{}";
  return JSON.parse(text);
}

// ── OpenAI-kompatibel ─────────────────────────────────────────────────────────

async function callOpenAI(
  messages: ChatMessage[],
): Promise<{ message: string; tasks: ProposedTask[] }> {
  const apiKey = process.env.OPENAI_API_KEY;
  const baseUrl = process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1";
  if (!apiKey) throw new Error("no key");

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_CHAT_MODEL_ID ?? "gpt-4o-mini",
      max_tokens: 1024,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...messages.filter((m) => m.role !== "system"),
      ],
    }),
  });

  if (!res.ok) throw new Error(`OpenAI ${res.status}`);
  const data = await res.json();
  const text = data.choices?.[0]?.message?.content ?? "{}";
  return JSON.parse(text);
}

// ── Route Handler ─────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  let user;
  try {
    user = await requireActiveUser();
  } catch (err) {
    return handleGuardError(err);
  }

  const rl = enforceRateLimit(request, "agents:chat", { max: 20, windowMs: 60_000 });
  if (rl) return rl;

  try {
    const body = await request.json();
    const { messages }: { messages: ChatMessage[] } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "messages[] erforderlich" }, { status: 400 });
    }

    let result: { message: string; tasks: ProposedTask[] };

    try {
      result = await callAnthropic(messages);
    } catch {
      try {
        result = await callOpenAI(messages);
      } catch {
        const lastUser = messages.filter((m) => m.role === "user").pop()?.content ?? "";
        result = localFallback(lastUser);
      }
    }

    // Sicherstellen dass tasks valide sind
    const validActions: AgentAction[] = [
      "submit_application", "schedule_followup", "create_calendar_event",
      "set_reminder", "draft_email", "update_status",
    ];
    const tasks = (result.tasks ?? []).filter(
      (t) => t.action && validActions.includes(t.action as AgentAction)
    );

    return NextResponse.json({ message: result.message ?? "", tasks });
  } catch (err) {
    console.error("[Agent Chat]", err);
    return NextResponse.json({ error: "Agent-Fehler" }, { status: 500 });
  }
}
