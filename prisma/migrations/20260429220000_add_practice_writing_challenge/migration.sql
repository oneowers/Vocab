CREATE TABLE "PracticeWritingChallenge" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "cardIds" TEXT[],
    "targetWords" JSONB NOT NULL,
    "userText" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "levelFeedback" TEXT NOT NULL,
    "usedWords" JSONB NOT NULL,
    "grammarMistakes" JSONB NOT NULL,
    "whatWasGood" TEXT NOT NULL,
    "improvedText" TEXT NOT NULL,
    "nextTask" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PracticeWritingChallenge_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PracticeWritingChallenge_userId_createdAt_idx"
ON "PracticeWritingChallenge"("userId", "createdAt" DESC);

ALTER TABLE "PracticeWritingChallenge"
ADD CONSTRAINT "PracticeWritingChallenge_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
