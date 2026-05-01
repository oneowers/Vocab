const { PrismaClient } = require("@prisma/client")
const prisma = new PrismaClient()

async function main() {
  try {
    const newCode = await prisma.promoCode.create({
      data: {
        code: "FREEMONTH",
        description: "Первый месяц бесплатно",
        maxUses: 1,
        proDurationDays: 30
      }
    })
    console.log("Success:", newCode)
  } catch (error) {
    console.error("Prisma Error:", error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
