ALTER TABLE "Workshop"
ADD COLUMN "googleCalendarEventId" TEXT,
ADD COLUMN "googleCalendarEventUrl" TEXT,
ADD COLUMN "googleCalendarSyncedAt" TIMESTAMP(3),
ADD COLUMN "googleCalendarSyncError" TEXT;

CREATE UNIQUE INDEX "Workshop_googleCalendarEventId_key" ON "Workshop"("googleCalendarEventId");
