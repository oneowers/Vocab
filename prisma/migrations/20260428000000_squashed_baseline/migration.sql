-- Squashed baseline recreated from prisma/schema.prisma on 2026-04-29.
-- This migration is safe for empty databases and also preserves the custom
-- WordCatalog search_vector optimization that existed in legacy history.

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'PRO', 'ADMIN');

-- CreateEnum
CREATE TYPE "CefrLevel" AS ENUM ('A1', 'A2', 'B1', 'B2', 'C1', 'C2');

-- CreateEnum
CREATE TYPE "CatalogEnrichmentStatus" AS ENUM ('pending', 'completed', 'failed');

-- CreateEnum
CREATE TYPE "CatalogReviewStatus" AS ENUM ('draft', 'approved');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "avatarUrl" TEXT,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "cefrLevel" "CefrLevel" NOT NULL DEFAULT 'A1',
    "reviewLives" INTEGER NOT NULL DEFAULT 3,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastActiveAt" TIMESTAMP(3),
    "streak" INTEGER NOT NULL DEFAULT 0,
    "lastReviewDate" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Card" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "catalogWordId" TEXT,
    "original" TEXT,
    "translation" TEXT,
    "translationAlternatives" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "direction" TEXT NOT NULL,
    "example" TEXT,
    "phonetic" TEXT,
    "dateAdded" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nextReviewDate" TEXT NOT NULL,
    "lastReviewResult" TEXT NOT NULL DEFAULT 'unknown',
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "correctCount" INTEGER NOT NULL DEFAULT 0,
    "wrongCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Card_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "result" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReviewLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppAnalytics" (
    "id" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "totalSessions" INTEGER NOT NULL DEFAULT 0,
    "totalReviews" INTEGER NOT NULL DEFAULT 0,
    "newUsers" INTEGER NOT NULL DEFAULT 0,
    "newCards" INTEGER NOT NULL DEFAULT 0,
    "activeUsersD1" INTEGER NOT NULL DEFAULT 0,
    "activeUsersD7" INTEGER NOT NULL DEFAULT 0,
    "activeUsersD30" INTEGER NOT NULL DEFAULT 0,
    "wrongByA1" INTEGER NOT NULL DEFAULT 0,
    "wrongByA2" INTEGER NOT NULL DEFAULT 0,
    "wrongByB1" INTEGER NOT NULL DEFAULT 0,
    "wrongByB2" INTEGER NOT NULL DEFAULT 0,
    "wrongByC1" INTEGER NOT NULL DEFAULT 0,
    "wrongByC2" INTEGER NOT NULL DEFAULT 0,
    "catalogClaimsToday" INTEGER NOT NULL DEFAULT 0,
    "catalogVsCustomRatio" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "AppAnalytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PracticeSessionProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "cardIds" TEXT[],
    "completedStages" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "activeStage" TEXT NOT NULL,
    "selectedStatus" TEXT NOT NULL DEFAULT 'All',
    "flow" TEXT NOT NULL DEFAULT 'linked',
    "state" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PracticeSessionProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WordCatalog" (
    "id" TEXT NOT NULL,
    "word" TEXT NOT NULL,
    "translation" TEXT NOT NULL,
    "translationAlternatives" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "cefrLevel" "CefrLevel" NOT NULL,
    "partOfSpeech" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "example" TEXT NOT NULL,
    "phonetic" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "source" TEXT,
    "sourceRef" TEXT,
    "enrichmentStatus" "CatalogEnrichmentStatus" NOT NULL DEFAULT 'completed',
    "reviewStatus" "CatalogReviewStatus" NOT NULL DEFAULT 'approved',
    "lastEnrichedAt" TIMESTAMP(3),
    "enrichmentError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WordCatalog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserCatalogWord" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "wordCatalogId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserCatalogWord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppSettings" (
    "id" TEXT NOT NULL DEFAULT 'app',
    "dailyNewCardsLimit" INTEGER NOT NULL DEFAULT 5,
    "reviewLives" INTEGER NOT NULL DEFAULT 3,
    "cefrProfilerEnabled" BOOLEAN NOT NULL DEFAULT true,
    "translationProvider" TEXT NOT NULL DEFAULT 'auto',
    "translationPriority" TEXT[] DEFAULT ARRAY['catalog', 'deepl', 'langeek']::TEXT[],
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Card_userId_catalogWordId_idx" ON "Card"("userId", "catalogWordId");

-- CreateIndex
CREATE INDEX "idx_card_user_due_added" ON "Card"("userId", "nextReviewDate", "dateAdded" DESC);

-- CreateIndex
CREATE INDEX "idx_card_user_status_due" ON "Card"("userId", "lastReviewResult", "nextReviewDate");

-- CreateIndex
CREATE INDEX "idx_reviewlog_user_created_desc" ON "ReviewLog"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "idx_reviewlog_created_user" ON "ReviewLog"("createdAt" DESC, "userId");

-- CreateIndex
CREATE UNIQUE INDEX "AppAnalytics_date_key" ON "AppAnalytics"("date");

-- CreateIndex
CREATE UNIQUE INDEX "PracticeSessionProgress_userId_key" ON "PracticeSessionProgress"("userId");

-- CreateIndex
CREATE INDEX "PracticeSessionProgress_userId_updatedAt_idx" ON "PracticeSessionProgress"("userId", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "WordCatalog_word_key" ON "WordCatalog"("word");

-- CreateIndex
CREATE INDEX "idx_wordcatalog_pub_level_priority_created" ON "WordCatalog"("isPublished", "cefrLevel", "priority" DESC, "createdAt");

-- CreateIndex
CREATE INDEX "idx_wordcatalog_review_enrichment" ON "WordCatalog"("reviewStatus", "enrichmentStatus");

-- CreateIndex
CREATE INDEX "WordCatalog_source_sourceRef_idx" ON "WordCatalog"("source", "sourceRef");

-- CreateIndex
CREATE INDEX "UserCatalogWord_userId_createdAt_idx" ON "UserCatalogWord"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "UserCatalogWord_userId_wordCatalogId_key" ON "UserCatalogWord"("userId", "wordCatalogId");

-- AddForeignKey
ALTER TABLE "Card" ADD CONSTRAINT "Card_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Card" ADD CONSTRAINT "Card_catalogWordId_fkey" FOREIGN KEY ("catalogWordId") REFERENCES "WordCatalog"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewLog" ADD CONSTRAINT "ReviewLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PracticeSessionProgress" ADD CONSTRAINT "PracticeSessionProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCatalogWord" ADD CONSTRAINT "UserCatalogWord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCatalogWord" ADD CONSTRAINT "UserCatalogWord_wordCatalogId_fkey" FOREIGN KEY ("wordCatalogId") REFERENCES "WordCatalog"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Legacy performance optimization preserved from pre-baseline history.
ALTER TABLE "WordCatalog"
ADD COLUMN IF NOT EXISTS "search_vector" tsvector
GENERATED ALWAYS AS (
  setweight(to_tsvector('simple', COALESCE("word", '')), 'A') ||
  setweight(to_tsvector('simple', COALESCE("translation", '')), 'A') ||
  setweight(to_tsvector('simple', COALESCE("topic", '')), 'B') ||
  setweight(to_tsvector('simple', COALESCE("partOfSpeech", '')), 'C')
) STORED;

CREATE INDEX IF NOT EXISTS "idx_wordcatalog_search_gin"
ON "WordCatalog" USING GIN ("search_vector");
