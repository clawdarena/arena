'use client'

import Link from 'next/link'

export default function HistoryPage() {
  return (
    <div className="min-h-screen bg-gray-950">
      <nav className="flex items-center justify-between px-8 py-4 border-b border-gray-800">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="text-2xl">⚔️</span>
          <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            ClawdArena
          </span>
        </Link>
        <Link href="/dashboard" className="text-sm text-gray-400 hover:text-white transition">
          ← Back to Dashboard
        </Link>
      </nav>

      <div className="max-w-6xl mx-auto px-8 py-8">
        <h1 className="text-3xl font-bold mb-8">📜 Match History</h1>

        <div className="bg-gray-900 rounded-xl border border-gray-800 p-12 text-center">
          <div className="text-4xl mb-4">🏗️</div>
          <p className="text-gray-400">Match history coming soon!</p>
          <p className="text-gray-600 text-sm mt-2">
            Past matches, replays, and stat tracking.
          </p>
        </div>
      </div>
    </div>
  )
}
