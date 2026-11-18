import { NoObjectGeneratedError, generateText } from "ai";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { generateStructured } from "./generate-structured";
import { resolveModel } from "./provider";

vi.mock("ai", async (importOriginal) => ({ ...(await importOriginal<typeof import("ai")>()), generateText: vi.fn() }));
vi.mock("./provider", () => ({ resolveModel: vi.fn(), mockDelay: () => Promise.resolve() }));

const generateTextMock = vi.mocked(generateText);
const schema = z.object({ answer: z.string() });

function invalidOutput(): NoObjectGeneratedError {
  return new NoObjectGeneratedError({
    message: "ogiltig",
    text: "{",
    response: { id: "1", timestamp: new Date(), modelId: "m" },
    usage: { inputTokens: 1, outputTokens: 1, totalTokens: 2 } as never,
    finishReason: "stop",
  });
}

const request = {
  task: "test",
  schema,
  schemaName: "test",
  system: "s",
  prompt: "p",
  timeoutMs: 5_000,
  mock: () => ({ answer: "mock" }),
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.mocked(resolveModel).mockReturnValue({ kind: "live", model: {} as never, modelId: "google:test" });
});

describe("generateStructured", () => {
  it("returnerar mocksvaret i testläge utan att anropa modellen", async () => {
    vi.mocked(resolveModel).mockReturnValue({ kind: "mock", modelId: "mock" });
    await expect(generateStructured(request)).resolves.toEqual({ ok: true, value: { answer: "mock" }, modelId: "mock" });
    expect(generateTextMock).not.toHaveBeenCalled();
  });

  it("försöker igen en gång när svaret inte följer schemat", async () => {
    generateTextMock.mockRejectedValueOnce(invalidOutput()).mockResolvedValueOnce({ output: { answer: "ok" } } as never);
    await expect(generateStructured(request)).resolves.toEqual({ ok: true, value: { answer: "ok" }, modelId: "google:test" });
    expect(generateTextMock).toHaveBeenCalledTimes(2);
  });

  it("ger INVALID_OUTPUT efter två ogiltiga svar", async () => {
    generateTextMock.mockRejectedValue(invalidOutput());
    const result = await generateStructured(request);
    expect(result).toMatchObject({ ok: false, error: { code: "INVALID_OUTPUT" } });
    expect(generateTextMock).toHaveBeenCalledTimes(2);
  });

  it("försöker inte om andra fel (AI SDK har redan gjort omförsök)", async () => {
    generateTextMock.mockRejectedValue(new Error("nätverk"));
    await expect(generateStructured(request)).resolves.toMatchObject({ ok: false, error: { code: "UNKNOWN" } });
    expect(generateTextMock).toHaveBeenCalledTimes(1);
  });
});
