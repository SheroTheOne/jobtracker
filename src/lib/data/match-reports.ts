import "server-only";
import { createHash } from "node:crypto";
import { io } from "next/cache";
import { db } from "@/lib/db/client";
import {
  MATCH_ANALYSIS_SCHEMA_VERSION,
  storedMatchAnalysisSchema,
  type StoredMatchAnalysis,
} from "@/lib/ai/schemas/match-analysis";

/** Fingeravtryck av CV-texten – avgör om en rapport baseras på ett äldre CV. */
export function hashCv(cvText: string): string {
  return createHash("sha256").update(cvText.trim()).digest("hex");
}

export type MatchReportView =
  | {
      kind: "ok";
      id: string;
      score: number;
      model: string;
      createdAt: Date;
      cvSnapshotHash: string;
      analysis: StoredMatchAnalysis;
    }
  /** Sparad med ett äldre schema eller korrupt – visas som "kör om" i stället för att krascha sidan. */
  | { kind: "outdated"; id: string; score: number; createdAt: Date };

export interface MatchReportSummary {
  id: string;
  score: number;
  createdAt: Date;
}

export async function getLatestMatchReport(applicationId: string): Promise<MatchReportView | null> {
  await io();
  const row = await db.matchReport.findFirst({
    where: { applicationId },
    orderBy: { createdAt: "desc" },
  });
  if (!row) return null;

  const parsed = storedMatchAnalysisSchema.safeParse(row.analysis);
  if (row.schemaVersion !== MATCH_ANALYSIS_SCHEMA_VERSION || !parsed.success) {
    return { kind: "outdated", id: row.id, score: row.score, createdAt: row.createdAt };
  }
  return {
    kind: "ok",
    id: row.id,
    score: row.score,
    model: row.model,
    createdAt: row.createdAt,
    cvSnapshotHash: row.cvSnapshotHash,
    analysis: parsed.data,
  };
}

export async function listMatchReportHistory(applicationId: string): Promise<MatchReportSummary[]> {
  await io();
  return db.matchReport.findMany({
    where: { applicationId },
    orderBy: { createdAt: "desc" },
    select: { id: true, score: true, createdAt: true },
  });
}

export interface CreateMatchReportInput {
  applicationId: string;
  analysis: StoredMatchAnalysis;
  score: number;
  model: string;
  cvText: string;
}

export async function createMatchReport(input: CreateMatchReportInput): Promise<{ id: string }> {
  return db.matchReport.create({
    data: {
      applicationId: input.applicationId,
      analysis: input.analysis,
      score: input.score,
      model: input.model,
      schemaVersion: MATCH_ANALYSIS_SCHEMA_VERSION,
      cvSnapshotHash: hashCv(input.cvText),
    },
    select: { id: true },
  });
}
