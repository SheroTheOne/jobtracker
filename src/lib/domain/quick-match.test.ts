import { describe, expect, it } from "vitest";
import { mentionsSkill, quickMatch } from "./quick-match";

describe("mentionsSkill", () => {
  it("matchar hela ord skiftlägesokänsligt", () => {
    expect(mentionsSkill("Vi jobbar med react och TypeScript.", "React")).toBe(true);
    expect(mentionsSkill("Erfarenhet av Javascript", "Java")).toBe(false);
  });

  it("hanterar tekniknamn med specialtecken", () => {
    expect(mentionsSkill("Backend i C# och .NET", "C#")).toBe(true);
    expect(mentionsSkill("Backend i C# och .NET", ".NET")).toBe(true);
    expect(mentionsSkill("Erfarenhet av C++", "C")).toBe(false);
    expect(mentionsSkill("API:er i Node.js.", "Node.js")).toBe(true);
  });

  it("ignorerar tomma kompetenser", () => {
    expect(mentionsSkill("vad som helst", "  ")).toBe(false);
  });
});

describe("quickMatch", () => {
  it("delar upp i träffar och missar med procent", () => {
    const result = quickMatch(["TypeScript", "React", "Go", "AWS"], "Vi söker dig med TypeScript, React och AWS.");
    expect(result).toEqual({ matched: ["TypeScript", "React", "AWS"], missing: ["Go"], percent: 75 });
  });

  it("ger 0 utan kompetenser", () => {
    expect(quickMatch([], "text").percent).toBe(0);
  });
});
