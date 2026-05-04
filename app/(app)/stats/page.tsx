import { StatsFilter } from "@/components/StatsFilter"
import { requireSignedInAppUser } from "@/lib/auth"
import { getDetailedUserStatsData } from "@/lib/server-data"

function formatShortDay(date: string) {
  return new Date(`${date}T00:00:00.000Z`).toLocaleDateString("en-US", {
    weekday: "short",
    timeZone: "UTC"
  })
}

function formatDisplayDate(date: string) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric"
  })
}

export default async function StatsPage({
  searchParams
}: {
  searchParams: { range?: string }
}) {
  const user = await requireSignedInAppUser()
  const range = searchParams.range || "7d"
  const daysCount = range === "all" ? 365 : parseInt(range) || 7
  const stats = user ? await getDetailedUserStatsData(user.id, daysCount) : null

  if (!stats) {
    return null
  }

  const maxWeeklyValue = Math.max(1, ...stats.weeklyProgress.map((item) => item.value))
  const cefrEntries = Object.entries(stats.cardsByCefrLevel)

  return (
    <div className="space-y-5">
      <StatsFilter />
      
      <section className="grid grid-cols-3 gap-3">
        <article className="panel rounded-[1.5rem] p-3 md:rounded-[2rem] md:p-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-quiet md:text-xs md:tracking-[0.24em]">
            Cards learned
          </p>
          <p className="mt-3 text-[24px] font-semibold text-ink md:mt-4 md:text-4xl">
            {stats.summary.totalCardsLearned}
          </p>
        </article>
        <article className="panel rounded-[1.5rem] p-3 md:rounded-[2rem] md:p-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-quiet md:text-xs md:tracking-[0.24em]">
            Current streak
          </p>
          <p className="mt-3 text-[24px] font-semibold text-ink md:mt-4 md:text-4xl">
            {stats.summary.currentStreak}
          </p>
        </article>
        <article className="panel rounded-[1.5rem] p-3 md:rounded-[2rem] md:p-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-quiet md:text-xs md:tracking-[0.24em]">
            Active days
          </p>
          <p className="mt-3 text-[24px] font-semibold text-ink md:mt-4 md:text-4xl">
            {stats.summary.activeDays}
          </p>
        </article>
      </section>

      <section className="panel rounded-[2rem] p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="section-label">Weekly progress</p>
            <h2 className="mt-1 text-lg font-semibold text-ink">Last 7 days reviews</h2>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          {stats.weeklyProgress.map((item) => (
            <div key={item.date} className="grid grid-cols-[44px_1fr_auto] items-center gap-3">
              <span className="text-sm font-semibold text-muted">{formatShortDay(item.date)}</span>
              <div className="h-3 overflow-hidden rounded-full bg-white/[0.06]">
                <div
                  className="h-full rounded-full bg-[var(--accent)] transition-[width]"
                  style={{ width: `${(item.value / maxWeeklyValue) * 100}%` }}
                />
              </div>
              <span className="min-w-6 text-right text-sm font-semibold text-ink">{item.value}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="panel rounded-[2rem] p-5">
        <p className="section-label">Cards by CEFR level</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {cefrEntries.map(([level, count]) => (
            <span
              key={level}
              className="rounded-full border border-white/[0.08] bg-white/[0.04] px-4 py-2 text-sm font-semibold text-ink"
            >
              {level} ({count})
            </span>
          ))}
        </div>
      </section>

      <section className="panel rounded-[2rem] p-5">
        <p className="section-label">Recent mistakes</p>
        <div className="mt-4 space-y-3">
          {stats.recentMistakes.length ? (
            stats.recentMistakes.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 rounded-[1.5rem] bg-white/[0.04] px-4 py-4"
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold text-ink">{item.word}</p>
                  <p className="mt-1 text-sm text-quiet">{formatDisplayDate(item.createdAt)}</p>
                </div>
                <span className="rounded-full bg-[var(--destructive-soft)] px-3 py-1 text-xs font-semibold text-[var(--destructive)]">
                  mistake
                </span>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted">No recent mistakes. Keep the streak going.</p>
          )}
        </div>
      </section>
    </div>
  )
}
