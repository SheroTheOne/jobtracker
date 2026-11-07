"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { upsertProfile } from "@/lib/data/profile";
import { profileFormSchema, readProfileFormValues, type ProfileFormField } from "@/lib/validation/profile";
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
