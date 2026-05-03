import type { WritingTaskType, CefrLevel } from "./types"

export type ExerciseType = 
  | "multiple_choice"
  | "fill_blank"
  | "fix_mistake"
  | "sentence_builder"
  | "writing"

export interface GrammarExerciseBase {
  id: string
  type: ExerciseType
  topicKey: string
}

export interface MultipleChoiceExercise extends GrammarExerciseBase {
  type: "multiple_choice"
  question: string
  options: {
    id: string
    text: string
    isCorrect: boolean
    feedbackRu: string
  }[]
}

export interface FillBlankExercise extends GrammarExerciseBase {
  type: "fill_blank"
  sentence: string 
  correctAnswers: string[] 
  feedbackRu: string
}

export interface FixMistakeExercise extends GrammarExerciseBase {
  type: "fix_mistake"
  wrongSentence: string
  correctSentence: string
  explanationRu: string
}

export interface SentenceBuilderExercise extends GrammarExerciseBase {
  type: "sentence_builder"
  words: string[] 
  correctSentence: string
  explanationRu: string
}

export interface WritingExercise extends GrammarExerciseBase {
  type: "writing"
  prompt: string
  minWords: number
}

export type GrammarExercise = 
  | MultipleChoiceExercise 
  | FillBlankExercise 
  | FixMistakeExercise 
  | SentenceBuilderExercise 
  | WritingExercise

export interface GrammarTopicContent {
  key: string
  titleEn: string
  titleRu: string
  cefrLevel: CefrLevel
  category: string
  descriptionRu: string
  formulas: {
    positive: string
    negative: string
    question: string
  }
  usage: string[]
  examples: Array<{ en: string; ru: string }>
  commonMistakes: Array<{ wrong: string; correct: string; explanationRu: string }>
  exercises: GrammarExercise[]
}

