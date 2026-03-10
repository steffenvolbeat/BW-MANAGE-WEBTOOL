/**
 * Server-Sent Events für Multi-Device Sync
 * GET /api/sync/stream  → SSE-Stream für Echtzeit-Updates
 */
import { NextRequest, NextResponse } from "next/server";
import { getSessionFromCookie } from "@/lib/auth/jwt";
import { prisma } from "@/lib/database";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getSessionFromCookie();
  if (!session?.sub) {
    return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
  }
  const userId = session.sub;

  const encoder = new TextEncoder();
  let intervalId: ReturnType<typeof setInterval>;

  const stream = new ReadableStream({
    start(controller) {
      // Initiale Verbindungsbestätigung
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "connected", userId })}\n\n`));

      // Alle 15 Sekunden: aktuelle Daten-Counts senden
      intervalId = setInterval(async () => {
        try {
          const [appCount, reminderCount, followUpCount] = await Promise.all([
            prisma.application.count({ where: { userId } }),
            prisma.reminder.count({ where: { userId, isDone: false } }),
            prisma.followUp.count({ where: { userId, isDone: false } }),
          ]);

          const payload = JSON.stringify({
            type: "sync",
            timestamp: new Date().toISOString(),
            counts: { applications: appCount, reminders: reminderCount, followUps: followUpCount },
          });
          controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
        } catch {
          controller.close();
        }
      }, 15000);

      // Heartbeat alle 30s
      req.signal.addEventListener("abort", () => {
        clearInterval(intervalId);
        controller.close();
      });
    },
    cancel() {
      clearInterval(intervalId);
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
