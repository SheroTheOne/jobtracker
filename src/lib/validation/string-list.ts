import { z } from "zod";

/**
 * Delar fritext på komma, semikolon eller radbrytning till en lista.
 * Trimmar, tar bort tomma poster och dubbletter (skiftlägesokänsligt, första stavningen vinner).
 */
export function parseStringList(input: string): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const raw of input.split(/[,;\n]/)) {
    const item = raw.trim().replace(/\s+/g, " ");
    const key = item.toLocaleLowerCase("sv-SE");
    if (item && !seen.has(key)) {
      seen.add(key);
      result.push(item);
    }
  }
  return result;
}

export function formatStringList(items: readonly string[]): string {
  return items.join(", ");
}

/** För Json-kolumner som ska innehålla string[]. Korrupt data → tom lista i stället för krasch. */
export const storedStringListSchema = z.array(z.string()).catch([]);
