import { describe, expect, it } from "vitest";
import { reconcileRequirements, requirementKey } from "./requirements";

describe("requirementKey", () => {
  it("ignorerar skiftläge, punktuation och blanksteg", () => {
    expect(requirementKey("  Erfarenhet av React. ")).toBe(requirementKey("erfarenhet av react"));
    expect(requirementKey("C#")).not.toBe(requirementKey("C++"));
  });
});

describe("reconcileRequirements", () => {
  it("tar bort dubbletter inom listorna", () => {
    const result = reconcileRequirements(
      [
        { requirement: "React", importance: "CRITICAL" },
        { requirement: "react", importance: "NICE_TO_HAVE" },
      ],
      [
        { requirement: "Kubernetes", importance: "NICE_TO_HAVE" },
        { requirement: "Kubernetes.", importance: "NICE_TO_HAVE" },
      ],
    );
    expect(result.matched).toEqual([{ requirement: "React", importance: "CRITICAL" }]);
    expect(result.missing).toEqual([{ requirement: "Kubernetes", importance: "NICE_TO_HAVE" }]);
    expect(result.removed).toBe(2);
  });

  it("räknar ett krav som finns i båda listorna som matchat", () => {
    const result = reconcileRequirements(
      [{ requirement: "TypeScript", importance: "CRITICAL" }],
      [{ requirement: "typescript", importance: "CRITICAL" }],
    );
    expect(result.matched).toHaveLength(1);
    expect(result.missing).toHaveLength(0);
  });

  it("tar bort krav med tom text", () => {
    expect(reconcileRequirements([{ requirement: " – ", importance: "CRITICAL" }], []).matched).toEqual([]);
  });
});
