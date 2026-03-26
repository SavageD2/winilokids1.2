ALTER TABLE "ParentAccount"
ALTER COLUMN "passwordHash" DROP NOT NULL;

ALTER TABLE "ParentAccount"
ADD COLUMN "googleSubject" TEXT,
ADD COLUMN "googleEmailVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "googleLinkedAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "ParentAccount_googleSubject_key" ON "ParentAccount"("googleSubject");
