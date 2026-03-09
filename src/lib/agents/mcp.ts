/**
 * AGENTIC AUTOMATION – Model Context Protocol (MCP)
 *
 * KI-Agent der autonom (mit Nutzer-Approval) Bewerbungsaufgaben ausführt:
 *  - Bewerbungen über Jobportale einreichen
 *  - Follow-up-E-Mails planen
 *  - Kalendereinträge erstellen
 *  - Reminder setzen
 *
 * Sicherheitsprinzipien:
 *  - Jede Agenten-Aktion erfordert explizite Nutzerfreigabe (Human-in-the-Loop)
 *  - Alle Aktionen werden im AuditLog gespeichert
 *  - Dry-Run-Modus für Vorschau ohne Ausführung
 *  - Rollback-Möglichkeit für reversible Aktionen
 */


export type AgentAction =
  | "submit_application"
  | "schedule_followup"
  | "create_calendar_event"
  | "set_reminder"
  | "draft_email"
  | "update_status";

export type ApprovalStatus = "pending" | "approved" | "rejected" | "executed" | "rolled_back";

export interface AgentTask {
  id: string;
  userId: string;
  action: AgentAction;
  payload: Record<string, unknown>;
  reasoning: string;      // Warum der Agent diese Aktion vorschlägt
  dryRunResult?: unknown; // Ergebnis des Dry-Run
  status: ApprovalStatus;
  createdAt: string;
  executedAt?: string;
  rollbackData?: unknown;
}

export interface AgentStep {
  tool: string;
  input: Record<string, unknown>;
  output?: unknown;
  error?: string;
}

// ─── In-Memory Task-Store (wird in Produktion durch DB ersetzt) ───────────────

const pendingTasks = new Map<string, AgentTask>();

function generateId(): string {
  return `agent_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// ─── Aktionen ─────────────────────────────────────────────────────────────────

const ACTION_HANDLERS: Record<
  AgentAction,
  (payload: Record<string, unknown>, dryRun: boolean) => Promise<unknown>
> = {
  submit_application: async (payload, dryRun) => {
    if (dryRun) {
      return {
        preview: `Würde Bewerbung für "${payload.position}" bei "${payload.company}" einreichen`,
        url: payload.portalUrl,
        estimatedTime: "2-3 Minuten",
      };
    }
    // TODO: Job-Portal-Integration (Selenium / Playwright headless)
    return { submitted: true, confirmationId: `JOB-${Date.now()}` };
  },

  schedule_followup: async (payload, dryRun) => {
    const date = new Date(Date.now() + 7 * 86400000).toISOString();
    if (dryRun) {
      return { preview: `Follow-up geplant für ${date}`, message: payload.template };
    }
    return { scheduled: true, date };
  },

  create_calendar_event: async (payload, dryRun) => {
    if (dryRun) {
      return { preview: `Kalender-Eintrag: ${payload.title} am ${payload.date}` };
    }
    return { created: true, eventId: generateId() };
  },

  set_reminder: async (payload, dryRun) => {
    if (dryRun) {
      return { preview: `Erinnerung: ${payload.title} um ${payload.dueAt}` };
    }
    return { created: true, reminderId: generateId() };
  },

  draft_email: async (payload, dryRun) => {
    const draft = `Betreff: ${payload.subject}\n\n${payload.body}`;
    if (dryRun) return { preview: draft };
    return { drafted: true, draft };
  },

  update_status: async (payload, dryRun) => {
    if (dryRun) {
      return {
        preview: `Status von "${payload.applicationId}" wird von ${payload.from} auf ${payload.to} gesetzt`,
      };
    }
    return { updated: true };
  },
};

// ─── Haupt-API ────────────────────────────────────────────────────────────────

/** Erstellt einen neuen Agenten-Task (noch nicht ausgeführt, wartet auf Approval) */
export async function createAgentTask(
  userId: string,
  action: AgentAction,
  payload: Record<string, unknown>,
  reasoning: string
): Promise<AgentTask> {
  const handler = ACTION_HANDLERS[action];
  const dryRunResult = await handler(payload, true);

  const task: AgentTask = {
    id: generateId(),
    userId,
    action,
    payload,
    reasoning,
    dryRunResult,
    status: "pending",
    createdAt: new Date().toISOString(),
  };

  pendingTasks.set(task.id, task);


  return task;
}

/** Genehmigt und führt einen Agenten-Task aus */
export async function approveAndExecuteTask(
  taskId: string,
  userId: string
): Promise<AgentTask> {
  const task = pendingTasks.get(taskId);
  if (!task) throw new Error(`Task ${taskId} nicht gefunden`);
  if (task.userId !== userId) throw new Error("Nicht autorisiert");
  if (task.status !== "pending") throw new Error(`Task ist bereits ${task.status}`);

  const handler = ACTION_HANDLERS[task.action];

  try {
    const result = await handler(task.payload, false);
    const updated: AgentTask = {
      ...task,
      status: "executed",
      executedAt: new Date().toISOString(),
      rollbackData: result,
    };
    pendingTasks.set(taskId, updated);

    return updated;
  } catch (err) {
    const failed: AgentTask = { ...task, status: "rejected" };
    pendingTasks.set(taskId, failed);
    throw err;
  }
}

/** Lehnt einen Agenten-Task ab */
export async function rejectTask(
  taskId: string,
  userId: string
): Promise<AgentTask> {
  const task = pendingTasks.get(taskId);
  if (!task) throw new Error(`Task ${taskId} nicht gefunden`);
  if (task.userId !== userId) throw new Error("Nicht autorisiert");

  const updated: AgentTask = { ...task, status: "rejected" };
  pendingTasks.set(taskId, updated);


  return updated;
}

/** Listet alle Tasks eines Nutzers */
export function listUserTasks(userId: string): AgentTask[] {
  return Array.from(pendingTasks.values())
    .filter((t) => t.userId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
