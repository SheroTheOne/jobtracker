import { describe, expect, it } from "vitest";
import { describeFollowUp, getFollowUpState, getLastTouchpoint, type FollowUpInput } from "./follow-up";

const NOW = new Date("2026-11-07T12:00:00.000Z");
const daysAgo = (n: number): Date => new Date(NOW.getTime() - n * 24 * 60 * 60 * 1000);
const daysAhead = (n: number): Date => daysAgo(-n);

const base: FollowUpInput = {
  status: "APPLIED",
  appliedDate: null,
  lastContactAt: null,
  followUpDate: null,
};

describe("getLastTouchpoint", () => {
  it("väljer det senaste av appliedDate och lastContactAt", () => {
    expect(getLastTouchpoint({ appliedDate: daysAgo(10), lastContactAt: daysAgo(2) })).toEqual(daysAgo(2));
    expect(getLastTouchpoint({ appliedDate: daysAgo(1), lastContactAt: daysAgo(5) })).toEqual(daysAgo(1));
  });

  it("faller tillbaka på det som finns", () => {
    expect(getLastTouchpoint({ appliedDate: daysAgo(3), lastContactAt: null })).toEqual(daysAgo(3));
    expect(getLastTouchpoint({ appliedDate: null, lastContactAt: null })).toBeNull();
  });
});

describe("getFollowUpState", () => {
  it.each(["SAVED", "OFFER", "REJECTED"] as const)("flaggar aldrig inaktiv status %s", (status) => {
    expect(getFollowUpState({ ...base, status, appliedDate: daysAgo(30) }, NOW)).toEqual({ needsFollowUp: false });
  });

  it("flaggar inte exakt 7 dagar (gränsen är > 7)", () => {
    expect(getFollowUpState({ ...base, appliedDate: daysAgo(7) }, NOW).needsFollowUp).toBe(false);
  });

  it("flaggar efter 8 dagar utan kontakt", () => {
    expect(getFollowUpState({ ...base, appliedDate: daysAgo(8) }, NOW)).toEqual({
      needsFollowUp: true,
      reason: "NO_RECENT_CONTACT",
      daysSinceContact: 8,
    });
  });

  it("nyare kontakt nollställer räknaren", () => {
    const state = getFollowUpState({ ...base, appliedDate: daysAgo(20), lastContactAt: daysAgo(3) }, NOW);
    expect(state.needsFollowUp).toBe(false);
  });

  it("gäller även INTERVIEW", () => {
    expect(getFollowUpState({ ...base, status: "INTERVIEW", lastContactAt: daysAgo(9) }, NOW).needsFollowUp).toBe(
      true,
    );
  });

  it("flaggar inte utan någon kontaktpunkt", () => {
    expect(getFollowUpState(base, NOW).needsFollowUp).toBe(false);
  });

  it("passerad påminnelse flaggas med antal dagar", () => {
    expect(getFollowUpState({ ...base, followUpDate: daysAgo(2) }, NOW)).toEqual({
      needsFollowUp: true,
      reason: "REMINDER_DUE",
      daysOverdue: 2,
    });
  });

  it("påminnelse idag flaggas", () => {
    expect(getFollowUpState({ ...base, followUpDate: NOW }, NOW)).toMatchObject({ reason: "REMINDER_DUE", daysOverdue: 0 });
  });

  it("framtida påminnelse skjuter upp 7-dagarsregeln", () => {
    const state = getFollowUpState({ ...base, appliedDate: daysAgo(30), followUpDate: daysAhead(3) }, NOW);
    expect(state.needsFollowUp).toBe(false);
  });
});

describe("describeFollowUp", () => {
  it("ger läsbar text", () => {
    expect(describeFollowUp({ needsFollowUp: false })).toBeNull();
    expect(describeFollowUp({ needsFollowUp: true, reason: "REMINDER_DUE", daysOverdue: 0 })).toBe("Påminnelse idag");
    expect(describeFollowUp({ needsFollowUp: true, reason: "NO_RECENT_CONTACT", daysSinceContact: 9 })).toBe(
      "Ingen kontakt på 9 dagar",
    );
  });
});
