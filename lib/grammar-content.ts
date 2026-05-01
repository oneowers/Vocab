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
  sentence: string // e.g. "He ___ to school every day."
  correctAnswers: string[] // e.g. ["goes"]
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
  words: string[] // e.g. ["every", "day", "I", "study"]
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
  present_simple: {
    key: "present_simple",
    titleEn: "Present Simple",
    titleRu: "Настоящее простое",
    cefrLevel: "A1",
    category: "Tenses",
    descriptionRu: "Используется для привычек, фактов, рутины и общеизвестных истин.",
    formulas: {
      positive: "I/You/We/They + verb | He/She/It + verb + s",
      negative: "I/You/We/They + do not + verb | He/She/It + does not + verb",
      question: "Do/Does + subject + verb?"
    },
    usage: [
      "Привычки и регулярные действия",
      "Факты и общие истины",
      "Расписания",
      "Постоянные состояния"
    ],
    examples: [
      { en: "I study English every day.", ru: "Я учу английский каждый день." },
      { en: "She works in a bank.", ru: "Она работает в банке." },
      { en: "Water boils at 100 degrees.", ru: "Вода кипит при 100 градусах." },
      { en: "They live in London.", ru: "Они живут в Лондоне." },
      { en: "Do you like coffee?", ru: "Тебе нравится кофе?" }
    ],
    commonMistakes: [
      { 
        wrong: "He go to school.", 
        correct: "He goes to school.", 
        explanationRu: "Для he/she/it добавляем -s к глаголу." 
      },
      { 
        wrong: "She don't like milk.", 
        correct: "She doesn't like milk.", 
        explanationRu: "Для he/she/it используем doesn't." 
      }
    ],
    exercises: [
      {
        id: "ps_ex_1",
        type: "multiple_choice",
        topicKey: "present_simple",
        question: "She ___ English every day.",
        options: [
          { id: "a", text: "study", isCorrect: false, feedbackRu: "Забыто окончание -s для She." },
          { id: "b", text: "studies", isCorrect: true, feedbackRu: "Верно! Для She добавляем -es (y меняется на i)." },
          { id: "c", text: "studying", isCorrect: false, feedbackRu: "Это форма Continuous, здесь нужно простое настоящее." }
        ]
      },
      {
        id: "ps_ex_2",
        type: "fill_blank",
        topicKey: "present_simple",
        sentence: "He ___ (go) to work by bus.",
        correctAnswers: ["goes"],
        feedbackRu: "Для He добавляем -es к глаголу go."
      },
      {
        id: "ps_ex_3",
        type: "fix_mistake",
        topicKey: "present_simple",
        wrongSentence: "They doesn't play football.",
        correctSentence: "They don't play football.",
        explanationRu: "Для They используем don't, а не doesn't."
      },
      {
        id: "ps_ex_4",
        type: "sentence_builder",
        topicKey: "present_simple",
        words: ["like", "they", "pizza", "do", "?"],
        correctSentence: "Do they like pizza?",
        explanationRu: "Вопрос начинается с Do, затем подлежащее и глагол."
      },
      {
        id: "ps_ex_6",
        type: "multiple_choice",
        topicKey: "present_simple",
        question: "Cats ___ milk.",
        options: [
          { id: "a", text: "like", isCorrect: true, feedbackRu: "Правильно! Cats - это 'они' (мн. число), окончание -s не нужно." },
          { id: "b", text: "likes", isCorrect: false, feedbackRu: "Cats - это множественное число, окончание -s используется только для ед. числа (he/she/it)." }
        ]
      },
      {
        id: "ps_ex_7",
        type: "fill_blank",
        topicKey: "present_simple",
        sentence: "I ___ (not / smoke).",
        correctAnswers: ["don't smoke", "do not smoke"],
        feedbackRu: "Для отрицания с I используем do not или don't."
      },
      {
        id: "ps_ex_5",
        type: "writing",
        topicKey: "present_simple",
        prompt: "Напиши 3 предложения о своей ежедневной рутине (например: I wake up at 7, I drink coffee...). Постарайся использовать разные глаголы.",
        minWords: 15
      }
    ]
  },
  present_continuous: {
    key: "present_continuous",
    titleEn: "Present Continuous",
    titleRu: "Настоящее продолженное",
    cefrLevel: "A2",
    category: "Tenses",
    descriptionRu: "Для действий, происходящих прямо сейчас или временных ситуаций.",
    formulas: {
      positive: "am/is/are + verb + ing",
      negative: "am/is/are + not + verb + ing",
      question: "Am/Is/Are + subject + verb + ing?"
    },
    usage: [
      "Действие происходит в момент речи",
      "Временные ситуации",
      "Запланированные действия в будущем",
      "Меняющиеся ситуации"
    ],
    examples: [
      { en: "I am reading a book now.", ru: "Я читаю книгу сейчас." },
      { en: "She is working from home this week.", ru: "На этой неделе она работает из дома." },
      { en: "They are playing football in the garden.", ru: "Они играют в футбол в саду." },
      { en: "What are you doing?", ru: "Что ты делаешь?" }
    ],
    commonMistakes: [
      { 
        wrong: "I reading a book.", 
        correct: "I am reading a book.", 
        explanationRu: "Забыт вспомогательный глагол am." 
      },
      { 
        wrong: "He is read a book.", 
        correct: "He is reading a book.", 
        explanationRu: "Забыто окончание -ing у глагола." 
      }
    ],
    exercises: [
      {
        id: "pc_ex_1",
        type: "multiple_choice",
        topicKey: "present_continuous",
        question: "Look! It ___.",
        options: [
          { id: "a", text: "rains", isCorrect: false, feedbackRu: "Это Present Simple, а нам нужно Continuous для действия в моменте." },
          { id: "b", text: "is raining", isCorrect: true, feedbackRu: "Верно! Действие происходит сейчас." },
          { id: "c", text: "raining", isCorrect: false, feedbackRu: "Нужен вспомогательный глагол is." }
        ]
      }
    ]
  },
  past_simple: {
    key: "past_simple",
    titleEn: "Past Simple",
    titleRu: "Прошедшее простое",
    cefrLevel: "A2",
    category: "Tenses",
    descriptionRu: "Для завершенных действий в прошлом.",
    formulas: {
      positive: "verb + ed (или 2-я форма)",
      negative: "did not + verb",
      question: "Did + subject + verb?"
    },
    usage: [
      "Действие закончилось в прошлом",
      "Последовательность действий в прошлом",
      "Привычки в прошлом"
    ],
    examples: [
      { en: "I visited my grandma yesterday.", ru: "Я навестил бабушку вчера." },
      { en: "She went to Paris last year.", ru: "Она ездила в Париж в прошлом году." },
      { en: "We didn't see the movie.", ru: "Мы не видели этот фильм." },
      { en: "Did you finish your homework?", ru: "Ты закончил домашнее задание?" }
    ],
    commonMistakes: [
      { 
        wrong: "I didn't saw him.", 
        correct: "I didn't see him.", 
        explanationRu: "После didn't глагол используется в начальной форме." 
      },
      { 
        wrong: "He seed the bird.", 
        correct: "He saw the bird.", 
        explanationRu: "See - неправильный глагол, его 2-я форма - saw." 
      }
    ],
    exercises: []
  },
  past_continuous: {
    key: "past_continuous",
    titleEn: "Past Continuous",
    titleRu: "Прошедшее продолженное",
    cefrLevel: "B1",
    category: "Tenses",
    descriptionRu: "Для действий, которые находились в процессе в определенный момент в прошлом.",
    formulas: {
      positive: "was/were + verb + ing",
      negative: "was/were + not + verb + ing",
      question: "Was/Were + subject + verb + ing?"
    },
    usage: [
      "Действие в процессе в конкретное время в прошлом",
      "Два действия происходили одновременно",
      "Фоновое действие, прерванное другим действием"
    ],
    examples: [
      { en: "I was sleeping at 10 PM yesterday.", ru: "Я спал в 10 вечера вчера." },
      { en: "They were watching TV when I arrived.", ru: "Они смотрели ТВ, когда я пришел." },
      { en: "While she was cooking, he was reading.", ru: "Пока она готовила, он читал." }
    ],
    commonMistakes: [
      { 
        wrong: "They was playing.", 
        correct: "They were playing.", 
        explanationRu: "Для They используем were." 
      }
    ],
    exercises: []
  }
}
