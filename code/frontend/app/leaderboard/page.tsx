'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/lib/store'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { Navbar } from '@/components/Navbar'
import {
  MOCK_LEADERBOARD,
  MOCK_USER,
  MOCK_BOT,
  loadMockData,
  getEloTier,
  TIER_COLORS,
  TIER_BG_COLORS,
  type LeaderboardEntry,
  type EloTier,
} from '@/lib/mock-api'
import { formatELO, getELORank } from '@/lib/utils'
import {
  Trophy,
  Medal,
  Crown,
  Filter,
  TrendingUp,
  ChevronUp,
  ChevronDown,
  User,
} from 'lucide-react'

type TierFilter = 'all' | EloTier

function RankIcon({ rank }: { rank: number }) {
  if (rank === 1) return <Crown className="w-5 h-5 text-yellow-400" />
  if (rank === 2) return <Medal className="w-5 h-5 text-gray-300" />
  if (rank === 3) return <Medal className="w-5 h-5 text-amber-600" />
  return <span className="text-sm font-mono text-gray-500 w-5 text-center">#{rank}</span>
}

function TierBadge({ elo }: { elo: number }) {
  const tier = getEloTier(elo)
  const color = TIER_COLORS[tier]
  return (
    <span className={`text-[10px] font-bold uppercase tracking-wider ${color}`}>
      {tier}
    </span>
  )
}

function LeaderboardRow({
  entry,
  isCurrentUser,
}: {
  entry: LeaderboardEntry
  isCurrentUser: boolean
}) {
  const winRate = (entry.win_rate * 100).toFixed(1)
  const tier = getEloTier(entry.elo)

  return (
    <tr
      className={`border-b border-gray-800/50 transition ${
        isCurrentUser
          ? 'bg-purple-900/20 border-purple-800/30'
          : 'hover:bg-gray-800/30'
      }`}
    >
      {/* Rank */}
      <td className="px-4 py-3 text-center">
        <div className="flex items-center justify-center">
          <RankIcon rank={entry.rank} />
        </div>
      </td>

      {/* Username */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${
            isCurrentUser
              ? 'bg-purple-600 text-white'
              : entry.rank <= 3
              ? 'bg-yellow-900/30 text-yellow-400'
              : 'bg-gray-800 text-gray-400'
          }`}>
            {isCurrentUser ? '⭐' : <User className="w-4 h-4" />}
          </div>
          <div>
            <span className={`text-sm font-medium ${isCurrentUser ? 'text-purple-300' : 'text-gray-200'}`}>
              {entry.user.username}
            </span>
            {isCurrentUser && (
              <span className="ml-2 text-[10px] bg-purple-600/30 text-purple-300 px-1.5 py-0.5 rounded-full">
                You
              </span>
            )}
          </div>
        </div>
      </td>

      {/* Tier */}
      <td className="px-4 py-3 text-center hidden sm:table-cell">
        <TierBadge elo={entry.elo} />
      </td>

      {/* ELO */}
      <td className="px-4 py-3 text-center">
        <span className="text-sm font-mono font-semibold text-white">{formatELO(entry.elo)}</span>
      </td>

      {/* W/L */}
      <td className="px-4 py-3 text-center hidden md:table-cell">
        <span className="text-xs">
          <span className="text-green-400">{entry.wins}</span>
          <span className="text-gray-600 mx-1">/</span>
          <span className="text-red-400">{entry.losses}</span>
        </span>
      </td>

      {/* Win Rate */}
      <td className="px-4 py-3 text-center">
        <div className="flex items-center justify-center gap-1">
          <span className={`text-sm font-medium ${
            entry.win_rate >= 0.6 ? 'text-green-400' :
            entry.win_rate >= 0.5 ? 'text-yellow-400' :
            'text-red-400'
          }`}>
            {winRate}%
          </span>
        </div>
      </td>
    </tr>
  )
}

function LeaderboardContent() {
  const { user, setUser, setBots, setToken } = useAuthStore()
  const [filter, setFilter] = useState<TierFilter>('all')

  useEffect(() => {
    if (!user) {
      const mock = loadMockData()
      setUser(mock.user)
      setBots(mock.bots)
      setToken(mock.token)
    }
  }, [user, setUser, setBots, setToken])

  const filteredLeaderboard = filter === 'all'
    ? MOCK_LEADERBOARD
    : MOCK_LEADERBOARD.filter((entry) => getEloTier(entry.elo) === filter)

  const myRank = MOCK_LEADERBOARD.find((e) => e.user.id === 'usr_001')
  const totalPlayers = MOCK_LEADERBOARD.length

  const tierFilters: Array<{ id: TierFilter; label: string; emoji: string }> = [
    { id: 'all', label: 'All', emoji: '🌍' },
    { id: 'legend', label: 'Legend', emoji: '👑' },
    { id: 'platinum', label: 'Platinum', emoji: '💎' },
    { id: 'gold', label: 'Gold', emoji: '🥇' },
    { id: 'silver', label: 'Silver', emoji: '🥈' },
    { id: 'bronze', label: 'Bronze', emoji: '🥉' },
  ]

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Trophy className="w-6 h-6 text-yellow-400" />
          Leaderboard
        </h1>
        <div className="text-sm text-gray-500">
          {totalPlayers} players ranked
        </div>
      </div>

      {/* My rank highlight */}
      {myRank && (
        <div className="bg-purple-900/20 rounded-xl border border-purple-800/30 p-4 mb-6 flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center text-xl">
            ⭐
          </div>
          <div className="flex-1">
            <div className="text-sm text-purple-300">Your Ranking</div>
            <div className="text-2xl font-bold text-white">#{myRank.rank}</div>
          </div>
          <div className="text-right">
            <div className="text-sm font-mono text-purple-300">{formatELO(myRank.elo)} ELO</div>
            <div className="text-xs text-gray-500">
              {(myRank.win_rate * 100).toFixed(1)}% win rate
            </div>
          </div>
        </div>
      )}

      {/* Tier filter */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
        <Filter className="w-4 h-4 text-gray-500 flex-shrink-0" />
        {tierFilters.map((tf) => (
          <button
            key={tf.id}
            onClick={() => setFilter(tf.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap ${
              filter === tf.id
                ? 'bg-purple-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-300'
            }`}
          >
            <span>{tf.emoji}</span>
            {tf.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800 text-xs text-gray-500 uppercase tracking-wider">
                <th className="px-4 py-3 text-center w-16">Rank</th>
                <th className="px-4 py-3 text-left">Player</th>
                <th className="px-4 py-3 text-center hidden sm:table-cell w-24">Tier</th>
                <th className="px-4 py-3 text-center w-24">ELO</th>
                <th className="px-4 py-3 text-center hidden md:table-cell w-24">W/L</th>
                <th className="px-4 py-3 text-center w-24">Win %</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeaderboard.map((entry) => (
                <LeaderboardRow
                  key={entry.user.id}
                  entry={entry}
                  isCurrentUser={entry.user.id === 'usr_001'}
                />
              ))}
            </tbody>
          </table>
        </div>

        {filteredLeaderboard.length === 0 && (
          <div className="p-12 text-center">
            <div className="text-4xl mb-4">🔍</div>
            <p className="text-gray-400">No players in this tier yet.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function LeaderboardPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-950">
        <Navbar />
        <LeaderboardContent />
      </div>
    </ProtectedRoute>
  )
}
