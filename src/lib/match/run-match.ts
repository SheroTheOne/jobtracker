import "server-only";
import { analyzeMatch } from "@/lib/ai/analyze-match";
import { getApplication } from "@/lib/data/applications";
import { createMatchReport } from "@/lib/data/match-reports";
import { getProfile } from "@/lib/data/profile";
import { canAnalyzeJobDescription } from "@/lib/domain/job-description";

export type RunMatchResult = { ok: true; score: number } | { ok: false; error: string };

/**
 * Orkestrerar en matchning: hämtar ansökan och profil, kör AI-analysen och sparar rapporten.
 * Delas av "Matcha mot CV" och "Spara & matcha" från jobbsökningen.
 */
export async function runMatchForApplication(applicationId: string): Promise<RunMatchResult> {
  const [application, profile] = await Promise.all([getApplication(applicationId), getProfile()]);
  if (!application) return { ok: false, error: "Ansökan finns inte längre." };
  if (!profile) return { ok: false, error: "Lägg in ditt CV under Profil först." };

  const jobDescription = application.jobDescriptionText?.trim() ?? "";
  if (!canAnalyzeJobDescription(jobDescription)) {
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
    console.error("[match/run-match] save", error);
    return { ok: false, error: "Analysen lyckades men kunde inte sparas. Försök igen." };
  }
  return { ok: true, score: result.value.score };
}
