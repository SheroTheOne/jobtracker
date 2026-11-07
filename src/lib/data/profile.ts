import "server-only";
import { io } from "next/cache";
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
async function findProfileRow() {
  return db.profile.findFirst({ orderBy: { createdAt: "asc" } });
}

export async function getProfile(): Promise<Profile | null> {
  await io();
  const row = await findProfileRow();
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
}

export async function upsertProfile(input: ProfileInput): Promise<{ id: string }> {
  const existing = await findProfileRow();
  if (existing) {
    return db.profile.update({ where: { id: existing.id }, data: input, select: { id: true } });
  }
  return db.profile.create({ data: input, select: { id: true } });
}
