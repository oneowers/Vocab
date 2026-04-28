CREATE TABLE "PracticeSessionProgress" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "cardIds" TEXT[] NOT NULL,
  "completedStages" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "activeStage" TEXT NOT NULL,
  "selectedStatus" TEXT NOT NULL DEFAULT 'All',
  "flow" TEXT NOT NULL DEFAULT 'linked',
  "state" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PracticeSessionProgress_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PracticeSessionProgress_userId_key" ON "PracticeSessionProgress"("userId");
CREATE INDEX "PracticeSessionProgress_userId_updatedAt_idx" ON "PracticeSessionProgress"("userId", "updatedAt");

ALTER TABLE "PracticeSessionProgress" ADD CONSTRAINT "PracticeSessionProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
