import { PageTransition } from "@/components/PageTransition"

export default function AuthTemplate({
  children
}: {
  children: React.ReactNode
}) {
  return <PageTransition>{children}</PageTransition>
}
