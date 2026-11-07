import "server-only";
import { z } from "zod";

const aiEnvSchema = z.object({
  AI_PROVIDER: z.enum(["google", "mock"]).default("mock"),
  AI_MODEL: z.string().min(1).default("gemini-3.5-flash"),
  GOOGLE_GENERATIVE_AI_API_KEY: z.string().optional(),
});

export type AiConfig =
  | { provider: "mock"; modelId: "mock" }
  | { provider: "google"; modelId: string; apiKey: string };

export class AiConfigError extends Error {
  override name = "AiConfigError";
}

/** Läses vid anrop (inte vid import) så att en saknad nyckel ger ett tydligt fel i UI:t i stället för krasch. */
export function getAiConfig(): AiConfig {
  const env = aiEnvSchema.safeParse(process.env);
  if (!env.success) throw new AiConfigError(`Ogiltig AI-konfiguration: ${z.prettifyError(env.error)}`);

  const { AI_PROVIDER, AI_MODEL, GOOGLE_GENERATIVE_AI_API_KEY } = env.data;
  if (AI_PROVIDER === "mock") return { provider: "mock", modelId: "mock" };

  if (!GOOGLE_GENERATIVE_AI_API_KEY) {
    throw new AiConfigError("GOOGLE_GENERATIVE_AI_API_KEY saknas i .env (eller sätt AI_PROVIDER=\"mock\").");
  }
  return { provider: "google", modelId: AI_MODEL, apiKey: GOOGLE_GENERATIVE_AI_API_KEY };
}
