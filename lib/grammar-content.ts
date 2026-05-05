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
  descriptionEn: string
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
  to_be: {
    key: "to_be",
    titleEn: "Verb 'to be'",
    titleRu: "Глагол 'to be'",
    cefrLevel: "A1",
    category: "Basics",
    descriptionEn: "The foundation of English. Used to express state or location.",
    descriptionRu: "Основа английского языка. Обозначает состояние или нахождение.",
    formulas: { positive: "am / is / are", negative: "am not / isn't / aren't", question: "Am / Is / Are ...?" },
    usage: ["Имя", "Возраст", "Профессия", "Местоположение"],
    examples: [{ en: "I am happy.", ru: "Я счастлив." }],
    commonMistakes: [{ wrong: "I is.", correct: "I am.", explanationRu: "Для I всегда am." }],
    exercises: [{ id: "tb1", type: "multiple_choice", topicKey: "to_be", question: "She ___ a doctor.", options: [{ id: "a", text: "am", isCorrect: false, feedbackRu: "" }, { id: "b", text: "is", isCorrect: true, feedbackRu: "Для She используется is." }, { id: "c", text: "are", isCorrect: false, feedbackRu: "" }] }]
  }
}


