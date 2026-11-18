import "server-only";
import { io } from "next/cache";
import { cache } from "react";
import { db } from "@/lib/db/client";
import type { Prisma } from "@/generated/prisma/client";
import type { ApplicationStatus } from "@/generated/prisma/enums";
import { deriveStatusChange, resolveInitialAppliedDate } from "@/lib/domain/status-change";
import type { ApplicationInput } from "@/lib/validation/application";
import { isUniqueConstraintViolation } from "./prisma-errors";

// Läsningar anropar `await io()` först: better-sqlite3 är synkron, och med Cache Components
// skulle resultatet annars bakas in i det statiska skalet vid prerender.

export const APPLICATION_SORTS = ["updated", "applied", "company"] as const;
export type ApplicationSort = (typeof APPLICATION_SORTS)[number];

export interface ApplicationListFilter {
  status?: ApplicationStatus;
  sort?: ApplicationSort;
}

const ORDER_BY: Record<ApplicationSort, Prisma.JobApplicationOrderByWithRelationInput[]> = {
  updated: [{ updatedAt: "desc" }],
  applied: [{ appliedDate: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }],
  company: [{ company: "asc" }, { role: "asc" }],
};

const listItemSelect = {
  id: true,
  company: true,
  role: true,
  status: true,
  appliedDate: true,
  followUpDate: true,
  lastContactAt: true,
  updatedAt: true,
  matchReports: { select: { score: true }, orderBy: { createdAt: "desc" }, take: 1 },
} satisfies Prisma.JobApplicationSelect;

type ListItemRow = Prisma.JobApplicationGetPayload<{ select: typeof listItemSelect }>;

export type ApplicationListItem = Omit<ListItemRow, "matchReports"> & { latestScore: number | null };

function toListItem({ matchReports, ...rest }: ListItemRow): ApplicationListItem {
  return { ...rest, latestScore: matchReports[0]?.score ?? null };
}

export async function listApplications(filter: ApplicationListFilter = {}): Promise<ApplicationListItem[]> {
  await io();
  const rows = await db.jobApplication.findMany({
    where: filter.status ? { status: filter.status } : undefined,
    orderBy: ORDER_BY[filter.sort ?? "updated"],
    select: listItemSelect,
  });
  return rows.map(toListItem);
}

export async function countApplicationsByStatus(): Promise<Record<ApplicationStatus, number>> {
  await io();
  const groups = await db.jobApplication.groupBy({ by: ["status"], _count: { _all: true } });
  const counts: Record<ApplicationStatus, number> = { SAVED: 0, APPLIED: 0, INTERVIEW: 0, OFFER: 0, REJECTED: 0 };
  for (const group of groups) counts[group.status] = group._count._all;
  return counts;
}

/** Dedupliceras per request med React cache – sidan och dess paneler kan anropa den var för sig. */
export const getApplication = cache(async (id: string) => {
  await io();
  return db.jobApplication.findUnique({ where: { id } });
});

export type ApplicationDetail = NonNullable<Awaited<ReturnType<typeof getApplication>>>;

export async function createApplication(input: ApplicationInput) {
  return db.jobApplication.create({
    data: { ...input, appliedDate: resolveInitialAppliedDate(input.status, input.appliedDate) },
    select: { id: true },
  });
}

// Statusändringar läser nuvarande status och skriver härledda fält. Läsning och skrivning sker
// i samma transaktion, så att två samtidiga ändringar inte räknar på samma (inaktuella) status.

/** Uppdatering via formuläret. Statusändringar får samma sidoeffekter som snabbändringen. */
export async function updateApplication(id: string, input: ApplicationInput) {
  return db.$transaction(async (tx) => {
    const current = await tx.jobApplication.findUniqueOrThrow({
      where: { id },
      select: { status: true, appliedDate: true },
    });
    const statusFields = deriveStatusChange({
      from: current.status,
      to: input.status,
      appliedDate: input.appliedDate ?? current.appliedDate,
    });
    return tx.jobApplication.update({
      where: { id },
      // Explicit angivet datum i formuläret vinner över det härledda.
      data: { ...input, ...statusFields, appliedDate: input.appliedDate ?? statusFields.appliedDate ?? null },
      select: { id: true },
    });
  });
}

export async function changeApplicationStatus(id: string, status: ApplicationStatus) {
  return db.$transaction(async (tx) => {
    const current = await tx.jobApplication.findUniqueOrThrow({
      where: { id },
      select: { status: true, appliedDate: true },
    });
    return tx.jobApplication.update({
      where: { id },
      data: deriveStatusChange({ from: current.status, to: status, appliedDate: current.appliedDate }),
      select: { id: true },
    });
  });
}

export async function logApplicationContact(id: string, at: Date = new Date()) {
  return db.jobApplication.update({ where: { id }, data: { lastContactAt: at }, select: { id: true } });
}

export async function deleteApplication(id: string) {
  return db.jobApplication.delete({ where: { id }, select: { id: true } });
}

// ─── Import från externa källor ──────────────────────────────────────────────

export interface ImportApplicationInput {
  source: string;
  externalId: string;
  company: string;
  role: string;
  url: string;
  jobDescriptionText: string;
  notes: string | null;
}

/** Returnerar map externalId → applicationId för annonser som redan importerats. */
export async function findImportedApplications(source: string, externalIds: readonly string[]): Promise<Map<string, string>> {
  await io();
  if (externalIds.length === 0) return new Map();
  const rows = await db.jobApplication.findMany({
    where: { source, externalId: { in: [...externalIds] } },
    select: { id: true, externalId: true },
  });
  return new Map(rows.flatMap((row) => (row.externalId ? [[row.externalId, row.id] as const] : [])));
}

/** Skapar en sparad ansökan från en extern annons. Idempotent: finns den redan returneras befintligt id. */
export async function importApplication(input: ImportApplicationInput): Promise<{ id: string; created: boolean }> {
  try {
    const { id } = await db.jobApplication.create({ data: { ...input, status: "SAVED" }, select: { id: true } });
    return { id, created: true };
  } catch (error) {
    if (!isUniqueConstraintViolation(error)) throw error;
    const existing = await db.jobApplication.findUniqueOrThrow({
      where: { source_externalId: { source: input.source, externalId: input.externalId } },
      select: { id: true },
    });
    return { id: existing.id, created: false };
  }
}
