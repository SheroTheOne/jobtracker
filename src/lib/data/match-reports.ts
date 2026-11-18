import "server-only";
import { io } from "next/cache";
import type { TokenUsage } from "@/lib/ai/generate-structured";
import { db } from "@/lib/db/client";
import { hashCv } from "@/lib/domain/cv-fingerprint";
import {
  MATCH_ANALYSIS_SCHEMA_VERSION,
  storedMatchAnalysisSchema,
  type StoredMatchAnalysis,
} from "@/lib/ai/schemas/match-analysis";

export type MatchReportView =
  | {
      kind: "ok";
      id: string;
      score: number;
      model: string;
      promptVersion: string;
      usage: TokenUsage;
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
    promptVersion: row.promptVersion,
    usage: { inputTokens: row.inputTokens, outputTokens: row.outputTokens },
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
  promptVersion: string;
  usage: TokenUsage;
  cvText: string;
}

export async function createMatchReport(input: CreateMatchReportInput): Promise<{ id: string }> {
  return db.matchReport.create({
    data: {
      applicationId: input.applicationId,
      analysis: input.analysis,
      score: input.score,
      model: input.model,
      promptVersion: input.promptVersion,
      inputTokens: input.usage.inputTokens,
      outputTokens: input.usage.outputTokens,
      schemaVersion: MATCH_ANALYSIS_SCHEMA_VERSION,
      cvSnapshotHash: hashCv(input.cvText),
    },
    select: { id: true },
  });
}
