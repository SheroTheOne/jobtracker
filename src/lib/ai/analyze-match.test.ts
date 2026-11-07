import { APICallError, RetryError } from "ai";
import { describe, expect, it } from "vitest";
import { finalizeAnalysis } from "./analyze-match";
import { AiConfigError } from "./config";
import { classifyAiError } from "./errors";
import { createMockAnalysis } from "./mock";
import { matchAnalysisSchema, storedMatchAnalysisSchema } from "./schemas/match-analysis";

const CV = "## Profil\nFullstackutvecklare med fem års erfarenhet av TypeScript och React.\n";

describe("mock + finalizeAnalysis", () => {
  it("mocken följer schemat och verifierar bara äkta citat", () => {
    const raw = createMockAnalysis({ cvText: CV, role: "Utvecklare" });
    expect(matchAnalysisSchema.safeParse(raw).success).toBe(true);

    const { analysis, score } = finalizeAnalysis(raw, CV);
    expect(storedMatchAnalysisSchema.safeParse(analysis).success).toBe(true);
    expect(analysis.matched.map((m) => m.evidenceVerified)).toEqual([true, false]);
    // CRITICAL STRONG verifierad (3) + NICE PARTIAL overifierad (0.5) av totalt 3+1+3+1 = 8
    expect(score).toBe(Math.round((3.5 / 8) * 100));
  });
});

function apiError(statusCode: number, responseBody = ""): APICallError {
  return new APICallError({ message: "fel", url: "https://x", requestBodyValues: {}, statusCode, responseBody });
}

describe("classifyAiError", () => {
  it.each([
    [apiError(429), "RATE_LIMIT"],
    [apiError(503), "OVERLOADED"],
    [apiError(403), "AUTH"],
    [apiError(400, '{"error":{"message":"API key not valid"}}'), "AUTH"],
    [apiError(400, '{"error":{"message":"Invalid JSON schema"}}'), "UNKNOWN"],
    [new DOMException("timeout", "TimeoutError"), "TIMEOUT"],
    [new Error("något annat"), "UNKNOWN"],
  ] as const)("klassar %s som %s", (error, code) => {
    expect(classifyAiError(error).code).toBe(code);
  });

  it("packar upp RetryError till sista felet", () => {
    const error = new RetryError({ message: "slut", reason: "maxRetriesExceeded", errors: [apiError(503), apiError(429)] });
    expect(classifyAiError(error).code).toBe("RATE_LIMIT");
  });

  it("visar konfigurationsfelets eget meddelande", () => {
    expect(classifyAiError(new AiConfigError("Nyckel saknas"))).toEqual({ code: "CONFIG", message: "Nyckel saknas" });
  });
});
