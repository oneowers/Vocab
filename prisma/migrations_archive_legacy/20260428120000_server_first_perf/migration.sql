ALTER TABLE "WordCatalog"
ADD COLUMN IF NOT EXISTS "search_vector" tsvector
GENERATED ALWAYS AS (
  setweight(to_tsvector('simple', COALESCE("word", '')), 'A') ||
  setweight(to_tsvector('simple', COALESCE("translation", '')), 'A') ||
  setweight(to_tsvector('simple', COALESCE("topic", '')), 'B') ||
  setweight(to_tsvector('simple', COALESCE("partOfSpeech", '')), 'C')
) STORED;

CREATE INDEX IF NOT EXISTS "idx_card_user_due_added"
ON "Card" ("userId", "nextReviewDate", "dateAdded" DESC);

CREATE INDEX IF NOT EXISTS "idx_card_user_status_due"
ON "Card" ("userId", "lastReviewResult", "nextReviewDate");

CREATE INDEX IF NOT EXISTS "idx_reviewlog_user_created_desc"
ON "ReviewLog" ("userId", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS "idx_reviewlog_created_user"
ON "ReviewLog" ("createdAt" DESC, "userId");

CREATE INDEX IF NOT EXISTS "idx_wordcatalog_pub_level_priority_created"
ON "WordCatalog" ("isPublished", "cefrLevel", "priority" DESC, "createdAt");

CREATE INDEX IF NOT EXISTS "idx_wordcatalog_review_enrichment"
ON "WordCatalog" ("reviewStatus", "enrichmentStatus");

CREATE INDEX IF NOT EXISTS "idx_wordcatalog_search_gin"
ON "WordCatalog" USING GIN ("search_vector");
