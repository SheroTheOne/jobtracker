import type { MatchPromptInput } from "../prompts/match";

/**
 * Golden set för matchningen. Varje fall beskriver vad en rimlig analys MÅSTE innehålla –
 * inte exakt output. Kör `npm run eval:match` före och efter varje ändring i prompt, schema
 * eller modell och jämför. Lägg till ett fall för varje bugg som hittas i verkliga analyser.
 */
export interface EvalCase {
  name: string;
  input: MatchPromptInput;
  expect: {
    /** Mönster (skiftlägesokänsliga) som ska finnas bland matchade krav. */
    matched: string[];
    /** Mönster som ska finnas bland saknade krav. */
    missing: string[];
    /** Rimligt poängintervall, inklusive gränser. */
    score: [min: number, max: number];
    /** Minsta andel matchningar med verifierat citat (0–1). */
    minVerifiedRatio: number;
  };
}

const FULLSTACK_CV = `# Alex Exempel
Fullstackutvecklare

## Erfarenhet
Nordlys Tech AB — Fullstackutvecklare (2021–2025)
- Byggde en bokningsplattform i TypeScript, React och Next.js med 40 000 användare.
- Designade REST-API:er i Node.js och PostgreSQL, inklusive migreringar och indexering.
- Satte upp CI/CD i GitHub Actions och drev införandet av automatiserade tester med Vitest.

Fjällmark Data — Juniorutvecklare (2019–2021)
- Underhöll interna verktyg i Python och Django.

## Kompetenser
TypeScript, JavaScript, React, Next.js, Node.js, PostgreSQL, Python, Git, Docker

## Språk
Svenska (modersmål), engelska (flytande)`;

export const EVAL_CASES: EvalCase[] = [
  {
    name: "Stark fullstackmatch med en tydlig lucka (AWS)",
    input: {
      cvText: FULLSTACK_CV,
      jobDescription: `Vi söker en fullstackutvecklare till vårt produktteam i Stockholm.

Krav:
- Minst 3 års erfarenhet av TypeScript och React
- Erfarenhet av Node.js och relationsdatabaser (PostgreSQL)
- Erfarenhet av AWS i produktion

Meriterande:
- Next.js
- Docker
- Erfarenhet av Terraform

Vi erbjuder friskvårdsbidrag, flexibla arbetstider och en härlig gemenskap.`,
      candidate: { seniority: "MID", targetRoles: ["Fullstackutvecklare"], coreSkills: ["TypeScript", "React", "Node.js"] },
      job: { company: "Exempelbolaget", role: "Fullstackutvecklare" },
    },
    expect: {
      matched: ["typescript|react", "node|postgres"],
      missing: ["aws", "terraform"],
      score: [50, 85],
      minVerifiedRatio: 0.7,
    },
  },
  {
    name: "Svag match – inbyggda system i C/C++",
    input: {
      cvText: FULLSTACK_CV,
      jobDescription: `Embedded Software Engineer – fordonsindustrin

Du kommer att utveckla mjukvara för styrenheter i moderna fordon.

Krav:
- Minst 5 års erfarenhet av C och C++ i inbyggda system
- Erfarenhet av AUTOSAR
- Kunskap om CAN-bussen

Meriterande:
- Python för testautomation
- Erfarenhet av ISO 26262`,
      candidate: { seniority: "MID", targetRoles: ["Fullstackutvecklare"], coreSkills: ["TypeScript", "React", "Node.js"] },
      job: { company: "Fordonsbolaget", role: "Embedded Software Engineer" },
    },
    expect: {
      matched: [],
      missing: ["c\\+\\+|\\bc\\b", "autosar", "can"],
      score: [0, 30],
      minVerifiedRatio: 0.5,
    },
  },
];
