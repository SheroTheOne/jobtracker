import type { Importance, MatchStrength } from "./requirements";

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
