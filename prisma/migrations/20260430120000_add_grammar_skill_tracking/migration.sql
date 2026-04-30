CREATE TYPE "GrammarSeverity" AS ENUM ('low', 'medium', 'high');

CREATE TYPE "GrammarFindingSourceType" AS ENUM ('writing_challenge');

ALTER TABLE "PracticeWritingChallenge"
ADD COLUMN "grammarFindings" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN "grammarScoreAppliedAt" TIMESTAMP(3);

CREATE TABLE "GrammarTopic" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "titleEn" TEXT NOT NULL,
    "titleRu" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "cefrLevel" "CefrLevel" NOT NULL,
    "description" TEXT NOT NULL,
    "examples" JSONB NOT NULL DEFAULT '[]',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GrammarTopic_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "UserGrammarSkill" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "evidenceCount" INTEGER NOT NULL DEFAULT 0,
    "positiveEvidenceCount" INTEGER NOT NULL DEFAULT 0,
    "negativeEvidenceCount" INTEGER NOT NULL DEFAULT 0,
    "lastDetectedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserGrammarSkill_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "GrammarFinding" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "sourceType" "GrammarFindingSourceType" NOT NULL,
    "sourceId" TEXT,
    "originalText" TEXT NOT NULL,
    "correctedText" TEXT NOT NULL,
    "explanationRu" TEXT NOT NULL,
    "severity" "GrammarSeverity" NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "scoreDelta" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GrammarFinding_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "GrammarTopic_key_key" ON "GrammarTopic"("key");
CREATE INDEX "GrammarTopic_isActive_cefrLevel_category_idx" ON "GrammarTopic"("isActive", "cefrLevel", "category");

CREATE UNIQUE INDEX "UserGrammarSkill_userId_topicId_key" ON "UserGrammarSkill"("userId", "topicId");
CREATE INDEX "UserGrammarSkill_userId_score_idx" ON "UserGrammarSkill"("userId", "score");
CREATE INDEX "UserGrammarSkill_topicId_idx" ON "UserGrammarSkill"("topicId");

CREATE UNIQUE INDEX "GrammarFinding_sourceType_sourceId_topicId_key" ON "GrammarFinding"("sourceType", "sourceId", "topicId");
CREATE INDEX "GrammarFinding_userId_idx" ON "GrammarFinding"("userId");
CREATE INDEX "GrammarFinding_topicId_idx" ON "GrammarFinding"("topicId");
CREATE INDEX "GrammarFinding_userId_createdAt_idx" ON "GrammarFinding"("userId", "createdAt" DESC);
CREATE INDEX "GrammarFinding_sourceType_sourceId_idx" ON "GrammarFinding"("sourceType", "sourceId");

ALTER TABLE "UserGrammarSkill"
ADD CONSTRAINT "UserGrammarSkill_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "UserGrammarSkill"
ADD CONSTRAINT "UserGrammarSkill_topicId_fkey"
FOREIGN KEY ("topicId") REFERENCES "GrammarTopic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "GrammarFinding"
ADD CONSTRAINT "GrammarFinding_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "GrammarFinding"
ADD CONSTRAINT "GrammarFinding_topicId_fkey"
FOREIGN KEY ("topicId") REFERENCES "GrammarTopic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

