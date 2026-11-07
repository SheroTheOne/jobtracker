import { z } from "zod";
import { SENIORITY_LEVELS } from "@/lib/domain/seniority";
import { parseStringList } from "./string-list";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, { error: `Max ${max} tecken` })
    .transform((value) => (value === "" ? null : value));

const stringList = (opts: { min: number; max: number; itemMax: number; label: string }) =>
  z
    .string()
    .transform(parseStringList)
    .pipe(
      z
        .array(z.string().max(opts.itemMax, { error: `Varje ${opts.label} får vara max ${opts.itemMax} tecken` }))
        .min(opts.min, { error: `Ange minst ${opts.min} ${opts.label}` })
        .max(opts.max, { error: `Max ${opts.max} poster` }),
    );

export const CV_MAX_LENGTH = 50_000;

export const profileFormSchema = z.object({
  fullName: optionalText(120),
  headline: optionalText(200),
  seniority: z.enum(SENIORITY_LEVELS, { error: "Välj senioritet" }),
  targetRoles: stringList({ min: 1, max: 20, itemMax: 100, label: "roll" }),
  coreSkills: stringList({ min: 1, max: 60, itemMax: 60, label: "kompetens" }),
  cvText: z
    .string()
    .trim()
    .min(200, { error: "CV:t verkar för kort – klistra in hela texten (minst 200 tecken)" })
    .max(CV_MAX_LENGTH, { error: `Max ${CV_MAX_LENGTH.toLocaleString("sv-SE")} tecken` }),
});

export const PROFILE_FORM_FIELDS = profileFormSchema.keyof().options;

export type ProfileFormField = (typeof PROFILE_FORM_FIELDS)[number];
export type ProfileFormValues = Record<ProfileFormField, string>;
export type ProfileInput = z.output<typeof profileFormSchema>;

export function readProfileFormValues(formData: FormData): ProfileFormValues {
  const entries = PROFILE_FORM_FIELDS.map((field) => {
    const value = formData.get(field);
    return [field, typeof value === "string" ? value : ""] as const;
  });
  return Object.fromEntries(entries) as ProfileFormValues;
}
