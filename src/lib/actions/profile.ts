"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { suggestProfileFromCv, type ProfileSuggestion } from "@/lib/ai/extract-profile";
import { extractCvText } from "@/lib/cv/extract-text";
import { upsertProfile } from "@/lib/data/profile";
import {
  CV_MAX_LENGTH,
  profileFormSchema,
  readProfileFormValues,
  type ProfileFormField,
} from "@/lib/validation/profile";
import type { FormState } from "./types";

export type ProfileFormState = FormState<ProfileFormField>;

export async function saveProfileAction(_prev: ProfileFormState, formData: FormData): Promise<ProfileFormState> {
  const values = readProfileFormValues(formData);
  const parsed = profileFormSchema.safeParse(values);

  if (!parsed.success) {
    return {
      status: "error",
      message: "Kontrollera de markerade fälten.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
      values,
    };
  }

  try {
    await upsertProfile(parsed.data);
  } catch (error) {
    console.error("[actions/profile] save", error);
    return { status: "error", message: "Profilen kunde inte sparas. Försök igen.", fieldErrors: {}, values };
  }

  // Layout-nivå: översikten och ansökningssidorna visar om profil saknas.
  revalidatePath("/", "layout");
  return { status: "success", message: "Profilen är sparad.", savedAt: Date.now() };
}

export type CvUploadResult =
  | {
      ok: true;
      fileName: string;
      text: string;
      /** AI-förslag på profilfält – saknas om AI inte är tillgänglig eller misslyckades. */
      suggestion: ProfileSuggestion | null;
      suggestionError: string | null;
    }
  | { ok: false; error: string };

/** Läser ett uppladdat CV och föreslår profilfält. Sparar inget – användaren granskar först. */
export async function uploadCvAction(formData: FormData): Promise<CvUploadResult> {
  const file = formData.get("file");
  if (!(file instanceof File)) return { ok: false, error: "Ingen fil valdes." };

  const extracted = await extractCvText(file);
  if (!extracted.ok) return extracted;

  const suggestion = await suggestProfileFromCv(extracted.text);
  return {
    ok: true,
    fileName: file.name,
    text: extracted.text.slice(0, CV_MAX_LENGTH),
    suggestion: suggestion.ok ? suggestion.value : null,
    suggestionError: suggestion.ok ? null : suggestion.error.message,
  };
}
