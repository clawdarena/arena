'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuthStore } from '@/lib/store'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { Navbar } from '@/components/Navbar'
import { HPBar } from '@/components/HPBar'
import {
  getEloTier,
  TIER_COLORS,
  type MatchHistoryEntry,
  type EloTier,
} from '@/lib/constants'
import { api } from '@/lib/api'
import { timeAgo, formatDuration } from '@/lib/utils'
import type { MatchType, RoundResult } from '../../../shared/types'
import {
  ChevronDown,
  ChevronUp,
  Trophy,
  Clock,
  Swords,
  Filter,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react'

function getMatchResult(match: MatchHistoryEntry): 'win' | 'loss' | 'draw' {
  if (match.winner_id === null) return 'draw'
  return match.winner_id === match.my_bot.id ? 'win' : 'loss'
}

function RoundReplay({ round, index }: { round: RoundResult; index: number }) {
  function actionLabel(action: string, target: string | null): string {
    if (action === 'defend') return '🛡️ Defend'
    if (action === 'skill') return '✨ Skill'
    return `⚔️ Attack → ${target || 'core'}`
  }

  return (
    <div className="flex items-center gap-3 py-2 text-sm">
      <div className="w-7 h-7 rounded-sm bg-[var(--bg-void)] border border-[var(--border-dim)] flex items-center justify-center text-[10px] font-mono font-bold text-[var(--neon-cyan)]">
        {round.round}
      </div>
      <div className="flex-1 grid grid-cols-2 gap-4">
        <div>
          <div className="text-[var(--text-primary)] text-xs font-medium">{actionLabel(round.bot1_action, round.bot1_target)}</div>
          <div className="flex items-center gap-2 mt-0.5">
            {round.bot1_damage_dealt > 0 && (
              <span className="text-[10px] font-mono text-[var(--neon-red)]">-{round.bot1_damage_dealt}</span>
            )}
            <span className="text-[10px] font-mono text-[var(--text-muted)]">HP:{round.bot1_hp}</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[var(--text-primary)] text-xs font-medium">{actionLabel(round.bot2_action, round.bot2_target)}</div>
          <div className="flex items-center justify-end gap-2 mt-0.5">
            {round.bot2_damage_dealt > 0 && (
              <span className="text-[10px] font-mono text-[var(--neon-red)]">-{round.bot2_damage_dealt}</span>
            )}
            <span className="text-[10px] font-mono text-[var(--text-muted)]">HP:{round.bot2_hp}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function MatchRow({ match }: { match: MatchHistoryEntry }) {
  const [expanded, setExpanded] = useState(false)
  const result = getMatchResult(match)
  const eloChange = match.my_bot.elo_after - match.my_bot.elo_before
  const tierName = match.match_type.replace('ranked_', '').toUpperCase()

  const resultConfig = {
    win: { label: 'VICTORY', color: 'text-[var(--neon-green)]', bg: 'bg-[var(--neon-green-dim)] border-[var(--neon-green)]', badge: 'bg-[var(--neon-green-dim)] text-[var(--neon-green)]' },
    loss: { label: 'DEFEAT', color: 'text-[var(--neon-red)]', bg: 'bg-[var(--neon-red-dim)] border-[var(--neon-red)]', badge: 'bg-[var(--neon-red-dim)] text-[var(--neon-red)]' },
    draw: { label: 'DRAW', color: 'text-[var(--text-secondary)]', bg: 'panel border-[var(--border-mid)]', badge: 'bg-[var(--bg-raised)] text-[var(--text-secondary)]' },
  }

  const cfg = resultConfig[result]

  return (
    <div className={`rounded-sm border transition-all ${expanded ? cfg.bg : 'panel hover:border-[var(--border-mid)]'}`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-4 text-left"
      >
        {/* Result badge */}
        <div className={`w-10 py-1.5 rounded-sm text-center text-[10px] font-mono font-bold ${cfg.badge}`}>
          {result === 'win' ? 'W' : result === 'loss' ? 'L' : 'D'}
        </div>

        {/* Match info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[var(--text-primary)] text-sm truncate">vs {match.opponent.name}</span>
            <span className="arena-subtitle text-[8px] text-[var(--text-muted)] px-1.5 py-0.5 bg-[var(--bg-void)] rounded-sm border border-[var(--border-dim)]">{tierName}</span>
          </div>
          <div className="flex items-center gap-3 mt-1 text-[10px] text-[var(--text-muted)] font-mono">
            <span>{match.rounds_fought}r</span>
            <span>{formatDuration(match.duration_seconds)}</span>
            <span>{timeAgo(match.created_at)}</span>
          </div>
        </div>

        {/* ELO change */}
        <div className={`flex items-center gap-1 text-sm font-mono font-bold ${
          eloChange > 0 ? 'text-[var(--neon-green)]' : eloChange < 0 ? 'text-[var(--neon-red)]' : 'text-[var(--text-muted)]'
        }`}>
          {eloChange > 0 ? '+' : ''}{eloChange}
        </div>

        {/* Credits */}
        {match.credits_won > 0 && (
          <span className="text-[10px] font-mono font-bold text-[var(--neon-amber)]">+{match.credits_won}</span>
        )}

        <div className="text-[var(--text-muted)]">
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-[var(--border-dim)]">
          <div className="flex items-center justify-between py-3 text-[10px] text-[var(--text-muted)] font-mono">
            <span>{match.my_bot.name}</span>
            <span className="arena-subtitle text-[9px]">ROUND REPLAY</span>
            <span>{match.opponent.name}</span>
          </div>
          <div className="divide-y divide-[var(--border-dim)]">
            {match.replay.map((round, i) => (
              <RoundReplay key={i} round={round} index={i} />
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-[var(--border-dim)] flex items-center justify-between text-[10px] font-mono">
            <span className="text-[var(--text-muted)]">
              {match.my_bot.elo_before} → <span className={cfg.color}>{match.my_bot.elo_after}</span>
            </span>
            <span className={`font-bold ${cfg.color} arena-subtitle text-[10px]`}>{cfg.label}</span>
            <span className="text-[var(--text-muted)]">
              {match.opponent.elo_before} → {match.opponent.elo_after}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

function HistoryContent() {
  const { user } = useAuthStore()
  const [filter, setFilter] = useState<'all' | MatchType>('all')
  const [matchHistory, setMatchHistory] = useState<MatchHistoryEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await api<{ matches: MatchHistoryEntry[] }>('/api/matches/history?limit=50')
        setMatchHistory(res.matches || [])
      } catch (err) {
        console.error('Failed to fetch match history:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex items-center gap-3 text-[var(--text-muted)]">
        <div className="w-4 h-4 border-2 border-[var(--neon-cyan)] border-t-transparent rounded-full animate-spin" />
        <span className="arena-subtitle text-xs">LOADING COMBAT LOG</span>
      </div>
    </div>
  )

  const filteredMatches = filter === 'all'
    ? matchHistory
    : matchHistory.filter((m) => m.match_type === filter)

  const wins = matchHistory.filter((m) => m.winner_id === m.my_bot.id).length
  const losses = matchHistory.filter((m) => m.winner_id !== null && m.winner_id !== m.my_bot.id).length
  const draws = matchHistory.filter((m) => m.winner_id === null).length

  const tierFilters: Array<{ id: 'all' | MatchType; label: string }> = [
    { id: 'all', label: 'ALL' },
    { id: 'ranked_bronze', label: 'BRONZE' },
    { id: 'ranked_silver', label: 'SILVER' },
    { id: 'ranked_gold', label: 'GOLD' },
    { id: 'ranked_platinum', label: 'PLAT' },
    { id: 'ranked_legend', label: 'LEGEND' },
  ]

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-8 py-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="arena-title text-xl text-[var(--text-primary)]">COMBAT LOG</h1>
          <div className="h-px flex-1 bg-[var(--border-dim)] min-w-8" />
        </div>
        <div className="flex items-center gap-2 text-xs font-mono font-bold">
          <span className="text-[var(--neon-green)]">{wins}W</span>
          <span className="text-[var(--text-muted)]">/</span>
          <span className="text-[var(--neon-red)]">{losses}L</span>
          <span className="text-[var(--text-muted)]">/</span>
          <span className="text-[var(--text-secondary)]">{draws}D</span>
        </div>
      </div>

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

      {/* Match list */}
      <div className="space-y-2">
        {filteredMatches.length > 0 ? (
          filteredMatches.map((match) => (
            <MatchRow key={match.id} match={match} />
          ))
        ) : (
          <div className="panel p-12 text-center">
            <p className="text-[var(--text-muted)] font-mono text-sm">// no combat data for this tier</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function HistoryPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[var(--bg-void)] arena-grid-bg">
        <Navbar />
        <HistoryContent />
      </div>
    </ProtectedRoute>
  )
}
