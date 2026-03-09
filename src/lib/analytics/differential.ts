/**
 * DIFFERENTIAL-PRIVACY-ANALYTIK
 *
 * Laplace-Mechanismus: Verrauschte Aggregate die statistisch korrekt sind,
 * aber keine Rückschlüsse auf einzelne Nutzer erlauben.
 *
 * Datenschutzgarantie: ε-Differential Privacy (ε = Epsilon)
 *  - Kleines ε (z.B. 0.1): sehr starker Schutz, mehr Rauschen
 *  - Größeres ε (z.B. 1.0): weniger Rauschen, schwächerer Schutz
 *
 * Standardwert: ε = 0.3 (stark, für Bewerbungsmanagement angemessen)
 */

const DEFAULT_EPSILON = 0.3;

/** Laplace-verteiltes Zufallsrauschen */
function laplaceSample(sensitivity: number, epsilon: number): number {
  const scale = sensitivity / epsilon;
  // Inverse CDF der Laplace-Verteilung
  const u = Math.random() - 0.5;
  return -scale * Math.sign(u) * Math.log(1 - 2 * Math.abs(u));
}

/** Fügt Laplace-Rauschen zu einem Zählwert hinzu */
export function privatizeCount(
  trueCount: number,
  epsilon = DEFAULT_EPSILON,
  sensitivity = 1
): number {
  const noise = laplaceSample(sensitivity, epsilon);
  return Math.max(0, Math.round(trueCount + noise));
}

/** Fügt Laplace-Rauschen zu einem Durchschnitt hinzu */
export function privatizeAverage(
  trueAvg: number,
  maxValue: number,
  epsilon = DEFAULT_EPSILON
): number {
  const noise = laplaceSample(maxValue, epsilon);
  return Math.max(0, trueAvg + noise);
}

/** Privatisiert eine Verteilungs-Map (z.B. Status → Anzahl) */
export function privatizeDistribution(
  distribution: Record<string, number>,
  epsilon = DEFAULT_EPSILON
): Record<string, number> {
  const result: Record<string, number> = {};
  // Budget über alle Kategorien aufteilen (Sequential Composition)
  const perCategoryEpsilon = epsilon / Object.keys(distribution).length;
  for (const [key, count] of Object.entries(distribution)) {
    result[key] = privatizeCount(count, perCategoryEpsilon);
  }
  return result;
}

/** Konfiguration für einen DP-geschützten Analytics-Report */
export interface DPConfig {
  epsilon: number;
  sensitivityCounts: number;
  sensitivityAverages: number;
  addedAt: string;
}

export const DP_DEFAULT_CONFIG: DPConfig = {
  epsilon: DEFAULT_EPSILON,
  sensitivityCounts: 1,
  sensitivityAverages: 100_000, // max. Gehalt in EUR
  addedAt: new Date().toISOString(),
};

/** Roh-Analytics in DP-geschützten Output transformieren */
export function applyDifferentialPrivacy(
  raw: {
    totalApplications: number;
    statusDistribution: Record<string, number>;
    avgResponseDays: number;
    interviewRate: number;
    offerRate: number;
    avgInterviewsPerMonth?: number;
    conversion?: {
      appliedToInterview: number;
      interviewToOffer: number;
      offerToAccept: number;
    };
  },
  config: DPConfig = DP_DEFAULT_CONFIG
): typeof raw & { dp: DPConfig } {
  return {
    totalApplications: privatizeCount(raw.totalApplications, config.epsilon),
    statusDistribution: privatizeDistribution(
      raw.statusDistribution,
      config.epsilon
    ),
    avgResponseDays: privatizeAverage(
      raw.avgResponseDays,
      365,
      config.epsilon
    ),
    interviewRate: Math.min(
      1,
      Math.max(0, privatizeAverage(raw.interviewRate, 1, config.epsilon))
    ),
    offerRate: Math.min(
      1,
      Math.max(0, privatizeAverage(raw.offerRate, 1, config.epsilon))
    ),
    avgInterviewsPerMonth:
      raw.avgInterviewsPerMonth === undefined
        ? undefined
        : Math.max(0, privatizeAverage(raw.avgInterviewsPerMonth, 100, config.epsilon)),
    conversion: raw.conversion
      ? {
          appliedToInterview: Math.min(
            1,
            Math.max(0, privatizeAverage(raw.conversion.appliedToInterview, 1, config.epsilon))
          ),
          interviewToOffer: Math.min(
            1,
            Math.max(0, privatizeAverage(raw.conversion.interviewToOffer, 1, config.epsilon))
          ),
          offerToAccept: Math.min(
            1,
            Math.max(0, privatizeAverage(raw.conversion.offerToAccept, 1, config.epsilon))
          ),
        }
      : undefined,
    dp: config,
  };
}
