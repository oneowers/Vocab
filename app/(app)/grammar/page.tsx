import { requireSignedInAppUser } from "@/lib/auth"
import { GrammarClientView } from "@/components/grammar/GrammarClientView"

export default async function GrammarPage() {
  await requireSignedInAppUser()

  return <GrammarClientView />
}
