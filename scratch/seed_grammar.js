const { PrismaClient } = require("@prisma/client")
const prisma = new PrismaClient()

async function main() {
  const topics = [
    {
      key: "present_simple",
      titleEn: "Present Simple",
      titleRu: "Настоящее простое",
      category: "Tenses",
      cefrLevel: "A1",
      description: "Habits, facts, routines, and general truths."
    },
    {
      key: "present_continuous",
      titleEn: "Present Continuous",
      titleRu: "Настоящее продолженное",
      category: "Tenses",
      cefrLevel: "A2",
      description: "Actions happening now or temporary situations."
    },
    {
      key: "past_simple",
      titleEn: "Past Simple",
      titleRu: "Прошедшее простое",
      category: "Tenses",
      cefrLevel: "A2",
      description: "Finished actions in the past."
    },
    {
      key: "past_continuous",
      titleEn: "Past Continuous",
      titleRu: "Прошедшее продолженное",
      category: "Tenses",
      cefrLevel: "B1",
      description: "Actions in progress at a specific time in the past."
    }
  ]

  for (const topic of topics) {
    await prisma.grammarTopic.upsert({
      where: { key: topic.key },
      update: topic,
      create: topic
    })
  }

  console.log("Grammar topics seeded!")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
