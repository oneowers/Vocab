
import bcrypt from "bcryptjs"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  const email = 'admin@localhost'
  const password = 'any' // Just to test if it gets past the findUnique and bcrypt.compare
  
  try {
    console.log('Finding user...')
    const user = await prisma.user.findUnique({ where: { email } })
    console.log('User found:', user ? 'Yes' : 'No')
    
    if (user && user.passwordHash) {
      console.log('Comparing password...')
      const isValid = await bcrypt.compare(password, user.passwordHash)
      console.log('Password valid:', isValid)
    }
    
    process.exit(0)
  } catch (error) {
    console.error('Login logic failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
