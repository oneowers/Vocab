import type { Metadata, Viewport } from "next"
import NextTopLoader from "nextjs-toploader"

import { StartupSplash } from "@/components/StartupSplash"
import { ToastProvider } from "@/components/Toast"
import "@/styles/apple-theme.css"
import "./globals.css"

export const metadata: Metadata = {
  title: "Wlingo",
  description: "Spaced repetition vocabulary learning for English and Russian learners."
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover"
}

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-shell text-ink antialiased">
        <NextTopLoader
          color="var(--accent)"
          crawlSpeed={160}
          height={2}
          easing="ease"
          showSpinner={false}
        />
        <StartupSplash />
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  )
}
