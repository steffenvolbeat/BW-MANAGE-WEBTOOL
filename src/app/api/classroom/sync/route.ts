/**
 * POST /api/classroom/sync
 *
 * Synchronisiert den DCI-Classroom-Kursplan mit:
 *  - Kalender: je Woche 5 Tagesplan-Termine (Tag 1–5)
 *  - Kanban:   Board "DCI Classroom" mit einer Karte pro Woche
 *
 * Idempotent: Bereits vorhandene DCI-Einträge werden übersprungen.
 * Erkennung: company = "DCI Classroom" (Kalender) / metadata.dciSync (Kanban).
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/database";
import { requireActiveUser, handleGuardError } from "@/lib/security/guard";
import { EventType } from "@prisma/client";
import { WEEKS_SCHEDULE, getWeekStart, computeCurrentWeek } from "@/lib/classroom/schedule";

const BOARD_NAME = "DCI Classroom";
const KANBAN_COLUMNS = ["Geplant", "Laufend", "Erledigt"] as const;
const EVENT_COMPANY = "DCI Classroom";

export async function POST() {
  try {
    const user = await requireActiveUser();

    /* ────────────────────────── KALENDER ────────────────────────────────── */

    // Alle bestehenden DCI-Events des Users laden (für Duplikat-Check)
    const existingEvents = await prisma.event.findMany({
      where: { userId: user.id, company: EVENT_COMPANY },
      select: { title: true, date: true },
    });
    const existingEventKeys = new Set(
      existingEvents.map((e) => `${e.title}__${e.date.toISOString().slice(0, 10)}`)
    );

    let calendarCreated = 0;
    let calendarSkipped = 0;

    const eventsToCreate: {
      userId: string;
      title: string;
      company: string;
      type: EventType;
      date: Date;
      time: string;
      notes: string;
      isInland: boolean;
    }[] = [];

    for (const ws of WEEKS_SCHEDULE) {
      const weekStart = getWeekStart(ws.week);

      for (let dayIndex = 0; dayIndex < ws.tagesplan.length; dayIndex++) {
        const entry = ws.tagesplan[dayIndex];
        const eventDate = new Date(weekStart);
        eventDate.setDate(weekStart.getDate() + dayIndex);
        eventDate.setHours(9, 0, 0, 0);

        const dateStr = eventDate.toISOString().slice(0, 10);
        const title = `[W${ws.week}] ${entry.focus}`.slice(0, 120);
        const key = `${title}__${dateStr}`;

        if (existingEventKeys.has(key)) {
          calendarSkipped++;
          continue;
        }

        eventsToCreate.push({
          userId: user.id,
          title,
          company: EVENT_COMPANY,
          type: EventType.DEADLINE,
          date: eventDate,
          time: "09:00",
          notes: `DCI Classroom – W${ws.week}: ${ws.title}`,
          isInland: true,
        });
        calendarCreated++;
      }
    }

    if (eventsToCreate.length > 0) {
      await prisma.event.createMany({ data: eventsToCreate });
    }

    /* ────────────────────────── KANBAN ──────────────────────────────────── */

    const currentWeek = computeCurrentWeek();

    // Board suchen oder anlegen
    let board = await prisma.board.findFirst({
      where: { ownerId: user.id, name: BOARD_NAME },
      include: {
        columns: {
          orderBy: { position: "asc" },
          include: {
            cards: { select: { id: true, metadata: true } },
          },
        },
      },
    });

    if (!board) {
      board = await prisma.board.create({
        data: {
          name: BOARD_NAME,
          ownerId: user.id,
          columns: {
            create: KANBAN_COLUMNS.map((title, position) => ({ title, position })),
          },
        },
        include: {
          columns: {
            orderBy: { position: "asc" },
            include: {
              cards: { select: { id: true, metadata: true } },
            },
          },
        },
      });
    }

    // Spalten-IDs ermitteln (Geplant / Laufend / Erledigt)
    const colGeplant = board.columns.find((c) => c.title === "Geplant") ?? board.columns[0];
    const colLaufend = board.columns.find((c) => c.title === "Laufend") ?? board.columns[1];
    const colErledigt = board.columns.find((c) => c.title === "Erledigt") ?? board.columns[2];

    // Bereits synced Wochen aus vorhandenen Karten ermitteln
    const syncedWeeks = new Set<number>();
    for (const col of board.columns) {
      for (const card of col.cards) {
        const meta = card.metadata as Record<string, unknown> | null;
        if (meta?.dciSync === true && typeof meta.week === "number") {
          syncedWeeks.add(meta.week);
        }
      }
    }

    let kanbanCreated = 0;
    let kanbanSkipped = 0;

    for (const ws of WEEKS_SCHEDULE) {
      if (syncedWeeks.has(ws.week)) {
        kanbanSkipped++;
        continue;
      }

      // Spalte bestimmen: vergangene Wochen → Erledigt, aktuelle → Laufend, zukünftige → Geplant
      let targetColumnId: string;
      if (ws.week < currentWeek) {
        targetColumnId = colErledigt.id;
      } else if (ws.week === currentWeek) {
        targetColumnId = colLaufend.id;
      } else {
        targetColumnId = colGeplant.id;
      }

      const weekStart = getWeekStart(ws.week);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 4); // Freitag

      const fmt = (d: Date) =>
        d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });

      await prisma.card.create({
        data: {
          boardId: board.id,
          columnId: targetColumnId,
          title: `W${ws.week}: ${ws.title}`,
          description: `🎯 Ziel: ${ws.goal}\n\n📅 ${fmt(weekStart)} – ${fmt(weekEnd)}`,
          status: ws.week < currentWeek ? "done" : ws.week === currentWeek ? "in_progress" : "open",
          metadata: { dciSync: true, week: ws.week },
        },
      });

      kanbanCreated++;
    }

    return NextResponse.json({
      ok: true,
      calendar: { created: calendarCreated, skipped: calendarSkipped },
      kanban: { created: kanbanCreated, skipped: kanbanSkipped, board: BOARD_NAME },
    });
  } catch (err) {
    return handleGuardError(err);
  }
}
