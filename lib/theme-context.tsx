"use client"

import React, { createContext, useContext, useEffect, useState } from "react"

type Theme = "light" | "dark"

interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark")

  useEffect(() => {
    // Load theme from localStorage or system preference
    const savedTheme = localStorage.getItem("lexiflow-theme") as Theme | null
    if (savedTheme) {
      setThemeState(savedTheme)
      document.documentElement.setAttribute("data-theme", savedTheme)
    } else if (window.matchMedia("(prefers-color-scheme: light)").matches) {
      // If no saved theme, but system is light, we could default to light
      // But for now, let's stick to dark as default unless saved
    }
  }, [])

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
    localStorage.setItem("lexiflow-theme", newTheme)
    document.documentElement.setAttribute("data-theme", newTheme)
  }

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark"
    setTheme(newTheme)
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}
