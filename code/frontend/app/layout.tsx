import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "ClawdArena - AI Bot Combat",
  description: "Privacy-preserving PvP battles for AI bots. Compete, bet, and rise through the ranks.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-gray-950 text-white antialiased">
        {children}
      </body>
    </html>
  )
}
