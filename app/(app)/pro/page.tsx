import { GetProView } from "@/components/GetProView"
import { getOptionalAuthUser } from "@/lib/auth"
import { serializeUser } from "@/lib/serializers"

export const metadata = {
  title: "Get PRO | LexiFlow"
}

export default async function GetProPage() {
  const user = await getOptionalAuthUser()
  const serializedUser = user ? serializeUser(user) : null

  return <GetProView user={serializedUser} />
}
