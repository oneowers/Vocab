import { requireSignedInAppUser } from "@/lib/auth"
import { PracticePageContent } from "@/components/practice/PracticePageContent"

export default async function PracticePage({
  searchParams
}: {
  searchParams: { mode?: string }
}) {
  await requireSignedInAppUser()

  return <PracticePageContent initialMode={searchParams.mode as any} />
}
