import { describe, expect, it } from "vitest";
import { computeMatchScore, isEvidenceInCv } from "./match-scoring";

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

describe("isEvidenceInCv", () => {
  const cv = `## Erfarenhet
Acme AB — Fullstackutvecklare (2022–2025)
- Byggde en betalningstjänst i TypeScript och Node.js med “event sourcing”.
- Ansvarade för CI/CD i GitHub Actions.`;

  it("hittar exakta citat", () => {
    expect(isEvidenceInCv(cv, "Ansvarade för CI/CD i GitHub Actions")).toBe(true);
  });

  it("tål skillnader i skiftläge, blanksteg, punktuation och citattecken", () => {
    expect(isEvidenceInCv(cv, 'byggde en  betalningstjänst i typescript och node.js med "event sourcing"')).toBe(true);
    expect(isEvidenceInCv(cv, "Acme AB - Fullstackutvecklare")).toBe(true);
  });

  it("tillåter förkortade citat med ellips om varje del finns", () => {
    expect(isEvidenceInCv(cv, "Byggde en betalningstjänst … med event sourcing")).toBe(true);
    expect(isEvidenceInCv(cv, "Byggde en betalningstjänst … i Kubernetes")).toBe(false);
  });

  it("avvisar påhittade belägg och tomma citat", () => {
    expect(isEvidenceInCv(cv, "Ledde ett team på tio utvecklare")).toBe(false);
    expect(isEvidenceInCv(cv, "  …  ")).toBe(false);
  });
});
