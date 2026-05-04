# Lexiflow 🌊

**Lexiflow** — это современное веб-приложение для изучения английского языка, разработанное специально для русскоязычных пользователей. Проект сочетает в себе эстетику Apple "Liquid Glass" с мощными инструментами ИИ для глубокого погружения в язык.

## 🚀 Стек технологий
- **Core**: Next.js 14 (App Router), TypeScript
- **Database**: PostgreSQL (Supabase / Neon), Prisma ORM
- **UI/UX**: Tailwind CSS, Framer Motion, Lucide Icons
- **AI**: Google Gemini API, Vercel AI SDK
- **Auth**: Supabase Auth (Google OAuth & Email/Password)

## 🛠 Установка
1. Клонируйте репозиторий:
   ```bash
   git clone https://github.com/oneowerse/lexiflow.git
   ```
2. Установите зависимости:
   ```bash
   npm install
   ```
3. Настройте переменные окружения:
   Скопируйте `.env.example` в `.env.local` и заполните ключи для Supabase, Prisma и Gemini.

## 🏁 Запуск
Для запуска сервера разработки:
```bash
npm run dev
```
Приложение будет доступно по адресу [http://localhost:3000](http://localhost:3000).

## 📜 Основные команды
- `npm run dev` — запуск в режиме разработки.
- `npm run build` — сборка проекта для продакшена.
- `npm run db:generate` — генерация клиента Prisma.
- `npx prisma db push` — синхронизация схемы БД (для разработки).
- `npm run seed:cefr:import` — импорт базового словаря CEFR.

## 🔗 Demo
[https://lexiflow-app.vercel.app](https://lexiflow-app.vercel.app)

## 👤 Автор
skycoax

---
*Подробная техническая документация доступна в папке [docs/](./docs/).*
