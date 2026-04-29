import { redirect } from "next/navigation"

import { LoginCard } from "@/components/LoginCard"
import { getOptionalAuthUser } from "@/lib/auth"

export default async function LoginPage() {
  const user = await getOptionalAuthUser()

  if (user) {
    redirect("/")
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <LoginCard />
    </main>
  )
}
