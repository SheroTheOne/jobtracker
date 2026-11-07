import "server-only";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText, Output } from "ai";
import { computeMatchScore, isEvidenceInCv } from "@/lib/domain/match-scoring";
import { getAiConfig } from "./config";
import { classifyAiError, type AiFailure } from "./errors";
import { createMockAnalysis } from "./mock";
import { MATCH_PROMPT_VERSION, MATCH_SYSTEM_PROMPT, buildMatchPrompt, type MatchPromptInput } from "./prompts/match";
import { matchAnalysisSchema, type MatchAnalysis, type StoredMatchAnalysis } from "./schemas/match-analysis";

const TIMEOUT_MS = 120_000;
const MOCK_DELAY_MS = 1_500;

export interface MatchResult {
  analysis: StoredMatchAnalysis;
  score: number;
  /** "leverantör:modell@promptversion" – sparas för spårbarhet. */
  model: string;
}

export type AnalyzeMatchResult = { ok: true; value: MatchResult } | { ok: false; error: AiFailure };

async function generateAnalysis(input: MatchPromptInput): Promise<{ analysis: MatchAnalysis; modelId: string }> {
  const config = getAiConfig();

  if (config.provider === "mock") {
    await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY_MS));
    return { analysis: createMockAnalysis({ cvText: input.cvText, role: input.job.role }), modelId: "mock" };
  }

  const google = createGoogleGenerativeAI({ apiKey: config.apiKey });
  const { output } = await generateText({
    model: google(config.modelId),
    system: MATCH_SYSTEM_PROMPT,
    prompt: buildMatchPrompt(input),
    output: Output.object({ schema: matchAnalysisSchema, name: "match_analysis" }),
    temperature: 0.2, // låg för konsekventa klassningar mellan körningar
    maxRetries: 2, // AI SDK gör omförsök med backoff vid 429/5xx
    abortSignal: AbortSignal.timeout(TIMEOUT_MS),
  });
  return { analysis: output, modelId: `google:${config.modelId}` };
}

/** Lägger till fält som härleds i kod: verifierade belägg och poäng. Ren funktion – testbar. */
export function finalizeAnalysis(analysis: MatchAnalysis, cvText: string): { analysis: StoredMatchAnalysis; score: number } {
  const matched = analysis.matched.map((match) => ({
    ...match,
    evidenceVerified: isEvidenceInCv(cvText, match.evidence),
  }));
  return {
    analysis: { ...analysis, matched },
    score: computeMatchScore(matched, analysis.missing),
  };
}

export async function analyzeMatch(input: MatchPromptInput): Promise<AnalyzeMatchResult> {
  try {
    const { analysis, modelId } = await generateAnalysis(input);
    const finalized = finalizeAnalysis(analysis, input.cvText);
    return { ok: true, value: { ...finalized, model: `${modelId}@${MATCH_PROMPT_VERSION}` } };
  } catch (error) {
    const failure = classifyAiError(error);
    console.error(`[ai/analyze-match] ${failure.code}`, error);
    return { ok: false, error: failure };
  }
}
