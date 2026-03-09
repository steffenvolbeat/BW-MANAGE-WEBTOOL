import { NextResponse } from "next/server";
import { requireActiveUser, handleGuardError } from "@/lib/security/guard";
import { scopedPrisma } from "@/lib/security/scope";
import { scoreApplicationDuplicates } from "@/lib/utils/fuzzy";

// GET /api/applications/duplicates?threshold=0.75&targetId=xxx
export async function GET(request: Request) {
  let user;
  try {
    user = await requireActiveUser();
  } catch (err) {
    return handleGuardError(err);
  }

  const url = new URL(request.url);
  const threshold = parseFloat(url.searchParams.get("threshold") ?? "0.75");
  const targetId = url.searchParams.get("targetId");

  try {
    const db = scopedPrisma(user.id);
    const applications = await db.raw.application.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        companyName: true,
        position: true,
        location: true,
        appliedAt: true,
      },
    });

    if (applications.length === 0) {
      return NextResponse.json({ duplicates: [], total: 0 });
    }

    if (targetId) {
      const target = applications.find((a) => a.id === targetId);
      if (!target) {
        return NextResponse.json({ error: "Bewerbung nicht gefunden" }, { status: 404 });
      }
      const scores = scoreApplicationDuplicates(target, applications, threshold);
      return NextResponse.json({ targetId, duplicates: scores, total: scores.length });
    }

    // Alle Duplikat-Paare
    const pairs: Array<{ a: string; b: string; score: number; reasons: string[] }> = [];
    const seen = new Set<string>();

    for (const app of applications) {
      const scores = scoreApplicationDuplicates(app, applications, threshold);
      for (const s of scores) {
        const key = [app.id, s.id].sort().join(":");
        if (!seen.has(key)) {
          seen.add(key);
          pairs.push({ a: app.id, b: s.id, score: s.score, reasons: s.reasons });
        }
      }
    }

    return NextResponse.json({
      pairs: pairs.sort((a, b) => b.score - a.score),
      total: pairs.length,
      threshold,
    });
  } catch (err) {
    console.error("Application duplicate detection error:", err);
    return NextResponse.json({ error: "Fehler bei Duplikat-Erkennung" }, { status: 500 });
  }
}
