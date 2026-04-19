import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/currentUser";
import { prisma } from "@/lib/database";

// ─── Automation Rule Types ────────────────────────────────────────────────────

export type AutomationTrigger =
  | "CARD_MOVED"          // Karte in eine Spalte verschoben
  | "CARD_CREATED"        // Neue Karte erstellt
  | "STATUS_CHANGED"      // Bewerbungsstatus geändert
  | "DUE_DATE_APPROACHING" // Fälligkeit in X Tagen
  | "CARD_ASSIGNED";      // Karte zugewiesen

export type AutomationAction =
  | "CREATE_REMINDER"     // Erinnerung erstellen
  | "CREATE_EVENT"        // Kalender-Termin erstellen
  | "SEND_NOTIFICATION"   // In-App Benachrichtigung
  | "MOVE_CARD"           // Karte in andere Spalte
  | "ADD_TAG"             // Tag hinzufügen
  | "CHANGE_PRIORITY";    // Priorität ändern

export interface AutomationRule {
  id: string;
  userId: string;
  name: string;
  enabled: boolean;
  trigger: AutomationTrigger;
  triggerConfig: Record<string, unknown>; // e.g., { columnName: "Interview" }
  action: AutomationAction;
  actionConfig: Record<string, unknown>;  // e.g., { daysBefore: 1, title: "Vorbereitung" }
  runCount: number;
  lastRunAt: string | null;
  createdAt: string;
}

// In-memory store (production: persist in DB via Prisma)
// The production schema should have a KanbanAutomation model.
// Here we simulate persistence via a module-level map keyed by userId.
const store = new Map<string, AutomationRule[]>();

function getRules(userId: string): AutomationRule[] {
  return store.get(userId) ?? [];
}

function setRules(userId: string, rules: AutomationRule[]): void {
  store.set(userId, rules);
}

// ─── GET /api/kanban/automations ──────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user.id) return NextResponse.json({ error: "Unauth" }, { status: 401 });

  return NextResponse.json(getRules(user.id));
}

// ─── POST /api/kanban/automations ─────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user.id) return NextResponse.json({ error: "Unauth" }, { status: 401 });

  let body: Partial<AutomationRule>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Ungültiges JSON" }, { status: 400 });
  }

  if (!body.name || !body.trigger || !body.action) {
    return NextResponse.json({ error: "Pflichtfelder fehlen: name, trigger, action." }, { status: 400 });
  }

  const newRule: AutomationRule = {
    id: `auto-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    userId: user.id,
    name: String(body.name).slice(0, 150),
    enabled: body.enabled !== false,
    trigger: body.trigger,
    triggerConfig: body.triggerConfig ?? {},
    action: body.action,
    actionConfig: body.actionConfig ?? {},
    runCount: 0,
    lastRunAt: null,
    createdAt: new Date().toISOString(),
  };

  const rules = getRules(user.id);
  if (rules.length >= 50) {
    return NextResponse.json({ error: "Maximal 50 Automationen pro Nutzer erlaubt." }, { status: 422 });
  }

  rules.push(newRule);
  setRules(user.id, rules);

  return NextResponse.json(newRule, { status: 201 });
}

// ─── PATCH /api/kanban/automations?id=... ─────────────────────────────────────

export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user.id) return NextResponse.json({ error: "Unauth" }, { status: 401 });

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id fehlt." }, { status: 400 });

  let body: Partial<AutomationRule>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Ungültiges JSON" }, { status: 400 });
  }
  const rules = getRules(user.id);
  const idx = rules.findIndex((r) => r.id === id);

  if (idx === -1) return NextResponse.json({ error: "Nicht gefunden." }, { status: 404 });

  rules[idx] = {
    ...rules[idx],
    ...(body.name !== undefined && { name: String(body.name).slice(0, 150) }),
    ...(body.enabled !== undefined && { enabled: body.enabled }),
    ...(body.triggerConfig !== undefined && { triggerConfig: body.triggerConfig }),
    ...(body.actionConfig !== undefined && { actionConfig: body.actionConfig }),
  };
  setRules(user.id, rules);

  return NextResponse.json(rules[idx]);
}

// ─── DELETE /api/kanban/automations?id=... ────────────────────────────────────

export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user.id) return NextResponse.json({ error: "Unauth" }, { status: 401 });

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id fehlt." }, { status: 400 });

  const rules = getRules(user.id).filter((r) => r.id !== id);
  setRules(user.id, rules);

  return NextResponse.json({ success: true });
}
