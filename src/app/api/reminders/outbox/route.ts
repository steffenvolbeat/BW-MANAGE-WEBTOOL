import { NextRequest, NextResponse } from "next/server";
import { requireActiveUser, blockReadOnlyRoles, handleGuardError } from "@/lib/security/guard";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ReminderStatus = "PENDING" | "DELIVERED" | "FAILED" | "RETRYING" | "CANCELLED";
export type ReminderPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export interface OutboxReminder {
  id: string;
  userId: string;
  title: string;
  body: string;
  dueAt: string;
  status: ReminderStatus;
  priority: ReminderPriority;
  retryCount: number;
  maxRetries: number;
  deliveredAt?: string;
  lastAttemptAt?: string;
  failureReason?: string;
  tags: string[];
  linkedEntityType?: string;
  linkedEntityId?: string;
  createdAt: string;
}

// ⚠️  PRODUCTION WARNING: In-memory store — data is lost on every cold start / serverless restart.
// TODO: Persist reminders via a ReminderOutbox Prisma model instead of this Map.
const outboxStore = new Map<string, OutboxReminder[]>();

function getUserReminders(userId: string): OutboxReminder[] {
  if (!outboxStore.has(userId)) outboxStore.set(userId, []);
  return outboxStore.get(userId)!;
}

// Simulate delivery attempt (in production: integrate VAPID push / email / SMS)
function attemptDelivery(reminder: OutboxReminder): { success: boolean; reason?: string } {
  // 90% success rate simulation
  const success = Math.random() > 0.1;
  return success ? { success: true } : { success: false, reason: "Zustellung fehlgeschlagen – temporärer Fehler" };
}

// ─── GET /api/reminders/outbox ────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  let user;
  try { user = await requireActiveUser(); } catch (err) { return handleGuardError(err); }

  const status = req.nextUrl.searchParams.get("status") as ReminderStatus | null;
  const all = getUserReminders(user.id);

  const filtered = status ? all.filter((r) => r.status === status) : all;

  // Sort: PENDING+RETRYING first, then by dueAt
  filtered.sort((a, b) => {
    const priority = (s: ReminderStatus) => (s === "PENDING" || s === "RETRYING" ? 0 : 1);
    if (priority(a.status) !== priority(b.status)) return priority(a.status) - priority(b.status);
    return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime();
  });

  const stats = {
    total: all.length,
    pending: all.filter((r) => r.status === "PENDING").length,
    delivered: all.filter((r) => r.status === "DELIVERED").length,
    failed: all.filter((r) => r.status === "FAILED").length,
    retrying: all.filter((r) => r.status === "RETRYING").length,
  };

  return NextResponse.json({ reminders: filtered, stats });
}

// ─── POST /api/reminders/outbox ───────────────────────────────────────────────

export async function POST(req: NextRequest) {
  let user;
  try { user = await blockReadOnlyRoles(); } catch (err) { return handleGuardError(err); }

  let body: {
    title?: string;
    body?: string;
    dueAt?: string;
    priority?: ReminderPriority;
    tags?: string[];
    linkedEntityType?: string;
    linkedEntityId?: string;
    maxRetries?: number;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Ungültiges JSON" }, { status: 400 });
  }

  if (!body.title?.trim()) return NextResponse.json({ error: "Titel fehlt" }, { status: 400 });
  if (!body.dueAt) return NextResponse.json({ error: "Fälligkeit fehlt" }, { status: 400 });

  const all = getUserReminders(user.id);
  if (all.length >= 500) return NextResponse.json({ error: "Maximale Erinnerungsanzahl erreicht" }, { status: 429 });

  const reminder: OutboxReminder = {
    id: crypto.randomUUID(),
    userId: user.id,
    title: body.title.trim().slice(0, 200),
    body: (body.body ?? "").trim().slice(0, 2000),
    dueAt: body.dueAt,
    status: "PENDING",
    priority: body.priority ?? "MEDIUM",
    retryCount: 0,
    maxRetries: Math.min(body.maxRetries ?? 3, 10),
    tags: (body.tags ?? []).slice(0, 10),
    linkedEntityType: body.linkedEntityType,
    linkedEntityId: body.linkedEntityId,
    createdAt: new Date().toISOString(),
  };

  outboxStore.set(user.id, [...all, reminder]);

  // Attempt immediate delivery if dueAt is in the past or within 1 minute
  const dueMs = new Date(reminder.dueAt).getTime();
  const nowMs = Date.now();
  if (dueMs <= nowMs + 60_000) {
    const result = attemptDelivery(reminder);
    reminder.lastAttemptAt = new Date().toISOString();
    if (result.success) {
      reminder.status = "DELIVERED";
      reminder.deliveredAt = new Date().toISOString();
    } else {
      reminder.status = "RETRYING";
      reminder.retryCount = 1;
      reminder.failureReason = result.reason;
    }
  }

  return NextResponse.json(reminder, { status: 201 });
}

// ─── PATCH /api/reminders/outbox?id=... (retry / cancel / update) ─────────────

export async function PATCH(req: NextRequest) {
  let user;
  try { user = await blockReadOnlyRoles(); } catch (err) { return handleGuardError(err); }

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID fehlt" }, { status: 400 });

  let body: { action?: "retry" | "cancel"; title?: string; body?: string; dueAt?: string; priority?: ReminderPriority };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Ungültiges JSON" }, { status: 400 });
  }

  const all = getUserReminders(user.id);
  const idx = all.findIndex((r) => r.id === id && r.userId === user.id);
  if (idx === -1) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });

  const reminder = all[idx];

  if (body.action === "retry") {
    if (reminder.retryCount >= reminder.maxRetries) {
      reminder.status = "FAILED";
      reminder.failureReason = "Maximale Wiederholungsversuche erreicht";
    } else {
      const result = attemptDelivery(reminder);
      reminder.lastAttemptAt = new Date().toISOString();
      reminder.retryCount += 1;
      if (result.success) {
        reminder.status = "DELIVERED";
        reminder.deliveredAt = new Date().toISOString();
        reminder.failureReason = undefined;
      } else {
        reminder.status = reminder.retryCount >= reminder.maxRetries ? "FAILED" : "RETRYING";
        reminder.failureReason = result.reason;
      }
    }
  } else if (body.action === "cancel") {
    reminder.status = "CANCELLED";
  } else {
    // Generic update
    if (body.title) reminder.title = body.title.trim().slice(0, 200);
    if (body.body !== undefined) reminder.body = body.body.trim().slice(0, 2000);
    if (body.dueAt) reminder.dueAt = body.dueAt;
    if (body.priority) reminder.priority = body.priority;
  }

  all[idx] = reminder;
  outboxStore.set(user.id, all);
  return NextResponse.json(reminder);
}

// ─── DELETE /api/reminders/outbox?id=... ──────────────────────────────────────

export async function DELETE(req: NextRequest) {
  let user;
  try { user = await requireActiveUser(); } catch (err) { return handleGuardError(err); }

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID fehlt" }, { status: 400 });

  const all = getUserReminders(user.id);
  if (!all.find((r) => r.id === id)) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });

  outboxStore.set(user.id, all.filter((r) => r.id !== id));
  return NextResponse.json({ deleted: true });
}
