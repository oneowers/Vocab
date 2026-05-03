import { GrammarTopicContent } from "../lib/grammar-content";

export const GRAMMAR_TOPICS: Record<string, GrammarTopicContent> = {
  to_be: {
    key: "to_be",
    titleEn: "Verb 'to be'",
    titleRu: "Глагол 'to be'",
    cefrLevel: "A1",
    category: "Basics",
    descriptionRu: "Основа английского языка. Обозначает состояние или нахождение.",
    formulas: { positive: "am / is / are", negative: "am not / isn't / aren't", question: "Am / Is / Are ...?" },
    usage: ["Имя", "Возраст", "Профессия", "Местоположение"],
    examples: [{ en: "I am happy.", ru: "Я счастлив." }],
    commonMistakes: [{ wrong: "I is.", correct: "I am.", explanationRu: "Для I всегда am." }],
    exercises: [{ id: "tb1", type: "multiple_choice", topicKey: "to_be", question: "She ___ a doctor.", options: [{ id: "a", text: "am", isCorrect: false }, { id: "b", text: "is", isCorrect: true }] }]
  },
  // (Остальные 41 тема находятся в базе данных. Это резервный файл.)
};
