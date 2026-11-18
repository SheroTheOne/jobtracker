import { z } from "zod";

/** Tom sträng → null, annars trimmad text med maxlängd. */
export const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, { error: `Max ${max.toLocaleString("sv-SE")} tecken` })
    .transform((value) => (value === "" ? null : value));

/**
 * Läser de angivna fälten ur FormData som strängar (filer och saknade fält blir "").
 * Resultatet används både för validering och för att återfylla formuläret vid fel.
 */
export function readFormValues<Field extends string>(formData: FormData, fields: readonly Field[]): Record<Field, string> {
  const entries = fields.map((field) => {
    const value = formData.get(field);
    return [field, typeof value === "string" ? value : ""] as const;
  });
  return Object.fromEntries(entries) as Record<Field, string>;
}
