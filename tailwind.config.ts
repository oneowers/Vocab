import type { Config } from "tailwindcss"

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: "var(--bg-primary)",
          secondary: "var(--bg-secondary)",
          tertiary: "var(--bg-tertiary)"
        },
        text: {
          primary: "var(--text-primary)",
          secondary: "var(--text-secondary)",
          tertiary: "var(--text-tertiary)"
        },
        ink: "var(--text-primary)",
        shell: "var(--bg-secondary)",
        line: "var(--separator)",
        muted: "var(--text-secondary)",
        quiet: "var(--text-tertiary)",
        accent: "var(--accent)",
        separator: "var(--separator)",
        destructive: "var(--destructive)",
        accentForeground: "var(--accent-foreground)",
        successBg: "var(--success-soft)",
        successText: "var(--success)",
        dangerBg: "var(--destructive-soft)",
        dangerText: "var(--destructive)",
        guestBg: "var(--warning-soft)",
        guestText: "var(--text-secondary)",
        background: {
          primary: "var(--bg-primary)",
          secondary: "var(--bg-secondary)",
          tertiary: "var(--bg-tertiary)"
        }
      },
      boxShadow: {
        panel: "var(--shadow-card)",
        subtle: "var(--shadow-subtle)",
        modal: "var(--shadow-modal)"
      },
      borderRadius: {
        card: "var(--radius-card)",
        button: "var(--radius-button)",
        input: "var(--radius-input)",
        sheet: "var(--radius-sheet)"
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        },
        "slide-in": {
          "0%": { opacity: "0", transform: "translateX(24px)" },
          "100%": { opacity: "1", transform: "translateX(0)" }
        },
        pulseSoft: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.55" }
        }
      },
      animation: {
        "fade-in": "fade-in 320ms var(--ease-standard)",
        "slide-in": "slide-in 320ms var(--ease-standard)",
        "pulse-soft": "pulseSoft 1.2s ease-in-out infinite"
      }
    }
  },
  plugins: []
}

export default config
