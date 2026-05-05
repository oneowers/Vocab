"use client"

import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { ChevronRight, ChevronLeft } from "lucide-react"
import { useRouter } from "next/navigation"

interface AppleCardProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
  href?: string
  activeScale?: number
}

/**
 * A standard iOS-style card container with spring animations and "squircle" corners.
 */
export function AppleCard({ 
  children, 
  className = "", 
  onClick, 
  href,
  activeScale = 0.98 
}: AppleCardProps) {
  const content = (
    <div className={`bg-[#1C1C1E] rounded-[20px] p-4 border border-white/[0.03] transition-transform active:scale-[${activeScale}] ${className}`}>
      {children}
    </div>
  )

  if (href) {
    return <Link href={href} className="block no-underline">{content}</Link>
  }

  return (
    <button type="button" onClick={onClick} className="w-full text-left outline-none">
      {content}
    </button>
  )
}

interface AppleTileProps {
  title: string
  subtitle: string
  icon: React.ReactNode
  color: string
  href: string
}

/**
 * A square-ish tile used in grids for tasks or categories.
 */
export function AppleTile({ title, subtitle, icon, color, href }: AppleTileProps) {
  return (
    <Link
      href={href}
      className="bg-[#1C1C1E] rounded-[20px] p-3.5 flex flex-col gap-2.5 active:scale-[0.97] transition-all border border-white/[0.03] overflow-hidden group"
    >
      <div className={`h-9 w-9 shrink-0 flex items-center justify-center rounded-lg ${color} text-white shadow-inner shadow-white/10 transition-transform group-hover:scale-110`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[15px] font-bold tracking-tight text-white truncate">{title}</p>
        <p className="text-[12px] font-medium text-white/30 truncate">{subtitle}</p>
      </div>
    </Link>
  )
}

interface AppleListItemProps {
  title: string
  subtitle?: string
  icon: React.ReactNode
  iconColor: string
  href?: string
  onClick?: () => void
  rightLabel?: string
  showDivider?: boolean
}

/**
 * A standard list item used in "Settings" style lists.
 */
export function AppleListItem({ title, subtitle, icon, iconColor, href, onClick, rightLabel, showDivider = false }: AppleListItemProps) {
  const content = (
    <div className="relative flex items-center justify-between py-2.5 px-4 active:bg-white/5 transition-colors group">
      <div className="flex items-center gap-3">
        <div className={`h-8 w-8 rounded-[8px] ${iconColor} flex items-center justify-center text-white shadow-sm shrink-0 overflow-hidden`}>
          {icon}
        </div>
        <div className="flex flex-col">
          <span className="text-[16px] font-medium text-white leading-tight">{title}</span>
          {subtitle && (
            <span className="text-[12px] text-white/40 font-normal mt-0.5">{subtitle}</span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {rightLabel && (
          <span className="text-[15px] text-white/30 font-normal">{rightLabel}</span>
        )}
        <ChevronRight size={14} className="text-white/10 transition-colors group-hover:text-white/30" />
      </div>

      {/* iOS Indented Divider */}
      {showDivider && (
        <div className="absolute bottom-0 right-0 h-[0.5px] bg-white/[0.08]" style={{ left: '60px' }} />
      )}
    </div>
  )

  if (href) {
    return <Link href={href} className="block no-underline">{content}</Link>
  }

  return (
    <button type="button" onClick={onClick} className="w-full text-left outline-none">
      {content}
    </button>
  )
}

interface AppleProgressCardProps {
  title: string
  current: number
  total: number
  href: string
  progressColor?: string
}

/**
 * A progress card showing a percentage bar.
 */
export function AppleProgressCard({ 
  title, 
  current, 
  total, 
  href, 
  progressColor = "bg-[#34C759]" 
}: AppleProgressCardProps) {
  const percentage = Math.round((current / total) * 100)

  return (
    <Link href={href} className="bg-[#1C1C1E] rounded-[20px] p-4 flex flex-col gap-3 active:scale-[0.98] transition-transform border border-white/[0.03]">
      <div className="flex items-center justify-between">
        <span className="text-[15px] font-semibold tracking-tight text-white">{title}</span>
        <div className="flex items-center text-white/30">
          <span className="text-[13px] font-medium mr-1">{current} of {total}</span>
          <ChevronRight size={16} />
        </div>
      </div>
      <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className={`h-full ${progressColor} rounded-full`}
        />
      </div>
    </Link>
  )
}

interface AppleHeaderProps {
  title: string
  onBack?: () => void
  rightElement?: React.ReactNode
}

/**
 * A reusable iOS-style header with a gradient background and centered title.
 */
export function AppleHeader({ title, onBack, rightElement }: AppleHeaderProps) {
  const router = useRouter()
  const handleBack = onBack || (() => router.back())

  return (
    <div className="fixed inset-x-0 top-0 z-[60] flex flex-col justify-end pb-3 bg-gradient-to-b from-black via-black/90 to-transparent h-20">
      <div className="flex items-center justify-between px-6 pt-[env(safe-area-inset-top,20px)]">
        <div className="flex items-center w-12">
          <button 
            onClick={handleBack}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white active:scale-90 transition-transform backdrop-blur-xl"
          >
            <ChevronLeft size={24} />
          </button>
        </div>
        <h1 className="text-[17px] font-bold text-white tracking-tight absolute left-1/2 -translate-x-1/2 whitespace-nowrap">
          {title}
        </h1>
        <div className="flex items-center justify-end w-12">
          {rightElement || <div className="w-9" />}
        </div>
      </div>
    </div>
  )
}

interface AppleAlertProps {
  isOpen: boolean
  onClose: () => void
  title: string
  message: string
  primaryAction?: {
    label: string
    onClick: () => void
  }
  secondaryAction?: {
    label: string
    onClick: () => void
  }
}

/**
 * A standard iOS-style alert modal for important messages or errors.
 */
export function AppleAlert({ 
  isOpen, 
  onClose, 
  title, 
  message, 
  primaryAction, 
  secondaryAction 
}: AppleAlertProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center px-8">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-[10px]"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            transition={{ type: "spring", damping: 25, stiffness: 450 }}
            className="relative w-full max-w-[290px] bg-[#2C2C2E]/95 backdrop-blur-2xl rounded-[32px] p-6 shadow-2xl border border-white/[0.08] text-center"
          >
            <h3 className="text-[17px] font-bold text-white tracking-tight mb-2">
              {title}
            </h3>
            <p className="text-[13px] text-white/50 leading-[1.4] mb-7 px-1">
              {message}
            </p>
            
            <div className="flex gap-2.5">
              {secondaryAction ? (
                <>
                  <button
                    onClick={secondaryAction.onClick}
                    className="flex-1 h-11 rounded-[16px] bg-[#3A3A3C] text-white text-[15px] font-bold active:scale-95 transition-all active:bg-[#48484A]"
                  >
                    {secondaryAction.label}
                  </button>
                  <button
                    onClick={primaryAction?.onClick || onClose}
                    className="flex-1 h-11 rounded-[16px] bg-[#3A3A3C] text-white text-[15px] font-bold active:scale-95 transition-all active:bg-[#48484A]"
                  >
                    {primaryAction?.label || "OK"}
                  </button>
                </>
              ) : (
                <button
                  onClick={onClose}
                  className="w-full h-11 rounded-[16px] bg-[#3A3A3C] text-white text-[15px] font-bold active:scale-95 transition-all active:bg-[#48484A]"
                >
                  OK
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
