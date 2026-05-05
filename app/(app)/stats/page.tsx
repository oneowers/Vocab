import { DetailedStatsView } from "@/components/stats/DetailedStatsView"
import { requireSignedInAppUser } from "@/lib/auth"

export default async function StatsPage({
}: {
  searchParams: { range?: string }
}) {
  await requireSignedInAppUser()

  return <DetailedStatsView />
}
