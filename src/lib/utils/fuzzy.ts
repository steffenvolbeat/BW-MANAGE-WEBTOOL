/**
 * Fuzzy-Matching-Bibliothek für Duplikat-Erkennung.
 *
 * Algorithmen:
 *  - Jaro-Winkler-Distanz (Strings ähnlicher Länge)
 *  - TF-IDF-Cosine-Similarity (semantische Ähnlichkeit)
 *  - Kombinierter Score für Bewerbungen + Kontakte
 */

// ───────────────────────── Jaro-Winkler ─────────────────────────────────────

export function jaro(s1: string, s2: string): number {
  if (s1 === s2) return 1;
  const len1 = s1.length;
  const len2 = s2.length;
  if (len1 === 0 || len2 === 0) return 0;

  const matchDist = Math.max(Math.floor(Math.max(len1, len2) / 2) - 1, 0);
  const s1Matches = new Array(len1).fill(false);
  const s2Matches = new Array(len2).fill(false);

  let matches = 0;
  let transpositions = 0;

  for (let i = 0; i < len1; i++) {
    const start = Math.max(0, i - matchDist);
    const end = Math.min(i + matchDist + 1, len2);
    for (let j = start; j < end; j++) {
      if (s2Matches[j] || s1[i] !== s2[j]) continue;
      s1Matches[i] = true;
      s2Matches[j] = true;
      matches++;
      break;
    }
  }

  if (matches === 0) return 0;

  let k = 0;
  for (let i = 0; i < len1; i++) {
    if (!s1Matches[i]) continue;
    while (!s2Matches[k]) k++;
    if (s1[i] !== s2[k]) transpositions++;
    k++;
  }

  return (
    (matches / len1 + matches / len2 + (matches - transpositions / 2) / matches) / 3
  );
}

export function jaroWinkler(s1: string, s2: string, p = 0.1): number {
  const j = jaro(s1, s2);
  let prefix = 0;
  for (let i = 0; i < Math.min(4, Math.min(s1.length, s2.length)); i++) {
    if (s1[i] === s2[i]) prefix++;
    else break;
  }
  return j + prefix * p * (1 - j);
}

// ───────────────────────── TF-IDF Cosine ─────────────────────────────────────

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9äöüß ]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length >= 2);
}

function termFrequency(tokens: string[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const t of tokens) map.set(t, (map.get(t) ?? 0) + 1);
  for (const [k, v] of map) map.set(k, v / tokens.length);
  return map;
}

function cosineSimilarity(
  a: Map<string, number>,
  b: Map<string, number>
): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (const [k, v] of a) {
    dot += v * (b.get(k) ?? 0);
    normA += v * v;
  }
  for (const [, v] of b) normB += v * v;
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export function textSimilarity(a: string, b: string): number {
  const tfA = termFrequency(tokenize(a));
  const tfB = termFrequency(tokenize(b));
  return cosineSimilarity(tfA, tfB);
}

// ───────────────────────── Duplikat-Score ────────────────────────────────────

export interface ApplicationDuplicateScore {
  id: string;
  score: number; // 0–1
  reasons: string[];
}

export interface ContactDuplicateScore {
  id: string;
  score: number;
  reasons: string[];
}

interface ApplicationLike {
  id: string;
  companyName: string;
  position: string;
  location?: string | null;
  appliedAt?: Date | null;
  itBereich?: string | null;
}

interface ContactLike {
  id: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  company?: string | null;
  position?: string | null;
}

