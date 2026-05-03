import { PrismaClient } from '@prisma/client';
import { GRAMMAR_TOPICS } from '../lib/grammar-content';

const prisma = new PrismaClient();

async function main() {
  const keys = Object.keys(GRAMMAR_TOPICS);
  console.log(`Migrating ${keys.length} grammar topics to the database...`);

  for (const key of keys) {
    const topic = GRAMMAR_TOPICS[key];
    await prisma.grammarTopic.upsert({
      where: { key: topic.key },
      update: {
        titleEn: topic.titleEn,
        titleRu: topic.titleRu,
        category: topic.category,
        cefrLevel: topic.cefrLevel,
        description: topic.descriptionRu,
        formulas: topic.formulas,
        usage: topic.usage,
        examples: topic.examples,
        commonMistakes: topic.commonMistakes,
        exercises: topic.exercises,
      },
      create: {
        key: topic.key,
        titleEn: topic.titleEn,
        titleRu: topic.titleRu,
        category: topic.category,
        cefrLevel: topic.cefrLevel,
        description: topic.descriptionRu,
        formulas: topic.formulas,
        usage: topic.usage,
        examples: topic.examples,
        commonMistakes: topic.commonMistakes,
        exercises: topic.exercises,
      }
    });
    console.log(`Upserted: ${topic.key}`);
  }
  console.log("Migration complete!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
