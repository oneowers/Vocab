# Documentation: Lexiflow (Vocabulary Learning App)

## 1. Project Overview
**Lexiflow** — это инновационное веб-приложение для изучения английского языка, которое объединяет традиционные методы интервального повторения с современными технологиями ИИ.

### Главная проблема
Многие изучающие язык сталкиваются с "плато" на уровнях B1-B2, отсутствием персонализированной практики и сложностью интеграции новых слов в активный словарный запас. Lexiflow решает это через умный подбор контента и ИИ-челленджи.

### Основные пользователи
- Студенты, готовящиеся к экзаменам (IELTS, TOEFL).
- Профессионалы, которым нужен английский для работы.
- Путешественники и те, кто изучает язык для повседневного общения.

### Основные функции
- **CEFR Profiler**: Оценка уровня владения языком (от A1 до C2) при первом входе.
- **Word Catalog**: Библиотека из тысяч слов, распределенных по уровням и темам.
- **Spaced Repetition (SRS)**: Система умных карточек для запоминания слов.
- **AI Practice**: Генерация заданий на написание текстов и перевод с проверкой грамматики в реальном времени.
- **Grammar Hub**: Интерактивная база данных грамматических правил с анализом типичных ошибок пользователя.
- **Analytics Dashboard**: Визуализация прогресса, стрики (ударный режим) и статистика обучения.

---

## 2. Tech Stack
### Frontend
- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS + Custom "Liquid Glass" design system
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Charts**: Recharts

### Backend
- **Framework**: Next.js Route Handlers (Server-side logic)
- **ORM**: Prisma
- **Validation**: Zod
- **AI Orchestration**: Vercel AI SDK

### Database
- **Primary DB**: PostgreSQL (размещен на Supabase)
- **Connection**: Prisma Client with Accelerate/Direct pooling

### Authentication
- **Provider**: Supabase Auth (Google & Email/Password)
- **Security**: bcryptjs для хэширования (гибридная модель с локальной БД)

### External APIs / Services
- **AI Service**: Google Gemini 1.5 Flash (через API), Vercel AI Gateway
- **Translation**: DeepL API / Langeek (для качественного перевода контекста)
- **Hosting**: Vercel

---

## 3. Project Architecture
Приложение следует архитектуре **Next.js Fullstack**:

- **Frontend <-> Backend**: Клиентские компоненты взаимодействуют с серверными через API Routes (`/api/*`) и Server Actions.
- **Backend <-> Database**: Prisma выступает в роли типобезопасного слоя между бизнес-логикой и PostgreSQL.
- **Data Storage**: Основные данные хранятся в реляционной базе. Тяжелые ассеты (аватары) — в Supabase Storage.
- **AI Integration**: Backend-роуты отправляют промпты к LLM (Gemini), обрабатывают JSON-ответы и сохраняют результаты в БД (напр. `GrammarFinding`).

---

## 4. Folder Structure
```text
/
├── app/                    # Next.js App Router (Routes, Layouts, APIs)
│   ├── (app)/              # Защищенные роуты приложения (dashboard, cards, etc.)
│   ├── (auth)/             # Роуты авторизации (login, register)
│   ├── admin/              # Панель администратора
│   ├── api/                # Эндпоинты API
│   └── onboarding/         # Процесс настройки профиля и теста уровня
├── components/             # Реализуемые компоненты UI
│   ├── ui/                 # Базовые атомарные компоненты (Buttons, Cards)
│   ├── shared/             # Переиспользуемые сложные компоненты
│   └── practice/           # Логика и UI для сессий практики
├── hooks/                  # Пользовательские React-хуки
├── lib/                    # Утилиты, конфигурации и серверная логика
│   ├── ai.ts               # Интеграция с LLM
│   ├── prisma.ts           # Клиент базы данных
│   ├── supabase-server.ts  # Серверный клиент Supabase
│   └── types/              # TypeScript определения
├── prisma/                 # Схема базы данных и миграции
├── public/                 # Статические файлы
├── scripts/                # Скрипты для сидинга и обслуживания БД
└── styles/                 # Глобальные стили
```

---

## 5. Features Documentation

### Feature: CEFR Level Test
- **Что делает**: Проводит адаптивный тест для определения уровня словаря.
- **Как работает**: Пользователю показывают слова разной сложности, он отмечает, знает ли он их.
- **API**: `POST /api/onboarding/level-test`
- **Сохраняет**: `cefrLevel`, `levelTestCorrect`, `levelTestMistakes` в модели `User`.

