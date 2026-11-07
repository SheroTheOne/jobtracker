import type { ApplicationStatus } from "@/generated/prisma/enums";
import { SUBMITTED_STATUSES } from "./application-status";

export interface StatusChangeContext {
  from: ApplicationStatus;
  to: ApplicationStatus;
  appliedDate: Date | null;
}

export interface StatusChangeFields {
  status: ApplicationStatus;
  appliedDate?: Date;
  lastContactAt?: Date;
}

/**
 * Sidoeffekter av en statusändring:
 * - Varje faktisk ändring räknas som en kontaktpunkt (lastContactAt = now).
 * - Går man till en inskickad status (APPLIED/INTERVIEW/OFFER) utan appliedDate sätts den till nu.
 */
export function deriveStatusChange(ctx: StatusChangeContext, now: Date = new Date()): StatusChangeFields {
  if (ctx.from === ctx.to) return { status: ctx.to };

  const fields: StatusChangeFields = { status: ctx.to, lastContactAt: now };
  if (SUBMITTED_STATUSES.has(ctx.to) && !ctx.appliedDate) fields.appliedDate = now;
  return fields;
}

/**
 * Vid skapande: en inskickad ansökan utan angivet datum antas vara sökt idag.
 * SAVED och REJECTED (t.ex. avfärdad innan ansökan) får inget automatiskt datum.
 */
export function resolveInitialAppliedDate(
  status: ApplicationStatus,
  appliedDate: Date | null,
  now: Date = new Date(),
): Date | null {
  if (appliedDate) return appliedDate;
  return SUBMITTED_STATUSES.has(status) ? now : null;
}
