-- CreateTable
CREATE TABLE "FaqEntry" (
    "id" SERIAL NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "category" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FaqEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FaqEntry_category_idx" ON "FaqEntry"("category");

-- CreateIndex
CREATE INDEX "FaqEntry_displayOrder_idx" ON "FaqEntry"("displayOrder");

-- CreateIndex
CREATE INDEX "FaqEntry_isPublished_idx" ON "FaqEntry"("isPublished");
