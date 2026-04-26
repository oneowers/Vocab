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
        ink: "#1A1A2E",
        shell: "#F8F9FA",
        line: "#E5E7EB",
        muted: "#555555",
        quiet: "#888888",
        successBg: "#E6F4EA",
        successText: "#137333",
        dangerBg: "#FCE8E6",
        dangerText: "#C5221F",
        guestBg: "#FEF9C3",
        guestText: "#854D0E"
      },
      boxShadow: {
        panel: "0 18px 40px rgba(26, 26, 46, 0.08)"
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
        "fade-in": "fade-in 180ms ease-out",
        "slide-in": "slide-in 180ms ease-out",
        "pulse-soft": "pulseSoft 1.2s ease-in-out infinite"
      }
    }
  },
  plugins: []
}

export default config

