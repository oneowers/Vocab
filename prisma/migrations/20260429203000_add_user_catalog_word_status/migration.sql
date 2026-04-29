DO $$
BEGIN
  CREATE TYPE "UserCatalogWordStatus" AS ENUM ('ACTIVE', 'KNOWN');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "UserCatalogWord"
ADD COLUMN IF NOT EXISTS "status" "UserCatalogWordStatus" NOT NULL DEFAULT 'ACTIVE';

CREATE INDEX IF NOT EXISTS "UserCatalogWord_userId_status_createdAt_idx"
ON "UserCatalogWord"("userId", "status", "createdAt");
