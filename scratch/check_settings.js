const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  try {
    const settings = await prisma.appSettings.findUnique({ where: { id: 'app' } })
    console.log('Current settings in DB:', JSON.stringify(settings, null, 2))
  } catch (error) {
    console.error('Error fetching settings:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
