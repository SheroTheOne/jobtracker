"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { importApplication } from "@/lib/data/applications";
import { formatDate } from "@/lib/dates";
import { JobSourceError, PLATSBANKEN_SOURCE, getJobAd, type JobAd } from "@/lib/jobs/platsbanken";
import { parsePlatsbankenAdId } from "@/lib/jobs/platsbanken-url";
import { runMatchForApplication } from "@/lib/match/run-match";

export type ImportJobResult =
  | { ok: true; applicationId: string; alreadySaved: boolean; matchError?: string; score?: number }
  | { ok: false; error: string };

const adIdSchema = z.string().regex(/^\d{1,15}$/);
const modeSchema = z.enum(["save", "match"]);

function buildNotes(ad: JobAd): string {
  const lines = [
    "Importerad från Platsbanken.",
    ad.location && `Ort: ${ad.location}`,
    ad.employmentType && `Anställningsform: ${ad.employmentType}`,
    ad.deadline && `Sista ansökningsdag: ${formatDate(ad.deadline)}`,
  ];
  return lines.filter(Boolean).join("\n");
}

/**
 * Sparar en Platsbanken-annons som ansökan och kör valfritt AI-matchning direkt.
 * Annonsen hämtas på nytt från API:t – klienten skickar bara id, så innehållet kan inte manipuleras.
 */
export async function importJobAction(adId: string, mode: string): Promise<ImportJobResult> {
  const parsedId = adIdSchema.safeParse(adId);
  const parsedMode = modeSchema.safeParse(mode);
  if (!parsedId.success || !parsedMode.success) return { ok: false, error: "Ogiltig förfrågan." };
  return importAd(parsedId.data, parsedMode.data);
}

/** Importerar från en inklistrad Platsbanken-länk (eller ett annons-id). */
export async function importJobFromUrlAction(url: string): Promise<ImportJobResult> {
  const adId = typeof url === "string" ? parsePlatsbankenAdId(url) : null;
  if (!adId) {
    return {
      ok: false,
      error: "Känner inte igen länken. Den ska se ut som arbetsformedlingen.se/platsbanken/annonser/12345678.",
    };
  }
  return importAd(adId, "save");
}

async function importAd(adId: string, mode: z.infer<typeof modeSchema>): Promise<ImportJobResult> {
  let ad: JobAd;
  try {
    ad = await getJobAd(adId);
  } catch (error) {
    return { ok: false, error: error instanceof JobSourceError ? error.message : "Kunde inte hämta annonsen." };
  }

  let imported: { id: string; created: boolean };
  try {
    imported = await importApplication({
      source: PLATSBANKEN_SOURCE,
      externalId: ad.id,
      company: ad.employer,
      role: ad.title,
      url: ad.url,
      jobDescriptionText: ad.description,
      notes: buildNotes(ad),
    });
  } catch (error) {
    console.error("[actions/jobs] import", error);
    return { ok: false, error: "Annonsen kunde inte sparas. Försök igen." };
  }

  revalidatePath("/", "layout");
  const base = { ok: true as const, applicationId: imported.id, alreadySaved: !imported.created };
  if (mode === "save") return base;

  const match = await runMatchForApplication(imported.id);
  return match.ok ? { ...base, score: match.score } : { ...base, matchError: match.error };
}
