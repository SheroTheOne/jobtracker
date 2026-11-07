import { differenceInCalendarDays } from "date-fns";
import type { ApplicationStatus } from "@/generated/prisma/enums";
import { ACTIVE_STATUSES } from "./application-status";

export const FOLLOW_UP_AFTER_DAYS = 7;

export interface FollowUpInput {
  status: ApplicationStatus;
  appliedDate: Date | null;
  lastContactAt: Date | null;
  followUpDate: Date | null;
}

export type FollowUpState =
  | { needsFollowUp: false }
  | { needsFollowUp: true; reason: "REMINDER_DUE"; daysOverdue: number }
  | { needsFollowUp: true; reason: "NO_RECENT_CONTACT"; daysSinceContact: number };

const NOT_NEEDED: FollowUpState = { needsFollowUp: false };

/** Senaste kända kontaktpunkten: den senare av lastContactAt och appliedDate. */
export function getLastTouchpoint({
  appliedDate,
  lastContactAt,
}: Pick<FollowUpInput, "appliedDate" | "lastContactAt">): Date | null {
  if (appliedDate && lastContactAt) {
    return appliedDate > lastContactAt ? appliedDate : lastContactAt;
  }
  return lastContactAt ?? appliedDate;
}

/**
 * Avgör om en ansökan behöver följas upp.
 *
 * Regler (i prioritetsordning):
 * 1. Endast aktiva statusar (APPLIED, INTERVIEW) kan behöva uppföljning.
 * 2. En manuell påminnelse (followUpDate) styr: passerad → uppföljning, framtida → vänta.
 * 3. Annars: mer än FOLLOW_UP_AFTER_DAYS kalenderdagar sedan senaste kontakt.
 */
export function getFollowUpState(input: FollowUpInput, now: Date = new Date()): FollowUpState {
  if (!ACTIVE_STATUSES.has(input.status)) return NOT_NEEDED;

  if (input.followUpDate) {
    const daysOverdue = differenceInCalendarDays(now, input.followUpDate);
    return daysOverdue >= 0 ? { needsFollowUp: true, reason: "REMINDER_DUE", daysOverdue } : NOT_NEEDED;
  }

  const touchpoint = getLastTouchpoint(input);
  if (!touchpoint) return NOT_NEEDED;

  const daysSinceContact = differenceInCalendarDays(now, touchpoint);
  return daysSinceContact > FOLLOW_UP_AFTER_DAYS
    ? { needsFollowUp: true, reason: "NO_RECENT_CONTACT", daysSinceContact }
    : NOT_NEEDED;
}

export function describeFollowUp(state: FollowUpState): string | null {
  if (!state.needsFollowUp) return null;
  if (state.reason === "REMINDER_DUE") {
    return state.daysOverdue === 0 ? "Påminnelse idag" : `Påminnelse passerad (${state.daysOverdue} d)`;
  }
  return `Ingen kontakt på ${state.daysSinceContact} dagar`;
}
