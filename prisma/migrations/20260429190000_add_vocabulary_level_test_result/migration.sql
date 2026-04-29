-- Store the Phase 2 vocabulary level test result on the user profile.

ALTER TYPE "OnboardingStep" ADD VALUE 'FIRST_WORDS';

ALTER TABLE "User"
ADD COLUMN "levelTestEstimatedLevel" "CefrLevel",
ADD COLUMN "levelTestConfidence" JSONB,
ADD COLUMN "levelTestCompletedAt" TIMESTAMP(3),
ADD COLUMN "levelTestMistakes" INTEGER,
ADD COLUMN "levelTestCorrect" INTEGER;
