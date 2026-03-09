/**
 * GET /api/analytics/network
 * Gibt Knoten und Verbindungen für den Netzwerk-Graphen zurück.
 * Knoten: Bewerbungen, Kontakte, Unternehmen
 * Kanten: Bewerbung→Unternehmen (applied_to), Kontakt→Unternehmen (works_at)
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/database";
import { requireActiveUser } from "@/lib/security/guard";

export interface NetworkNode {
  id: string;
  type: "application" | "contact" | "company";
  label: string;
  subLabel?: string;
  status?: string;
}

export interface NetworkLink {
  source: string;
  target: string;
  type: string;
}

export async function GET() {
  try {
    const user = await requireActiveUser().catch(() => null);
    if (!user)
      return NextResponse.json(
        { error: "Nicht authentifiziert" },
        { status: 401 }
      );

    const [applications, contacts] = await Promise.all([
      prisma.application.findMany({
        where: { userId: user.id },
        select: {
          id: true,
          companyName: true,
          position: true,
          status: true,
          location: true,
        },
        orderBy: { appliedAt: "desc" },
        take: 80,
      }),
      prisma.contact.findMany({
        where: { userId: user.id },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          company: true,
          contactType: true,
        },
        take: 60,
      }),
    ]);

    const nodes: NetworkNode[] = [];
    const links: NetworkLink[] = [];

    // ── Unternehmen als Knoten (dedupliziert) ───────────────────────────
    const companySet = new Set<string>();
    for (const app of applications) companySet.add(app.companyName);
    for (const c of contacts) {
      if (c.company) companySet.add(c.company);
    }

    for (const company of companySet) {
      nodes.push({
        id: `co_${company}`,
        type: "company",
        label: company,
      });
    }

    // ── Bewerbungen als Knoten + Kanten zu Unternehmen ──────────────────
    for (const app of applications) {
      nodes.push({
        id: `ap_${app.id}`,
        type: "application",
        label: app.position,
        subLabel: app.location,
        status: app.status,
      });
      links.push({
        source: `ap_${app.id}`,
        target: `co_${app.companyName}`,
        type: "applied_to",
      });
    }

    // ── Kontakte als Knoten + Kanten zu Unternehmen ─────────────────────
    for (const c of contacts) {
      nodes.push({
        id: `ct_${c.id}`,
        type: "contact",
        label: `${c.firstName} ${c.lastName}`.trim(),
        subLabel: c.contactType,
      });
      if (c.company && companySet.has(c.company)) {
        links.push({
          source: `ct_${c.id}`,
          target: `co_${c.company}`,
          type: "works_at",
        });
      }
    }

    return NextResponse.json({ nodes, links });
  } catch (err) {
    console.error("network GET error:", err);
    return NextResponse.json({ error: "Interner Fehler" }, { status: 500 });
  }
}
