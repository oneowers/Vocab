const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log("Adding columns to GrammarTopic...")
  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE "GrammarTopic" ADD COLUMN IF NOT EXISTS "formulas" JSONB;`)
    await prisma.$executeRawUnsafe(`ALTER TABLE "GrammarTopic" ADD COLUMN IF NOT EXISTS "usage" JSONB;`)
    await prisma.$executeRawUnsafe(`ALTER TABLE "GrammarTopic" ADD COLUMN IF NOT EXISTS "commonMistakes" JSONB;`)
    await prisma.$executeRawUnsafe(`ALTER TABLE "GrammarTopic" ADD COLUMN IF NOT EXISTS "exercises" JSONB;`)
    console.log("Columns added successfully!")
  } catch (e) {
    console.error("Error:", e)
  }
}

main().finally(() => prisma.$disconnect())
