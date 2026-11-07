-- CreateTable
CREATE TABLE "Profile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fullName" TEXT,
    "headline" TEXT,
    "cvText" TEXT NOT NULL,
    "coreSkills" JSONB NOT NULL,
    "targetRoles" JSONB NOT NULL,
    "seniority" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "JobApplication" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "company" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "url" TEXT,
    "jobDescriptionText" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SAVED',
    "appliedDate" DATETIME,
    "followUpDate" DATETIME,
    "lastContactAt" DATETIME,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "MatchReport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "applicationId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "analysis" JSONB NOT NULL,
    "schemaVersion" INTEGER NOT NULL DEFAULT 1,
    "model" TEXT NOT NULL,
    "cvSnapshotHash" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MatchReport_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "JobApplication" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "JobApplication_status_idx" ON "JobApplication"("status");

-- CreateIndex
CREATE INDEX "JobApplication_followUpDate_idx" ON "JobApplication"("followUpDate");

-- CreateIndex
CREATE INDEX "MatchReport_applicationId_createdAt_idx" ON "MatchReport"("applicationId", "createdAt");
