/**
 * Begrepp för krav i en jobbannons. Ägs av domänlagret – AI-schemat och poängberäkningen
 * importerar härifrån, aldrig tvärtom (domain/ ska inte bero på ai/).
 */

export const IMPORTANCE = ["CRITICAL", "NICE_TO_HAVE"] as const;
export type Importance = (typeof IMPORTANCE)[number];

export const MATCH_STRENGTH = ["STRONG", "PARTIAL"] as const;
export type MatchStrength = (typeof MATCH_STRENGTH)[number];

export const IMPORTANCE_LABELS: Record<Importance, string> = { CRITICAL: "Krav", NICE_TO_HAVE: "Meriterande" };

interface Requirement {
  requirement: string;
  importance: Importance;
}

/** Jämförelsenyckel: skiftläge, punktuation och blanksteg spelar ingen roll. */
export function requirementKey(text: string): string {
  return text
    .normalize("NFKC")
    .toLocaleLowerCase("sv-SE")
    .replace(/[^\p{L}\p{N}+#]+/gu, " ")
    .trim();
}

/**
 * Städar modellens kravlistor innan poängen räknas:
 * - Dubbletter inom en lista tas bort (första förekomsten vinner).
 * - Ett krav som finns i både matched och missing räknas som matchat – annars skulle
 *   det dra ned poängen två gånger, trots att prompten säger "aldrig båda".
 */
export function reconcileRequirements<M extends Requirement, G extends Requirement>(
  matched: readonly M[],
  missing: readonly G[],
): { matched: M[]; missing: G[]; removed: number } {
  const seen = new Set<string>();
  const keep = <T extends Requirement>(item: T): boolean => {
    const key = requirementKey(item.requirement);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  };
  const cleanMatched = matched.filter(keep);
  const cleanMissing = missing.filter(keep);
  return {
    matched: cleanMatched,
    missing: cleanMissing,
    removed: matched.length + missing.length - cleanMatched.length - cleanMissing.length,
  };
}
