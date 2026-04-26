import type { Role } from "@/lib/types"

export function canViewStats(role: Role | null | undefined) {
  return role === "PRO" || role === "ADMIN"
}

export function getRoleLabel(role: Role | null | undefined) {
  if (role === "ADMIN") {
    return "Administrator"
  }

  if (role === "PRO") {
    return "Pro member"
  }

  if (role === "USER") {
    return "Learner"
  }

  return "Not signed in"
}
