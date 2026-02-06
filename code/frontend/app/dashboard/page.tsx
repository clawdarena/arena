'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore, useQueueStore } from '@/lib/store'
import { formatCredits, formatELO, getELORank, getEntryFee, timeAgo } from '@/lib/utils'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { Navbar } from '@/components/Navbar'
import { ALL_SKILLS, type MatchHistoryEntry } from '@/lib/constants'
import { api } from '@/lib/api'
import type { Skill, SkillId } from '../../../shared/types'
import { Swords, Shield, Zap, Heart, TrendingUp, TrendingDown, Minus, ChevronRight, Trophy, Flame, Activity } from 'lucide-react'

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

function SkillBadge({ skillId }: { skillId: string }) {
  const skill = ALL_SKILLS[skillId as SkillId]
  if (!skill) return null

  const rarityColors: Record<string, string> = {
    common: 'border-[var(--border-bright)] bg-[var(--bg-raised)] text-[var(--text-primary)]',
    rare: 'border-blue-600/50 bg-blue-900/20 text-blue-400',
    epic: 'border-[var(--neon-cyan)] bg-[var(--neon-cyan-dim)] text-[var(--neon-cyan)]',
    legendary: 'border-[var(--neon-amber)] bg-[var(--neon-amber-dim)] text-[var(--neon-amber)]',
  }

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-sm border ${rarityColors[skill.rarity] || rarityColors.common}`}>
      <span className="text-sm">✨</span>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold truncate">{skill.name}</div>
        <div className="text-[10px] text-[var(--text-muted)] font-mono">{skill.cooldown}r cooldown</div>
      </div>
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
  const [selectedTier, setSelectedTier] = useState('ranked_bronze')
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

  const tiers = [
    { id: 'ranked_bronze', name: 'BRONZE', fee: 50, minElo: 0 },
    { id: 'ranked_silver', name: 'SILVER', fee: 100, minElo: 1200 },
    { id: 'ranked_gold', name: 'GOLD', fee: 200, minElo: 1400 },
    { id: 'ranked_platinum', name: 'PLATINUM', fee: 400, minElo: 1600 },
    { id: 'ranked_legend', name: 'LEGEND', fee: 800, minElo: 1800 },
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

      {/* Middle Row: Bot Stats + Skills + Match Finder */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-4">
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

        {/* Equipped Skills */}
        <div className="panel p-6">
          <h3 className="arena-subtitle text-[10px] text-[var(--text-muted)] mb-4 flex items-center gap-2">
            <Flame className="w-3.5 h-3.5 text-[var(--neon-amber)]" />
            EQUIPPED SKILLS
          </h3>
          <div className="space-y-2">
            {bot.skills.length > 0 ? (
              bot.skills.map((equipped) => (
                <SkillBadge key={equipped.slot} skillId={equipped.skill_id} />
              ))
            ) : (
              <p className="text-sm text-[var(--text-muted)] text-center py-6 font-mono">
                // no skills equipped
              </p>
            )}
          </div>
          {bot.skills.length < 2 && (
            <div className="mt-3 pt-3 border-t border-[var(--border-dim)]">
              <p className="text-[10px] text-[var(--text-muted)] font-mono">
                {2 - bot.skills.length} slot{2 - bot.skills.length > 1 ? 's' : ''} available
              </p>
            </div>
          )}
          <Link
            href="/shop"
            className="inline-flex items-center gap-1 mt-4 text-xs text-[var(--neon-cyan)] hover:underline"
          >
            <span className="arena-subtitle text-[10px]">BROWSE SKILLS</span> <ChevronRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Match Finder */}
        <div className="panel p-6 corner-brackets">
          <h3 className="arena-subtitle text-[10px] text-[var(--text-muted)] mb-4 flex items-center gap-2">
            <Swords className="w-3.5 h-3.5 text-[var(--neon-red)]" />
            FIND MATCH
          </h3>

          <div className="space-y-1.5 mb-4">
            {tiers.map((tier) => {
              const locked = user.current_elo < tier.minElo
              return (
                <button
                  key={tier.id}
                  onClick={() => !locked && setSelectedTier(tier.id)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-sm border text-sm transition ${
                    selectedTier === tier.id
                      ? 'border-[var(--neon-cyan)] bg-[var(--neon-cyan-dim)] text-[var(--text-primary)]'
                      : locked
                      ? 'border-[var(--border-dim)] bg-[var(--bg-void)] text-[var(--text-muted)] cursor-not-allowed opacity-40'
                      : 'border-[var(--border-dim)] hover:border-[var(--border-mid)] text-[var(--text-secondary)]'
                  }`}
                  disabled={locked}
                >
                  <span className="arena-subtitle text-[10px]">{tier.name}</span>
                  <span className="text-[10px] font-mono text-[var(--text-muted)]">
                    {locked ? `🔒 ${tier.minElo}+` : `${tier.fee} CR`}
                  </span>
                </button>
              )
            })}
          </div>

          <button
            onClick={handleFindMatch}
            className={`w-full py-3 font-semibold transition ${
              isQueuing
                ? 'btn-danger'
                : 'btn-primary'
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
