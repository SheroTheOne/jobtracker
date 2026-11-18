import { z } from "zod";
import { parseDateInput } from "@/lib/dates";
import { APPLICATION_STATUSES } from "@/lib/domain/application-status";
import { optionalText, readFormValues } from "./form";

const optionalDate = z
  .string()
  .trim()
  .transform((value, ctx): Date | null => {
    if (value === "") return null;
    const date = parseDateInput(value);
    if (!date) {
      ctx.addIssue({ code: "custom", message: "Ogiltigt datum" });
      return z.NEVER;
    }
    return date;
  });

const optionalUrl = z
  .string()
  .trim()
  .transform((value) => (value === "" ? null : value))
  .pipe(z.url({ protocol: /^https?$/, error: "Ange en giltig länk (https://…)" }).nullable());

export const applicationFormSchema = z.object({
  company: z.string().trim().min(1, { error: "Ange företag" }).max(200),
  role: z.string().trim().min(1, { error: "Ange roll" }).max(200),
  url: optionalUrl,
  jobDescriptionText: optionalText(50_000),
  status: z.enum(APPLICATION_STATUSES, { error: "Ogiltig status" }),
  appliedDate: optionalDate,
  followUpDate: optionalDate,
  notes: optionalText(10_000),
});

export const APPLICATION_FORM_FIELDS = applicationFormSchema.keyof().options;

export type ApplicationFormField = (typeof APPLICATION_FORM_FIELDS)[number];
/** Rå formulärvärden (strängar) – används även för att återfylla formuläret vid fel. */
export type ApplicationFormValues = Record<ApplicationFormField, string>;
/** Validerad och normaliserad data, redo för dataåtkomstlagret. */
export type ApplicationInput = z.output<typeof applicationFormSchema>;

export function readApplicationFormValues(formData: FormData): ApplicationFormValues {
  return readFormValues(formData, APPLICATION_FORM_FIELDS);
}
