import { NextResponse } from "next/server";
import { requireActiveUser, handleGuardError } from "@/lib/security/guard";
import { scopedPrisma } from "@/lib/security/scope";
import { scoreContactDuplicates } from "@/lib/utils/fuzzy";

// GET /api/contacts/duplicates?threshold=0.75
// Findet doppelte Kontakte basierend auf Jaro-Winkler + TF-IDF
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
    const contacts = await db.raw.contact.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        company: true,
      },
    });

    if (contacts.length === 0) {
      return NextResponse.json({ duplicates: [], total: 0 });
    }

    // Analyse für einen spezifischen Kontakt oder alle
    if (targetId) {
      const target = contacts.find((c) => c.id === targetId);
      if (!target) {
        return NextResponse.json({ error: "Kontakt nicht gefunden" }, { status: 404 });
      }
      const scores = scoreContactDuplicates(target, contacts, threshold);
      return NextResponse.json({
        targetId,
        duplicates: scores,
        total: scores.length,
      });
    }

    // Alle Duplikat-Paare ermitteln
    const pairs: Array<{ a: string; b: string; score: number; reasons: string[] }> = [];
    const seen = new Set<string>();

    for (const contact of contacts) {
      const scores = scoreContactDuplicates(contact, contacts, threshold);
      for (const s of scores) {
        const key = [contact.id, s.id].sort().join(":");
        if (!seen.has(key)) {
          seen.add(key);
          pairs.push({ a: contact.id, b: s.id, score: s.score, reasons: s.reasons });
        }
      }
    }

    return NextResponse.json({
      pairs: pairs.sort((a, b) => b.score - a.score),
      total: pairs.length,
      threshold,
    });
  } catch (err) {
    console.error("Duplicate detection error:", err);
    return NextResponse.json({ error: "Fehler bei Duplikat-Erkennung" }, { status: 500 });
  }
}
