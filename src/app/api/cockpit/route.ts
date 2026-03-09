import { NextRequest, NextResponse } from "next/server";
import { handleGuardError, requireActiveUser } from "@/lib/security/guard";

export const revalidate = 0;

const ALLOWED_TOOLS = [
  "read_profile",
  "list_documents",
  "list_contacts",
  "fetch_notes_summary",
];

function classifyRequestedTool(message: string): { tool?: string; approvalRequired: boolean } {
  const lower = message.toLowerCase();
  if (lower.includes("delete") || lower.includes("remove")) {
    return { tool: "delete_resource", approvalRequired: true };
  }
  if (lower.includes("email") || lower.includes("send")) {
    return { tool: "send_email", approvalRequired: true };
  }
  if (lower.includes("update") || lower.includes("write")) {
    return { tool: "update_record", approvalRequired: true };
  }
  return { tool: "analyze_context", approvalRequired: false };
}

export async function POST(req: NextRequest) {
  try {
    await requireActiveUser();

    const payload = await req.json();
    const message: string = payload?.message ?? "";
    const sessionId: string | null = payload?.sessionId ?? null;

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message required" }, { status: 400 });
    }

    const toolDecision = classifyRequestedTool(message);

    const responseText = toolDecision.approvalRequired
      ? "Aktion erkannt. Freigabe erforderlich, nichts ausgeführt."
      : "Eingabe verarbeitet.";

    return NextResponse.json({
      reply: responseText,
      tools: {
        allowed: ALLOWED_TOOLS,
        requested: toolDecision.tool,
        approvalRequired: toolDecision.approvalRequired,
      },
      sessionId,
    });
  } catch (err) {
    return handleGuardError(err);
  }
}
