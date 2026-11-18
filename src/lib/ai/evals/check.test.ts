import { describe, expect, it } from "vitest";
import { createMockAnalysis } from "../mock";
import type { StoredMatchAnalysis } from "../schemas/match-analysis";
import { checkEvalCase } from "./check";
import { EVAL_CASES } from "./fixtures";
import { finalizeAnalysis } from "../analyze-match";

function analysis(): StoredMatchAnalysis {
  const raw = createMockAnalysis({ cvText: "Erfarenhet av modern webbutveckling med React", role: "X" });
  const result = finalizeAnalysis(raw, "Erfarenhet av modern webbutveckling med React");
  if (!result.ok) throw new Error("väntade ok");
  return result.analysis;
}

describe("checkEvalCase", () => {
  it("godkänner en analys som uppfyller förväntningarna", () => {
    expect(
      checkEvalCase({ matched: ["webbutveckling"], missing: ["postgres"], score: [0, 100], minVerifiedRatio: 0.5 }, analysis(), 44),
    ).toEqual([]);
  });

  it("rapporterar saknade krav, poäng utanför intervallet och för få verifierade citat", () => {
    const failures = checkEvalCase({ matched: ["kotlin"], missing: ["rust"], score: [80, 100], minVerifiedRatio: 1 }, analysis(), 44);
    expect(failures).toHaveLength(4);
  });

  it("alla fall i golden set har giltiga regex och rimliga intervall", () => {
    for (const evalCase of EVAL_CASES) {
      for (const pattern of [...evalCase.expect.matched, ...evalCase.expect.missing]) expect(() => new RegExp(pattern)).not.toThrow();
      const [min, max] = evalCase.expect.score;
      expect(min).toBeLessThanOrEqual(max);
      expect(evalCase.input.jobDescription.length).toBeGreaterThanOrEqual(100);
    }
  });
});
