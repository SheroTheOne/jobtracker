import { describe, expect, it } from "vitest";
import { isSeniorTitle } from "./seniority-filter";

describe("isSeniorTitle", () => {
  it.each([
    "Senior Javautvecklare",
    "Sr. Frontend Developer",
    "Tech Lead – plattformsteam",
    "Principal Engineer",
    "Arkitekt inom molntjänster",
    "Lösningsarkitekt",
    "Utvecklingschef",
    "IT-chef",
    "Head of Engineering",
    "Engineering Manager",
  ])("flaggar %s", (title) => {
    expect(isSeniorTitle(title)).toBe(true);
  });

  it.each([
    "Fullstackutvecklare",
    "Junior utvecklare till växande team",
    "Utvecklare – stöd från seniora kollegor", // "seniora" är inte ordet "senior"
    "Leadgenerering och CRM-utvecklare", // "Leadgenerering" är inte "lead"
    "Chefsstöd med systemansvar", // börjar på chef men slutar inte så
    "Systemutvecklare .NET",
  ])("släpper igenom %s", (title) => {
    expect(isSeniorTitle(title)).toBe(false);
  });
});
