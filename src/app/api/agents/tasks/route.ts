import { NextResponse } from "next/server";
import { requireActiveUser, blockReadOnlyRoles, handleGuardError } from "@/lib/security/guard";
import {
  createAgentTask,
  approveAndExecuteTask,
  rejectTask,
  listUserTasks,
  AgentAction,
} from "@/lib/agents/mcp";

// GET /api/agents/tasks – Eigene Agenten-Tasks abrufen
export async function GET() {
  let user;
  try {
    user = await requireActiveUser();
  } catch (err) {
    return handleGuardError(err);
  }

  const tasks = listUserTasks(user.id);
  return NextResponse.json({ tasks, total: tasks.length });
}

// POST /api/agents/tasks – Neuen Task erstellen
// Body: { action, payload, reasoning }
export async function POST(request: Request) {
  let user;
  try {
    user = await blockReadOnlyRoles();
  } catch (err) {
    return handleGuardError(err);
  }

  try {
    const body = await request.json();
    const { action, payload, reasoning } = body;

    const validActions: AgentAction[] = [
      "submit_application",
      "schedule_followup",
      "create_calendar_event",
      "set_reminder",
      "draft_email",
      "update_status",
    ];

    if (!action || !validActions.includes(action)) {
      return NextResponse.json(
        { error: `action muss eines von: ${validActions.join(", ")} sein` },
        { status: 400 }
      );
    }

    if (!payload || typeof payload !== "object") {
      return NextResponse.json({ error: "payload (object) erforderlich" }, { status: 400 });
    }

    const task = await createAgentTask(
      user.id,
      action,
      payload,
      reasoning ?? "Automatisch vom Agenten vorgeschlagen"
    );

    return NextResponse.json({ task }, { status: 201 });
  } catch (err) {
    console.error("Agent task create error:", err);
    return NextResponse.json({ error: "Fehler beim Task-Erstellen" }, { status: 500 });
  }
}

// PATCH /api/agents/tasks – Task genehmigen oder ablehnen
// Body: { taskId, action: "approve" | "reject" }
export async function PATCH(request: Request) {
  let user;
  try {
    user = await blockReadOnlyRoles();
  } catch (err) {
    return handleGuardError(err);
  }

  try {
    const body = await request.json();
    const { taskId, action } = body;

    if (!taskId || !["approve", "reject"].includes(action)) {
      return NextResponse.json(
        { error: "taskId und action ('approve'|'reject') erforderlich" },
        { status: 400 }
      );
    }

    const task =
      action === "approve"
        ? await approveAndExecuteTask(taskId, user.id)
        : await rejectTask(taskId, user.id);

    return NextResponse.json({ task });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unbekannter Fehler";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
