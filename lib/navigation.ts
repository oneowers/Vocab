import {
  BarChart3,
  BookCopy,
  ChartColumnBig,
  House,
  Shield,
  Sparkles,
  Users
} from "lucide-react"

import type { NavItem } from "@/lib/types"

export const appNavItems: NavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: House
  },
  {
    href: "/review",
    label: "Review",
    icon: Sparkles
  },
  {
    href: "/stats",
    label: "Stats",
    icon: BarChart3
  }
]

export const adminNavItems: NavItem[] = [
  {
    href: "/admin",
    label: "Overview",
    icon: Shield,
    match: (pathname) => pathname === "/admin"
  },
  {
    href: "/admin/users",
    label: "Users",
    icon: Users,
    match: (pathname) => pathname.startsWith("/admin/users")
  },
  {
    href: "/admin/cards",
    label: "Cards",
    icon: BookCopy,
    match: (pathname) => pathname.startsWith("/admin/cards")
  },
  {
    href: "/admin/analytics",
    label: "Analytics",
    icon: ChartColumnBig,
    match: (pathname) => pathname.startsWith("/admin/analytics")
  }
]
