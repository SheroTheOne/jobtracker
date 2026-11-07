import { describe, expect, it } from "vitest";
import { profileFormSchema, type ProfileFormValues } from "./profile";
import { parseStringList, storedStringListSchema } from "./string-list";

describe("parseStringList", () => {
  it("delar på komma, semikolon och radbrytning", () => {
    expect(parseStringList("TypeScript, React;Node.js\nPostgreSQL")).toEqual([
      "TypeScript",
      "React",
      "Node.js",
      "PostgreSQL",
    ]);
  });

  it("trimmar, normaliserar mellanslag och tar bort tomma poster", () => {
    expect(parseStringList("  Next.js  ,, \n  Tailwind   CSS ,")).toEqual(["Next.js", "Tailwind CSS"]);
  });

  it("tar bort dubbletter skiftlägesokänsligt och behåller första stavningen", () => {
    expect(parseStringList("React, react, REACT, Vue")).toEqual(["React", "Vue"]);
  });
});

describe("storedStringListSchema", () => {
  it("släpper igenom giltiga listor och ersätter korrupt data med tom lista", () => {
    expect(storedStringListSchema.parse(["a", "b"])).toEqual(["a", "b"]);
    expect(storedStringListSchema.parse({ not: "a list" })).toEqual([]);
    expect(storedStringListSchema.parse([1, 2])).toEqual([]);
  });
});

describe("profileFormSchema", () => {
  const valid: ProfileFormValues = {
    fullName: "",
    headline: "Fullstackutvecklare",
    seniority: "MID",
    targetRoles: "Fullstackutvecklare, Frontendutvecklare",
    coreSkills: "TypeScript, React, Next.js",
    cvText: "x".repeat(250),
  };

  it("parsar listor och normaliserar tomma fält", () => {
    const result = profileFormSchema.parse(valid);
    expect(result.fullName).toBeNull();
    expect(result.coreSkills).toEqual(["TypeScript", "React", "Next.js"]);
    expect(result.targetRoles).toHaveLength(2);
  });

  it("kräver minst en roll och en kompetens", () => {
    const result = profileFormSchema.safeParse({ ...valid, coreSkills: " , ", targetRoles: "" });
    expect(result.success).toBe(false);
    const fields = result.error?.issues.map((issue) => issue.path[0]);
    expect(fields).toEqual(expect.arrayContaining(["coreSkills", "targetRoles"]));
  });

  it("avvisar för kort CV och ogiltig senioritet", () => {
    expect(profileFormSchema.safeParse({ ...valid, cvText: "kort" }).success).toBe(false);
    expect(profileFormSchema.safeParse({ ...valid, seniority: "WIZARD" }).success).toBe(false);
  });
});
