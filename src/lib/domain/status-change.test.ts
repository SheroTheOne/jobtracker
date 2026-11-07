import { describe, expect, it } from "vitest";
import { deriveStatusChange, resolveInitialAppliedDate } from "./status-change";

const NOW = new Date("2026-11-07T12:00:00.000Z");

describe("deriveStatusChange", () => {
  it("gör inget om statusen är oförändrad", () => {
    expect(deriveStatusChange({ from: "APPLIED", to: "APPLIED", appliedDate: null }, NOW)).toEqual({
      status: "APPLIED",
    });
  });

  it("sätter appliedDate och lastContactAt vid första APPLIED", () => {
    expect(deriveStatusChange({ from: "SAVED", to: "APPLIED", appliedDate: null }, NOW)).toEqual({
      status: "APPLIED",
      appliedDate: NOW,
      lastContactAt: NOW,
    });
  });

  it("skriver inte över befintligt appliedDate", () => {
    const earlier = new Date("2026-10-01T12:00:00.000Z");
    const result = deriveStatusChange({ from: "INTERVIEW", to: "APPLIED", appliedDate: earlier }, NOW);
    expect(result.appliedDate).toBeUndefined();
  });

  it("sätter appliedDate när man hoppar direkt till INTERVIEW", () => {
    expect(deriveStatusChange({ from: "SAVED", to: "INTERVIEW", appliedDate: null }, NOW).appliedDate).toBe(NOW);
  });

  it("räknar övriga ändringar som kontakt", () => {
    expect(deriveStatusChange({ from: "APPLIED", to: "INTERVIEW", appliedDate: NOW }, NOW)).toEqual({
      status: "INTERVIEW",
      lastContactAt: NOW,
    });
  });
});

describe("resolveInitialAppliedDate", () => {
  it("behåller angivet datum", () => {
    const given = new Date("2026-10-01T12:00:00.000Z");
    expect(resolveInitialAppliedDate("APPLIED", given, NOW)).toBe(given);
  });

  it.each(["SAVED", "REJECTED"] as const)("%s utan datum får inget datum", (status) => {
    expect(resolveInitialAppliedDate(status, null, NOW)).toBeNull();
  });

  it("sökt utan datum antas vara idag", () => {
    expect(resolveInitialAppliedDate("INTERVIEW", null, NOW)).toBe(NOW);
  });
});
