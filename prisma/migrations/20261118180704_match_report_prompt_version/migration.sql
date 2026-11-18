-- Delar upp den gamla "leverantör:modell@promptversion"-strängen i model + promptVersion.
-- Rapporter utan "@" (borde inte finnas) får promptVersion "unknown".
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_MatchReport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "applicationId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "analysis" JSONB NOT NULL,
    "schemaVersion" INTEGER NOT NULL DEFAULT 1,
    "model" TEXT NOT NULL,
    "promptVersion" TEXT NOT NULL,
    "inputTokens" INTEGER,
    "outputTokens" INTEGER,
    "cvSnapshotHash" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MatchReport_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "JobApplication" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_MatchReport" ("analysis", "applicationId", "createdAt", "cvSnapshotHash", "id", "model", "promptVersion", "schemaVersion", "score")
SELECT
    "analysis", "applicationId", "createdAt", "cvSnapshotHash", "id",
    CASE WHEN instr("model", '@') > 0 THEN substr("model", 1, instr("model", '@') - 1) ELSE "model" END,
    CASE WHEN instr("model", '@') > 0 THEN substr("model", instr("model", '@') + 1) ELSE 'unknown' END,
    "schemaVersion", "score"
FROM "MatchReport";
DROP TABLE "MatchReport";
ALTER TABLE "new_MatchReport" RENAME TO "MatchReport";
CREATE INDEX "MatchReport_applicationId_createdAt_idx" ON "MatchReport"("applicationId", "createdAt");
CREATE INDEX "MatchReport_promptVersion_idx" ON "MatchReport"("promptVersion");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
