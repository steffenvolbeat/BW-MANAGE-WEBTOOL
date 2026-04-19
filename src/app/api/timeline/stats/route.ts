import { NextRequest, NextResponse } from "next/server";
import { resolveTargetUserId, handleGuardError } from "@/lib/security/guard";
import { prisma } from "@/lib/database";

// GET /api/timeline/stats — Funnel + Reaktionszeiten + Staleness
export async function GET(req: NextRequest) {
  let targetUserId: string;
  try {
    const viewAs = new URL(req.url).searchParams.get("viewAs");
    targetUserId = await resolveTargetUserId(viewAs);
  } catch (err) {
    return handleGuardError(err);
  }

  const entries = await prisma.applicationTimeline.findMany({
    where: { userId: targetUserId },
    include: {
      application: {
        select: {
          id: true,
          companyName: true,
          position: true,
          status: true,
        },
      },
    },
    orderBy: { date: "asc" },
  });

  // ── Funnel ──────────────────────────────────────────────────────────────────
  const funnelOrder = [
    "APPLIED", "REVIEWED", "INTERVIEW_SCHEDULED", "INTERVIEWED",
    "TASK_RECEIVED", "TASK_SUBMITTED", "OFFER_RECEIVED", "NEGOTIATION",
    "ACCEPTED", "REJECTED", "WITHDRAWN", "GHOSTING",
  ];

  // Letzte bekannte Status-Snapshots pro Bewerbung
  const appStatuses: Record<string, string> = {};
  for (const e of entries) {
    if (e.status) appStatuses[e.applicationId] = e.status;
    if (e.application.status) appStatuses[e.applicationId] = e.application.status;
  }
  const funnel: Record<string, number> = {};
  for (const s of funnelOrder) funnel[s] = 0;
  for (const s of Object.values(appStatuses)) {
    if (funnel[s] !== undefined) funnel[s]++;
    else funnel["OTHER"] = (funnel["OTHER"] ?? 0) + 1;
  }

  // ── Reaktionszeiten ──────────────────────────────────────────────────────────
  // Tage zwischen erstem Eintrag (APPLIED) und erstem Interview/Angebot pro App
  const byApp: Record<string, typeof entries> = {};
  for (const e of entries) {
    (byApp[e.applicationId] = byApp[e.applicationId] || []).push(e);
  }

  const reactionDays: number[] = [];
  for (const appEntries of Object.values(byApp)) {
    const applied = appEntries.find((e) => e.status === "APPLIED" || e.type === "STATUS_CHANGE");
    const response = appEntries.find(
      (e) => e.status === "INTERVIEW_SCHEDULED" || e.status === "OFFER_RECEIVED" || e.status === "REJECTED"
    );
    if (applied && response) {
      const diff = (new Date(response.date).getTime() - new Date(applied.date).getTime()) / 86400000;
      if (diff >= 0 && diff < 365) reactionDays.push(Math.round(diff));
    }
  }
  const avgReactionDays =
    reactionDays.length > 0
      ? Math.round(reactionDays.reduce((a, b) => a + b, 0) / reactionDays.length)
      : null;

  // ── Staleness: Bewerbungen ohne Update seit > 14 Tagen ─────────────────────
  const now = Date.now();
  const staleApps: { applicationId: string; companyName: string; position: string; daysSince: number }[] = [];
  for (const [appId, appEntries] of Object.entries(byApp)) {
    const lastEntry = appEntries[appEntries.length - 1];
    const daysSince = Math.floor((now - new Date(lastEntry.date).getTime()) / 86400000);
    const lastStatus = appStatuses[appId] ?? "";
    const isOpen = !["ACCEPTED", "REJECTED", "WITHDRAWN", "GHOSTING"].includes(lastStatus);
    if (isOpen && daysSince >= 14) {
      staleApps.push({
        applicationId: appId,
        companyName: lastEntry.application.companyName,
        position: lastEntry.application.position,
        daysSince,
      });
    }
  }
  staleApps.sort((a, b) => b.daysSince - a.daysSince);

  // ── Aktivitäts-Heatmap (letzte 365 Tage) ────────────────────────────────────
  const heatmap: Record<string, number> = {};
  const cutoff = new Date(now - 365 * 86400000);
  for (const e of entries) {
    const d = new Date(e.date);
    if (d < cutoff) continue;
    const key = d.toISOString().slice(0, 10);
    heatmap[key] = (heatmap[key] ?? 0) + 1;
  }

  // ── Fortschritt pro Unternehmen ──────────────────────────────────────────────
  const progressOrder = [
    "SAVED", "APPLIED", "REVIEWED", "INTERVIEW_SCHEDULED", "INTERVIEWED",
    "TASK_RECEIVED", "TASK_SUBMITTED", "OFFER_RECEIVED", "NEGOTIATION",
    "ACCEPTED", "REJECTED", "WITHDRAWN", "GHOSTING", "INITIATIVE", "OTHER",
  ];
  const companyProgress: {
    applicationId: string; companyName: string; position: string;
    status: string; progress: number; entryCount: number;
  }[] = [];
  const seen = new Set<string>();
  for (const e of entries) {
    if (seen.has(e.applicationId)) continue;
    seen.add(e.applicationId);
    const s = e.application.status;
    const idx = progressOrder.indexOf(s);
    const progress = idx >= 0 ? Math.round(((idx + 1) / progressOrder.length) * 100) : 0;
    companyProgress.push({
      applicationId: e.applicationId,
      companyName: e.application.companyName,
      position: e.application.position,
      status: s,
      progress,
      entryCount: byApp[e.applicationId]?.length ?? 0,
    });
  }

  // ── Gesamt-Statistiken ───────────────────────────────────────────────────────
  const totalApps = Object.keys(byApp).length;
  const totalEntries = entries.length;
  const pinnedCount = entries.filter((e) => e.pinned).length;

  return NextResponse.json({
    funnel,
    avgReactionDays,
    reactionDaysCount: reactionDays.length,
    staleApps: staleApps.slice(0, 10),
    heatmap,
    companyProgress,
    totalApps,
    totalEntries,
    pinnedCount,
  });
}
