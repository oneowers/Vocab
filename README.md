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
- `KV_REST_API_URL` or `UPSTASH_REDIS_REST_URL`
- `KV_REST_API_TOKEN` or `UPSTASH_REDIS_REST_TOKEN`
- `AI_GATEWAY_API_KEY` or a fresh `VERCEL_OIDC_TOKEN` from `vercel env pull` for AI Gateway
- `GEMINI_API_KEY` as the fallback AI provider
- `AI_GATEWAY_MODEL` defaults to `openai/gpt-5.4`
- `GEMINI_MODEL` defaults to `gemini-2.5-flash`

`NEXT_PUBLIC_GUEST_MODE=true` enables guest mode and keeps Google sign-in visually disabled until OAuth is ready.

AI features use `AI_PROVIDER_ORDER=gateway,gemini` by default when Vercel/Gateway env is present, and fall back to Gemini if Gateway auth fails. For local development with OIDC, re-run `vercel env pull` when the token expires.

## Local Development

1. Install dependencies:

```bash
npm install
```

2. Generate the Prisma client:

```bash
npm run db:generate
```

3. Apply migrations to your database:

```bash
npx prisma migrate deploy
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
npx prisma migrate deploy
```

7. When OAuth is ready, set `NEXT_PUBLIC_GUEST_MODE=false` and redeploy.

## Verification

The current implementation has been verified with:

```bash
npm run lint
npm run build
```

## Prisma migrations

- The active Prisma history uses a squashed baseline plus legacy no-op placeholders.
- Read [docs/prisma-migration-baseline.md](/Users/tokiancunin/Downloads/lexiflow_-vocabulary-learning-app/docs/prisma-migration-baseline.md) before creating or resolving migrations.
- Use `npx prisma migrate dev --name <change_name>` for new schema work.
- Use `npx prisma migrate deploy` for deploys.
- Do not use `prisma db push` on shared environments.
