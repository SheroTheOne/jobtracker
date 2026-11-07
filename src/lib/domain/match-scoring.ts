import type { Importance, MatchStrength } from "@/lib/ai/schemas/match-analysis";

/**
 * Matchningspoängen räknas deterministiskt i kod – inte av modellen.
 * LLM:er är dåliga på att sätta konsekventa siffror, men bra på att klassificera krav.
 * Formeln är transparent och kan visas för användaren.
 */
export const IMPORTANCE_WEIGHT: Record<Importance, number> = { CRITICAL: 3, NICE_TO_HAVE: 1 };
export const STRENGTH_FACTOR: Record<MatchStrength, number> = { STRONG: 1, PARTIAL: 0.5 };

/** Overifierade belägg (citatet finns inte i CV:t) räknas som högst PARTIAL. */
const UNVERIFIED_CAP = STRENGTH_FACTOR.PARTIAL;

export interface ScorableMatch {
  importance: Importance;
  strength: MatchStrength;
  evidenceVerified: boolean;
}

export interface ScorableGap {
  importance: Importance;
}

export function computeMatchScore(matched: readonly ScorableMatch[], missing: readonly ScorableGap[]): number {
  const total =
    matched.reduce((sum, m) => sum + IMPORTANCE_WEIGHT[m.importance], 0) +
    missing.reduce((sum, m) => sum + IMPORTANCE_WEIGHT[m.importance], 0);
  if (total === 0) return 0;

  const earned = matched.reduce((sum, m) => {
    const factor = m.evidenceVerified ? STRENGTH_FACTOR[m.strength] : Math.min(STRENGTH_FACTOR[m.strength], UNVERIFIED_CAP);
    return sum + IMPORTANCE_WEIGHT[m.importance] * factor;
  }, 0);

  return Math.round((earned / total) * 100);
}

/** Normaliserar för jämförelse: gemener, enhetliga citattecken/streck, ingen punktuation eller extra blanksteg. */
function normalize(text: string): string {
  return text
    .toLocaleLowerCase("sv-SE")
    .replace(/[‘’´`]/g, "'")
    .replace(/[“”„]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/[^\p{L}\p{N}\s'+#.-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Kontrollerar att ett citat verkligen finns i CV:t. Tolerant mot skiftläge, blanksteg,
 * punktuation och att modellen kortat citatet med "…" (varje del måste då finnas).
 */
export function isEvidenceInCv(cvText: string, evidence: string): boolean {
  const haystack = normalize(cvText);
  const parts = evidence
    .split(/\.\.\.|…/)
    .map(normalize)
    .filter((part) => part.length > 0);
  if (parts.length === 0) return false;
  return parts.every((part) => part.length >= 3 && haystack.includes(part));
}
