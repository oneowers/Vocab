"use client"

interface PracticeBackgroundProps {
  status: "idle" | "correct" | "incorrect" | "active"
}

export function PracticeBackground({ status }: PracticeBackgroundProps) {
  const backgroundStyle = {
    backgroundColor: `var(--practice-bg-${status})`,
    backgroundImage: `linear-gradient(180deg, var(--practice-bg-${status}) 0%, var(--bg-primary) 100%)`
  }

  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      <div 
        className="absolute inset-0 transition-colors duration-500" 
        style={backgroundStyle}
      />
    </div>
  )
}
