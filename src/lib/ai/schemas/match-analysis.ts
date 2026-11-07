import { z } from "zod";

/**
 * Det strukturerade svar modellen MÅSTE returnera. Skickas som JSON Schema till
 * leverantören (constrained decoding) och valideras med Zod på vägen tillbaka.
 *
 * Håll schemat enkelt: Gemini stöder bara en delmängd av JSON Schema, så undvik
 * format-validering, unions och rekursion. Beskrivningarna styr modellen – de är en del av prompten.
 */

export const IMPORTANCE = ["CRITICAL", "NICE_TO_HAVE"] as const;
export type Importance = (typeof IMPORTANCE)[number];

export const MATCH_STRENGTH = ["STRONG", "PARTIAL"] as const;
export type MatchStrength = (typeof MATCH_STRENGTH)[number];

const importance = z
  .enum(IMPORTANCE)
  .describe("CRITICAL = uttalat krav (ska, måste, krav, required). NICE_TO_HAVE = meriterande, plus, önskvärt.");

export const matchAnalysisSchema = z.object({
  job: z.object({
    title: z.string().describe("Rollens titel enligt annonsen."),
    seniority: z
      .enum(["JUNIOR", "MID", "SENIOR", "LEAD", "PRINCIPAL", "UNSPECIFIED"])
      .describe("Senioritet som annonsen efterfrågar. UNSPECIFIED om det inte framgår."),
    summary: z.string().describe("2–3 meningar om vad rollen går ut på. Svenska."),
  }),
  techStack: z.array(z.string()).describe("Tekniker, språk, ramverk och verktyg som nämns i annonsen."),
  keywords: z
    .array(z.string())
    .describe("Övriga nyckelord för ATS-matchning: domäner, metoder, certifieringar, mjuka färdigheter."),
  matched: z
    .array(
      z.object({
        requirement: z.string().describe("Kravet, kort formulerat."),
        importance,
        strength: z
          .enum(MATCH_STRENGTH)
          .describe("STRONG = CV:t visar tydligt kravet. PARTIAL = närliggande eller delvis uppfyllt."),
        evidence: z
          .string()
          .describe("ORDAGRANT citat från CV:t som styrker kravet. Kopiera exakt, max ~25 ord. Hitta inte på."),
        cvSection: z.string().describe("Var i CV:t citatet finns, t.ex. 'Erfarenhet – Acme AB' eller 'Kompetenser'."),
      }),
    )
    .describe("Krav i annonsen som CV:t uppfyller helt eller delvis."),
  missing: z
    .array(
      z.object({
        requirement: z.string().describe("Kravet, kort formulerat."),
        importance,
        suggestion: z
          .string()
          .describe("Konkret råd: hur luckan kan hanteras i ansökan eller intervju, eller vad som kan läras. Svenska."),
      }),
    )
    .describe("Krav i annonsen som CV:t inte visar. Varje krav ska finnas i antingen matched eller missing, aldrig båda."),
  assessment: z.string().describe("Ärlig helhetsbedömning av matchningen, 2–4 meningar. Svenska."),
  pitch: z.object({
    coverLetterParagraph: z
      .string()
      .describe("Ett stycke (80–140 ord) till personligt brev, i första person, på annonsens språk. Bygg bara på CV:t."),
    talkingPoints: z
      .array(z.string())
      .describe("3–5 konkreta poänger att lyfta i intervju, kopplade till annonsens viktigaste krav. Svenska."),
  }),
});

export type MatchAnalysis = z.infer<typeof matchAnalysisSchema>;

/** Det som sparas i MatchReport.analysis: modellens svar + fält som härleds i kod. */
export const storedMatchAnalysisSchema = matchAnalysisSchema.extend({
  matched: z.array(
    matchAnalysisSchema.shape.matched.element.extend({
      /** true om citatet faktiskt hittades i CV:t – skydd mot hallucinerade belägg. */
      evidenceVerified: z.boolean(),
    }),
  ),
});

export type StoredMatchAnalysis = z.infer<typeof storedMatchAnalysisSchema>;

export const MATCH_ANALYSIS_SCHEMA_VERSION = 1;
