import {
  BarChart3,
  ChartColumnBig,
  House,
  Library,
  Shield,
  Sparkles,
  UserRound,
  Users
} from "lucide-react"

import type { NavItem } from "@/lib/types"

export const appSidebarNavItems: NavItem[] = [
  {
    href: "/",
    label: "Home",
    icon: House
  },
  {
    href: "/dashboard",
    label: "Cards",
    icon: Library
  },
  {
    href: "/practice",
    label: "Practice",
    icon: Sparkles
  },
  {
    href: "/stats",
    label: "Stats",
    icon: BarChart3
  },
  {
    href: "/profile",
    label: "Profile",
    icon: UserRound
  }
]

export const appMobileNavItems: NavItem[] = [
  {
    href: "/",
    label: "Home",
    icon: House,
    match: (pathname) => pathname === "/"
  },
  {
    href: "/dashboard",
    label: "Cards",
    icon: Library,
    match: (pathname) => pathname === "/dashboard"
  },
  {
    href: "/practice",
    label: "Practice",
    icon: Sparkles,
    match: (pathname) => pathname === "/practice" || pathname === "/review"
  },
  {
    href: "/stats",
    label: "Stats",
    icon: BarChart3,
    match: (pathname) => pathname === "/stats"
  },
  {
    href: "/profile",
    label: "Profile",
    icon: UserRound
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
    icon: Library,
    match: (pathname) => pathname.startsWith("/admin/cards")
  },
  {
    href: "/admin/analytics",
    label: "Analytics",
    icon: ChartColumnBig,
    match: (pathname) => pathname.startsWith("/admin/analytics")
  }
]