INSERT INTO "GrammarTopic" (
  "id",
  "key",
  "titleEn",
  "titleRu",
  "category",
  "cefrLevel",
  "description",
  "examples",
  "isActive",
  "createdAt",
  "updatedAt"
) VALUES
  (
    'grammar-topic-present-simple',
    'present_simple',
    'Present Simple',
    'Present Simple',
    'tenses',
    'A1',
    'Use Present Simple for habits, facts, routines, and regular actions.',
    '["I work every day.", "She likes coffee.", "They live in Tashkent."]'::jsonb,
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    'grammar-topic-present-continuous',
    'present_continuous',
    'Present Continuous',
    'Present Continuous',
    'tenses',
    'A1',
    'Use Present Continuous for actions happening now or temporary situations.',
    '["I am studying now.", "She is reading a book.", "They are working today."]'::jsonb,
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    'grammar-topic-present-simple-vs-present-continuous',
    'present_simple_vs_present_continuous',
    'Present Simple vs Present Continuous',
    'Present Simple vs Present Continuous',
    'tenses',
    'A2',
    'Choose Present Simple for routines and Present Continuous for actions happening now.',
    '["I usually walk to work.", "I am walking to work now.", "He works every day, but he is resting today."]'::jsonb,
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    'grammar-topic-past-simple',
    'past_simple',
    'Past Simple',
    'Past Simple',
    'tenses',
    'A2',
    'Use Past Simple for completed actions in the past.',
    '["I visited Samarkand last year.", "She watched a movie yesterday.", "They finished the task."]'::jsonb,
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    'grammar-topic-future-simple',
    'future_simple',
    'Future Simple',
    'Future Simple',
    'tenses',
    'A2',
    'Use will or be going to to talk about future actions, plans, and predictions.',
    '["I will call you tomorrow.", "She is going to study tonight.", "It will be sunny."]'::jsonb,
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    'grammar-topic-articles-a-an-the',
    'articles_a_an_the',
    'Articles: a, an, the',
    'Артикли: a, an, the',
    'articles',
    'A2',
    'Use articles to show whether a noun is general, one of many, or specific.',
    '["I saw a dog.", "She ate an apple.", "The book is on the table."]'::jsonb,
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    'grammar-topic-prepositions-of-time',
    'prepositions_of_time',
    'Prepositions of Time',
    'Предлоги времени',
    'prepositions',
    'A1',
    'Use in, on, and at correctly with time expressions.',
    '["at 7 o’clock", "on Monday", "in April"]'::jsonb,
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    'grammar-topic-prepositions-of-place',
    'prepositions_of_place',
    'Prepositions of Place',
    'Предлоги места',
    'prepositions',
    'A1',
    'Use in, on, at, under, near, and next to to describe location.',
    '["The phone is on the table.", "She is at school.", "The keys are in my bag."]'::jsonb,
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    'grammar-topic-plural-nouns',
    'plural_nouns',
    'Plural Nouns',
    'Множественное число существительных',
    'nouns',
    'A1',
    'Use regular and common irregular plural noun forms correctly.',
    '["one book, two books", "one child, two children", "one person, two people"]'::jsonb,
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    'grammar-topic-subject-verb-agreement',
    'subject_verb_agreement',
    'Subject-Verb Agreement',
    'Согласование подлежащего и сказуемого',
    'sentence_structure',
    'A2',
    'Make the verb match the subject, especially in Present Simple.',
    '["She works.", "They work.", "My friend likes tea."]'::jsonb,
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    'grammar-topic-word-order',
    'word_order',
    'Word Order',
    'Порядок слов',
    'sentence_structure',
    'A1',
    'Use natural English word order in statements, questions, and short answers.',
    '["I like English.", "Do you like English?", "She is at home."]'::jsonb,
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    'grammar-topic-time-oclock',
    'time_oclock',
    'Time / o’clock',
    'Время / o’clock',
    'time',
    'A1',
    'Use time expressions like o’clock, half past, and quarter to correctly.',
    '["It is five o’clock.", "It is half past six.", "The lesson starts at seven."]'::jsonb,
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  )
ON CONFLICT ("key") DO UPDATE SET
  "titleEn" = EXCLUDED."titleEn",
  "titleRu" = EXCLUDED."titleRu",
  "category" = EXCLUDED."category",
  "cefrLevel" = EXCLUDED."cefrLevel",
  "description" = EXCLUDED."description",
  "examples" = EXCLUDED."examples",
  "updatedAt" = CURRENT_TIMESTAMP;