export const GRAMMAR_TOPICS: Record<string, GrammarTopicContent> = {
  // --- A1: BEGINNER (1-9) ---
  to_be: {
    key: "to_be",
    titleEn: "Verb 'to be'",
    titleRu: "Глагол 'to be'",
    cefrLevel: "A1",
    category: "Basics",
    descriptionRu: "Основа английского языка. Обозначает состояние или нахождение.",
    formulas: {
      positive: "am / is / are",
      negative: "am not / isn't / aren't",
      question: "Am / Is / Are ...?"
    },
    usage: ["Имя", "Возраст", "Профессия", "Местоположение"],
    examples: [{ en: "I am happy.", ru: "Я счастлив." }],
    commonMistakes: [{ wrong: "I is.", correct: "I am.", explanationRu: "Для I всегда am." }],
    exercises: [{ id: "tb1", type: "multiple_choice", topicKey: "to_be", question: "She ___ a doctor.", options: [{ id: "a", text: "am", isCorrect: false, feedbackRu: "Неверно. Попробуй еще раз." }, { id: "b", text: "is", isCorrect: true, feedbackRu: "Правильно!" }] }]
  },
  present_simple: {
    key: "present_simple",
    titleEn: "Present Simple",
    titleRu: "Настоящее простое",
    cefrLevel: "A1",
    category: "Tenses",
    descriptionRu: "Регулярные действия и факты.",
    formulas: { positive: "V / V+s", negative: "don't / doesn't + V", question: "Do / Does ... + V?" },
    usage: ["Привычки", "Факты", "Расписания"],
    examples: [{ en: "I drink tea.", ru: "Я пью чай." }],
    commonMistakes: [{ wrong: "He like.", correct: "He likes.", explanationRu: "Забыто -s." }],
    exercises: [{ id: "ps1", type: "fill_blank", topicKey: "present_simple", sentence: "He ___ (work) here.", correctAnswers: ["works"], feedbackRu: "3-е лицо + s." }]
  },
  present_continuous: {
    key: "present_continuous",
    titleEn: "Present Continuous",
    titleRu: "Настоящее продолженное",
    cefrLevel: "A1",
    category: "Tenses",
    descriptionRu: "Действие прямо сейчас.",
    formulas: { positive: "am/is/are + V-ing", negative: "am/is/are not + V-ing", question: "Am/Is/Are ... + V-ing?" },
    usage: ["В момент речи", "Временные ситуации"],
    examples: [{ en: "I am eating.", ru: "Я ем." }],
    commonMistakes: [{ wrong: "I eating.", correct: "I am eating.", explanationRu: "Забыт to be." }],
    exercises: [{ id: "pc1", type: "multiple_choice", topicKey: "present_continuous", question: "They ___ now.", options: [{ id: "a", text: "play", isCorrect: false, feedbackRu: "Неверно. Попробуй еще раз." }, { id: "b", text: "are playing", isCorrect: true, feedbackRu: "Правильно!" }] }]
  },
  plural_nouns: {
    key: "plural_nouns",
    titleEn: "Plural Nouns",
    titleRu: "Множественное число",
    cefrLevel: "A1",
    category: "Nouns",
    descriptionRu: "Как сделать много из одного.",
    formulas: { positive: "S / ES", negative: "Irregular", question: "How many?" },
    usage: ["Исчисляемые предметы"],
    examples: [{ en: "Cat -> Cats", ru: "Кот -> Коты" }],
    commonMistakes: [{ wrong: "Mans.", correct: "Men.", explanationRu: "Исключение." }],
    exercises: [{ id: "pl1", type: "fill_blank", topicKey: "plural_nouns", sentence: "Two ___ (child).", correctAnswers: ["children"], feedbackRu: "Исключение." }]
  },
  articles_basic: {
    key: "articles_basic",
    titleEn: "Articles: a/an/the",
    titleRu: "Артикли",
    cefrLevel: "A1",
    category: "Basics",
    descriptionRu: "A/An для любого, The для конкретного.",
    formulas: { positive: "a/an | the", negative: "Zero", question: "A or The?" },
    usage: ["Первое упоминание", "Уникальные объекты"],
    examples: [{ en: "A dog.", ru: "Собака." }],
    commonMistakes: [{ wrong: "A apple.", correct: "An apple.", explanationRu: "Гласная -> an." }],
    exercises: [{ id: "ar1", type: "multiple_choice", topicKey: "articles_basic", question: "I see ___ sun.", options: [{ id: "a", text: "a", isCorrect: false, feedbackRu: "Неверно. Попробуй еще раз." }, { id: "b", text: "the", isCorrect: true, feedbackRu: "Правильно!" }] }]
  },
  prepositions_basic: {
    key: "prepositions_basic",
    titleEn: "Prepositions: in/at/on",
    titleRu: "Предлоги",
    cefrLevel: "A1",
    category: "Basics",
    descriptionRu: "Место и время.",
    formulas: { positive: "in / at / on", negative: "not in/on/at", question: "Where/When?" },
    usage: ["Время", "Место"],
    examples: [{ en: "In London.", ru: "В Лондоне." }],
    commonMistakes: [{ wrong: "In Monday.", correct: "On Monday.", explanationRu: "С днями — on." }],
    exercises: [{ id: "pr1", type: "multiple_choice", topicKey: "prepositions_basic", question: "___ 5 o'clock.", options: [{ id: "a", text: "In", isCorrect: false, feedbackRu: "Неверно. Попробуй еще раз." }, { id: "b", text: "At", isCorrect: true, feedbackRu: "Правильно!" }] }]
  },
  there_is_are: {
    key: "there_is_are",
    titleEn: "There is / There are",
    titleRu: "There is / There are",
    cefrLevel: "A1",
    category: "Structures",
    descriptionRu: "Наличие чего-то где-то.",
    formulas: { positive: "There is / are", negative: "There isn't / aren't", question: "Is / Are there ...?" },
    usage: ["Описание комнаты", "Местоположение"],
    examples: [{ en: "There is a pen.", ru: "Там есть ручка." }],
    commonMistakes: [{ wrong: "There is cats.", correct: "There are cats.", explanationRu: "Для мн. числа — are." }],
    exercises: [{ id: "ti1", type: "fill_blank", topicKey: "there_is_are", sentence: "There ___ (be) a book.", correctAnswers: ["is"], feedbackRu: "Ед. число." }]
  },
  pronouns_possessives: {
    key: "pronouns_possessives",
    titleEn: "Pronouns & Possessives",
    titleRu: "Местоимения",
    cefrLevel: "A1",
    category: "Basics",
    descriptionRu: "Я, мой, меня.",
    formulas: { positive: "I/me/my/mine", negative: "No", question: "Who/Whose?" },
    usage: ["Принадлежность", "Объект действия"],
    examples: [{ en: "My book.", ru: "Моя книга." }],
    commonMistakes: [{ wrong: "Me like.", correct: "I like.", explanationRu: "Нужно подлежащее." }],
    exercises: [{ id: "prn1", type: "multiple_choice", topicKey: "pronouns_possessives", question: "It is ___ car.", options: [{ id: "a", text: "me", isCorrect: false, feedbackRu: "Неверно. Попробуй еще раз." }, { id: "b", text: "my", isCorrect: true, feedbackRu: "Правильно!" }] }]
  },
  word_order_basic: {
    key: "word_order_basic",
    titleEn: "Basic Word Order",
    titleRu: "Порядок слов",
    cefrLevel: "A1",
    category: "Structures",
    descriptionRu: "Кто -> делает -> что.",
    formulas: { positive: "Subject + Verb + Object", negative: "Don't break order", question: "Aux + Subj + Verb?" },
    usage: ["Построение предложений"],
    examples: [{ en: "I love pizza.", ru: "Я люблю пиццу." }],
    commonMistakes: [{ wrong: "Pizza I love.", correct: "I love pizza.", explanationRu: "Строгий порядок." }],
    exercises: [{ id: "wo1", type: "sentence_builder", topicKey: "word_order_basic", words: ["like", "I", "cats"], correctSentence: "I like cats", explanationRu: "S-V-O." }]
  },

  // --- A2: ELEMENTARY (10-17) ---
  past_simple: {
    key: "past_simple",
    titleEn: "Past Simple",
    titleRu: "Прошедшее простое",
    cefrLevel: "A2",
    category: "Tenses",
    descriptionRu: "Действие в прошлом.",
    formulas: { positive: "V-ed / 2nd form", negative: "didn't + V", question: "Did ... + V?" },
    usage: ["Вчера", "В 2010 году"],
    examples: [{ en: "I went home.", ru: "Я пошел домой." }],
    commonMistakes: [{ wrong: "I didn't went.", correct: "I didn't go.", explanationRu: "После didn't база." }],
    exercises: [{ id: "pas1", type: "fill_blank", topicKey: "past_simple", sentence: "I ___ (see) him.", correctAnswers: ["saw"], feedbackRu: "2-я форма." }]
  },
  past_continuous: {
    key: "past_continuous",
    titleEn: "Past Continuous",
    titleRu: "Прошедшее продолженное",
    cefrLevel: "A2",
    category: "Tenses",
    descriptionRu: "Процесс в прошлом.",
    formulas: { positive: "was/were + V-ing", negative: "was/were not + V-ing", question: "Was/Were ... + V-ing?" },
    usage: ["Конкретный момент в прошлом"],
    examples: [{ en: "I was sleeping.", ru: "Я спал." }],
    commonMistakes: [{ wrong: "They was.", correct: "They were.", explanationRu: "They — were." }],
    exercises: [{ id: "paco1", type: "multiple_choice", topicKey: "past_continuous", question: "He ___ at 5.", options: [{ id: "a", text: "was working", isCorrect: true, feedbackRu: "Правильно!" }, { id: "b", text: "were working", isCorrect: false, feedbackRu: "Неверно. Попробуй еще раз." }] }]
  },
  future_simple: {
    key: "future_simple",
    titleEn: "Future Simple",
    titleRu: "Будущее простое",
    cefrLevel: "A2",
    category: "Tenses",
    descriptionRu: "Прогнозы и решения.",
    formulas: { positive: "will + V", negative: "won't + V", question: "Will ... + V?" },
    usage: ["Обещания", "Спонтанность"],
    examples: [{ en: "I will call you.", ru: "Я позвоню тебе." }],
    commonMistakes: [{ wrong: "I will to call.", correct: "I will call.", explanationRu: "Без to." }],
    exercises: [{ id: "fs1", type: "fill_blank", topicKey: "future_simple", sentence: "I ___ (be) there.", correctAnswers: ["will be"], feedbackRu: "Будущее." }]
  },
  going_to: {
    key: "going_to",
    titleEn: "Going to",
    titleRu: "Going to",
    cefrLevel: "A2",
    category: "Structures",
    descriptionRu: "Планы и намерения.",
    formulas: { positive: "be going to + V", negative: "be not going to + V", question: "Am/Is/Are ... going to + V?" },
    usage: ["Заранее решенные планы"],
    examples: [{ en: "I'm going to travel.", ru: "Я собираюсь путешествовать." }],
    commonMistakes: [{ wrong: "I going to.", correct: "I am going to.", explanationRu: "Забыт am/is/are." }],
    exercises: [{ id: "gt1", type: "multiple_choice", topicKey: "going_to", question: "She ___ visit us.", options: [{ id: "a", text: "is going to", isCorrect: true, feedbackRu: "Правильно!" }, { id: "b", text: "will going to", isCorrect: false, feedbackRu: "Неверно. Попробуй еще раз." }] }]
  },
  countable_uncountable: {
    key: "countable_uncountable",
    titleEn: "Countable / Uncountable",
    titleRu: "Исчисляемые и неисчисляемые",
    cefrLevel: "A2",
    category: "Nouns",
    descriptionRu: "Much, many, some, any.",
    formulas: { positive: "some", negative: "any / much / many", question: "any / how much / many?" },
    usage: ["Количество"],
    examples: [{ en: "Some water.", ru: "Немного воды." }],
    commonMistakes: [{ wrong: "Many water.", correct: "Much water.", explanationRu: "Вода неисчисляемая." }],
    exercises: [{ id: "cu1", type: "multiple_choice", topicKey: "countable_uncountable", question: "How ___ money?", options: [{ id: "a", text: "many", isCorrect: false, feedbackRu: "Неверно. Попробуй еще раз." }, { id: "b", text: "much", isCorrect: true, feedbackRu: "Правильно!" }] }]
  },
  comparatives_superlatives: {
    key: "comparatives_superlatives",
    titleEn: "Comparatives & Superlatives",
    titleRu: "Степени сравнения",
    cefrLevel: "A2",
    category: "Adjectives",
    descriptionRu: "Быстрее, самый быстрый.",
    formulas: { positive: "er / more | est / most", negative: "not as ... as", question: "Is it better?" },
    usage: ["Сравнение"],
    examples: [{ en: "Better than me.", ru: "Лучше меня." }],
    commonMistakes: [{ wrong: "More better.", correct: "Better.", explanationRu: "Двойная степень." }],
    exercises: [{ id: "cs1", type: "fill_blank", topicKey: "comparatives_superlatives", sentence: "He is ___ (tall) than me.", correctAnswers: ["taller"], feedbackRu: "Сравнение." }]
  },
  modal_can_should_must: {
    key: "modal_can_should_must",
    titleEn: "Modals: can, should, must",
    titleRu: "Модальные глаголы",
    cefrLevel: "A2",
    category: "Modals",
    descriptionRu: "Умение, совет, долг.",
    formulas: { positive: "modal + V", negative: "modal + not + V", question: "Modal ... + V?" },
    usage: ["Способность", "Обязанность"],
    examples: [{ en: "I can swim.", ru: "Я умею плавать." }],
    commonMistakes: [{ wrong: "He cans.", correct: "He can.", explanationRu: "Не меняется." }],
    exercises: [{ id: "mc1", type: "multiple_choice", topicKey: "modal_can_should_must", question: "You ___ study.", options: [{ id: "a", text: "should", isCorrect: true, feedbackRu: "Правильно!" }, { id: "b", text: "should to", isCorrect: false, feedbackRu: "Неверно. Попробуй еще раз." }] }]
  },
  adverbs_basic: {
    key: "adverbs_basic",
    titleEn: "Adverbs",
    titleRu: "Наречия",
    cefrLevel: "A2",
    category: "Basics",
    descriptionRu: "Как совершается действие.",
    formulas: { positive: "adj + ly", negative: "No ly (fast)", question: "How?" },
    usage: ["Описание глагола"],
    examples: [{ en: "Slowly.", ru: "Медленно." }],
    commonMistakes: [{ wrong: "He runs good.", correct: "He runs well.", explanationRu: "Good -> Well." }],
    exercises: [{ id: "adv1", type: "fill_blank", topicKey: "adverbs_basic", sentence: "He speaks ___ (quiet).", correctAnswers: ["quietly"], feedbackRu: "+ly." }]
  },

  // --- B1: INTERMEDIATE (18-22) ---
  present_perfect: {
    key: "present_perfect",
    titleEn: "Present Perfect",
    titleRu: "Настоящее совершенное",
    cefrLevel: "B1",
    category: "Tenses",
    descriptionRu: "Опыт и результат.",
    formulas: { positive: "have/has + V3", negative: "haven't/hasn't + V3", question: "Have/Has ... + V3?" },
    usage: ["Когда-либо", "Только что"],
    examples: [{ en: "I've lost keys.", ru: "Я потерял ключи." }],
    commonMistakes: [{ wrong: "I have saw.", correct: "I have seen.", explanationRu: "Нужна V3." }],
    exercises: [{ id: "pp1", type: "multiple_choice", topicKey: "present_perfect", question: "Have you ___?", options: [{ id: "a", text: "ate", isCorrect: false, feedbackRu: "Неверно. Попробуй еще раз." }, { id: "b", text: "eaten", isCorrect: true, feedbackRu: "Правильно!" }] }]
  },
  conditionals_0_1: {
    key: "conditionals_0_1",
    titleEn: "Conditionals 0 & 1",
    titleRu: "Условные 0 и 1",
    cefrLevel: "B1",
    category: "Conditionals",
    descriptionRu: "Факты и реальное будущее.",
    formulas: { positive: "If + Pres, Pres/Will", negative: "Unless", question: "What if?" },
    usage: ["Условия"],
    examples: [{ en: "If it rains, I stay.", ru: "Если дождь, я остаюсь." }],
    commonMistakes: [{ wrong: "If I will see.", correct: "If I see.", explanationRu: "В IF нет WILL." }],
    exercises: [{ id: "c01", type: "multiple_choice", topicKey: "conditionals_0_1", question: "If he ___ help.", options: [{ id: "a", text: "comes", isCorrect: true, feedbackRu: "Правильно!" }, { id: "b", text: "will come", isCorrect: false, feedbackRu: "Неверно. Попробуй еще раз." }] }]
  },
  gerund_infinitive_basic: {
    key: "gerund_infinitive_basic",
    titleEn: "Gerund & Infinitive",
    titleRu: "Герундий и инфинитив",
    cefrLevel: "B1",
    category: "Verbs",
    descriptionRu: "-ing или to V.",
    formulas: { positive: "V-ing / to V", negative: "not V-ing / not to V", question: "Which form?" },
    usage: ["После глаголов"],
    examples: [{ en: "I like swimming.", ru: "Люблю плавать." }],
    commonMistakes: [{ wrong: "I want going.", correct: "I want to go.", explanationRu: "Want + to." }],
    exercises: [{ id: "gi1", type: "fill_blank", topicKey: "gerund_infinitive_basic", sentence: "I hope ___ (pass).", correctAnswers: ["to pass"], feedbackRu: "Hope + to." }]
  },
  passive_voice_basic: {
    key: "passive_voice_basic",
    titleEn: "Passive Voice Basic",
    titleRu: "Пассивный залог",
    cefrLevel: "B1",
    category: "Structures",
    descriptionRu: "Над кем совершается действие.",
    formulas: { positive: "be + V3", negative: "be not + V3", question: "Be ... + V3?" },
    usage: ["Акцент на объекте"],
    examples: [{ en: "The door is closed.", ru: "Дверь закрыта." }],
    commonMistakes: [{ wrong: "It made.", correct: "It was made.", explanationRu: "Забыт be." }],
    exercises: [{ id: "pv1", type: "fill_blank", topicKey: "passive_voice_basic", sentence: "The book ___ (write).", correctAnswers: ["was written"], feedbackRu: "Passive." }]
  },
  reported_speech_basic: {
    key: "reported_speech_basic",
    titleEn: "Reported Speech Basic",
    titleRu: "Косвенная речь",
    cefrLevel: "B1",
    category: "Structures",
    descriptionRu: "Пересказ слов.",
    formulas: { positive: "Say/Tell + Backshift", negative: "No say me", question: "Ask if" },
    usage: ["Пересказ"],
    examples: [{ en: "He said he was tired.", ru: "Он сказал, что устал." }],
    commonMistakes: [{ wrong: "He said me.", correct: "He told me.", explanationRu: "Say + to / Tell + obj." }],
    exercises: [{ id: "rs1", type: "multiple_choice", topicKey: "reported_speech_basic", question: "He said he ___ happy.", options: [{ id: "a", text: "is", isCorrect: false, feedbackRu: "Неверно. Попробуй еще раз." }, { id: "b", text: "was", isCorrect: true, feedbackRu: "Правильно!" }] }]
  },

  // --- B2: UPPER INTERMEDIATE (23-32) ---
  present_perfect_continuous: {
    key: "present_perfect_continuous",
    titleEn: "Present Perfect Continuous",
    titleRu: "Настоящее завершенное продолженное",
    cefrLevel: "B2",
    category: "Tenses",
    descriptionRu: "Как долго идет действие.",
    formulas: { positive: "have been V-ing", negative: "haven't been V-ing", question: "Have ... been V-ing?" },
    usage: ["Продолжительность"],
    examples: [{ en: "I've been waiting.", ru: "Я жду (уже какое-то время)." }],
    commonMistakes: [{ wrong: "I am waiting for 2 hours.", correct: "I have been waiting.", explanationRu: "Для длительности до сейчас." }],
    exercises: [{ id: "ppc1", type: "fill_blank", topicKey: "present_perfect_continuous", sentence: "She ___ (cry).", correctAnswers: ["has been crying"], feedbackRu: "Duration." }]
  },
  past_perfect: {
    key: "past_perfect",
    titleEn: "Past Perfect",
    titleRu: "Прошедшее совершенное",
    cefrLevel: "B2",
    category: "Tenses",
    descriptionRu: "Раньше прошлого.",
    formulas: { positive: "had + V3", negative: "hadn't + V3", question: "Had ... + V3?" },
    usage: ["Действие до момента в прошлом"],
    examples: [{ en: "The train had left.", ru: "Поезд ушел (до моего прихода)." }],
    commonMistakes: [{ wrong: "I came and he left.", correct: "He had left when I came.", explanationRu: "Показать последовательность." }],
    exercises: [{ id: "ppf1", type: "multiple_choice", topicKey: "past_perfect", question: "I ___ before dinner.", options: [{ id: "a", text: "had finished", isCorrect: true, feedbackRu: "Правильно!" }, { id: "b", text: "have finished", isCorrect: false, feedbackRu: "Неверно. Попробуй еще раз." }] }]
  },
  conditionals_2_3: {
    key: "conditionals_2_3",
    titleEn: "Conditionals 2 & 3",
    titleRu: "Условные 2 и 3",
    cefrLevel: "B2",
    category: "Conditionals",
    descriptionRu: "Мечты и сожаления.",
    formulas: { positive: "Would / Would have V3", negative: "If I hadn't", question: "What would you have done?" },
    usage: ["Нереальные ситуации"],
    examples: [{ en: "If I were you.", ru: "Если бы я был тобой." }],
    commonMistakes: [{ wrong: "If I would have.", correct: "If I had.", explanationRu: "В IF нет WOULD." }],
    exercises: [{ id: "c23", type: "fill_blank", topicKey: "conditionals_2_3", sentence: "If I ___ (win), I'd travel.", correctAnswers: ["won"], feedbackRu: "Conditional 2." }]
  },
  passive_voice_advanced: {
    key: "passive_voice_advanced",
    titleEn: "Passive Voice Advanced",
    titleRu: "Пассивный залог (профи)",
    cefrLevel: "B2",
    category: "Structures",
    descriptionRu: "Сложные пассивные формы.",
    formulas: { positive: "It is said that / Being V3", negative: "Not being V3", question: "Is he thought to be...?" },
    usage: ["Слухи", "Инфинитивные пассивы"],
    examples: [{ en: "It is thought that...", ru: "Считается, что..." }],
    commonMistakes: [{ wrong: "He is say to be.", correct: "He is said to be.", explanationRu: "Нужна V3." }],
    exercises: [{ id: "pva1", type: "multiple_choice", topicKey: "passive_voice_advanced", question: "He is said ___ rich.", options: [{ id: "a", text: "to be", isCorrect: true, feedbackRu: "Правильно!" }, { id: "b", text: "being", isCorrect: false, feedbackRu: "Неверно. Попробуй еще раз." }] }]
  },
  relative_clauses: {
    key: "relative_clauses",
    titleEn: "Relative Clauses",
    titleRu: "Относительные придаточные",
    cefrLevel: "B2",
    category: "Structures",
    descriptionRu: "Who, which, whose.",
    formulas: { positive: "Defining / Non-defining", negative: "No commas", question: "Whose is it?" },
    usage: ["Доп. информация"],
    examples: [{ en: "The man who lives here.", ru: "Человек, который живет здесь." }],
    commonMistakes: [{ wrong: "The book who.", correct: "The book which.", explanationRu: "Who — для людей." }],
    exercises: [{ id: "rc1", type: "multiple_choice", topicKey: "relative_clauses", question: "The car ___ I bought.", options: [{ id: "a", text: "which", isCorrect: true, feedbackRu: "Правильно!" }, { id: "b", text: "who", isCorrect: false, feedbackRu: "Неверно. Попробуй еще раз." }] }]
  },
  modal_perfect: {
    key: "modal_perfect",
    titleEn: "Modal Perfect",
    titleRu: "Модальные перфектные",
    cefrLevel: "B2",
    category: "Modals",
    descriptionRu: "Догадки о прошлом.",
    formulas: { positive: "Modal + have + V3", negative: "Shouldn't have V3", question: "Could he have done it?" },
    usage: ["Сожаление", "Уверенность в прошлом"],
    examples: [{ en: "You should have told me.", ru: "Тебе следовало сказать мне." }],
    commonMistakes: [{ wrong: "Must did.", correct: "Must have done.", explanationRu: "Перфектная форма." }],
    exercises: [{ id: "mp1", type: "multiple_choice", topicKey: "modal_perfect", question: "He ___ forgotten.", options: [{ id: "a", text: "must have", isCorrect: true, feedbackRu: "Правильно!" }, { id: "b", text: "must has", isCorrect: false, feedbackRu: "Неверно. Попробуй еще раз." }] }]
  },
  inversion_basic: {
    key: "inversion_basic",
    titleEn: "Inversion",
    titleRu: "Инверсия",
    cefrLevel: "B2",
    category: "Style",
    descriptionRu: "Обратный порядок слов.",
    formulas: { positive: "Negative word + Aux + Subj", negative: "Never have I", question: "Seldom does he" },
    usage: ["Усиление"],
    examples: [{ en: "Never have I seen this.", ru: "Никогда я этого не видел." }],
    commonMistakes: [{ wrong: "Never I have seen.", correct: "Never have I seen.", explanationRu: "Нужен порядок вопроса." }],
    exercises: [{ id: "inv1", type: "sentence_builder", topicKey: "inversion_basic", words: ["seen", "I", "Never", "have"], correctSentence: "Never have I seen", explanationRu: "Inversion." }]
  },
  subjunctive: {
    key: "subjunctive",
    titleEn: "Subjunctive",
    titleRu: "Сослагательное наклонение",
    cefrLevel: "C1",
    category: "Structures",
    descriptionRu: "Важность и требования.",
    formulas: { positive: "Suggest that he V (base)", negative: "Not go", question: "Do you insist?" },
    usage: ["Формальные просьбы"],
    examples: [{ en: "I suggest he stay.", ru: "Предлагаю ему остаться." }],
    commonMistakes: [{ wrong: "I suggest he stays.", correct: "I suggest he stay.", explanationRu: "Базовая форма." }],
    exercises: [{ id: "sub1", type: "multiple_choice", topicKey: "subjunctive", question: "I insist he ___.", options: [{ id: "a", text: "be", isCorrect: true, feedbackRu: "Правильно!" }, { id: "b", text: "is", isCorrect: false, feedbackRu: "Неверно. Попробуй еще раз." }] }]
  },
  cleft_sentences: {
    key: "cleft_sentences",
    titleEn: "Cleft Sentences",
    titleRu: "Расщепленные предложения",
    cefrLevel: "C1",
    category: "Style",
    descriptionRu: "Акцент: What I need is...",
    formulas: { positive: "What ... is / It is ... that", negative: "Not what I want", question: "Is it that?" },
    usage: ["Выделение главного"],
    examples: [{ en: "What I need is coffee.", ru: "Что мне нужно, так это кофе." }],
    commonMistakes: [{ wrong: "I need coffee.", correct: "What I need is coffee.", explanationRu: "Для акцента." }],
    exercises: [{ id: "cle1", type: "sentence_builder", topicKey: "cleft_sentences", words: ["is", "coffee", "What", "I", "need"], correctSentence: "What I need is coffee", explanationRu: "Cleft." }]
  },
  participle_clauses: {
    key: "participle_clauses",
    titleEn: "Participle Clauses",
    titleRu: "Причастные обороты",
    cefrLevel: "C1",
    category: "Structures",
    descriptionRu: "Walking home, I saw him.",
    formulas: { positive: "V-ing / V3 clause", negative: "Not having V3", question: "Having done that?" },
    usage: ["Сокращение"],
    examples: [{ en: "Seeing him, I waved.", ru: "Увидев его, я помахал." }],
    commonMistakes: [{ wrong: "I saw him walk home.", correct: "Walking home, I saw him.", explanationRu: "Для краткости." }],
    exercises: [{ id: "pcp1", type: "fill_blank", topicKey: "participle_clauses", sentence: "___ (finish) work, I left.", correctAnswers: ["Having finished"], feedbackRu: "Perfect Participle." }]
  },

  // --- NEW TOPICS TO REACH 42 (33-42) ---
  future_continuous: {
    key: "future_continuous",
    titleEn: "Future Continuous",
    titleRu: "Будущее продолженное",
    cefrLevel: "B1",
    category: "Tenses",
    descriptionRu: "Процесс в будущем.",
    formulas: { positive: "will be + V-ing", negative: "won't be + V-ing", question: "Will ... be V-ing?" },
    usage: ["Действие в конкретное время в будущем"],
    examples: [{ en: "I'll be working at 5.", ru: "Я буду работать в 5." }],
    commonMistakes: [{ wrong: "I will working.", correct: "I will be working.", explanationRu: "Забыт be." }],
    exercises: [{ id: "fc1", type: "fill_blank", topicKey: "future_continuous", sentence: "This time tomorrow I ___ (fly).", correctAnswers: ["will be flying"], feedbackRu: "Process in future." }]
  },
  future_perfect: {
    key: "future_perfect",
    titleEn: "Future Perfect",
    titleRu: "Будущее завершенное",
    cefrLevel: "B2",
    category: "Tenses",
    descriptionRu: "Завершится к моменту в будущем.",
    formulas: { positive: "will have + V3", negative: "won't have + V3", question: "Will ... have V3?" },
    usage: ["К определенному времени"],
    examples: [{ en: "I'll have finished by 10.", ru: "Я закончу к 10." }],
    commonMistakes: [{ wrong: "I will finish by then.", correct: "I will have finished.", explanationRu: "Акцент на завершении к сроку." }],
    exercises: [{ id: "fp1", type: "fill_blank", topicKey: "future_perfect", sentence: "By 2025 I ___ (graduate).", correctAnswers: ["will have graduated"], feedbackRu: "By + future." }]
  },
  past_perfect_continuous: {
    key: "past_perfect_continuous",
    titleEn: "Past Perfect Continuous",
    titleRu: "Прошедшее завершенное продолженное",
    cefrLevel: "B2",
    category: "Tenses",
    descriptionRu: "Как долго шло до прошлого.",
    formulas: { positive: "had been V-ing", negative: "hadn't been V-ing", question: "Had ... been V-ing?" },
    usage: ["Длительность до момента в прошлом"],
    examples: [{ en: "I had been running.", ru: "Я бегал (какое-то время до события)." }],
    commonMistakes: [{ wrong: "I was running for an hour when...", correct: "I had been running.", explanationRu: "Длительность до прошлого момента." }],
    exercises: [{ id: "ppfc1", type: "multiple_choice", topicKey: "past_perfect_continuous", question: "He ___ for hours.", options: [{ id: "a", text: "had been waiting", isCorrect: true, feedbackRu: "Правильно!" }, { id: "b", text: "has been waiting", isCorrect: false, feedbackRu: "Неверно. Попробуй еще раз." }] }]
  },
  mixed_conditionals: {
    key: "mixed_conditionals",
    titleEn: "Mixed Conditionals",
    titleRu: "Смешанные условия",
    cefrLevel: "C1",
    category: "Conditionals",
    descriptionRu: "Прошлое влияет на сейчас (и наоборот).",
    formulas: { positive: "If + Past Perfect, Would + V", negative: "If I hadn't ... I wouldn't be", question: "What if...?" },
    usage: ["Смешение времен"],
    examples: [{ en: "If I'd studied, I'd be rich.", ru: "Если бы я учился (тогда), я был бы богат (сейчас)." }],
    commonMistakes: [{ wrong: "If I had studied I would have been rich.", correct: "I would be rich now.", explanationRu: "Связь с настоящим." }],
    exercises: [{ id: "mix1", type: "multiple_choice", topicKey: "mixed_conditionals", question: "If I ___ born earlier, I'd be old.", options: [{ id: "a", text: "had been", isCorrect: true, feedbackRu: "Правильно!" }, { id: "b", text: "were", isCorrect: false, feedbackRu: "Неверно. Попробуй еще раз." }] }]
  },
  wishes_regrets: {
    key: "wishes_regrets",
    titleEn: "Wishes & Regrets",
    titleRu: "Желания и сожаления",
    cefrLevel: "B2",
    category: "Structures",
    descriptionRu: "I wish / If only.",
    formulas: { positive: "Wish + Past (now) / Past Perfect (past)", negative: "I wish I hadn't", question: "Do you wish...?" },
    usage: ["Сожаления"],
    examples: [{ en: "I wish I were rich.", ru: "Жаль, что я не богат." }],
    commonMistakes: [{ wrong: "I wish I am.", correct: "I wish I were.", explanationRu: "Шаг назад во времени." }],
    exercises: [{ id: "wis1", type: "fill_blank", topicKey: "wishes_regrets", sentence: "I wish I ___ (know) then.", correctAnswers: ["had known"], feedbackRu: "Regret about past." }]
  },
  phrasal_verbs_intro: {
    key: "phrasal_verbs_intro",
    titleEn: "Phrasal Verbs Intro",
    titleRu: "Фразовые глаголы",
    cefrLevel: "A2",
    category: "Verbs",
    descriptionRu: "Глагол + частица = новый смысл.",
    formulas: { positive: "Verb + Particle", negative: "Don't give up", question: "Can you pick up?" },
    usage: ["Разговорная речь"],
    examples: [{ en: "Give up.", ru: "Сдаться." }],
    commonMistakes: [{ wrong: "Look after to.", correct: "Look after.", explanationRu: "Частица уже есть." }],
    exercises: [{ id: "phv1", type: "multiple_choice", topicKey: "phrasal_verbs_intro", question: "Don't ___ up!", options: [{ id: "a", text: "give", isCorrect: true, feedbackRu: "Правильно!" }, { id: "b", text: "take", isCorrect: false, feedbackRu: "Неверно. Попробуй еще раз." }] }]
  },
  reported_questions_commands: {
    key: "reported_questions_commands",
    titleEn: "Reported Questions",
    titleRu: "Косвенные вопросы",
    cefrLevel: "B1",
    category: "Structures",
    descriptionRu: "He asked where I lived.",
    formulas: { positive: "Ask + if / Wh-word + Subj + Verb", negative: "Order not to", question: "He asked why" },
    usage: ["Пересказ вопросов"],
    examples: [{ en: "She asked if I was OK.", ru: "Она спросила, в порядке ли я." }],
    commonMistakes: [{ wrong: "He asked where am I.", correct: "He asked where I was.", explanationRu: "Прямой порядок слов." }],
    exercises: [{ id: "rq1", type: "sentence_builder", topicKey: "reported_questions_commands", words: ["asked", "He", "was", "where", "I"], correctSentence: "He asked where I was", explanationRu: "Direct order." }]
  },
  used_to_would: {
    key: "used_to_would",
    titleEn: "Used to / Would",
    titleRu: "Used to / Would",
    cefrLevel: "B1",
    category: "Structures",
    descriptionRu: "Привычки в прошлом.",
    formulas: { positive: "Used to + V / Would + V", negative: "Didn't use to", question: "Did you use to?" },
    usage: ["Прошлые состояния и привычки"],
    examples: [{ en: "I used to smoke.", ru: "Я раньше курил." }],
    commonMistakes: [{ wrong: "I used to smoking.", correct: "I used to smoke.", explanationRu: "Used to + V." }],
    exercises: [{ id: "utw1", type: "multiple_choice", topicKey: "used_to_would", question: "I ___ live in NY.", options: [{ id: "a", text: "used to", isCorrect: true, feedbackRu: "Правильно!" }, { id: "b", text: "would", isCorrect: false, feedbackRu: "Would не для состояний." }] }]
  },
  stative_verbs: {
    key: "stative_verbs",
    titleEn: "Stative Verbs",
    titleRu: "Глаголы состояния",
    cefrLevel: "A2",
    category: "Verbs",
    descriptionRu: "Глаголы, которые не любят -ing.",
    formulas: { positive: "Know, love, hate, want", negative: "Don't use in Continuous", question: "Do you understand?" },
    usage: ["Чувства, мысли, владение"],
    examples: [{ en: "I love it.", ru: "Я люблю это." }],
    commonMistakes: [{ wrong: "I am loving it.", correct: "I love it.", explanationRu: "State, not action." }],
    exercises: [{ id: "sv1", type: "multiple_choice", topicKey: "stative_verbs", question: "I ___ the answer.", options: [{ id: "a", text: "know", isCorrect: true, feedbackRu: "Правильно!" }, { id: "b", text: "am knowing", isCorrect: false, feedbackRu: "Неверно. Попробуй еще раз." }] }]
  },
  linking_words: {
    key: "linking_words",
    titleEn: "Linking Words",
    titleRu: "Слова-связки",
    cefrLevel: "B1",
    category: "Basics",
    descriptionRu: "However, although, because.",
    formulas: { positive: "Conj + Clause", negative: "Despite + Noun", question: "Why/How?" },
    usage: ["Логика текста"],
    examples: [{ en: "Although it rained...", ru: "Хотя шел дождь..." }],
    commonMistakes: [{ wrong: "Because of he was sick.", correct: "Because he was sick.", explanationRu: "Because of + Noun." }],
    exercises: [{ id: "lw1", type: "multiple_choice", topicKey: "linking_words", question: "___ it was late, I worked.", options: [{ id: "a", text: "Although", isCorrect: true, feedbackRu: "Правильно!" }, { id: "b", text: "But", isCorrect: false, feedbackRu: "Неверно. Попробуй еще раз." }] }]
  }
}
