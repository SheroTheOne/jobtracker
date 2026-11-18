import { describe, expect, it } from "vitest";
import { computeMatchScore } from "./match-scoring";

describe("computeMatchScore", () => {
  it("ger 100 när alla krav är starkt och verifierat uppfyllda", () => {
    expect(
      computeMatchScore(
        [
          { importance: "CRITICAL", strength: "STRONG", evidenceVerified: true },
          { importance: "NICE_TO_HAVE", strength: "STRONG", evidenceVerified: true },
        ],
        [],
      ),
    ).toBe(100);
  });

  it("ger 0 utan krav och utan matchningar", () => {
    expect(computeMatchScore([], [])).toBe(0);
    expect(computeMatchScore([], [{ importance: "CRITICAL" }])).toBe(0);
  });

  it("väger kritiska krav tre gånger tyngre än meriterande", () => {
    // Uppfyllt kritiskt (3) mot saknat meriterande (1) → 3/4
    expect(
      computeMatchScore([{ importance: "CRITICAL", strength: "STRONG", evidenceVerified: true }], [{ importance: "NICE_TO_HAVE" }]),
    ).toBe(75);
    // Uppfyllt meriterande (1) mot saknat kritiskt (3) → 1/4
    expect(
      computeMatchScore([{ importance: "NICE_TO_HAVE", strength: "STRONG", evidenceVerified: true }], [{ importance: "CRITICAL" }]),
    ).toBe(25);
  });

  it("räknar PARTIAL som halv poäng", () => {
    expect(computeMatchScore([{ importance: "CRITICAL", strength: "PARTIAL", evidenceVerified: true }], [])).toBe(50);
  });

  it("begränsar overifierade belägg till PARTIAL", () => {
    expect(computeMatchScore([{ importance: "CRITICAL", strength: "STRONG", evidenceVerified: false }], [])).toBe(50);
  });
});
