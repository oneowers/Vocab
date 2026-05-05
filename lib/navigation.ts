import { BookOpen, BookOpenCheck, Cog, Crown, House, Library, MessageCircle, Shield, Sparkles, Ticket, UserRound, Users } from "lucide-react"

import type { NavItem, Role, AppSettingsRecord } from "@/lib/types"

const aiNavItem: NavItem = {
  href: "/ai",
  label: "AI",
  icon: MessageCircle,
  match: (pathname) => pathname === "/ai" || pathname === "/stats"
}

export function getAppSidebarNavItems(role: Role | null, settings?: AppSettingsRecord | null): NavItem[] {
  const items: NavItem[] = [
    {
      href: "/",
      label: "Home",
      icon: House,
      id: "home"
    },
    {
      href: "/dashboard",
      label: "Cards",
      icon: Library,
      id: "cards"
    },
    {
      href: "/translate",
      label: "Translate",
      icon: MessageCircle,
      id: "translate"
    },
    {
      href: "/practice",
      label: "Practice",
      icon: Sparkles,
      id: "practice"
    },
    {
      href: "/grammar",
      label: "Grammar",
      icon: BookOpen,
      id: "grammar"
    },
    { ...aiNavItem, id: "ai" },
    {
      href: "/profile",
      label: "Profile",
      icon: UserRound,
      id: "profile"
    }
  ]

  const order = settings?.mobileNavOrder || ["home", "cards", "translate", "practice", "grammar", "ai"]
  const sortedItems = [...items].sort((a, b) => {
    const idxA = order.indexOf(a.id || "")
    const idxB = order.indexOf(b.id || "")
    if (idxA === -1 && idxB === -1) return 0
    if (idxA === -1) return 1
    if (idxB === -1) return -1
    return idxA - idxB
  })

  return sortedItems
}

export function getAppMobileNavItems(role: Role | null, settings?: AppSettingsRecord | null): NavItem[] {
  const allItems: Record<string, NavItem> = {
    home: {
      href: "/",
      label: "Home",
      icon: House,
      match: (pathname) => pathname === "/"
    },
    cards: {
      href: "/dashboard",
      label: "Cards",
      icon: Library,
      match: (pathname) => pathname === "/dashboard"
    },
    translate: {
      href: "/translate",
      label: "Translate",
      icon: MessageCircle,
      match: (pathname) => pathname === "/translate"
    },
    practice: {
      href: "/practice",
      label: "Practice",
      icon: Sparkles,
      match: (pathname) => pathname === "/practice" || pathname === "/review"
    },
    grammar: {
      href: "/grammar",
      label: "Grammar",
      icon: BookOpen,
      match: (pathname) => pathname === "/grammar"
    },
    ai: aiNavItem
  }

  const order = settings?.mobileNavOrder || ["home", "cards", "translate", "practice", "grammar", "ai"]
  const items = order.map(id => allItems[id]).filter(Boolean)

  if (role && role !== "PRO" && role !== "ADMIN") {
    items.push({
      href: "/pro",
      label: "Get PRO",
      icon: Crown,
      match: (pathname) => pathname === "/pro"
    })
  }

  // Filter to ensure uniqueness by href
  const uniqueItems = items.filter((item, index, self) => 
    index === self.findIndex((t) => t.href === item.href)
  )

  return uniqueItems
}

const adminOverviewNavItem: NavItem = {
  href: "/admin",
  label: "Overview",
  icon: Shield,
  match: (pathname) => pathname === "/admin" || pathname.startsWith("/admin/analytics")
}

const adminUsersNavItem: NavItem = {
  href: "/admin/users",
  label: "Users",
  icon: Users,
  match: (pathname) => pathname.startsWith("/admin/users")
}

const adminCatalogNavItem: NavItem = {
  href: "/admin/catalog",
  label: "Catalog",
  icon: Library,
  match: (pathname) =>
    pathname.startsWith("/admin/catalog") ||
    pathname.startsWith("/admin/cards") ||
    pathname.startsWith("/admin/grammar-topics")
}

const adminGrammarNavItem: NavItem = {
  href: "/admin/grammar-topics",
  label: "Grammar",
  icon: BookOpenCheck,
  match: (pathname) => pathname.startsWith("/admin/grammar-topics")
}

const adminCardsNavItem: NavItem = {
  href: "/admin/cards",
  label: "Cards",
  icon: Library,
  match: (pathname) => pathname.startsWith("/admin/cards")
}

const adminSystemNavItem: NavItem = {
  href: "/admin/settings",
  label: "System",
  icon: Cog,
  match: (pathname) =>
    pathname.startsWith("/admin/settings") ||
    pathname.startsWith("/admin/promo-codes")
}

const adminPromoNavItem: NavItem = {
  href: "/admin/promo-codes",
  label: "Promo Codes",
  icon: Ticket,
  match: (pathname) => pathname.startsWith("/admin/promo-codes")
}

export const adminSidebarSections: Array<{ label: string; items: NavItem[] }> = [
  {
    label: "Monitor",
    items: [adminOverviewNavItem]
  },
  {
    label: "People",
    items: [adminUsersNavItem]
  },
  {
    label: "Content",
    items: [adminCatalogNavItem, adminGrammarNavItem, adminCardsNavItem]
  },
  {
    label: "System",
    items: [adminSystemNavItem, adminPromoNavItem]
  }
]

export const adminNavItems: NavItem[] = adminSidebarSections.flatMap((section) => section.items)

export const adminMobileNavItems: NavItem[] = [
  adminOverviewNavItem,
  adminUsersNavItem,
  {
    href: "/admin/catalog",
    label: "Content",
    icon: Library,
    match: adminCatalogNavItem.match
  },
  {
    href: "/admin/settings",
    label: "System",
    icon: Cog,
    match: adminSystemNavItem.match
  }
]
