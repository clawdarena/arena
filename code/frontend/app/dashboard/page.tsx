'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore, useQueueStore } from '@/lib/store'
import { api } from '@/lib/api'
import { formatCredits, formatELO, getELORank, getEntryFee } from '@/lib/utils'

export default function DashboardPage() {
  const router = useRouter()
  const { user, setUser, setBots, bots, logout } = useAuthStore()
  const { isQueuing, startQueuing, stopQueuing } = useQueueStore()
  const [loading, setLoading] = useState(true)
  const [selectedTier, setSelectedTier] = useState('ranked_bronze')

  // Check auth on mount
  useEffect(() => {
    async function loadUser() {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
        return
      }

      try {
        const data = await api<any>('/api/auth/me')
        setUser(data)
        if (data.bots) setBots(data.bots)
      } catch {
        localStorage.removeItem('token')
        router.push('/login')
        return
      }

      setLoading(false)
    }

    if (!user) {
      loadUser()
    } else {
      setLoading(false)
    }
  }, [user, router, setUser, setBots])

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    )
  }

  const rank = getELORank(user.current_elo)
  const winRate = user.total_matches > 0
    ? ((user.wins / user.total_matches) * 100).toFixed(1)
    : '0.0'

  const tiers = [
    { id: 'ranked_bronze', name: 'Bronze', fee: 50, minElo: 0 },
    { id: 'ranked_silver', name: 'Silver', fee: 100, minElo: 0 },
    { id: 'ranked_gold', name: 'Gold', fee: 250, minElo: 0 },
    { id: 'ranked_platinum', name: 'Platinum', fee: 500, minElo: 0 },
    { id: 'ranked_legend', name: 'Legend', fee: 1000, minElo: 1600 },
  ]

  function handleFindMatch() {
    if (isQueuing) {
      stopQueuing()
      return
    }

    const fee = getEntryFee(selectedTier)
    if (user && user.credits < fee) {
      alert(`Insufficient credits. Need ${fee} AC.`)
      return
    }

    startQueuing(selectedTier)
    // TODO: Connect to WebSocket and join queue
  }

  function handleLogout() {
    logout()
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-4 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <span className="text-2xl">⚔️</span>
          <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            ClawdArena
          </span>
        </div>
        <div className="flex items-center gap-6">
          <Link href="/shop" className="text-sm text-gray-400 hover:text-white transition">
            Shop
          </Link>
          <Link href="/leaderboard" className="text-sm text-gray-400 hover:text-white transition">
            Leaderboard
          </Link>
          <Link href="/history" className="text-sm text-gray-400 hover:text-white transition">
            History
          </Link>
          <div className="flex items-center gap-2 bg-gray-900 px-3 py-1.5 rounded-lg border border-gray-800">
            <span className="text-yellow-400 text-sm">💰</span>
            <span className="text-sm font-medium">{formatCredits(user.credits)} AC</span>
          </div>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-500 hover:text-gray-300 transition"
          >
            Logout
          </button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-8 py-8">
        {/* Welcome + Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {/* Profile Card */}
          <div className="md:col-span-2 bg-gray-900 rounded-xl border border-gray-800 p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center text-2xl">
                🤖
              </div>
              <div>
                <h2 className="text-xl font-bold">{user.username}</h2>
                <p className={`text-sm font-medium ${rank.color}`}>
                  {rank.name} — {formatELO(user.current_elo)} ELO
                </p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-green-400">{user.wins}</div>
                <div className="text-xs text-gray-500">Wins</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-400">{user.losses}</div>
                <div className="text-xs text-gray-500">Losses</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-400">{winRate}%</div>
                <div className="text-xs text-gray-500">Win Rate</div>
              </div>
            </div>
          </div>

          {/* Credits Card */}
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
            <div className="text-sm text-gray-500 mb-1">Credits</div>
            <div className="text-3xl font-bold text-yellow-400">
              {formatCredits(user.credits)}
            </div>
            <div className="text-xs text-gray-500 mt-1">Arena Credits</div>
            <Link
              href="/shop"
              className="inline-block mt-3 text-xs text-purple-400 hover:text-purple-300 transition"
            >
              Buy more →
            </Link>
          </div>

          {/* Peak ELO Card */}
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
            <div className="text-sm text-gray-500 mb-1">Peak ELO</div>
            <div className="text-3xl font-bold">{formatELO(user.peak_elo)}</div>
            <div className="text-xs text-gray-500 mt-1">All-time best</div>
            <div className="mt-3 text-xs text-gray-600">
              {user.total_matches} matches played
            </div>
          </div>
        </div>

        {/* Match Finder */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 mb-8">
          <h3 className="text-lg font-semibold mb-4">⚔️ Find a Match</h3>

          {/* Tier Selection */}
          <div className="grid grid-cols-5 gap-2 mb-4">
            {tiers.map((tier) => (
              <button
                key={tier.id}
                onClick={() => setSelectedTier(tier.id)}
                className={`p-3 rounded-lg border text-center transition ${
                  selectedTier === tier.id
                    ? 'border-purple-500 bg-purple-900/30'
                    : 'border-gray-700 hover:border-gray-600'
                } ${
                  user.current_elo < tier.minElo
                    ? 'opacity-50 cursor-not-allowed'
                    : ''
                }`}
                disabled={user.current_elo < tier.minElo}
              >
                <div className="text-sm font-medium">{tier.name}</div>
                <div className="text-xs text-gray-500">{tier.fee} AC</div>
              </button>
            ))}
          </div>

          {/* Queue Button */}
          <button
            onClick={handleFindMatch}
            className={`w-full py-4 rounded-lg font-semibold text-lg transition ${
              isQueuing
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-purple-600 hover:bg-purple-700'
            }`}
          >
            {isQueuing ? '⏳ Searching... (Click to cancel)' : `🎮 Find Match (${getEntryFee(selectedTier)} AC)`}
          </button>
        </div>

        {/* Bot Info */}
        {bots.length > 0 && (
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
            <h3 className="text-lg font-semibold mb-4">🤖 Your Bot</h3>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gray-800 rounded-lg flex items-center justify-center text-xl">
                🤖
              </div>
              <div>
                <div className="font-medium">{bots[0].name}</div>
                <div className="text-xs text-gray-500">Level {bots[0].level}</div>
              </div>
              <div className="ml-auto grid grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-sm font-medium text-red-400">{bots[0].base_hp}</div>
                  <div className="text-xs text-gray-500">HP</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-orange-400">{bots[0].base_attack}</div>
                  <div className="text-xs text-gray-500">ATK</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-blue-400">{bots[0].base_defense}</div>
                  <div className="text-xs text-gray-500">DEF</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-green-400">{bots[0].base_speed}</div>
                  <div className="text-xs text-gray-500">SPD</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
