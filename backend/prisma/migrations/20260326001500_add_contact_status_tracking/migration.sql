CREATE TYPE "ContactStatus" AS ENUM ('NEW', 'IN_PROGRESS', 'RESOLVED', 'ARCHIVED');

ALTER TABLE "Contact"
ADD COLUMN "status" "ContactStatus" NOT NULL DEFAULT 'NEW',
ADD COLUMN "adminNotes" TEXT,
ADD COLUMN "handledAt" TIMESTAMP(3),
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE "Contact"
SET "updatedAt" = "createdAt"
WHERE "updatedAt" <> "createdAt";

CREATE INDEX "Contact_status_idx" ON "Contact"("status");
CREATE INDEX "Contact_updatedAt_idx" ON "Contact"("updatedAt");
