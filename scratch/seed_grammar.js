const { PrismaClient } = require("@prisma/client")
const prisma = new PrismaClient()

async function main() {
  const topics = [
    // A1 - Basics
    {
      key: "to_be",
      titleEn: "Verb 'to be'",
      titleRu: "Глагол 'to be'",
      category: "Basics",
      cefrLevel: "A1",
      description: "Am, is, are in present simple.",
      examples: ["I am a student.", "They are at home."]
    },
    {
      key: "present_simple",
      titleEn: "Present Simple",
      titleRu: "Настоящее простое",
      category: "Tenses",
      cefrLevel: "A1",
      description: "Habits, facts, and routines.",
      examples: ["I study every day.", "He works in an office."]
    },
    {
      key: "present_continuous",
      titleEn: "Present Continuous",
      titleRu: "Настоящее продолженное",
      category: "Tenses",
      cefrLevel: "A1",
      description: "Actions happening right now.",
      examples: ["I am reading a book.", "They are playing football."]
    },
    {
      key: "plural_nouns",
      titleEn: "Plural Nouns",
      titleRu: "Множественное число",
      category: "Nouns",
      cefrLevel: "A1",
      description: "Regular and irregular plural forms.",
      examples: ["Two books", "Three children", "Many people"]
    },
    {
      key: "articles_basic",
      titleEn: "Articles: a/an/the",
      titleRu: "Артикли: a/an/the",
      category: "Basics",
      cefrLevel: "A1",
      description: "Basic use of definite and indefinite articles.",
      examples: ["A dog", "An apple", "The sun"]
    },
    {
      key: "prepositions_basic",
      titleEn: "Prepositions: in/at/on",
      titleRu: "Предлоги: in/at/on",
      category: "Basics",
      cefrLevel: "A1",
      description: "Basic time and place prepositions.",
      examples: ["At 5 o'clock", "In the room", "On Monday"]
    },
    {
      key: "there_is_are",
      titleEn: "There is / There are",
      titleRu: "Конструкция There is / There are",
      category: "Structures",
      cefrLevel: "A1",
      description: "Describing existence and location.",
      examples: ["There is a book on the table.", "There are many trees here."]
    },
    {
      key: "pronouns_possessives",
      titleEn: "Pronouns & Possessives",
      titleRu: "Местоимения",
      category: "Basics",
      cefrLevel: "A1",
      description: "I, me, my, mine and other forms.",
      examples: ["This is my book.", "It belongs to me."]
    },
    {
      key: "word_order_basic",
      titleEn: "Basic Word Order",
      titleRu: "Порядок слов",
      category: "Structures",
      cefrLevel: "A1",
      description: "Subject-Verb-Object and basic question structure.",
      examples: ["I like apples.", "Do you like apples?"]
    },

    // A2 - Expanding
    {
      key: "past_simple",
      titleEn: "Past Simple",
      titleRu: "Прошедшее простое",
      category: "Tenses",
      cefrLevel: "A2",
      description: "Finished actions in the past.",
      examples: ["I went to the cinema yesterday.", "She didn't see me."]
    },
    {
      key: "past_continuous",
      titleEn: "Past Continuous",
      titleRu: "Прошедшее продолженное",
      category: "Tenses",
      cefrLevel: "A2",
      description: "Actions in progress in the past.",
      examples: ["I was sleeping when you called.", "What were they doing?"]
    },
    {
      key: "future_simple",
      titleEn: "Future Simple",
      titleRu: "Будущее простое",
      category: "Tenses",
      cefrLevel: "A2",
      description: "Will for predictions and promises.",
      examples: ["I will help you.", "It will rain tomorrow."]
    },
    {
      key: "going_to",
      titleEn: "Going to",
      titleRu: "Собираться сделать что-то",
      category: "Structures",
      cefrLevel: "A2",
      description: "Plans and intentions.",
      examples: ["I'm going to buy a car.", "They're going to visit us."]
    },
    {
      key: "countable_uncountable",
      titleEn: "Countable / Uncountable",
      titleRu: "Исчисляемые и неисчисляемые",
      category: "Nouns",
      cefrLevel: "A2",
      description: "Some, any, much, many, a lot of.",
      examples: ["Some water", "Many apples", "Much time"]
    },
    {
      key: "comparatives_superlatives",
      titleEn: "Comparatives & Superlatives",
      titleRu: "Степени сравнения",
      category: "Adjectives",
      cefrLevel: "A2",
      description: "Better, best, more beautiful, most beautiful.",
      examples: ["He is taller than me.", "The fastest car."]
    },
    {
      key: "modal_can_should_must",
      titleEn: "Modals: can, should, must",
      titleRu: "Модальные глаголы",
      category: "Modals",
      cefrLevel: "A2",
      description: "Ability, advice, and obligation.",
      examples: ["I can swim.", "You should rest.", "You must wait."]
    },
    {
      key: "adverbs_basic",
      titleEn: "Adverbs",
      titleRu: "Наречия",
      category: "Basics",
      cefrLevel: "A2",
      description: "Adverbs of manner, frequency, and time.",
      examples: ["He runs quickly.", "I always drink coffee."]
    },

    // B1 - Intermediate
    {
      key: "present_perfect",
      titleEn: "Present Perfect",
      titleRu: "Настоящее совершенное",
      category: "Tenses",
      cefrLevel: "B1",
      description: "Actions with present results or experience.",
      examples: ["I have lost my keys.", "Have you ever been to Paris?"]
    },
    {
      key: "conditionals_0_1",
      titleEn: "Conditionals 0 & 1",
      titleRu: "Условные предложения 0 и 1",
      category: "Conditionals",
      cefrLevel: "B1",
      description: "Real situations and scientific facts.",
      examples: ["If it rains, we stay home.", "If I study, I will pass."]
    },
    {
      key: "gerund_infinitive_basic",
      titleEn: "Gerund & Infinitive Basic",
      titleRu: "Герундий и инфинитив (база)",
      category: "Verbs",
      cefrLevel: "B1",
      description: "Basic use of -ing vs to-infinitive.",
      examples: ["I like swimming.", "I want to go out."]
    },
    {
      key: "passive_voice_basic",
      titleEn: "Passive Voice Basic",
      titleRu: "Пассивный залог (база)",
      category: "Structures",
      cefrLevel: "B1",
      description: "Focus on the object of the action.",
      examples: ["The window was broken.", "Coffee is grown in Brazil."]
    },
    {
      key: "reported_speech_basic",
      titleEn: "Reported Speech Basic",
      titleRu: "Косвенная речь (база)",
      category: "Structures",
      cefrLevel: "B1",
      description: "Reporting what someone said.",
      examples: ["He said he was tired.", "She asked if I was ready."]
    },

    // B2 - Upper Intermediate
    {
      key: "present_perfect_continuous",
      titleEn: "Present Perfect Continuous",
      titleRu: "Настоящее совершенное продолженное",
      category: "Tenses",
      cefrLevel: "B2",
      description: "Duration of actions leading up to now.",
      examples: ["I've been waiting for hours.", "It's been raining all day."]
    },
    {
      key: "past_perfect",
      titleEn: "Past Perfect",
      titleRu: "Прошедшее совершенное",
      category: "Tenses",
      cefrLevel: "B2",
      description: "An action completed before another past action.",
      examples: ["The train had left when I arrived.", "I had already eaten."]
    },
    {
      key: "conditionals_2_3",
      titleEn: "Conditionals 2 & 3",
      titleRu: "Условные предложения 2 и 3",
      category: "Conditionals",
      cefrLevel: "B2",
      description: "Hypothetical situations in the present and past.",
      examples: ["If I were rich, I'd travel.", "If I'd known, I would've helped."]
    },
    {
      key: "passive_voice_advanced",
      titleEn: "Passive Voice Advanced",
      titleRu: "Пассивный залог (продвинутый)",
      category: "Structures",
      cefrLevel: "B2",
      description: "Passive with modals and reporting verbs.",
      examples: ["It is said that...", "He was seen leaving."]
    },
    {
      key: "relative_clauses",
      titleEn: "Relative Clauses",
      titleRu: "Относительные придаточные",
      category: "Structures",
      cefrLevel: "B2",
      description: "Defining and non-defining clauses with who, which, that.",
      examples: ["The man who lives next door.", "My car, which is old, broke down."]
    },
    {
      key: "modal_perfect",
      titleEn: "Modal Perfect",
      titleRu: "Перфектные модальные глаголы",
      category: "Modals",
      cefrLevel: "B2",
      description: "Should have, could have, must have for past speculation.",
      examples: ["You should have told me.", "He must have forgotten."]
    },
    {
      key: "inversion_basic",
      titleEn: "Inversion",
      titleRu: "Инверсия",
      category: "Style",
      cefrLevel: "B2",
      description: "Changing word order for emphasis.",
      examples: ["Never have I seen such a mess.", "Seldom does he visit."]
    },

    // C1 - Advanced
    {
      key: "subjunctive",
      titleEn: "Subjunctive",
      titleRu: "Сослагательное наклонение",
      category: "Structures",
      cefrLevel: "C1",
      description: "Expressing wishes, suggestions, and hypothetical ideas.",
      examples: ["I suggest that he be on time.", "If only I were there."]
    },
    {
      key: "cleft_sentences",
      titleEn: "Cleft Sentences",
      titleRu: "Расщепленные предложения",
      category: "Style",
      cefrLevel: "C1",
      description: "It is... that, What... is... for emphasis.",
      examples: ["It was John who broke the vase.", "What I need is a coffee."]
    },
    {
      key: "participle_clauses",
      titleEn: "Participle Clauses",
      titleRu: "Причастные обороты",
      category: "Structures",
      cefrLevel: "C1",
      description: "Using -ing and -ed to replace clauses.",
      examples: ["Walking down the street, I saw him.", "Having finished work, I went home."]
    }
  ]

  console.log(`Seeding ${topics.length} grammar topics...`)

  for (const topic of topics) {
    await prisma.grammarTopic.upsert({
      where: { key: topic.key },
      update: topic,
      create: topic
    })
  }

  console.log("Grammar topics seeded successfully!")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
