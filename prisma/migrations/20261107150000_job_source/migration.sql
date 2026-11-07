-- AlterTable
ALTER TABLE "JobApplication" ADD COLUMN "externalId" TEXT;
ALTER TABLE "JobApplication" ADD COLUMN "source" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "JobApplication_source_externalId_key" ON "JobApplication"("source", "externalId");

