"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { analyzeMatch } from "@/lib/ai/analyze-match";
import { getApplication } from "@/lib/data/applications";
import { createMatchReport } from "@/lib/data/match-reports";
import { getProfile } from "@/lib/data/profile";
import type { ActionResult } from "./types";

const JOB_DESCRIPTION_MIN_LENGTH = 100;

/** Kör AI-matchning för en ansökan mot den sparade profilen och sparar rapporten. */
export async function runMatchAction(applicationId: string): Promise<ActionResult> {
  const parsedId = z.cuid().safeParse(applicationId);
  if (!parsedId.success) return { ok: false, error: "Ogiltig förfrågan." };

  const [application, profile] = await Promise.all([getApplication(parsedId.data), getProfile()]);
  if (!application) return { ok: false, error: "Ansökan finns inte längre." };
  if (!profile) return { ok: false, error: "Lägg in ditt CV under Profil först." };

  const jobDescription = application.jobDescriptionText?.trim() ?? "";
  if (jobDescription.length < JOB_DESCRIPTION_MIN_LENGTH) {
    return { ok: false, error: "Annonstexten är för kort. Klistra in hela annonsen under Redigera." };
  }

  const result = await analyzeMatch({
    cvText: profile.cvText,
    jobDescription,
    candidate: { seniority: profile.seniority, targetRoles: profile.targetRoles, coreSkills: profile.coreSkills },
    job: { company: application.company, role: application.role },
  });
  if (!result.ok) return { ok: false, error: result.error.message };

  try {
    await createMatchReport({ applicationId: application.id, cvText: profile.cvText, ...result.value });
  } catch (error) {
    console.error("[actions/match] save", error);
    return { ok: false, error: "Analysen lyckades men kunde inte sparas. Försök igen." };
  }

  revalidatePath(`/applications/${application.id}`);
  revalidatePath("/applications");
  return { ok: true };
}
