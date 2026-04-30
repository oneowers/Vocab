import {
  BookOpenCheck,
  ChartColumnBig,
  Cog,
  House,
  Library,
  MessageCircle,
  Shield,
  Sparkles,
  UserRound,
  Users
} from "lucide-react"

import type { NavItem, Role } from "@/lib/types"

const aiNavItem: NavItem = {
  href: "/ai",
  label: "AI",
  icon: MessageCircle,
  match: (pathname) => pathname === "/ai" || pathname === "/stats"
}

export function getAppSidebarNavItems(role: Role | null): NavItem[] {
  return [
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
    aiNavItem,
    {
      href: "/profile",
      label: "Profile",
      icon: UserRound
    }
  ]
}

export function getAppMobileNavItems(role: Role | null): NavItem[] {
  return [
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
    aiNavItem
  ]
}

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
    href: "/admin/catalog",
    label: "Catalog",
    icon: Cog,
    match: (pathname) => pathname.startsWith("/admin/catalog")
  },
  {
    href: "/admin/grammar-topics",
    label: "Grammar",
    icon: BookOpenCheck,
    match: (pathname) => pathname.startsWith("/admin/grammar-topics")
  },
  {
    href: "/admin/settings",
    label: "Settings",
    icon: Cog,
    match: (pathname) => pathname.startsWith("/admin/settings")
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
