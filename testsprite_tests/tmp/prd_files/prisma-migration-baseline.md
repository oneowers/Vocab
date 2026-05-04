# Prisma migration baseline

## What was wrong

The repository did not contain a true initial Prisma baseline.

- The earliest active migration, `20260428120000_server_first_perf`, starts with `ALTER TABLE "WordCatalog"` and assumes the core tables already exist.
- A shadow database replay from empty state would fail on that first migration because `WordCatalog`, `Card`, and `ReviewLog` have not been created yet.
- The later migrations for `PracticeSessionProgress` and `AppAnalytics` were valid incrementals, but they depended on that missing initial schema history.
- `20260429130000_expand_app_analytics` had to be applied manually with `prisma db execute` and then marked as applied with `prisma migrate resolve`, which kept the live database aligned but did not fix the history problem for future `prisma migrate dev`.

## What changed

The active migration history was converted into a safe squashed baseline strategy.

- Added `prisma/migrations/20260428000000_squashed_baseline/migration.sql`.
- The baseline creates the full current Prisma schema from an empty database.
- The baseline also preserves the custom `WordCatalog.search_vector` generated column and GIN index that existed only in legacy SQL.
- The three original migration SQL files were archived into `prisma/migrations_archive_legacy/`.
- The original migration names remain in `prisma/migrations/`, but now as no-op placeholders. This keeps existing `_prisma_migrations` rows valid on already deployed databases while making the on-disk history replayable.

## Why this strategy is safer

This avoids destructive database work and avoids rewriting production data.

- Fresh databases can apply the baseline and reach the current schema without relying on hidden prehistory.
- Existing databases do not need table resets or data copies.
- Production alignment can be done with a single manual `migrate resolve` command that only updates Prisma migration bookkeeping.

## How to verify locally

Safe checks:

```bash
npx prisma validate
npx prisma format
npx prisma migrate status
npx tsc --noEmit
npm run build
```

Expected outcomes:

- `validate` succeeds.
- `format` is idempotent.
- `migrate status` reports the database is up to date on already aligned environments.
- TypeScript and Next.js build remain green.

Replayability note:

- The historical failure is visible directly in the old archived SQL: the first legacy migration started with `ALTER TABLE` statements instead of table creation.
- Because the new baseline contains the full schema and the remaining active legacy migrations are placeholders, a fresh migration replay no longer depends on missing history.
- Do not run shadow-database checks against production Neon without an explicitly approved disposable shadow database, because Prisma may create and mutate that shadow database.

## Safe commands

For a fresh local or preview database:

```bash
npx prisma migrate deploy
```

For future schema changes:

```bash
npx prisma migrate dev --name <change_name>
```

For CI or deploy pipelines:

```bash
npx prisma migrate deploy
```

## Manual commands for existing deployed databases

These commands must be run manually by an operator against each already-initialized shared database. They were intentionally not executed automatically in this cleanup.

1. Confirm the database already has the old migration names applied:

```bash
npx prisma migrate status
```

2. Mark the new baseline as applied without re-running SQL:

```bash
npx prisma migrate resolve --applied 20260428000000_squashed_baseline
```

3. Re-check status:

```bash
npx prisma migrate status
```

Important:

- Run `migrate resolve` only on databases that already contain the full schema represented by the baseline.
- Do not run the baseline SQL directly against an existing populated production database.
- Do not use `prisma db push` for shared environments.

## Future migration workflow

1. Edit `prisma/schema.prisma`.
2. Create a normal migration:

```bash
npx prisma migrate dev --name <descriptive_name>
```

3. Review the generated SQL before merging.
4. Deploy with:

```bash
npx prisma migrate deploy
```

5. If a migration ever needs manual SQL again, document the reason in this file and pair it with a matching `migrate resolve` step.

## Remaining risks

- The custom `search_vector` column still lives only in SQL, not in the Prisma datamodel, so future refactors to `WordCatalog` should review baseline SQL as well as `schema.prisma`.
- Existing shared databases still require the one-time manual `migrate resolve --applied 20260428000000_squashed_baseline` step.
- A full shadow-database replay was not executed here because doing so safely would require an explicitly disposable shadow database target, not the shared Neon environment.
