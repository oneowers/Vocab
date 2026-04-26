import type { Metadata } from "next"

import { ToastProvider } from "@/components/Toast"
import "./globals.css"

export const metadata: Metadata = {
  title: "WordFlow",
  description: "Spaced repetition vocabulary learning for English and Russian learners."
}

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Serif+Display&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="text-ink antialiased">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  )
}
