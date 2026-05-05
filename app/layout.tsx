import type { Metadata, Viewport } from "next"
import NextTopLoader from "nextjs-toploader"

import { StartupSplash } from "@/components/StartupSplash"
import { ToastProvider } from "@/components/Toast"
import { UpdateNotifier } from "@/components/UpdateNotifier"
import { ThemeProvider } from "@/lib/theme-context"
import "@/styles/apple-theme.css"
import "./globals.css"

export const metadata: Metadata = {
  title: "LexiFlow",
  description: "Spaced repetition vocabulary learning for English and Russian learners.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "LexiFlow"
  }
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#000000"
}

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning style={{ backgroundColor: "#000000" }}>
      <body className="bg-shell text-ink antialiased">
        <NextTopLoader
          color="var(--accent)"
          crawlSpeed={160}
          height={2}
          easing="ease"
          showSpinner={false}
        />
        <StartupSplash />
        <ThemeProvider>
          <ToastProvider>
            {children}
            <UpdateNotifier />
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
