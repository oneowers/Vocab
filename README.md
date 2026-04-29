# LexiFlow

LexiFlow is a Next.js 14 vocabulary learning app for Russian-speaking English learners. It supports Google OAuth with Supabase, a Neon PostgreSQL database through Prisma, spaced repetition review modes, per-user statistics, and an admin panel.

## Stack

- Next.js 14 App Router
- TypeScript (strict mode)
- Tailwind CSS
- Supabase Auth (Google OAuth)
- Prisma ORM
- Neon PostgreSQL
- Vercel deployment target

## Features

- Translator panel with MyMemory translation proxy and Free Dictionary metadata proxy
- Guest mode with local demo deck and disabled write actions
- Dashboard with deck management, tag filters, JSON export/import, and TTS
- Review page with Flip, Write, and Quiz modes
- Stats page with streaks, accuracy, hardest cards, due counts, and tag breakdown
- Admin overview, users, cards, and analytics screens

## Environment Variables

Create `.env.local` from `.env.example` and fill in:

```bash
cp .env.example .env.local
```

Required keys:

- `DATABASE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXTAUTH_SECRET`
- `NEXT_PUBLIC_GUEST_MODE`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

`NEXT_PUBLIC_GUEST_MODE=true` enables guest mode and keeps Google sign-in visually disabled until OAuth is ready.

## Local Development

1. Install dependencies:

```bash
npm install
```

2. Generate the Prisma client:

```bash
npm run db:generate
```

3. Push the schema to your database:

```bash
npm run db:push
```

4. Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Authentication Flow

- `/login` shows Google sign-in and, when guest mode is enabled, a `Continue as Guest` option.
- `/api/auth/callback` exchanges the Supabase OAuth code for a session and creates the first database user as `ADMIN`.
- App routes use the authenticated Supabase session when guest mode is off.

## Review Logic

- `Don't know` schedules the card for tomorrow.
- `I know it` schedules the card 15 days ahead and increments `reviewCount`.
- `reviewCount >= 3` is treated as mastered.
- Cards are due when `nextReviewDate <= today`.

## Deployment

1. Create a Supabase project and enable Google in Authentication Providers.
2. Connect Neon to the Vercel project.
3. Add all environment variables in Vercel Project Settings.
4. Keep `NEXT_PUBLIC_GUEST_MODE=true` until Google OAuth credentials are configured everywhere.
5. Deploy to Vercel.
6. Run:

```bash
npm run db:generate
npm run db:push
```

7. When OAuth is ready, set `NEXT_PUBLIC_GUEST_MODE=false` and redeploy.

## Verification

The current implementation has been verified with:

```bash
npm run lint
npm run build
```
