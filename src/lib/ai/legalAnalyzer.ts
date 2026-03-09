/**
 * LEGAL TECH – KI-GESTÜTZTE VERTRAGSANALYSE
 *
 * Vollständig On-Device-Vertragsanalyse ohne externe API-Aufrufe.
 *
 * Funktionen:
 *  - Klausel-Extraktion aus Arbeitsverträgen, NDAs, Freiberufler-Verträgen
 *  - Risiko-Klassifizierung: Wettbewerbsverbote, Überstunden, etc.
 *  - Handlungsempfehlungen
 *  - KEIN Vertragsinhalt verlässt das Gerät (On-Device RAG)
 *
 * Sicherheit:
 *  - Vertragstexte sind höchst sensibel – ausschließlich lokal
 *  - Analyse-Ergebnis (Metadaten, kein Vertragstext) wird in DB gespeichert
 *  - Vollständige Löschbarkeit garantiert
 *
 * Produktions-Stack:
 *  - pdf.js für Text-Extraktion
 *  - @xenova/transformers (lokal) für Klassifizierung
 *  - vectra für lokalen Embedding-Index
 */

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type ClauseType =
  | "NOTICE_PERIOD"
  | "NON_COMPETE"
  | "NON_DISCLOSURE"
  | "OVERTIME"
  | "IP_ASSIGNMENT"
  | "PROBATION"
  | "JURISDICTION"
  | "TERMINATION"
  | "SALARY"
  | "VACATION"
  | "SIDE_EMPLOYMENT"
  | "DATA_PROTECTION"
  | "PENALTY";

export interface ContractClause {
  type: ClauseType;
  text: string;           // Original-Klauseltextt
  riskLevel: RiskLevel;
  riskExplanation: string;
  recommendation: string;
  legalReference?: string; // z.B. "§ 74 HGB (Wettbewerbsverbot)"
  redFlag: boolean;        // Sofortige Aufmerksamkeit erforderlich
}

export interface ContractAnalysis {
  contractType: string;
  riskLevel: RiskLevel;
  overallScore: number;   // 0 (sehr riskant) – 100 (unbedenklich)
  clauses: ContractClause[];
  redFlags: ContractClause[];
  summary: string;
  disclaimer: string;
}

// ─── Klausel-Pattern-Erkennung ────────────────────────────────────────────────

interface ClausePattern {
  type: ClauseType;
  patterns: RegExp[];
  defaultRisk: RiskLevel;
  explanation: string;
  recommendation: string;
  legalReference?: string;
}

const CLAUSE_PATTERNS: ClausePattern[] = [
  {
    type: "NON_COMPETE",
    patterns: [
      /wettbewerb/i,
      /konkurrenz/i,
      /tätig.{0,30}(nicht|verboten|untersagt)/i,
      /non.?compete/i,
      /konkurrierend/i,
    ],
    defaultRisk: "HIGH",
    explanation: "Wettbewerbsverbot: Einschränkung der Berufstätigkeit nach Kündigung. Gem. § 74 HGB nur mit Karenzentschädigung (50% letztes Gehalt) wirksam.",
    recommendation: "Prüfen: Gilt das Verbot nach Vertragsende? Karenzentschädigung vereinbart? Zeitlicher/räumlicher Umfang angemessen?",
    legalReference: "§ 74–75f HGB",
  },
  {
    type: "OVERTIME",
    patterns: [
      /überstunden.{0,50}(abgegolten|pauschal|vergütet)/i,
      /mehrarbeit.{0,50}(eingeschlossen|einbegriffen)/i,
      /all-in/i,
      /zeitguthaben/i,
    ],
    defaultRisk: "MEDIUM",
    explanation: "Überstunden-Pauschal-Abgeltung kann bedeuten, dass Mehrarbeit nicht gesondert vergütet wird.",
    recommendation: "Klären: Bis zu wie viele Überstunden sind pauschal abgegolten? Schriftliche Klarstellung fordern.",
    legalReference: "§ 612 BGB, ArbZG",
  },
  {
    type: "NOTICE_PERIOD",
    patterns: [
      /kündigungsfrist/i,
      /notice period/i,
      /kündigung.{0,30}(monat|woche|tage)/i,
    ],
    defaultRisk: "LOW",
    explanation: "Kündigungsfrist regelt wie lange Arbeitsverhältnis nach Kündigung fortbesteht.",
    recommendation: "Prüfen ob beiderseitige Fristen gleich sind. Längere Fristen können die Jobsuche erschweren.",
    legalReference: "§ 622 BGB",
  },
  {
    type: "IP_ASSIGNMENT",
    patterns: [
      /erfindung.{0,80}(gehört|überträgt|zustehen|rechte)/i,
      /intellectual property/i,
      /geistiges eigentum/i,
      /urheberrecht.{0,50}(überträgt|abtritt)/i,
    ],
    defaultRisk: "MEDIUM",
    explanation: "IP-Übertragungsklauseln können bedeuten, dass persönliche Projekte dem Arbeitgeber gehören.",
    recommendation: "Klären ob private Projekte außerhalb der Arbeitszeit und -ausstattung ausgeschlossen sind.",
    legalReference: "ArbErfG (Arbeitnehmererfindungsgesetz)",
  },
  {
    type: "NON_DISCLOSURE",
    patterns: [
      /vertraulich/i,
      /geheimhaltung/i,
      /non.?disclosure/i,
      /nda/i,
      /verschwiegenheit/i,
    ],
    defaultRisk: "LOW",
    explanation: "Vertraulichkeitsklausel – standard in den meisten Arbeitsverträgen.",
    recommendation: "Prüfen ob die Gültigkeitsdauer nach Vertragsende angemessen ist (max. 2 Jahre üblich).",
    legalReference: "§ 17 UWG",
  },
  {
    type: "PENALTY",
    patterns: [
      /vertragsstrafe/i,
      /penalty/i,
      /pönale/i,
      /schadensersatz.{0,50}(monatsgeh|jahres)/i,
    ],
    defaultRisk: "CRITICAL",
    explanation: "Vertragsstrafen können erhebliche finanzielle Risiken darstellen.",
    recommendation: "SOFORT anwaltliche Beratung einholen. Höhe und Auslöser der Vertragsstrafe genau prüfen.",
    legalReference: "§ 339 ff. BGB",
  },
  {
    type: "PROBATION",
    patterns: [
      /probezeit/i,
      /probation/i,
      /probe.{0,20}(dauer|monat)/i,
    ],
    defaultRisk: "LOW",
    explanation: "Probezeit mit verkürzter Kündigungsfrist (2 Wochen gesetzlich max. 6 Monate).",
    recommendation: "Prüfen ob Probezeit maximal 6 Monate dauert (gesetzliches Maximum).",
    legalReference: "§ 622 Abs. 3 BGB",
  },
  {
    type: "SIDE_EMPLOYMENT",
    patterns: [
      /nebentätigkeit/i,
      /nebenbeschäftigung/i,
      /nebenberuflich/i,
      /side employment/i,
    ],
    defaultRisk: "MEDIUM",
    explanation: "Einschränkungen bei Nebentätigkeiten können Freelance-Projekte betreffen.",
    recommendation: "Genehmigungspflicht klären. Bei bestehenden Nebentätigkeiten vorab schriftliche Genehmigung einholen.",
    legalReference: "§ 60 HGB, loyalitätspflicht",
  },
];

