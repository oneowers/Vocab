const { PrismaClient } = require("@prisma/client")
const prisma = new PrismaClient()

async function main() {
  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "proUntil" TIMESTAMP(3);`)
    console.log("Added proUntil to User")

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "PromoCode" (
          "id" TEXT NOT NULL,
          "code" TEXT NOT NULL,
          "description" TEXT,
          "maxUses" INTEGER,
          "currentUses" INTEGER NOT NULL DEFAULT 0,
          "expiresAt" TIMESTAMP(3),
          "isActive" BOOLEAN NOT NULL DEFAULT true,
          "proDurationDays" INTEGER NOT NULL DEFAULT 30,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "PromoCode_pkey" PRIMARY KEY ("id")
      );
    `)
    console.log("Created PromoCode table")

    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "PromoCode_code_key" ON "PromoCode"("code");
    `)
    console.log("Created PromoCode index")

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "PromoCodeUsage" (
          "id" TEXT NOT NULL,
          "userId" TEXT NOT NULL,
          "promoCodeId" TEXT NOT NULL,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "PromoCodeUsage_pkey" PRIMARY KEY ("id")
      );
    `)
    console.log("Created PromoCodeUsage table")

    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "PromoCodeUsage_userId_promoCodeId_key" ON "PromoCodeUsage"("userId", "promoCodeId");
    `)
    console.log("Created PromoCodeUsage index")

    // Adding foreign keys. Ignore errors if they already exist.
    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "PromoCodeUsage" ADD CONSTRAINT "PromoCodeUsage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      `)
    } catch (e) {
      console.log("FK userId might exist", e.message)
    }

    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "PromoCodeUsage" ADD CONSTRAINT "PromoCodeUsage_promoCodeId_fkey" FOREIGN KEY ("promoCodeId") REFERENCES "PromoCode"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      `)
    } catch (e) {
      console.log("FK promoCodeId might exist", e.message)
    }

    console.log("Successfully ran all migrations manually")
  } catch (error) {
    console.error("Migration Error:", error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
