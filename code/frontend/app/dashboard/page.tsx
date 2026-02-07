'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore, useQueueStore } from '@/lib/store'
import { formatCredits, formatELO, getELORank, getEntryFee, timeAgo } from '@/lib/utils'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { Navbar } from '@/components/Navbar'
import { type MatchHistoryEntry } from '@/lib/constants'
import { api } from '@/lib/api'
import { Swords, Shield, Zap, Heart, TrendingUp, TrendingDown, Minus, ChevronRight, Trophy, Activity } from 'lucide-react'

function StatBar({ label, value, max, color, icon }: {
  label: string
  value: number
  max: number
  color: string
  icon: React.ReactNode
}) {
  const pct = Math.min(100, (value / max) * 100)
  return (
    <div className="flex items-center gap-3">
      <div className="w-5 text-center">{icon}</div>
      <span className="arena-subtitle text-[10px] text-[var(--text-muted)] w-8">{label}</span>
      <div className="flex-1 bar-track">
        <div
          className={`h-full transition-all duration-700 ease-out ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-mono text-[var(--text-primary)] w-8 text-right">{value}</span>
    </div>
  )
}

function MatchHistoryRow({ match }: { match: MatchHistoryEntry }) {
  const isWin = match.winner_id === match.my_bot.id
  const isDraw = match.winner_id === null
  const eloChange = match.my_bot.elo_after - match.my_bot.elo_before

  return (
    <div className="flex items-center gap-3 py-2.5 px-3 hover:bg-[var(--bg-raised)] transition group">
      {/* Result indicator */}
      <div className={`w-8 h-8 rounded-sm flex items-center justify-center text-xs font-mono font-bold ${
        isDraw ? 'bg-[var(--bg-raised)] text-[var(--text-muted)]' :
        isWin ? 'bg-[var(--neon-green-dim)] text-[var(--neon-green)]' : 'bg-[var(--neon-red-dim)] text-[var(--neon-red)]'
      }`}>
        {isDraw ? 'D' : isWin ? 'W' : 'L'}
      </div>

      {/* Opponent info */}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-[var(--text-primary)] truncate">
          vs {match.opponent.name}
        </div>
        <div className="text-[10px] text-[var(--text-muted)] font-mono">
          {match.rounds_fought} rounds · {timeAgo(match.created_at)}
        </div>
      </div>

      {/* ELO change */}
      <div className={`flex items-center gap-1 text-sm font-mono font-bold ${
        eloChange > 0 ? 'text-[var(--neon-green)]' : eloChange < 0 ? 'text-[var(--neon-red)]' : 'text-[var(--text-muted)]'
      }`}>
        {eloChange > 0 ? <TrendingUp className="w-3.5 h-3.5" /> :
         eloChange < 0 ? <TrendingDown className="w-3.5 h-3.5" /> :
         <Minus className="w-3.5 h-3.5" />}
        {eloChange > 0 ? '+' : ''}{eloChange}
      </div>

      {/* Credits */}
      {match.credits_won > 0 && (
        <span className="text-xs text-[var(--neon-amber)] font-mono font-bold">+{match.credits_won}</span>
      )}
    </div>
  )
}

function DashboardContent() {
  const router = useRouter()
  const { user, bots, setUser, setBots, setToken } = useAuthStore()
  const { isQueuing, startQueuing, stopQueuing } = useQueueStore()
  const [recentMatches, setRecentMatches] = useState<MatchHistoryEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const me = await api<any>('/api/auth/me')
        setUser({
          id: me.id,
          username: me.username,
          credits: me.credits,
          current_elo: me.current_elo,
          peak_elo: me.peak_elo,
          total_matches: me.total_matches,
          wins: me.wins,
          losses: me.losses,
          created_at: me.created_at,
        })
        if (me.bots?.length) {
          setBots(me.bots)
        }

        try {
          const historyRes = await api<{ matches: MatchHistoryEntry[] }>('/api/matches/history?limit=5')
          setRecentMatches(historyRes.matches || [])
        } catch {
          // No matches yet
        }
      } catch (err) {
        console.error('Failed to fetch user data:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [setUser, setBots])

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex items-center gap-3 text-[var(--text-muted)]">
        <div className="w-4 h-4 border-2 border-[var(--neon-cyan)] border-t-transparent rounded-full animate-spin" />
        <span className="arena-subtitle text-xs">LOADING COMMAND CENTER</span>
      </div>
    </div>
  )

  if (!user) return null

  const rank = getELORank(user.current_elo)
  const winRate = user.total_matches > 0
    ? ((user.wins / user.total_matches) * 100).toFixed(1)
    : '0.0'

  const bot = bots[0]

  if (!bot) return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-16 text-center">
      <div className="panel p-8 corner-brackets max-w-md mx-auto">
        <div className="text-3xl mb-4">🤖</div>
        <h2 className="arena-title text-lg mb-2">NO BOT DEPLOYED</h2>
        <p className="text-[var(--text-muted)] text-sm mb-4">Register a bot to enter the arena.</p>
      </div>
    </div>
  )

  // Auto-detect tier from ELO
  function getAutoTier(elo: number): string {
    if (elo >= 1800) return 'ranked_legend'
    if (elo >= 1600) return 'ranked_platinum'
    if (elo >= 1400) return 'ranked_gold'
    if (elo >= 1200) return 'ranked_silver'
    return 'ranked_bronze'
  }

  const autoTier = getAutoTier(user.current_elo)

  function handleFindMatch() {
    if (isQueuing) {
      stopQueuing()
      return
    }

    const fee = getEntryFee(autoTier)
    if (user && user.credits < fee) return

    startQueuing(autoTier)
    router.push('/queue')
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6">
      {/* Page header */}
      <div className="flex items-center gap-3 mb-6">
        <h1 className="arena-title text-xl text-[var(--text-primary)]">COMMAND CENTER</h1>
        <div className="h-px flex-1 bg-[var(--border-dim)]" />
        <span className="arena-subtitle text-[10px] text-[var(--text-muted)]">
          {user.username.toUpperCase()}
        </span>
      </div>

      {/* Top Row: Profile + Credits + Peak */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
        {/* Profile Card */}
        <div className="md:col-span-2 panel p-6">
          <div className="flex items-center gap-4 mb-5">
            <div className="w-14 h-14 bg-[var(--bg-raised)] border border-[var(--border-mid)] rounded-sm flex items-center justify-center text-2xl">
              🤖
            </div>
            <div>
              <h2 className="text-lg font-bold font-body">{user.username}</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <Trophy className={`w-3.5 h-3.5 ${rank.color}`} />
                <span className={`arena-subtitle text-[10px] ${rank.color}`}>
                  {rank.name.toUpperCase()}
                </span>
                <span className="text-[var(--text-muted)]">·</span>
                <span className="text-sm text-[var(--neon-cyan)] font-mono font-bold">{formatELO(user.current_elo)}</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-[var(--bg-void)] border border-[var(--border-dim)] rounded-sm py-3">
              <div className="text-xl font-mono font-bold text-[var(--neon-green)]">{user.wins}</div>
              <div className="arena-subtitle text-[9px] text-[var(--text-muted)] mt-0.5">WINS</div>
            </div>
            <div className="bg-[var(--bg-void)] border border-[var(--border-dim)] rounded-sm py-3">
              <div className="text-xl font-mono font-bold text-[var(--neon-red)]">{user.losses}</div>
              <div className="arena-subtitle text-[9px] text-[var(--text-muted)] mt-0.5">LOSSES</div>
            </div>
            <div className="bg-[var(--bg-void)] border border-[var(--border-dim)] rounded-sm py-3">
              <div className="text-xl font-mono font-bold text-[var(--neon-cyan)]">{winRate}%</div>
              <div className="arena-subtitle text-[9px] text-[var(--text-muted)] mt-0.5">WIN RATE</div>
            </div>
          </div>
        </div>

        {/* Credits Card */}
        <div className="panel p-6 flex flex-col justify-between">
          <div>
            <div className="arena-subtitle text-[10px] text-[var(--text-muted)] mb-2">CREDITS</div>
            <div className="text-3xl font-mono font-bold text-[var(--neon-amber)] glow-amber">
              {formatCredits(user.credits)}
            </div>
            <div className="text-[10px] text-[var(--text-muted)] font-mono mt-1">ARENA CR</div>
          </div>
          <Link
            href="/shop"
            className="inline-flex items-center gap-1 mt-3 text-xs text-[var(--neon-cyan)] hover:underline transition"
          >
            <span className="arena-subtitle text-[10px]">SHOP</span> <ChevronRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Peak ELO Card */}
        <div className="panel p-6 flex flex-col justify-between">
          <div>
            <div className="arena-subtitle text-[10px] text-[var(--text-muted)] mb-2">PEAK ELO</div>
            <div className="text-3xl font-mono font-bold text-[var(--neon-amber)]">
              {formatELO(user.peak_elo)}
            </div>
            <div className="text-[10px] text-[var(--text-muted)] font-mono mt-1">ALL-TIME</div>
          </div>
          <div className="mt-3 text-[10px] text-[var(--text-muted)] flex items-center gap-1 font-mono">
            <Activity className="w-3 h-3" />
            {user.total_matches} MATCHES
          </div>
        </div>
      </div>

      {/* Middle Row: Bot Stats + Match Finder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-4">
        {/* Bot Stats */}
        <div className="panel p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 bg-[var(--bg-void)] border border-[var(--border-dim)] rounded-sm flex items-center justify-center text-lg">
              🤖
            </div>
            <div>
              <div className="font-semibold text-[var(--text-primary)]">{bot.name}</div>
              <div className="text-[10px] text-[var(--text-muted)] font-mono">LVL {bot.level} · {bot.xp} XP</div>
            </div>
          </div>
          <div className="space-y-3">
            <StatBar label="HP" value={bot.base_hp} max={200} color="bg-[var(--neon-red)]" icon={<Heart className="w-3.5 h-3.5 text-[var(--neon-red)]" />} />
            <StatBar label="ATK" value={bot.base_attack} max={50} color="bg-[var(--neon-amber)]" icon={<Swords className="w-3.5 h-3.5 text-[var(--neon-amber)]" />} />
            <StatBar label="DEF" value={bot.base_defense} max={40} color="bg-[var(--neon-cyan)]" icon={<Shield className="w-3.5 h-3.5 text-[var(--neon-cyan)]" />} />
            <StatBar label="SPD" value={bot.base_speed} max={30} color="bg-[var(--neon-green)]" icon={<Zap className="w-3.5 h-3.5 text-[var(--neon-green)]" />} />
          </div>
        </div>

        {/* Match Finder — ELO auto-tier */}
        <div className="panel p-6 corner-brackets flex flex-col">
          <h3 className="arena-subtitle text-[10px] text-[var(--text-muted)] mb-4 flex items-center gap-2">
            <Swords className="w-3.5 h-3.5 text-[var(--neon-red)]" />
            FIND MATCH
          </h3>

          {/* Current tier display */}
          <div className="flex-1 flex flex-col items-center justify-center py-4">
            <div className="text-[10px] text-[var(--text-muted)] font-mono mb-2">YOUR TIER</div>
            <div className={`text-2xl font-bold arena-title ${rank.color}`}>
              {rank.name.toUpperCase()}
            </div>
            <div className="text-sm font-mono text-[var(--neon-cyan)] mt-1">
              {formatELO(user.current_elo)} ELO
            </div>
            <div className="mt-4 flex items-center gap-4 text-center">
              <div>
                <div className="text-lg font-mono font-bold text-[var(--neon-amber)]">{getEntryFee(autoTier)} CR</div>
                <div className="text-[9px] text-[var(--text-muted)] font-mono">ENTRY FEE</div>
              </div>
              <div className="w-px h-8 bg-[var(--border-dim)]" />
              <div>
                <div className="text-lg font-mono font-bold text-[var(--neon-green)]">{getEntryFee(autoTier) * 2} CR</div>
                <div className="text-[9px] text-[var(--text-muted)] font-mono">WIN PAYOUT</div>
              </div>
            </div>
          </div>

          {user.credits < getEntryFee(autoTier) && (
            <div className="text-[10px] text-[var(--neon-red)] font-mono text-center mb-3">
              ⚠ INSUFFICIENT CREDITS — NEED {getEntryFee(autoTier)} CR
            </div>
          )}

          <button
            onClick={handleFindMatch}
            disabled={user.credits < getEntryFee(autoTier)}
            className={`w-full py-3 font-semibold transition ${
              isQueuing
                ? 'btn-danger'
                : 'btn-primary disabled:opacity-40 disabled:cursor-not-allowed'
            }`}
          >
            {isQueuing ? '⏳ CANCEL SEARCH' : '⚔️ FIND MATCH →'}
          </button>
        </div>
      </div>

      {/* Bottom Row: Recent Matches */}
      <div className="panel p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="arena-subtitle text-[10px] text-[var(--text-muted)] flex items-center gap-2">
            📜 RECENT MATCHES
          </h3>
          <Link
            href="/history"
            className="arena-subtitle text-[10px] text-[var(--neon-cyan)] hover:underline flex items-center gap-1"
          >
            VIEW ALL <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
        {recentMatches.length > 0 ? (
          <div className="divide-y divide-[var(--border-dim)]">
            {recentMatches.map((match) => (
              <MatchHistoryRow key={match.id} match={match} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-[var(--text-muted)] text-center py-8 font-mono">
            // no combat data — enter the arena
          </p>
        )}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[var(--bg-void)] arena-grid-bg">
        <Navbar />
        <DashboardContent />
      </div>
    </ProtectedRoute>
  )
}
