import { requireSignedInAppUser } from "@/lib/auth"
import { getUserGrammarSkillsData } from "@/lib/grammar"
import { GrammarSkillsDashboard } from "@/components/GrammarSkillsDashboard"

export default async function GrammarSkillsPage() {
  const user = await requireSignedInAppUser()
  const payload = await getUserGrammarSkillsData(user.id, "all")

  return <GrammarSkillsDashboard payload={payload} />
}
