import { NextRequest, NextResponse } from "next/server";
import { requireActiveUser, handleGuardError } from "@/lib/security/guard";
import { prisma } from "@/lib/database";
import { batchMatchApplications } from "@/lib/ml/semanticMatch";

// GET /api/ml/semantic-match?profile=... – Batch-Matching aller Bewerbungen
export async function GET(req: NextRequest) {
  let user;
  try { user = await requireActiveUser(); } catch (err) { return handleGuardError(err); }

  const profileText = req.nextUrl.searchParams.get("profile") ?? "";

  if (!profileText || profileText.length < 50) {
    return NextResponse.json(
      { error: "Profil-Text zu kurz (min. 50 Zeichen)" },
      { status: 400 }
    );
  }

  try {
    const applications = await prisma.application.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        companyName: true,
        position: true,
        requirements: true,
        notesText: true,
      },
    });

    // On-Device-Matching – profileText & applications nie zu externem Service
    const results = await batchMatchApplications(profileText, applications);

    return NextResponse.json({
      results,
      processingNode: "on-device",
      disclaimer: "Analyse vollständig lokal – kein Profil-Inhalt wurde übertragen",
    });
  } catch (err) {
    console.error("semantic-match GET failed", err);
    return NextResponse.json({ error: "Matching fehlgeschlagen" }, { status: 500 });
  }
}

// POST /api/ml/semantic-match – Einzelne Stelle analysieren
export async function POST(req: NextRequest) {
  let user;
  try { user = await requireActiveUser(); } catch (err) { return handleGuardError(err); }

  try {
    const { profileText, applicationId } = await req.json();

    const application = await prisma.application.findFirst({
      where: { id: applicationId, userId: user.id },
    });

    if (!application) {
      return NextResponse.json({ error: "Bewerbung nicht gefunden" }, { status: 404 });
    }

    const { semanticJobMatch } = await import("@/lib/ml/semanticMatch");
    const result = await semanticJobMatch({
      profileText,
      jobDescription: `${application.position} ${application.companyName}`,
      jobTitle: application.position,
      company: application.companyName,
      requirements: application.requirements ?? application.notesText ?? "",
    });

    return NextResponse.json({ result, applicationId });
  } catch (err) {
    console.error("semantic-match POST failed", err);
    return NextResponse.json({ error: "Matching fehlgeschlagen" }, { status: 500 });
  }
}
