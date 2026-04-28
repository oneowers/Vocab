"use client"

interface PracticeBackgroundProps {
  status: "idle" | "correct" | "incorrect" | "active"
}

export function PracticeBackground({ status }: PracticeBackgroundProps) {
  const primaryTone =
    status === "correct"
      ? "bg-emerald-500/12"
      : status === "incorrect"
        ? "bg-rose-500/12"
        : status === "active"
          ? "bg-indigo-600/12"
          : "bg-blue-600/8"
  const secondaryTone =
    status === "correct"
      ? "bg-emerald-400/8"
      : status === "incorrect"
        ? "bg-rose-600/8"
        : status === "active"
          ? "bg-violet-600/8"
          : "bg-purple-600/8"
  const coreTone =
    status === "correct"
      ? "bg-teal-400/14"
      : status === "incorrect"
        ? "bg-orange-500/12"
        : "bg-fuchsia-500/12"

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div className="absolute inset-0 transition-opacity duration-500">
        <div
          className={`absolute -top-1/4 -left-1/4 h-[150%] w-[150%] rounded-[100%] blur-[140px] transition-colors duration-700 ${primaryTone}`}
        />
        <div
          className={`absolute -bottom-1/4 -right-1/4 h-[150%] w-[150%] rounded-[100%] blur-[140px] transition-colors duration-700 ${secondaryTone}`}
        />
        <div
          className={`absolute top-1/4 left-1/4 h-[50%] w-[50%] rounded-[100%] blur-[100px] transition-colors duration-700 mix-blend-screen ${coreTone}`}
        />
      </div>

      {/* Static Noise Texture for Depth */}
      <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay" 
           style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3 ForeignObject %3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />
    </div>
  )
}
