import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createMockAnalysis } from "@/lib/ai/mock";
import type { StoredMatchAnalysis } from "@/lib/ai/schemas/match-analysis";
import type { ApplicationInput } from "@/lib/validation/application";
import type { ProfileInput } from "@/lib/validation/profile";
import { setupTestDatabase } from "@/test/test-database";

// Datalagret läser DATABASE_URL vid import – laddas dynamiskt efter att testdatabasen skapats.
let cleanup: () => Promise<void>;
let db: typeof import("@/lib/db/client").db;
let applications: typeof import("./applications");
let profile: typeof import("./profile");
let matchReports: typeof import("./match-reports");
let prismaErrors: typeof import("./prisma-errors");

beforeAll(async () => {
  ({ cleanup } = await setupTestDatabase());
  ({ db } = await import("@/lib/db/client"));
  applications = await import("./applications");
  profile = await import("./profile");
  matchReports = await import("./match-reports");
  prismaErrors = await import("./prisma-errors");
});

afterAll(async () => {
  await cleanup();
});

beforeEach(async () => {
  await db.matchReport.deleteMany();
  await db.jobApplication.deleteMany();
  await db.profile.deleteMany();
});

const baseInput: ApplicationInput = {
  company: "Acme AB",
  role: "Utvecklare",
  url: null,
  jobDescriptionText: null,
  status: "SAVED",
  appliedDate: null,
  followUpDate: null,
  notes: null,
};

const importInput = {
  source: "platsbanken",
  externalId: "12345678",
  company: "Acme AB",
  role: "Utvecklare",
  url: "https://arbetsformedlingen.se/platsbanken/annonser/12345678",
  jobDescriptionText: "Annons",
  notes: null,
};

describe("ansökningar", () => {
  it("SAVED → APPLIED sätter ansökningsdatum och kontakt", async () => {
    const { id } = await applications.createApplication(baseInput);
    await applications.changeApplicationStatus(id, "APPLIED");
    const row = await db.jobApplication.findUniqueOrThrow({ where: { id } });
    expect(row.status).toBe("APPLIED");
    expect(row.appliedDate).toBeInstanceOf(Date);
    expect(row.lastContactAt).toBeInstanceOf(Date);
  });

  it("formuläruppdatering behåller ett explicit angivet ansökningsdatum", async () => {
    const { id } = await applications.createApplication(baseInput);
    const appliedDate = new Date("2026-11-01T12:00:00.000Z");
    await applications.updateApplication(id, { ...baseInput, status: "APPLIED", appliedDate });
    const row = await db.jobApplication.findUniqueOrThrow({ where: { id } });
    expect(row.appliedDate?.toISOString()).toBe(appliedDate.toISOString());
  });

  it("samtidiga statusändringar går igenom utan låsfel", async () => {
    const { id } = await applications.createApplication(baseInput);
    await Promise.all([
      applications.changeApplicationStatus(id, "APPLIED"),
      applications.changeApplicationStatus(id, "INTERVIEW"),
      applications.logApplicationContact(id),
    ]);
    const row = await db.jobApplication.findUniqueOrThrow({ where: { id } });
    expect(["APPLIED", "INTERVIEW"]).toContain(row.status);
    expect(row.appliedDate).toBeInstanceOf(Date);
  });

  it("ändring av en borttagen ansökan ger P2025", async () => {
    const error = await applications.changeApplicationStatus("cnotfound000000000000000", "APPLIED").catch((e: unknown) => e);
    expect(prismaErrors.isRecordNotFound(error)).toBe(true);
  });

  it("import är idempotent – även vid samtidiga anrop", async () => {
    const [a, b] = await Promise.all([applications.importApplication(importInput), applications.importApplication(importInput)]);
    expect(a.id).toBe(b.id);
    expect([a.created, b.created].sort()).toEqual([false, true]);
    expect(await db.jobApplication.count()).toBe(1);

    const imported = await applications.findImportedApplications("platsbanken", ["12345678", "999"]);
    expect([...imported.entries()]).toEqual([["12345678", a.id]]);
  });
});

describe("profil", () => {
  const profileInput: ProfileInput = {
    fullName: "Kim",
    headline: null,
    seniority: "MID",
    targetRoles: ["Utvecklare"],
    coreSkills: ["TypeScript"],
    cvText: "CV ".repeat(100),
  };

  it("samtidiga första sparningar skapar bara en profil", async () => {
    await Promise.all([profile.upsertProfile(profileInput), profile.upsertProfile({ ...profileInput, fullName: "Alex" })]);
    expect(await db.profile.count()).toBe(1);
  });

  it("Json-kolumnerna läses tillbaka som listor", async () => {
    await profile.upsertProfile(profileInput);
    const saved = await profile.getProfile();
    expect(saved).toMatchObject({ fullName: "Kim", targetRoles: ["Utvecklare"], coreSkills: ["TypeScript"] });
  });
});

describe("matchningsrapporter", () => {
  const analysis: StoredMatchAnalysis = {
    ...createMockAnalysis({ cvText: "x", role: "Utvecklare" }),
    matched: [],
  };

  it("sparar och läser tillbaka rapport med promptversion och tokens", async () => {
    const { id } = await applications.createApplication(baseInput);
    await matchReports.createMatchReport({
      applicationId: id,
      analysis,
      score: 42,
      model: "google:gemini-3.5-flash",
      promptVersion: "match-v1",
      usage: { inputTokens: 1200, outputTokens: 300 },
      cvText: "Mitt CV",
    });

    const report = await matchReports.getLatestMatchReport(id);
    expect(report).toMatchObject({
      kind: "ok",
      score: 42,
      promptVersion: "match-v1",
      usage: { inputTokens: 1200, outputTokens: 300 },
    });
  });

  it("korrupt analys visas som inaktuell i stället för att krascha", async () => {
    const { id } = await applications.createApplication(baseInput);
    await db.matchReport.create({
      data: { applicationId: id, score: 10, analysis: { trasig: true }, model: "x", promptVersion: "v0", cvSnapshotHash: "h" },
    });
    expect(await matchReports.getLatestMatchReport(id)).toMatchObject({ kind: "outdated", score: 10 });
  });

  it("rapporter tas bort tillsammans med ansökan (foreign keys är på)", async () => {
    const { id } = await applications.createApplication(baseInput);
    await db.matchReport.create({
      data: { applicationId: id, score: 10, analysis: {}, model: "x", promptVersion: "v0", cvSnapshotHash: "h" },
    });
    await applications.deleteApplication(id);
    expect(await db.matchReport.count()).toBe(0);
  });
});
