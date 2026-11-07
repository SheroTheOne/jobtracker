import { describe, expect, it } from "vitest";
import { applicationFormSchema, readApplicationFormValues, type ApplicationFormValues } from "./application";

const valid: ApplicationFormValues = {
  company: "  Acme AB ",
  role: "Fullstackutvecklare",
  url: "",
  jobDescriptionText: "",
  status: "APPLIED",
  appliedDate: "2026-11-01",
  followUpDate: "",
  notes: "",
};

describe("applicationFormSchema", () => {
  it("normaliserar tomma fält till null och trimmar text", () => {
    const result = applicationFormSchema.parse(valid);
    expect(result).toMatchObject({ company: "Acme AB", url: null, notes: null, followUpDate: null });
    expect(result.appliedDate?.toISOString()).toBe("2026-11-01T12:00:00.000Z");
  });

  it("kräver företag och roll", () => {
    const result = applicationFormSchema.safeParse({ ...valid, company: "  ", role: "" });
    expect(result.success).toBe(false);
    const fields = result.error?.issues.map((issue) => issue.path[0]);
    expect(fields).toEqual(expect.arrayContaining(["company", "role"]));
  });

  it("avvisar länkar som inte är http(s)", () => {
    expect(applicationFormSchema.safeParse({ ...valid, url: "javascript:alert(1)" }).success).toBe(false);
    expect(applicationFormSchema.safeParse({ ...valid, url: "https://jobb.se/123" }).success).toBe(true);
  });

  it("avvisar ogiltigt datum och okänd status", () => {
    expect(applicationFormSchema.safeParse({ ...valid, appliedDate: "2026-13-45" }).success).toBe(false);
    expect(applicationFormSchema.safeParse({ ...valid, status: "GHOSTED" }).success).toBe(false);
  });
});

describe("readApplicationFormValues", () => {
  it("läser alla fält och ersätter saknade med tom sträng", () => {
    const formData = new FormData();
    formData.set("company", "Acme");
    formData.set("unknown", "ignoreras");
    const values = readApplicationFormValues(formData);
    expect(values.company).toBe("Acme");
    expect(values.notes).toBe("");
    expect(values).not.toHaveProperty("unknown");
  });
});
