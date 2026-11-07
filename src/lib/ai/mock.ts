import type { MatchAnalysis } from "./schemas/match-analysis";

/**
 * Exempelsvar för AI_PROVIDER="mock": utveckla och testa UI utan nyckel eller kostnad.
 * Belägget i första matchningen hämtas ur CV:t så att verifieringen kan visas som lyckad.
 */
export function createMockAnalysis(input: { cvText: string; role: string }): MatchAnalysis {
  const firstCvLine =
    input.cvText
      .split("\n")
      .map((line) => line.replace(/^[#*\-\s]+/, "").trim())
      .find((line) => line.length > 20) ?? input.cvText.slice(0, 80);

  return {
    job: {
      title: input.role,
      seniority: "MID",
      summary: "[Testläge] Exempelsammanfattning av rollen. Sätt AI_PROVIDER=\"google\" för en riktig analys.",
    },
    techStack: ["TypeScript", "React", "Next.js", "PostgreSQL", "AWS"],
    keywords: ["Agilt", "CI/CD", "Kodgranskning", "Kommunikativ"],
    matched: [
      {
        requirement: "Erfarenhet av modern webbutveckling",
        importance: "CRITICAL",
        strength: "STRONG",
        evidence: firstCvLine.slice(0, 160),
        cvSection: "CV – inledning",
      },
      {
        requirement: "Molntjänster (AWS)",
        importance: "NICE_TO_HAVE",
        strength: "PARTIAL",
        evidence: "Påhittat citat som inte finns i CV:t",
        cvSection: "Exempel på overifierat belägg",
      },
    ],
    missing: [
      {
        requirement: "PostgreSQL i produktion",
        importance: "CRITICAL",
        suggestion: "[Testläge] Lyft närliggande databaserfarenhet och visa ett eget projekt med Postgres.",
      },
      {
        requirement: "Erfarenhet av Terraform",
        importance: "NICE_TO_HAVE",
        suggestion: "[Testläge] Nämn intresse och gör en kort tutorial innan intervjun.",
      },
    ],
    assessment: "[Testläge] Det här är ett exempelsvar som visar hur rapporten ser ut. Inga AI-anrop har gjorts.",
    pitch: {
      coverLetterParagraph:
        "[Testläge] Här hamnar ett stycke till ditt personliga brev, skrivet utifrån ditt CV och annonsens viktigaste krav.",
      talkingPoints: ["[Testläge] Första poängen att lyfta", "[Testläge] Andra poängen", "[Testläge] Tredje poängen"],
    },
  };
}
