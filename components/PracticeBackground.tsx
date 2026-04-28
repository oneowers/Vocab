"use client"

interface PracticeBackgroundProps {
  status: "idle" | "correct" | "incorrect" | "active"
}

export function PracticeBackground({ status }: PracticeBackgroundProps) {
  const backgroundClass =
    status === "correct"
      ? "bg-[linear-gradient(180deg,#07110d_0%,#000000_100%)]"
      : status === "incorrect"
        ? "bg-[linear-gradient(180deg,#14090b_0%,#000000_100%)]"
        : status === "active"
          ? "bg-[linear-gradient(180deg,#0a0b14_0%,#000000_100%)]"
          : "bg-[linear-gradient(180deg,#060608_0%,#000000_100%)]"

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div className={`absolute inset-0 transition-colors duration-300 ${backgroundClass}`} />
    </div>
  )
}
