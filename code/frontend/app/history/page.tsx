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
} from '@/lib/mock-api'
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
      <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center text-xs font-bold text-purple-400">
        R{round.round}
      </div>
      <div className="flex-1 grid grid-cols-2 gap-4">
        {/* Bot 1 */}
        <div>
          <div className="text-gray-300 text-xs">{actionLabel(round.bot1_action, round.bot1_target)}</div>
          <div className="flex items-center gap-2 mt-0.5">
            {round.bot1_damage_dealt > 0 && (
              <span className="text-xs text-orange-400">-{round.bot1_damage_dealt} dmg dealt</span>
            )}
            <span className="text-[10px] text-gray-600">HP: {round.bot1_hp}</span>
          </div>
        </div>
        {/* Bot 2 */}
        <div className="text-right">
          <div className="text-gray-300 text-xs">{actionLabel(round.bot2_action, round.bot2_target)}</div>
          <div className="flex items-center justify-end gap-2 mt-0.5">
            {round.bot2_damage_dealt > 0 && (
              <span className="text-xs text-orange-400">-{round.bot2_damage_dealt} dmg dealt</span>
            )}
            <span className="text-[10px] text-gray-600">HP: {round.bot2_hp}</span>
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
  const tierName = match.match_type.replace('ranked_', '')

  const resultConfig = {
    win: { label: 'VICTORY', color: 'text-green-400', bg: 'bg-green-900/20 border-green-800/30', badge: 'bg-green-500/20 text-green-400' },
    loss: { label: 'DEFEAT', color: 'text-red-400', bg: 'bg-red-900/20 border-red-800/30', badge: 'bg-red-500/20 text-red-400' },
    draw: { label: 'DRAW', color: 'text-gray-400', bg: 'bg-gray-800/40 border-gray-700/30', badge: 'bg-gray-500/20 text-gray-400' },
  }

  const cfg = resultConfig[result]

  return (
    <div className={`rounded-xl border transition-all ${expanded ? cfg.bg : 'bg-gray-900 border-gray-800 hover:border-gray-700'}`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-4 p-4 text-left"
      >
        {/* Result badge */}
        <div className={`w-14 py-1.5 rounded-lg text-center text-xs font-bold ${cfg.badge}`}>
          {result === 'win' ? 'W' : result === 'loss' ? 'L' : 'D'}
        </div>

        {/* Match info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-200 truncate">vs {match.opponent.name}</span>
            <span className="text-[10px] text-gray-600 px-1.5 py-0.5 bg-gray-800 rounded capitalize">{tierName}</span>
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Swords className="w-3 h-3" />
              {match.rounds_fought} rounds
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDuration(match.duration_seconds)}
            </span>
            <span>{timeAgo(match.created_at)}</span>
          </div>
        </div>

        {/* ELO change */}
        <div className={`flex items-center gap-1 text-sm font-mono font-medium ${
          eloChange > 0 ? 'text-green-400' : eloChange < 0 ? 'text-red-400' : 'text-gray-500'
        }`}>
          {eloChange > 0 ? <TrendingUp className="w-3.5 h-3.5" /> :
           eloChange < 0 ? <TrendingDown className="w-3.5 h-3.5" /> :
           <Minus className="w-3.5 h-3.5" />}
          {eloChange > 0 ? '+' : ''}{eloChange}
        </div>

        {/* Credits */}
        {match.credits_won > 0 && (
          <span className="text-xs font-medium text-yellow-400">+{match.credits_won} AC</span>
        )}

        {/* Expand icon */}
        <div className="text-gray-500">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {/* Expanded: Round-by-round replay */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-gray-800/50">
          <div className="flex items-center justify-between py-3 text-xs text-gray-500">
            <span className="font-medium">{match.my_bot.name}</span>
            <span className="text-gray-600">Round-by-Round Replay</span>
            <span className="font-medium">{match.opponent.name}</span>
          </div>
          <div className="divide-y divide-gray-800/30">
            {match.replay.map((round, i) => (
              <RoundReplay key={i} round={round} index={i} />
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-gray-800/50 flex items-center justify-between text-xs">
            <span className="text-gray-500">
              ELO: {match.my_bot.elo_before} → <span className={cfg.color}>{match.my_bot.elo_after}</span>
            </span>
            <span className={`font-bold ${cfg.color}`}>{cfg.label}</span>
            <span className="text-gray-500">
              Opp ELO: {match.opponent.elo_before} → {match.opponent.elo_after}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

function HistoryContent() {
  const { user, setUser, setBots, setToken } = useAuthStore()
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
      <div className="text-gray-500">Loading history...</div>
    </div>
  )

  const filteredMatches = filter === 'all'
    ? matchHistory
    : matchHistory.filter((m) => m.match_type === filter)

  const wins = matchHistory.filter((m) => m.winner_id === m.my_bot.id).length
  const losses = matchHistory.filter((m) => m.winner_id !== null && m.winner_id !== m.my_bot.id).length
  const draws = matchHistory.filter((m) => m.winner_id === null).length

  const tierFilters: Array<{ id: 'all' | MatchType; label: string }> = [
    { id: 'all', label: 'All Tiers' },
    { id: 'ranked_bronze', label: 'Bronze' },
    { id: 'ranked_silver', label: 'Silver' },
    { id: 'ranked_gold', label: 'Gold' },
    { id: 'ranked_platinum', label: 'Platinum' },
    { id: 'ranked_legend', label: 'Legend' },
  ]

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          📜 Match History
        </h1>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-green-400 font-medium">{wins}W</span>
          <span className="text-gray-600">/</span>
          <span className="text-red-400 font-medium">{losses}L</span>
          <span className="text-gray-600">/</span>
          <span className="text-gray-400 font-medium">{draws}D</span>
        </div>
      </div>

      {/* Tier filter */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
        <Filter className="w-4 h-4 text-gray-500 flex-shrink-0" />
        {tierFilters.map((tf) => (
          <button
            key={tf.id}
            onClick={() => setFilter(tf.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap ${
              filter === tf.id
                ? 'bg-purple-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-300'
            }`}
          >
            {tf.label}
          </button>
        ))}
      </div>

      {/* Match list */}
      <div className="space-y-3">
        {filteredMatches.length > 0 ? (
          filteredMatches.map((match) => (
            <MatchRow key={match.id} match={match} />
          ))
        ) : (
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-12 text-center">
            <div className="text-4xl mb-4">🔍</div>
            <p className="text-gray-400">No matches found for this tier.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function HistoryPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-950">
        <Navbar />
        <HistoryContent />
      </div>
    </ProtectedRoute>
  )
}
