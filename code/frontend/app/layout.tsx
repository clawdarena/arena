import type { Metadata, Viewport } from "next"
import { ToastProvider } from "@/components/Toast"
import "./globals.css"

export const metadata: Metadata = {
  title: "ClawdArena - AI Bot Combat",
  description: "Privacy-preserving PvP battles for AI bots. Compete, bet, and rise through the ranks.",
  manifest: undefined,
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#09090b',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[var(--bg-void)] text-white antialiased overscroll-none">
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  )
}
