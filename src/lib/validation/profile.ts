import { z } from "zod";
import { SENIORITY_LEVELS } from "@/lib/domain/seniority";
import { optionalText, readFormValues } from "./form";
import { parseStringList } from "./string-list";

/** Formulärets gränser – delas med AI-förslaget så att ett förslag alltid går att spara. */
export const PROFILE_LIMITS = {
  fullName: 120,
  headline: 200,
  targetRoles: { min: 1, max: 20, itemMax: 100 },
  coreSkills: { min: 1, max: 60, itemMax: 60 },
  cvText: { min: 200, max: 50_000 },
} as const;

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

export const CV_MAX_LENGTH = PROFILE_LIMITS.cvText.max;

export const profileFormSchema = z.object({
  fullName: optionalText(PROFILE_LIMITS.fullName),
  headline: optionalText(PROFILE_LIMITS.headline),
  seniority: z.enum(SENIORITY_LEVELS, { error: "Välj senioritet" }),
  targetRoles: stringList({ ...PROFILE_LIMITS.targetRoles, label: "roll" }),
  coreSkills: stringList({ ...PROFILE_LIMITS.coreSkills, label: "kompetens" }),
  cvText: z
    .string()
    .trim()
    .min(PROFILE_LIMITS.cvText.min, {
      error: `CV:t verkar för kort – klistra in hela texten (minst ${PROFILE_LIMITS.cvText.min} tecken)`,
    })
    .max(CV_MAX_LENGTH, { error: `Max ${CV_MAX_LENGTH.toLocaleString("sv-SE")} tecken` }),
});

export const PROFILE_FORM_FIELDS = profileFormSchema.keyof().options;

export type ProfileFormField = (typeof PROFILE_FORM_FIELDS)[number];
export type ProfileFormValues = Record<ProfileFormField, string>;
export type ProfileInput = z.output<typeof profileFormSchema>;

export function readProfileFormValues(formData: FormData): ProfileFormValues {
  return readFormValues(formData, PROFILE_FORM_FIELDS);
}
