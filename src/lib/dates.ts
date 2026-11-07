import { format } from "date-fns";
import { sv } from "date-fns/locale";

const DATE_INPUT_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Tolkar ett värde från <input type="date"> ("YYYY-MM-DD").
 * Lagras som kl. 12:00 UTC så att datumet inte förskjuts en dag i någon tidszon (±12 h).
 */
export function parseDateInput(value: string): Date | null {
  if (!DATE_INPUT_PATTERN.test(value)) return null;
  const date = new Date(`${value}T12:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Date → "YYYY-MM-DD" för defaultValue i <input type="date">. */
export function toDateInputValue(date: Date | null | undefined): string {
  return date ? date.toISOString().slice(0, 10) : "";
}

export function formatDate(date: Date | null | undefined): string {
  return date ? format(date, "d MMM yyyy", { locale: sv }) : "–";
}
