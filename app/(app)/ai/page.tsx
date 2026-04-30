import { AiCoachView } from "@/components/AiCoachView"
import { requireSignedInAppUser } from "@/lib/auth"

export default async function AiPage() {
  const user = await requireSignedInAppUser()
  const isPro = user.role === "PRO" || user.role === "ADMIN"

  return <AiCoachView isPro={isPro} />
}
