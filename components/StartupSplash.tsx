"use client"

import type { CSSProperties } from "react"
import { useEffect, useState } from "react"

const DOT_COLUMNS = 12
const DOT_ROWS = 18

// This is the "pixel lightning" (гроза) pattern
const LIGHTNING_PATTERN = [
  "000000111000",
  "000000111000",
  "000001110000",
  "000001110000",
  "000011100000",
  "000011100000",
  "000111000000",
  "001110000000",
  "001111111000",
  "011111111100",
  "000001111000",
  "000011110000",
  "000011100000",
  "000111000000",
  "001110000000",
  "001100000000",
  "011000000000",
  "010000000000"
] as const

function getLightningIntensity(column: number, row: number) {
  const patternRow = LIGHTNING_PATTERN[row]

  if (!patternRow || patternRow[column] !== "1") {
    return 0
  }

  const verticalWeight = 0.78 + row / (DOT_ROWS - 1) * 0.22
  const centerDistance = Math.abs(column - (DOT_COLUMNS - 1) / 2)
  const centerWeight = 1 - (centerDistance / ((DOT_COLUMNS - 1) / 2)) * 0.08

  return Math.min(1, verticalWeight * centerWeight)
}

export function StartupSplash() {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setVisible(false)
    }, 2000) // Original was 1450, but 2000 feels smoother for the fade animation

    return () => window.clearTimeout(timeout)
  }, [])

  if (!visible) {
    return null
  }

  const dots = Array.from({ length: DOT_ROWS * DOT_COLUMNS }, (_, index) => {
    const column = index % DOT_COLUMNS
    const row = Math.floor(index / DOT_COLUMNS)
    const intensity = getLightningIntensity(column, row)

    return {
      id: `dot-${row}-${column}`,
      intensity,
      delay: row * 34 + column * 5
    }
  })

  return (
    <div className="startup-splash" aria-hidden="true">
      <div className="startup-splash__noise" />
      <div className="startup-splash__dotmark">
        {dots.map((dot) => (
          <span
            key={dot.id}
            className="startup-splash__dot"
            data-active={dot.intensity > 0 ? "true" : "false"}
            style={
              {
                "--dot-scale": dot.intensity.toFixed(3),
                "--dot-opacity": Math.max(0.12, dot.intensity).toFixed(3),
                "--dot-delay": `${dot.delay}ms`
              } as CSSProperties
            }
          />
        ))}
      </div>
    </div>
  )
}
