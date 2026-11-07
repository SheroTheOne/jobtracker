"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { runMatchForApplication } from "@/lib/match/run-match";
import type { ActionResult } from "./types";

/** Kör AI-matchning för en ansökan mot den sparade profilen och sparar rapporten. */
export async function runMatchAction(applicationId: string): Promise<ActionResult> {
  const parsedId = z.cuid().safeParse(applicationId);
  if (!parsedId.success) return { ok: false, error: "Ogiltig förfrågan." };

  const result = await runMatchForApplication(parsedId.data);
  if (!result.ok) return result;

  revalidatePath(`/applications/${parsedId.data}`);
  revalidatePath("/applications");
  return { ok: true };
}
