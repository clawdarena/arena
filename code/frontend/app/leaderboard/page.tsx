'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/lib/store'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { Navbar } from '@/components/Navbar'
import {
  getEloTier,
  TIER_COLORS,
  TIER_BG_COLORS,
  type LeaderboardEntry,
  type EloTier,
} from '@/lib/constants'
import { api } from '@/lib/api'
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
  if (rank === 2) return <Medal className="w-5 h-5 text-[var(--text-primary)]" />
  if (rank === 3) return <Medal className="w-5 h-5 text-amber-600" />
  return <span className="text-sm font-mono text-[var(--text-muted)] w-5 text-center">#{rank}</span>
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
      className={`border-b border-[var(--border-dim)]/50 transition ${
        isCurrentUser
          ? 'bg-[var(--neon-cyan-dim)] border-[var(--neon-cyan)]'
          : 'hover:bg-[var(--bg-raised)]'
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
          <div className={`w-8 h-8 rounded-sm flex items-center justify-center text-sm ${
            isCurrentUser
              ? 'bg-[var(--neon-cyan)] text-white'
              : entry.rank <= 3
              ? 'bg-yellow-900/30 text-yellow-400'
              : 'bg-[var(--bg-raised)] text-[var(--text-secondary)]'
          }`}>
            {isCurrentUser ? '⭐' : <User className="w-4 h-4" />}
          </div>
          <div>
            <span className={`text-sm font-medium ${isCurrentUser ? 'text-[var(--neon-cyan)]' : 'text-gray-200'}`}>
              {entry.user.username}
            </span>
            {isCurrentUser && (
              <span className="ml-2 text-[10px] bg-[var(--neon-cyan)]/30 text-[var(--neon-cyan)] px-1.5 py-0.5 rounded-full">
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
          <span className="text-[var(--text-muted)] mx-1">/</span>
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
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [myRank, setMyRank] = useState<LeaderboardEntry | null>(null)
  const [totalPlayers, setTotalPlayers] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await api<{ leaderboard: any[]; my_rank?: number; total_players: number }>('/api/leaderboard?limit=100')
        const entries: LeaderboardEntry[] = (res.leaderboard || []).map((e: any, i: number) => ({
          rank: e.rank || i + 1,
          user: { id: e.user?.id || e.id, username: e.user?.username || e.username },
          elo: e.elo || e.current_elo,
          wins: e.wins,
          losses: e.losses,
          win_rate: e.win_rate ?? (e.wins + e.losses > 0 ? e.wins / (e.wins + e.losses) : 0),
        }))
        setLeaderboard(entries)
        setTotalPlayers(res.total_players || entries.length)

        if (user) {
          const me = entries.find((e) => e.user.id === user.id)
          if (me) setMyRank(me)
        }
      } catch (err) {
        console.error('Failed to fetch leaderboard:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [user])

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-[var(--text-muted)]">Loading leaderboard...</div>
    </div>
  )

  const filteredLeaderboard = filter === 'all'
    ? leaderboard
    : leaderboard.filter((entry) => getEloTier(entry.elo) === filter)

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
        <div className="text-sm text-[var(--text-muted)]">
          {totalPlayers} players ranked
        </div>
      </div>

      {/* My rank highlight */}
      {myRank && (
        <div className="bg-[var(--neon-cyan-dim)] rounded-sm border border-[var(--neon-cyan)] p-4 mb-6 flex items-center gap-4">
          <div className="w-12 h-12 bg-[var(--neon-cyan)] rounded-sm flex items-center justify-center text-xl">
            ⭐
          </div>
          <div className="flex-1">
            <div className="text-sm text-[var(--neon-cyan)]">Your Ranking</div>
            <div className="text-2xl font-bold text-white">#{myRank.rank}</div>
          </div>
          <div className="text-right">
            <div className="text-sm font-mono text-[var(--neon-cyan)]">{formatELO(myRank.elo)} ELO</div>
            <div className="text-xs text-[var(--text-muted)]">
              {(myRank.win_rate * 100).toFixed(1)}% win rate
            </div>
          </div>
        </div>
      )}

      {/* Tier filter */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
        <Filter className="w-4 h-4 text-[var(--text-muted)] flex-shrink-0" />
        {tierFilters.map((tf) => (
          <button
            key={tf.id}
            onClick={() => setFilter(tf.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-medium transition whitespace-nowrap ${
              filter === tf.id
                ? 'bg-[var(--neon-cyan)] text-white'
                : 'bg-[var(--bg-raised)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]'
            }`}
          >
            <span>{tf.emoji}</span>
            {tf.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-[var(--bg-panel)] rounded-sm border border-[var(--border-dim)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--border-dim)] text-xs text-[var(--text-muted)] uppercase tracking-wider">
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
            <p className="text-[var(--text-secondary)]">No players in this tier yet.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function LeaderboardPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[var(--bg-void)]">
        <Navbar />
        <LeaderboardContent />
      </div>
    </ProtectedRoute>
  )
}
