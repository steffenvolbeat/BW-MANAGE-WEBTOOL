import { NextRequest, NextResponse } from "next/server";
import { requireActiveUser, handleGuardError } from "@/lib/security/guard";
import { prisma } from "@/lib/database";
import { analyzeContract } from "@/lib/ai/legalAnalyzer";
import type { ContractType } from "@prisma/client";

// POST /api/ai/legal-analysis – Erstellt neue Vertragsanalyse
export async function POST(req: NextRequest) {
  let user;
  try { user = await requireActiveUser(); } catch (err) { return handleGuardError(err); }

  const { contractText, contractName, contractType, documentId } = await req.json() as {
    contractText: string;
    contractName: string;
    contractType: ContractType;
    documentId?: string;
  };

  if (!contractText || contractText.length < 200) {
    return NextResponse.json(
      { error: "Vertragstext zu kurz (min. 200 Zeichen)" },
      { status: 400 }
    );
  }

  // Sicherheits-Check: Kein Vertragstext wird gespeichert – nur Metadaten
  const analysis = analyzeContract(contractText, contractName);

  try {
  // Nur Metadaten in DB – kein Vertragstext
  const contract = await prisma.legalContract.create({
    data: {
      userId: user.id,
      name: contractName,
      contractType,
      analysisStatus: "DONE",
      riskLevel: analysis.riskLevel,
      riskCount: analysis.redFlags.length,
      clauseCount: analysis.clauses.length,
      findings: analysis.clauses.map((c) => ({
        type: c.type,
        riskLevel: c.riskLevel,
        riskExplanation: c.riskExplanation,
        recommendation: c.recommendation,
        legalReference: c.legalReference,
        redFlag: c.redFlag,
        // originalText wird NICHT gespeichert
      })) as unknown as object,
      documentId: documentId ?? null,
      analyzedAt: new Date(),
    },
  });


  return NextResponse.json({
    contractId: contract.id,
    analysis: {
      riskLevel: analysis.riskLevel,
      overallScore: analysis.overallScore,
      summary: analysis.summary,
      disclaimer: analysis.disclaimer,
      // Klauseln mit Empfehlungen aber ohne Original-Vertragstext
      clauses: analysis.clauses.map((c) => ({
        type: c.type,
        riskLevel: c.riskLevel,
        riskExplanation: c.riskExplanation,
        recommendation: c.recommendation,
        legalReference: c.legalReference,
        redFlag: c.redFlag,
      })),
      redFlagCount: analysis.redFlags.length,
    },
  });
  } catch (err) {
    console.error("legal-analysis POST failed", err);
    return NextResponse.json({ error: "Analyse konnte nicht gespeichert werden" }, { status: 500 });
  }
}

// GET /api/ai/legal-analysis – Alle Analysen
export async function GET(req: NextRequest) {
  let user;
  try { user = await requireActiveUser(); } catch (err) { return handleGuardError(err); }

  try {
    const contracts = await prisma.legalContract.findMany({
      where: { userId: user.id },
      orderBy: { uploadedAt: "desc" },
      select: {
        id: true,
        name: true,
        contractType: true,
        riskLevel: true,
        riskCount: true,
        clauseCount: true,
        analysisStatus: true,
        findings: true,
        uploadedAt: true,
        analyzedAt: true,
      },
    });
    return NextResponse.json({ contracts });
  } catch (err) {
    console.error("legal-analysis GET failed", err);
    return NextResponse.json({ error: "Analysen konnten nicht geladen werden" }, { status: 500 });
  }
}
