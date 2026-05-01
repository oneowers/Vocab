import { AdminPromoCodesView } from "@/components/AdminPromoCodesView"
import { getOptionalAuthUser } from "@/lib/auth"
import { redirect } from "next/navigation"

export const metadata = {
  title: "Promo Codes | Admin | LexiFlow"
}

export default async function AdminPromoCodesPage() {
  const user = await getOptionalAuthUser()

  if (user?.role !== "ADMIN") {
    redirect("/")
  }

  return <AdminPromoCodesView />
}
