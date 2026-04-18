import { NextRequest, NextResponse } from "next/server";
import { requireActiveUser, handleGuardError } from "@/lib/security/guard";
import { prisma } from "@/lib/database";

// GET /api/timeline/export?format=csv — CSV Export aller Timeline-Einträge
export async function GET(req: NextRequest) {
  let user;
  try {
    user = await requireActiveUser();
  } catch (err) {
    return handleGuardError(err);
  }

  const { searchParams } = new URL(req.url);
  const company = searchParams.get("company") || undefined;
  const type = searchParams.get("type") || undefined;

  const where: Record<string, unknown> = { userId: user.id };
  if (company) where["applicationId"] = undefined; // will use include filter below
  if (type) where.type = type;

  const entries = await prisma.applicationTimeline.findMany({
    where,
    orderBy: { date: "asc" },
    include: {
      application: { select: { companyName: true, position: true, status: true } },
    },
  });

  const filtered = company
    ? entries.filter((e) => e.application.companyName.toLowerCase().includes(company.toLowerCase()))
    : entries;

  const escape = (v: string | null | undefined) =>
    `"${(v ?? "").replace(/"/g, '""')}"`;

  const header = ["ID", "Datum", "Unternehmen", "Position", "Typ", "Titel", "Status", "IT-Bereich", "Inhalt", "Angepinnt"];
  const rows = filtered.map((e) => [
    escape(e.id),
    escape(new Date(e.date).toLocaleDateString("de-DE")),
    escape(e.application.companyName),
    escape(e.application.position),
    escape(e.type),
    escape(e.title),
    escape(e.status),
    escape(e.itBereich),
    escape(e.content),
    escape(e.pinned ? "Ja" : "Nein"),
  ].join(","));

  const csv = [header.join(","), ...rows].join("\r\n");
  const bom = "\uFEFF"; // UTF-8 BOM für Excel

  return new NextResponse(bom + csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="timeline-export-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
