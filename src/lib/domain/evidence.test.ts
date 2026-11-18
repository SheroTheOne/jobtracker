import { describe, expect, it } from "vitest";
import { createEvidenceVerifier, isEvidenceInCv, normalizeForEvidence } from "./evidence";

const cv = `## Erfarenhet
Acme AB — Fullstackutvecklare (2022–2025)
- Byggde en betalningstjänst i TypeScript och Node.js med “event sourcing”.
- Ansvarade för CI/CD i GitHub Actions.
- **Backend:** C#, .NET och C++ i en mikrotjänstarkitektur.`;

describe("isEvidenceInCv", () => {
  it("hittar exakta citat", () => {
    expect(isEvidenceInCv(cv, "Ansvarade för CI/CD i GitHub Actions")).toBe(true);
  });

  it("tål skillnader i skiftläge, blanksteg, punktuation och citattecken", () => {
    expect(isEvidenceInCv(cv, 'byggde en  betalningstjänst i typescript och node.js med "event sourcing"')).toBe(true);
    expect(isEvidenceInCv(cv, "Acme AB - Fullstackutvecklare")).toBe(true);
  });

  it("tål avslutande punkt och markdown runt citatet", () => {
    expect(isEvidenceInCv(cv, "Ansvarade för CI/CD.")).toBe(true);
    expect(isEvidenceInCv(cv, "Backend: C#, .NET och C++")).toBe(true);
  });

  it("tillåter förkortade citat med ellips om delarna finns i rätt ordning", () => {
    expect(isEvidenceInCv(cv, "Byggde en betalningstjänst … med event sourcing")).toBe(true);
    expect(isEvidenceInCv(cv, "Byggde en betalningstjänst ... med event sourcing")).toBe(true);
    expect(isEvidenceInCv(cv, "Byggde en betalningstjänst … i Kubernetes")).toBe(false);
    // Delarna finns, men i omvänd ordning – ihopklippt citat räknas inte.
    expect(isEvidenceInCv(cv, "event sourcing … Byggde en betalningstjänst")).toBe(false);
  });

  it("kräver hela ord – ordfragment räknas inte som belägg", () => {
    expect(isEvidenceInCv(cv, "React")).toBe(false); // finns inte
    expect(isEvidenceInCv(cv, "betalning")).toBe(false); // bara en del av "betalningstjänst"
    expect(isEvidenceInCv(cv, "Script")).toBe(false); // del av "TypeScript"
    expect(isEvidenceInCv(cv, "TypeScript")).toBe(true);
  });

  it("skiljer på C, C# och C++", () => {
    expect(isEvidenceInCv("Kompetenser: C++, Python", "C#")).toBe(false);
    expect(isEvidenceInCv("Kompetenser: C++, Python", "C++")).toBe(true);
  });

  it("hanterar PDF-artefakter: ligaturer, NFD-tecken och mjuka bindestreck", () => {
    const pdfCv = "Certiﬁerad i Azure. Arbetat på Gävle kommun med utveck­ling.";
    expect(isEvidenceInCv(pdfCv, "Certifierad i Azure")).toBe(true);
    expect(isEvidenceInCv(pdfCv, "Arbetat på Gävle kommun med utveckling")).toBe(true);
  });

  it("avvisar påhittade belägg och tomma eller för korta citat", () => {
    expect(isEvidenceInCv(cv, "Ledde ett team på tio utvecklare")).toBe(false);
    expect(isEvidenceInCv(cv, "  …  ")).toBe(false);
    expect(isEvidenceInCv(cv, "")).toBe(false);
    expect(isEvidenceInCv(cv, "Byggde … i")).toBe(false);
  });
});

describe("createEvidenceVerifier", () => {
  it("kan återanvändas för flera citat", () => {
    const verify = createEvidenceVerifier(cv);
    expect(["TypeScript", "Kubernetes", "GitHub Actions"].map(verify)).toEqual([true, false, true]);
  });
});

describe("normalizeForEvidence", () => {
  it("behåller tecken inuti tekniknamn men tar bort dem i kanterna", () => {
    expect(normalizeForEvidence("## Node.js, CI-miljö – 2022–2025.")).toBe("node.js ci-miljö 2022-2025");
  });
});
