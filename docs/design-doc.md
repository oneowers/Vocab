# LexiFlow Design Document (Liquid Glass Edition)

## 1. Overview
LexiFlow is a premium vocabulary learning application specifically designed for Russian-speaking English learners. It combines advanced Spaced Repetition System (SRS) mechanics with a state-of-the-art "Liquid Glass" (Nebula Flux) design aesthetic, inspired by iOS 26 and modern glassmorphism.

## 2. Technology Stack
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript (Strict Mode)
- **Styling**: Tailwind CSS with custom Liquid Glass design tokens
- **Database**: Neon PostgreSQL via Prisma ORM
- **Authentication**: Supabase Auth (Google OAuth)
- **AI Integration**: Vercel AI SDK / Gemini 1.5/2.5 Flash
- **Deployment**: Vercel

## 3. Design System: Liquid Glass (Nebula Flux)
LexiFlow utilizes a unique design language called **Liquid Glass**, characterized by:
- **Translucency**: Extensive use of backdrop-blur and semi-transparent surfaces.
- **Nebula Gradients**: Deep indigo and violet ambient backgrounds with aurora-like radial glows.
- **Premium Shadows**: Multi-layered shadows (`shadow-card`, `shadow-panel`) that create realistic depth.
- **Haptic Interactions**: Subtle scale transitions and micro-animations using Framer Motion.
- **Dynamic Themes**: Fully functional **Light** and **Dark** modes managed via `ThemeProvider` and CSS variables (`apple-theme.css`).

### Theme Variables (Semantic Layer)
- `--bg-primary`: Main app background.
- `--bg-secondary`: Card/Panel backgrounds.
- `--text-ink`: Primary high-contrast text.
- `--accent`: Brand blue (#007aff).
- `--separator`: Subtle line borders.

## 4. System Architecture

### Data Layer (`lib/server-data.ts`)
A centralized aggregation layer that prepares data for the UI, handling:
- Combined dashboard views (Cards, Stats, Daily Catalog).
- Complex review session payloads.
- Admin analytics and user management data.

### Spaced Repetition (SRS)
- **Intervals**: 1 day (Incorrect) -> 15 days (Correct).
- **Mastery**: `reviewCount >= 3` marks a word as "Mastered".
- **Due Logic**: Cards are due when `nextReviewDate <= today`.

### AI Engine (`app/api/ai-chat/route.ts`)
A robust AI provider system that:
- Uses **AI Gateway** (OpenAI/Mistral) as the primary provider.
- Falls back to **Gemini API** for resilience.
- Powers Writing Challenges, Feedback, and Grammar Explanations.

## 5. Core Modules

### 1. Dashboard & Card Management
- Compact card grid with CEFR level indicators.
- Multi-status filtering (All, Waiting, Learning, Mastered).
- JSON Export/Import for deck portability.
- Built-in Text-to-Speech (TTS) for pronunciation.

### 2. Review Session (`components/ReviewSession.tsx`)
A multi-stage immersive learning experience:
- **Flip**: Active recall/flashcard mode.
- **Quiz**: Matching pairs (Translation vs. Original).
- **Write**: Active production (Spelling check).
- **Challenge**: AI-powered Writing Challenge using target vocabulary.

### 3. Grammar Hub (`/grammar`)
A dedicated theory section separated from practice:
- Categorized grammar topics (Tenses, Articles, Modal Verbs).
- CEFR-aligned progression (A1 to B2).
- Interactive lessons with AI coaching.

### 4. Admin Panel (`/admin`)
Full-scale administrative dashboard:
- **Analytics**: Overview of total reviews, cards, and active users.
- **User Management**: Detailed view of student progress and decks.
- **Card Explorer**: Global search and management of all vocabulary items.

## 6. Project Directory Structure
```text
/app         - Route handlers and page components
/components  - Reusable UI components (Liquid Glass tokens)
/lib         - Core logic (Auth, SRS, Server Data, AI)
/prisma      - Schema and migrations
/styles      - Global CSS and Apple-inspired theme variables
/scripts     - Database seeding and CEFR enrichment tools
/docs        - Documentation and roadmaps
```

## 7. Roadmap & Future
- **Streak Recovery System**: Special sessions to restore broken streaks.
- **Interactive Onboarding**: Guided CEFR assessment for new users.
- **Advanced Gamification**: XP systems and level-up rewards.
