import "server-only";
import { io } from "next/cache";
import { cache } from "react";
import { db } from "@/lib/db/client";
import type { SeniorityLevel } from "@/generated/prisma/enums";
import { storedStringListSchema } from "@/lib/validation/string-list";
import type { ProfileInput } from "@/lib/validation/profile";

/** Profil med Json-kolumnerna validerade till riktiga typer. */
export interface Profile {
  id: string;
  fullName: string | null;
  headline: string | null;
  seniority: SeniorityLevel;
  targetRoles: string[];
  coreSkills: string[];
  cvText: string;
  updatedAt: Date;
}

// Enanvändarapp: den äldsta raden är "profilen". upsertProfile skapar aldrig en andra rad.
const OLDEST_FIRST = { orderBy: { createdAt: "asc" } } as const;

/**
 * Dedupliceras per request med React cache: översikten, matchningspanelen m.fl. läser profilen
 * var för sig utan att det blir flera databasfrågor.
 */
export const getProfile = cache(async (): Promise<Profile | null> => {
  await io();
  const row = await db.profile.findFirst(OLDEST_FIRST);
  if (!row) return null;
  return {
    id: row.id,
    fullName: row.fullName,
    headline: row.headline,
    seniority: row.seniority,
    targetRoles: storedStringListSchema.parse(row.targetRoles),
    coreSkills: storedStringListSchema.parse(row.coreSkills),
    cvText: row.cvText,
    updatedAt: row.updatedAt,
  };
});

/** Läs-och-skriv i en transaktion så att två samtidiga första sparningar inte skapar två profiler. */
export async function upsertProfile(input: ProfileInput): Promise<{ id: string }> {
  return db.$transaction(async (tx) => {
    const existing = await tx.profile.findFirst({ ...OLDEST_FIRST, select: { id: true } });
    if (existing) {
      return tx.profile.update({ where: { id: existing.id }, data: input, select: { id: true } });
    }
    return tx.profile.create({ data: input, select: { id: true } });
  });
}
