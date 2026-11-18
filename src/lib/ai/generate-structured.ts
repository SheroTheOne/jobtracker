import "server-only";
import { generateText, Output } from "ai";
import type { z } from "zod";
import { classifyAiError, isInvalidOutputError, type AiFailure } from "./errors";
import { mockDelay, resolveModel } from "./provider";

/**
 * Gemensam väg för alla AI-anrop med strukturerad output. Samlar på ett ställe:
 * testläge (mock), Zod-schema → JSON Schema, temperatur, timeout, omförsök och felklassning.
 * Anroparen får alltid ett resultat – aldrig ett kastat fel.
 */

export type AiResult<T> = { ok: true; value: T; modelId: string } | { ok: false; error: AiFailure };

export interface StructuredRequest<T> {
  /** Namn i loggar, t.ex. "analyze-match". */
  task: string;
  schema: z.ZodType<T>;
  /** Skickas till leverantören som namn på schemat. */
  schemaName: string;
  system: string;
  prompt: string;
  /** Total tidsbudget för alla försök. */
  timeoutMs: number;
  /** Svar i testläge (AI_PROVIDER="mock"). */
  mock: () => T;
  mockDelayMs?: number;
}

/**
 * AI SDK gör själv omförsök vid 429/5xx (maxRetries). Ett svar som inte följer schemat
 * (trunkerat, blockerat eller felformaterat) försöker vi om en gång själva – det är oftast slumpmässigt.
 */
const API_RETRIES = 2;
const INVALID_OUTPUT_ATTEMPTS = 2;

export async function generateStructured<T>(request: StructuredRequest<T>): Promise<AiResult<T>> {
  try {
    const resolved = resolveModel();
    if (resolved.kind === "mock") {
      await mockDelay(request.mockDelayMs ?? 0);
      return { ok: true, value: request.mock(), modelId: resolved.modelId };
    }

    const abortSignal = AbortSignal.timeout(request.timeoutMs);
    for (let attempt = 1; ; attempt++) {
      try {
        const { output } = await generateText({
          model: resolved.model,
          system: request.system,
          prompt: request.prompt,
          output: Output.object({ schema: request.schema, name: request.schemaName }),
          temperature: 0.2, // låg för konsekventa klassningar mellan körningar
          maxRetries: API_RETRIES,
          abortSignal,
        });
        return { ok: true, value: output as T, modelId: resolved.modelId };
      } catch (error) {
        if (attempt < INVALID_OUTPUT_ATTEMPTS && isInvalidOutputError(error) && !abortSignal.aborted) {
          console.warn(`[ai/${request.task}] ogiltig output, försök ${attempt + 1}`);
          continue;
        }
        throw error;
      }
    }
  } catch (error) {
    const failure = classifyAiError(error);
    console.error(`[ai/${request.task}] ${failure.code}`, error);
    return { ok: false, error: failure };
  }
}
