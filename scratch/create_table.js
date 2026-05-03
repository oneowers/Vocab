const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "PracticeTranslationChallenge" (
          "id" TEXT NOT NULL,
          "userId" TEXT NOT NULL,
          "russianText" TEXT NOT NULL,
          "userTranslation" TEXT NOT NULL,
          "score" INTEGER NOT NULL,
          "feedbackRu" TEXT NOT NULL,
          "correctedEnglishText" TEXT NOT NULL,
          "mistakes" JSONB NOT NULL,
          "grammarFindings" JSONB NOT NULL DEFAULT '[]',
          "grammarScoreAppliedAt" TIMESTAMP(3),
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

          CONSTRAINT "PracticeTranslationChallenge_pkey" PRIMARY KEY ("id")
      );
    `)
    console.log('Table created or already exists.')

    try {
      await prisma.$executeRawUnsafe(`
        CREATE INDEX "PracticeTranslationChallenge_userId_createdAt_idx" ON "PracticeTranslationChallenge"("userId", "createdAt" DESC);
      `)
      console.log('Index created.')
    } catch (e) {
      console.log('Index might already exist.')
    }

    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "PracticeTranslationChallenge" ADD CONSTRAINT "PracticeTranslationChallenge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      `)
      console.log('Foreign key created.')
    } catch (e) {
      console.log('Foreign key might already exist.')
    }

  } catch (e) {
    console.error('Error creating table:', e)
  } finally {
    await prisma.$disconnect()
  }
}

main()
