const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function check() {
  console.log("Scanning Grammar Topics for missing data...")
  const topics = await prisma.grammarTopic.findMany()
  
  const incomplete = topics.filter(t => !t.formulas || !t.usage || !t.examples)
  
  if (incomplete.length === 0) {
    console.log("All topics look good!")
  } else {
    console.log(`Found ${incomplete.length} topics with missing data:`)
    incomplete.forEach(t => {
      console.log(`- ${t.key} (${t.titleEn}): Formulas: ${!!t.formulas}, Usage: ${!!t.usage}, Examples: ${!!t.examples}`)
    })
  }
}

check().finally(() => prisma.$disconnect())