export function scoreApplicationDuplicates(
  target: ApplicationLike,
  candidates: ApplicationLike[],
  threshold = 0.75
): ApplicationDuplicateScore[] {
  const results: ApplicationDuplicateScore[] = [];

  for (const c of candidates) {
    if (c.id === target.id) continue;

    // Wenn beide einen IT-Bereich haben und dieser unterschiedlich ist,
    // handelt es sich um eine andere Stellenausschreibung → kein Duplikat
    if (
      target.itBereich && c.itBereich &&
      target.itBereich.trim().toLowerCase() !== c.itBereich.trim().toLowerCase()
    ) continue;

    // Wenn beide Bewerbungsdaten vorhanden und > 90 Tage auseinander → Neubewerbung, kein Duplikat
    if (target.appliedAt && c.appliedAt) {
      const diffDays = Math.abs(
        (new Date(target.appliedAt).getTime() - new Date(c.appliedAt).getTime()) /
        (1000 * 60 * 60 * 24)
      );
      if (diffDays > 90) continue;
    }

    const reasons: string[] = [];
    let score = 0;

    const combinedTarget = `${target.companyName} ${target.position}`;
    const combinedCandidate = `${c.companyName} ${c.position}`;
    const tfScore = textSimilarity(combinedTarget, combinedCandidate);
    if (tfScore > 0.6) {
      score += 0.35 * tfScore;
      reasons.push(`Textähnlichkeit (TF-IDF) ${(tfScore * 100).toFixed(0)}%`);
    }

    const companyScore = jaroWinkler(
      target.companyName.toLowerCase(),
      c.companyName.toLowerCase()
    );
    if (companyScore > 0.85) {
      score += 0.35 * companyScore;
      reasons.push(`Firmenname ähnlich (${(companyScore * 100).toFixed(0)}%)`);
    }

    const positionScore = textSimilarity(target.position, c.position);
    if (positionScore > 0.6) {
      score += 0.25 * positionScore;
      reasons.push(`Position ähnlich (${(positionScore * 100).toFixed(0)}%)`);
    }

    const locationScore = target.location && c.location
      ? jaroWinkler(target.location.toLowerCase(), c.location.toLowerCase())
      : 0;
    if (locationScore > 0.8) {
      score += 0.15 * locationScore;
      reasons.push(`Ort ähnlich (${(locationScore * 100).toFixed(0)}%)`);
    }

    const normalizedScore = Math.min(score, 1);
    if (normalizedScore >= threshold) {
      results.push({ id: c.id, score: normalizedScore, reasons });
    }
  }

  return results.sort((a, b) => b.score - a.score);
}

export function scoreContactDuplicates(
  target: ContactLike,
  candidates: ContactLike[],
  threshold = 0.75
): ContactDuplicateScore[] {
  const results: ContactDuplicateScore[] = [];

  for (const c of candidates) {
    if (c.id === target.id) continue;

    const reasons: string[] = [];
    let score = 0;

    // E-Mail ist stärkstes Signal
    if (target.email && c.email && target.email.toLowerCase() === c.email.toLowerCase()) {
      score += 0.9;
      reasons.push("Identische E-Mail-Adresse");
    } else {
      const combinedTarget = `${target.company ?? ""} ${target.position ?? ""} ${target.email ?? ""}`;
      const combinedCandidate = `${c.company ?? ""} ${c.position ?? ""} ${c.email ?? ""}`;
      const tfScore = textSimilarity(combinedTarget, combinedCandidate);
      if (tfScore > 0.6) {
        score += 0.25 * tfScore;
        reasons.push(`Textähnlichkeit (TF-IDF) ${(tfScore * 100).toFixed(0)}%`);
      }

      const nameScore = jaroWinkler(
        `${target.firstName} ${target.lastName}`.toLowerCase(),
        `${c.firstName} ${c.lastName}`.toLowerCase()
      );
      if (nameScore > 0.85) {
        score += 0.4 * nameScore;
        reasons.push(`Name ähnlich (${(nameScore * 100).toFixed(0)}%)`);
      }

      if (target.company && c.company) {
        const companyScore = jaroWinkler(
          target.company.toLowerCase(),
          c.company.toLowerCase()
        );
        if (companyScore > 0.8) {
          score += 0.25 * companyScore;
          reasons.push(`Firma ähnlich (${(companyScore * 100).toFixed(0)}%)`);
        }
      }
    }

    const normalizedScore = Math.min(score, 1);
    if (normalizedScore >= threshold) {
      results.push({ id: c.id, score: normalizedScore, reasons });
    }
  }

  return results.sort((a, b) => b.score - a.score);
}
