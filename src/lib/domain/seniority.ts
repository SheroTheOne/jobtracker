import type { SeniorityLevel } from "@/generated/prisma/enums";

export const SENIORITY_LEVELS = [
  "JUNIOR",
  "MID",
  "SENIOR",
  "LEAD",
  "PRINCIPAL",
] as const satisfies readonly SeniorityLevel[];

export const SENIORITY_LABELS: Record<SeniorityLevel, string> = {
  JUNIOR: "Junior",
  MID: "Mid-level",
  SENIOR: "Senior",
  LEAD: "Lead",
  PRINCIPAL: "Principal",
};
