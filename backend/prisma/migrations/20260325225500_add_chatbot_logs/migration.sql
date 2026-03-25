-- CreateEnum
CREATE TYPE "ChatbotSourceType" AS ENUM ('FAQ', 'WORKSHOP', 'GUIDANCE', 'FALLBACK');

-- CreateTable
CREATE TABLE "ChatbotMessageLog" (
    "id" SERIAL NOT NULL,
    "message" TEXT NOT NULL,
    "normalizedMessage" TEXT NOT NULL,
    "currentRoute" TEXT,
    "sourceType" "ChatbotSourceType" NOT NULL,
    "fallbackToContact" BOOLEAN NOT NULL DEFAULT false,
    "matchedFaqIds" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "matchedWorkshopIds" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "reply" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatbotMessageLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ChatbotMessageLog_sourceType_idx" ON "ChatbotMessageLog"("sourceType");

-- CreateIndex
CREATE INDEX "ChatbotMessageLog_fallbackToContact_idx" ON "ChatbotMessageLog"("fallbackToContact");

-- CreateIndex
CREATE INDEX "ChatbotMessageLog_createdAt_idx" ON "ChatbotMessageLog"("createdAt");
