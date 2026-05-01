const { PrismaClient } = require("@prisma/client")
const prisma = new PrismaClient()

async function main() {
  try {
    const codes = await prisma.promoCode.findMany()
    console.log("Promo codes in DB:", codes)
  } catch (error) {
    console.error("Prisma Error:", error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
