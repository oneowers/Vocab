import { requireSignedInAppUser } from "@/lib/auth"
import { getUserGrammarSkillsData } from "@/lib/grammar"
import { GrammarView } from "@/components/grammar/GrammarView"

export default async function GrammarPage() {
  const user = await requireSignedInAppUser()
  const payload = await getUserGrammarSkillsData(user.id, "all")

  return <GrammarView payload={payload} />
}
