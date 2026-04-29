-- Additive onboarding fields for Phase 1.

CREATE TYPE "LearningGoal" AS ENUM ('IELTS', 'WORK', 'DAILY_ENGLISH', 'TRAVEL', 'OTHER');

CREATE TYPE "OnboardingStep" AS ENUM ('QUESTIONS', 'LEVEL_TEST', 'COMPLETED');

ALTER TABLE "User"
ADD COLUMN "learningGoal" "LearningGoal",
ADD COLUMN "dailyWordTarget" INTEGER,
ADD COLUMN "onboardingStep" "OnboardingStep" NOT NULL DEFAULT 'QUESTIONS',
ADD COLUMN "onboardingCompletedAt" TIMESTAMP(3);
