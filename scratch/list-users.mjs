
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    const users = await prisma.user.findMany({
      select: { email: true, id: true },
      take: 5
    })
    console.log('Users:', users)
    process.exit(0)
  } catch (error) {
    console.error('Failed to fetch users:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