### Feature: AI Writing Challenge
- **Что делает**: Предлагает написать текст на заданную тему с использованием целевых слов.
- **Как работает**: ИИ оценивает текст, исправляет ошибки и дает фидбек.
- **API**: `POST /api/practice/writing-challenge`
- **Сохраняет**: Запись в `PracticeWritingChallenge` и `GrammarFinding`.

---

## 6. Authentication & Authorization
- **Регистрация**: Через форму (Email/Pass) или Google. При регистрации создается запись в Supabase Auth и локальной таблице `User`.
- **Login**: Проверка через bcrypt или Supabase session.
- **JWT**: Используются сессионные куки Supabase (`sb-access-token`).
- **Роли**: `USER`, `PRO`, `ADMIN`.
- **Защита**: Middleware проверяет сессию и перенаправляет неавторизованных пользователей на `/login`.

---

## 7. Database Schema (Основные модели)

### User
- `id`: UUID, PK
- `email`: String, Unique
- `role`: Role (USER/ADMIN)
- `cefrLevel`: CefrLevel
- `streak`: Int
- `reviewLives`: Int (Количество жизней для сессии)

### Card (Карточки пользователя)
- `userId`: Внешний ключ на User
- `original`: Оригинальное слово (если не из каталога)
- `translation`: Перевод
- `nextReviewDate`: Дата следующего повторения
- `lastReviewResult`: Результат последнего повторения (known/unknown)

### WordCatalog (Общий словарь)
- `word`: Слово (Unique)
- `cefrLevel`: Уровень сложности
- `topic`: Тематика (напр. "Work", "Travel")

---

## 8. API Documentation

### `POST /api/auth/login`
- **URL**: `/api/auth/login`
- **Description**: Авторизация по email и паролю.
- **Request**: `{ "email": "...", "password": "..." }`
- **Response**: `{ "message": "Login successful", "redirectTo": "..." }`
- **Errors**: 400 (Invalid data), 401 (Wrong email or password), 500 (Server error).

### `GET /api/cards`
- **URL**: `/api/cards`
- **Description**: Получение карточек пользователя с фильтрацией.
- **Query Params**: `status` (known/unknown), `search` (string), `due` (today).
- **Response**: Список карточек и summary (streak, totalCards, dueToday).
- **Auth**: Required.

### `POST /api/cards`
- **URL**: `/api/cards`
- **Description**: Создание новой карточки (кастомной или из каталога).
- **Request**: `{ "original": "...", "translation": "...", "direction": "en-ru" }`
- **Response**: Объект созданной карточки.

---

## 9. Environment Variables
| Название | Назначение | Обязательность |
| :--- | :--- | :--- |
| `DATABASE_URL` | Подключение к PostgreSQL | Да |
| `NEXT_PUBLIC_SUPABASE_URL` | URL Supabase API | Да |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Анонимный ключ Supabase | Да |
| `GEMINI_API_KEY` | API ключ для Google Gemini | Да |
| `AI_PROVIDER_ORDER` | Приоритет провайдеров ИИ | Нет (default: gemini,gateway) |

---

## 10. Installation & Setup
1. **Клонирование**: `git clone <repo_url>`
2. **Зависимости**: `npm install`
3. **Окружение**: Скопируйте `.env.example` в `.env.local` и заполните значения.
4. **Prisma**: Сгенерируйте клиент и примените схему:
   ```bash
   npx prisma generate
   npx prisma db push
   ```
5. **Сидинг**: Импортируйте CEFR базу:
   ```bash
   npm run seed:cefr:import
   ```
6. **Запуск**: `npm run dev`

---

## 11. Deployment
- **Vercel**: Проект оптимизирован для Vercel.
- **GitHub Integration**: Деплой происходит автоматически при пуше в `main`.
- **Migrations**: `prisma migrate deploy` выполняется на этапе сборки.

---

## 12. Testing
- **Unit**: Тесты логики интервальных повторений в `lib/spaced-repetition.ts`.
- **API**: Проверка эндпоинтов на корректность статус-кодов.
- **Frontend**: Тестирование компонентов через TestSprite.

---

## 13. Error Handling
- **API**: Все ошибки возвращают JSON с полем `message`.
- **Frontend**: Использование React Error Boundaries для изоляции сбоев.
- **Logs**: Ошибки пишутся в стандартный поток вывода (Vercel Logs).

---

## 14. Security
- **Хэширование**: `bcryptjs` для паролей.
- **CORS**: Настроен в `next.config.mjs` и middleware.
- **RLS**: Row Level Security в Supabase для защиты таблиц.
- **Validation**: Strict validation через `zod` на всех API эндпоинтах.

---

## 15. Future Improvements
- Внедрение WebSockets для real-time чата.
- Оптимизация поиска через Meilisearch или Elastic.
- Поддержка оффлайн-режима (PWA).

---
