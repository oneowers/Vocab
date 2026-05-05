"use client"

import { ChevronRight } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { AppUserRecord } from "@/lib/types"

interface MobileHeaderProps {
  user: AppUserRecord | null
}

export function MobileHeader({ user }: MobileHeaderProps) {
  const pathname = usePathname()

  // Hide header for these paths (handled internally or hidden)
  if (pathname === "/dashboard" || pathname === "/translate" || pathname === "/profile") {
    return null
  }

  // Check if it's one of the paths the user wants to styled like the homepage
  const isIosStyle = 
    pathname === "/" || 
    pathname.startsWith("/practice") || 
    pathname.startsWith("/grammar") || 
    pathname.startsWith("/profile") || 
    pathname.startsWith("/translate") || 
    pathname.startsWith("/cards") || 
    pathname.startsWith("/admin")

  const getPageTitle = () => {
    if (pathname === "/") return "LexiFlow+"
    
    // For /admin/users -> Users
    const parts = pathname.split("/").filter(Boolean)
    const lastPart = parts[parts.length - 1] || ""
    if (!lastPart) return "LexiFlow+"
    
    return lastPart.charAt(0).toUpperCase() + lastPart.slice(1)
  }

  const title = getPageTitle()
  const userName = user?.name || user?.email?.split("@")[0] || ""

  return (
    <div 
      className={`fixed inset-x-0 top-0 z-50 md:hidden flex flex-col justify-end pb-3 ${
        isIosStyle 
          ? "bg-gradient-to-b from-black via-black/90 to-transparent h-20" 
          : "bg-black/80 backdrop-blur-xl border-b border-white/[0.05] h-16"
      }`}
    >
      <div className="flex items-center justify-between px-6 pt-[env(safe-area-inset-top,20px)]">
        <Link 
          href="/profile" 
          className="flex w-full items-center justify-between group active:opacity-60 transition-opacity mt-0.5"
        >
          <div className="flex flex-col">
            <h1 className="text-[28px] font-bold tracking-tight text-white leading-none">
              {title}
            </h1>
            {isIosStyle && userName && (
              <p className="text-[15px] font-medium text-white/40 mt-1">
                {userName}
              </p>
            )}
          </div>
          {isIosStyle && <ChevronRight size={20} className="text-white/20" />}
        </Link>
      </div>
    </div>
  )
}
