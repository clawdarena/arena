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
import { PageTransition } from '@/components/PageTransition'

type TierFilter = 'all' | EloTier

function RankIcon({ rank }: { rank: number }) {
  if (rank === 1) return <Crown className="w-5 h-5 text-[var(--neon-amber)]" />
  if (rank === 2) return <Medal className="w-5 h-5 text-[var(--text-primary)]" />
  if (rank === 3) return <Medal className="w-5 h-5 text-amber-600" />
  return <span className="text-xs font-mono text-[var(--text-muted)] w-5 text-center">#{rank}</span>
}

function TierBadge({ elo }: { elo: number }) {
  const tier = getEloTier(elo)
  const color = TIER_COLORS[tier]
  return (
    <span className={`arena-subtitle text-[9px] ${color}`}>
      {tier.toUpperCase()}
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

  return (
    <tr
      className={`border-b border-[var(--border-dim)] transition ${
        isCurrentUser
          ? 'bg-[var(--neon-cyan-dim)] border-l-2 border-l-[var(--neon-cyan)]'
          : 'hover:bg-[var(--bg-raised)]'
      }`}
    >
      <td className="px-4 py-3 text-center">
        <RankIcon rank={entry.rank} />
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className={`w-7 h-7 rounded-sm flex items-center justify-center text-xs ${
            isCurrentUser
              ? 'bg-[var(--neon-cyan)] text-[var(--bg-void)]'
              : entry.rank <= 3
              ? 'bg-[var(--neon-amber-dim)] text-[var(--neon-amber)]'
              : 'bg-[var(--bg-raised)] text-[var(--text-muted)]'
          }`}>
            {isCurrentUser ? '⭐' : <User className="w-3.5 h-3.5" />}
          </div>
          <div>
            <span className={`text-sm font-semibold ${isCurrentUser ? 'text-[var(--neon-cyan)]' : 'text-[var(--text-primary)]'}`}>
              {entry.user.username}
            </span>
            {isCurrentUser && (
              <span className="ml-2 arena-subtitle text-[8px] bg-[var(--neon-cyan-dim)] text-[var(--neon-cyan)] px-1.5 py-0.5">
                YOU
              </span>
            )}
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-center hidden sm:table-cell">
        <TierBadge elo={entry.elo} />
      </td>
      <td className="px-4 py-3 text-center">
        <span className="text-sm font-mono font-bold text-[var(--text-primary)]">{formatELO(entry.elo)}</span>
      </td>
      <td className="px-4 py-3 text-center hidden md:table-cell">
        <span className="text-xs font-mono">
          <span className="text-[var(--neon-green)]">{entry.wins}</span>
          <span className="text-[var(--text-muted)] mx-0.5">/</span>
          <span className="text-[var(--neon-red)]">{entry.losses}</span>
        </span>
      </td>
      <td className="px-4 py-3 text-center">
        <span className={`text-sm font-mono font-bold ${
          entry.win_rate >= 0.6 ? 'text-[var(--neon-green)]' :
          entry.win_rate >= 0.5 ? 'text-[var(--neon-amber)]' :
          'text-[var(--neon-red)]'
        }`}>
          {winRate}%
        </span>
      </td>
    </tr>
  )
}

function LeaderboardContent() {
  const { user } = useAuthStore()
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
      <div className="flex items-center gap-3 text-[var(--text-muted)]">
        <div className="w-4 h-4 border-2 border-[var(--neon-amber)] border-t-transparent rounded-full animate-spin" />
        <span className="arena-subtitle text-xs">LOADING RANKINGS</span>
      </div>
    </div>
  )

  const filteredLeaderboard = filter === 'all'
    ? leaderboard
    : leaderboard.filter((entry) => getEloTier(entry.elo) === filter)

  const tierFilters: Array<{ id: TierFilter; label: string }> = [
    { id: 'all', label: 'ALL' },
    { id: 'legend', label: 'LEGEND' },
    { id: 'platinum', label: 'PLAT' },
    { id: 'gold', label: 'GOLD' },
    { id: 'silver', label: 'SILVER' },
    { id: 'bronze', label: 'BRONZE' },
  ]

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-8 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="arena-title text-xl text-[var(--text-primary)]">RANKINGS</h1>
          <div className="h-px flex-1 bg-[var(--border-dim)] min-w-8" />
        </div>
        <span className="text-xs font-mono text-[var(--text-muted)]">{totalPlayers} RANKED</span>
      </div>

      {/* My rank highlight */}
      {myRank && (
        <div className="panel p-4 mb-6 corner-brackets box-glow-cyan flex items-center gap-4">
          <div className="w-12 h-12 bg-[var(--neon-cyan)] rounded-sm flex items-center justify-center text-xl font-mono font-bold text-[var(--bg-void)]">
            #{myRank.rank}
          </div>
          <div className="flex-1">
            <div className="arena-subtitle text-[10px] text-[var(--neon-cyan)]">YOUR POSITION</div>
            <div className="text-lg font-mono font-bold text-[var(--text-primary)]">{myRank.user.username}</div>
          </div>
          <div className="text-right">
            <div className="text-lg font-mono font-bold text-[var(--neon-cyan)] glow-cyan">{formatELO(myRank.elo)}</div>
            <div className="text-[10px] font-mono text-[var(--text-muted)]">
              {(myRank.win_rate * 100).toFixed(1)}% WR
            </div>
          </div>
        </div>
      )}

      {/* Tier filter */}
      <div className="flex items-center gap-1 mb-4 overflow-x-auto pb-2">
        {tierFilters.map((tf) => (
          <button
            key={tf.id}
            onClick={() => setFilter(tf.id)}
            className={`px-3 py-1.5 rounded-sm text-[10px] font-mono font-bold transition whitespace-nowrap ${
              filter === tf.id
                ? 'bg-[var(--neon-cyan)] text-[var(--bg-void)]'
                : 'bg-[var(--bg-raised)] text-[var(--text-muted)] hover:text-[var(--text-secondary)] border border-[var(--border-dim)]'
            }`}
          >
            {tf.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--border-mid)]">
                <th className="px-4 py-3 text-center w-16 arena-subtitle text-[9px] text-[var(--text-muted)]">#</th>
                <th className="px-4 py-3 text-left arena-subtitle text-[9px] text-[var(--text-muted)]">OPERATOR</th>
                <th className="px-4 py-3 text-center hidden sm:table-cell w-24 arena-subtitle text-[9px] text-[var(--text-muted)]">TIER</th>
                <th className="px-4 py-3 text-center w-24 arena-subtitle text-[9px] text-[var(--text-muted)]">ELO</th>
                <th className="px-4 py-3 text-center hidden md:table-cell w-24 arena-subtitle text-[9px] text-[var(--text-muted)]">W/L</th>
                <th className="px-4 py-3 text-center w-24 arena-subtitle text-[9px] text-[var(--text-muted)]">WIN%</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeaderboard.map((entry) => (
                <LeaderboardRow
                  key={entry.user.id}
                  entry={entry}
                  isCurrentUser={entry.user.id === user?.id}
                />
              ))}
            </tbody>
          </table>
        </div>

        {filteredLeaderboard.length === 0 && (
          <div className="p-12 text-center">
            <p className="text-[var(--text-muted)] font-mono text-sm">// no combatants in this tier</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function LeaderboardPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[var(--bg-void)] arena-grid-bg">
        <Navbar />
        <LeaderboardContent />
      </div>
    </ProtectedRoute>
  )
}
