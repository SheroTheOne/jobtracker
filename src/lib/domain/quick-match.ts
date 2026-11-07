/**
 * Snabbmatchning: vilka av kandidatens kompetenser nämns i annonsen?
 * Gratis, omedelbar och deterministisk – används för att sortera sökresultat
 * innan man lägger en AI-analys på de mest lovande.
 */

export interface QuickMatch {
  matched: string[];
  missing: string[];
  /** Andel av kompetenserna som nämns, 0–100. */
  percent: number;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Matchar hela ord, skiftlägesokänsligt. Hanterar tecken som ingår i tekniknamn
 * (C#, C++, .NET, Node.js) genom att kräva att träffen inte omges av bokstäver/siffror.
 */
export function mentionsSkill(text: string, skill: string): boolean {
  const term = skill.trim();
  if (!term) return false;
  const pattern = new RegExp(`(?<![\\p{L}\\p{N}])${escapeRegExp(term)}(?![\\p{L}\\p{N}+#])`, "iu");
  return pattern.test(text);
}

export function quickMatch(skills: readonly string[], adText: string): QuickMatch {
  const matched: string[] = [];
  const missing: string[] = [];
  for (const skill of skills) (mentionsSkill(adText, skill) ? matched : missing).push(skill);
  const percent = skills.length === 0 ? 0 : Math.round((matched.length / skills.length) * 100);
  return { matched, missing, percent };
}
