import type { ApplicationStatus } from "@/generated/prisma/enums";

/** Ordningen speglar ett typiskt rekryteringsflöde och används för filter och sortering. */
export const APPLICATION_STATUSES = [
  "SAVED",
  "APPLIED",
  "INTERVIEW",
  "OFFER",
  "REJECTED",
] as const satisfies readonly ApplicationStatus[];

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  SAVED: "Sparad",
  APPLIED: "Sökt",
  INTERVIEW: "Intervju",
  OFFER: "Erbjudande",
  REJECTED: "Avslag",
};

/** Statusar där processen pågår och man väntar på motparten – bara dessa kan behöva uppföljning. */
export const ACTIVE_STATUSES: ReadonlySet<ApplicationStatus> = new Set(["APPLIED", "INTERVIEW"]);

/** Statusar som förutsätter att en ansökan har skickats in. */
export const SUBMITTED_STATUSES: ReadonlySet<ApplicationStatus> = new Set(["APPLIED", "INTERVIEW", "OFFER"]);

export function isApplicationStatus(value: unknown): value is ApplicationStatus {
  return typeof value === "string" && (APPLICATION_STATUSES as readonly string[]).includes(value);
}
