import "server-only";
import { createEvidenceVerifier } from "@/lib/domain/evidence";
import { computeMatchScore } from "@/lib/domain/match-scoring";
import { reconcileRequirements } from "@/lib/domain/requirements";
import { aiFailure, type AiFailure } from "./errors";
import { generateStructured, type TokenUsage } from "./generate-structured";
import { createMockAnalysis } from "./mock";
import { MATCH_PROMPT_VERSION, MATCH_SYSTEM_PROMPT, buildMatchPrompt, type MatchPromptInput } from "./prompts/match";
import { matchAnalysisSchema, type MatchAnalysis, type StoredMatchAnalysis } from "./schemas/match-analysis";

const TIMEOUT_MS = 120_000;
const MOCK_DELAY_MS = 1_500;

export interface MatchResult {
  analysis: StoredMatchAnalysis;
  score: number;
  /** "leverantör:modell" – sparas för spårbarhet. */
  model: string;
  promptVersion: string;
  usage: TokenUsage;
}

export type AnalyzeMatchResult = { ok: true; value: MatchResult } | { ok: false; error: AiFailure };

export type FinalizedAnalysis =
  | { ok: true; analysis: StoredMatchAnalysis; score: number }
  | { ok: false; error: AiFailure };

/**
 * Efterbearbetning i kod av modellens svar – ren funktion, testbar:
 * 1. Städar kravlistorna (dubbletter, krav i både matched och missing).
 * 2. Verifierar varje citat mot CV:t.
 * 3. Räknar poängen deterministiskt.
 * Ett svar utan krav ger ett fel i stället för en missvisande 0 %.
 */
export function finalizeAnalysis(analysis: MatchAnalysis, cvText: string): FinalizedAnalysis {
  const { matched, missing } = reconcileRequirements(analysis.matched, analysis.missing);
  if (matched.length + missing.length === 0) return { ok: false, error: aiFailure("NO_REQUIREMENTS") };

  const verify = createEvidenceVerifier(cvText);
  const verifiedMatched = matched.map((match) => ({ ...match, evidenceVerified: verify(match.evidence) }));
  return {
    ok: true,
    analysis: { ...analysis, matched: verifiedMatched, missing },
    score: computeMatchScore(verifiedMatched, missing),
  };
}

export async function analyzeMatch(input: MatchPromptInput): Promise<AnalyzeMatchResult> {
  const generated = await generateStructured({
    task: "analyze-match",
    schema: matchAnalysisSchema,
    schemaName: "match_analysis",
    system: MATCH_SYSTEM_PROMPT,
    prompt: buildMatchPrompt(input),
    timeoutMs: TIMEOUT_MS,
    mock: () => createMockAnalysis({ cvText: input.cvText, role: input.job.role }),
    mockDelayMs: MOCK_DELAY_MS,
  });
  if (!generated.ok) return generated;

  const finalized = finalizeAnalysis(generated.value, input.cvText);
  if (!finalized.ok) {
    console.error(`[ai/analyze-match] ${finalized.error.code}`);
    return finalized;
  }
  return {
    ok: true,
    value: {
      analysis: finalized.analysis,
      score: finalized.score,
      model: generated.modelId,
      promptVersion: MATCH_PROMPT_VERSION,
      usage: generated.usage,
    },
  };
}