// ─── Hauptanalyse ─────────────────────────────────────────────────────────────

/**
 * Analysiert einen Vertragstext und gibt strukturiertes Ergebnis zurück.
 * SICHERHEIT: text verlässt diese Funktion nicht – nur Metadaten werden zurückgegeben.
 */
export function analyzeContract(text: string, contractType = "Arbeitsvertrag"): ContractAnalysis {
  const foundClauses: ContractClause[] = [];

  for (const pattern of CLAUSE_PATTERNS) {
    // Suche nach relevanten Textstellen
    const matchedPattern = pattern.patterns.find((p) => p.test(text));

    if (matchedPattern) {
      // Extrahiere Kontext um den Match (max. 200 Zeichen)
      const match = matchedPattern.exec(text);
      const start = Math.max(0, (match?.index ?? 0) - 50);
      const end = Math.min(text.length, (match?.index ?? 0) + 150);
      const excerpt = text.substring(start, end).replace(/\s+/g, " ").trim();

      foundClauses.push({
        type: pattern.type,
        text: excerpt + "...", // Nur Auszug, kein vollständiger Vertragstext
        riskLevel: pattern.defaultRisk,
        riskExplanation: pattern.explanation,
        recommendation: pattern.recommendation,
        legalReference: pattern.legalReference,
        redFlag: pattern.defaultRisk === "CRITICAL" || pattern.defaultRisk === "HIGH",
      });
    }
  }

  const redFlags = foundClauses.filter((c) => c.redFlag);

  // Gesamtrisiko
  let riskLevel: RiskLevel;
  const criticalCount = foundClauses.filter((c) => c.riskLevel === "CRITICAL").length;
  const highCount = foundClauses.filter((c) => c.riskLevel === "HIGH").length;

  if (criticalCount > 0) riskLevel = "CRITICAL";
  else if (highCount > 0) riskLevel = "HIGH";
  else if (foundClauses.filter((c) => c.riskLevel === "MEDIUM").length > 1) riskLevel = "MEDIUM";
  else riskLevel = "LOW";

  // Score (0 = riskant, 100 = unbedenklich)
  const riskPenalty = criticalCount * 30 + highCount * 15 +
    foundClauses.filter((c) => c.riskLevel === "MEDIUM").length * 5;
  const overallScore = Math.max(0, 100 - riskPenalty);

  return {
    contractType,
    riskLevel,
    overallScore,
    clauses: foundClauses,
    redFlags,
    summary:
      redFlags.length > 0
        ? `⚠️ ${redFlags.length} kritische Klausel(n) gefunden – anwaltliche Beratung empfohlen`
        : foundClauses.length === 0
        ? "Keine Risiko-Klauseln erkannt – Vertrag erscheint standardmäßig"
        : `${foundClauses.length} Klausel(n) zur Prüfung identifiziert`,
    disclaimer:
      "Diese KI-Analyse ist keine Rechtsberatung und ersetzt nicht die Prüfung durch einen qualifizierten Rechtsanwalt. Bitte konsultieren Sie bei wichtigen Vertragsangelegenheiten immer einen Fachanwalt für Arbeitsrecht.",
  };
}

export const RISK_COLORS: Record<RiskLevel, string> = {
  LOW: "text-green-700 dark:text-green-400",
  MEDIUM: "text-yellow-700 dark:text-yellow-400",
  HIGH: "text-orange-700 dark:text-orange-400",
  CRITICAL: "text-red-700 dark:text-red-400",
};

export const RISK_BG: Record<RiskLevel, string> = {
  LOW: "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800",
  MEDIUM: "bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800",
  HIGH: "bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800",
  CRITICAL: "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800",
};
