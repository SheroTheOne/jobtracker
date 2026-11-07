import { describe, expect, it } from "vitest";
import { parsePlatsbankenAdId } from "./platsbanken-url";

describe("parsePlatsbankenAdId", () => {
  it.each([
    ["https://arbetsformedlingen.se/platsbanken/annonser/31697074", "31697074"],
    ["https://www.arbetsformedlingen.se/platsbanken/annonser/31697074?utm_source=x#top", "31697074"],
    ["  https://arbetsformedlingen.se/platsbanken/annonser/31697074/  ", "31697074"],
    ["31697074", "31697074"],
  ])("tolkar %s", (input, expected) => {
    expect(parsePlatsbankenAdId(input)).toBe(expected);
  });

  it.each([
    "https://se.indeed.com/viewjob?jk=123456",
    "https://arbetsformedlingen.se.evil.com/platsbanken/annonser/31697074",
    "https://arbetsformedlingen.se/platsbanken/annonser",
    "inte en länk",
    "",
  ])("avvisar %s", (input) => {
    expect(parsePlatsbankenAdId(input)).toBeNull();
  });
});
