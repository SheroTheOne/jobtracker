import "server-only";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import type { LanguageModel } from "ai";
import { getAiConfig } from "./config";

export type ResolvedModel = { kind: "mock"; modelId: "mock" } | { kind: "live"; model: LanguageModel; modelId: string };

/** Enda stället som vet vilken leverantör som används. Byt leverantör här (eller via .env). */
export function resolveModel(): ResolvedModel {
  const config = getAiConfig();
  if (config.provider === "mock") return { kind: "mock", modelId: "mock" };

  const google = createGoogleGenerativeAI({ apiKey: config.apiKey });
  return { kind: "live", model: google(config.modelId), modelId: `google:${config.modelId}` };
}

export const mockDelay = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));
