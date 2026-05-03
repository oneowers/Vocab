const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

// List of valid keys from our 42 topics
const validKeys = [
  "to_be", "present_simple", "present_continuous", "plural_nouns", 
  "articles_basic", "prepositions_basic", "there_is_are", "pronouns_possessives", 
  "word_order_basic", "past_simple", "past_continuous", "future_simple", 
  "going_to", "countable_uncountable", "comparatives_superlatives", "modal_can_should_must", 
  "adverbs_basic", "present_perfect", "conditionals_0_1", "gerund_infinitive_basic", 
  "passive_voice_basic", "reported_speech_basic", "present_perfect_continuous", "past_perfect", 
  "conditionals_2_3", "passive_voice_advanced", "relative_clauses", "modal_perfect", 
  "inversion_basic", "subjunctive", "cleft_sentences", "participle_clauses", 
  "future_continuous", "future_perfect", "past_perfect_continuous", "mixed_conditionals", 
  "wishes_regrets", "phrasal_verbs_intro", "reported_questions_commands", "used_to_would", 
  "stative_verbs", "linking_words"
]

async function cleanup() {
  console.log("Cleaning up old grammar topics...")
  
  const allTopics = await prisma.grammarTopic.findMany({
    select: { id: true, key: true }
  })
  
  const toDelete = allTopics.filter(t => !validKeys.includes(t.key))
  
  if (toDelete.length === 0) {
    console.log("No old topics to delete.")
    return
  }
  
  console.log(`Found ${toDelete.length} old/duplicate topics. Deleting...`)
  for (const t of toDelete) {
    console.log(`- Deleting: ${t.key}`)
    try {
      await prisma.grammarTopic.delete({ where: { id: t.id } })
    } catch (err) {
      console.error(`Failed to delete ${t.key}: might have dependencies.`)
    }
  }
  
  console.log("Cleanup finished!")
}

cleanup().finally(() => prisma.$disconnect())
