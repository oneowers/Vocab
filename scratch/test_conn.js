const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log("Testing connection...")
  try {
    const userCount = await prisma.user.count()
    console.log("Connection successful! Total users:", userCount)
  } catch (e) {
    console.error("Connection failed:", e)
  }
}

main().finally(() => prisma.$disconnect())
