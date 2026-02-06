'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { Navbar } from '@/components/Navbar'
import { HPBar } from '@/components/HPBar'
import { api } from '@/lib/api'
import { connectSocket } from '@/lib/socket'
import {
  Swords,
  Eye,
  Users,
  ArrowLeft,
  Radio,
  Trophy,
  Zap,
  Shield,
  Clock,
} from 'lucide-react'
import type { Socket } from 'socket.io-client'

// ============================================================
// Types
// ============================================================

interface ActiveBot {
  name: string
  hp: number
}

interface ActiveMatch {
  id: string
  bot1: ActiveBot
  bot2: ActiveBot
  round: number
  match_type: string
  started_at: string
  spectators?: number
}

interface RoundAction {
  round: number
  bot1_action: string
  bot1_target: string | null
  bot1_damage_dealt: number
  bot2_action: string
  bot2_target: string | null
  bot2_damage_dealt: number
  bot1_hp: number
  bot2_hp: number
  bot1_timed_out?: boolean
  bot2_timed_out?: boolean
  effects_applied?: Array<{ bot: string; effect: string }>
}

interface MatchEndData {
  winner_bot_id?: string
  winner_name?: string
  reason?: string
  bot1_hp: number
  bot2_hp: number
}

// ============================================================
// Match List View
// ============================================================

function MatchCard({
  match,
  onWatch,
}: {
  match: ActiveMatch
  onWatch: () => void
}) {
  const timeSince = getTimeSince(match.started_at)
  const matchLabel = match.match_type
    .replace('ranked_', '')
    .replace(/^\w/, (c) => c.toUpperCase())

  return (
    <div className="bg-[var(--bg-panel)] rounded-sm border border-[var(--border-dim)] p-5 hover:border-purple-700/50 transition group">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
          </span>
          <span className="text-xs font-bold text-red-400 uppercase tracking-wider">
            Live
          </span>
        </div>
        <div className="flex items-center gap-3">
          {match.spectators != null && match.spectators > 0 && (
            <div className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
              <Eye className="w-3 h-3" />
              {match.spectators}
            </div>
          )}
          <span className="text-xs text-[var(--text-muted)] bg-[var(--bg-raised)] px-2 py-0.5 rounded-full">
            {matchLabel}
          </span>
        </div>
      </div>

      {/* Bots */}
      <div className="space-y-3 mb-4">
        {/* Bot 1 */}
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-7 h-7 bg-gradient-to-br from-purple-600 to-purple-800 rounded-md flex items-center justify-center text-xs shadow-lg shadow-purple-500/10">
              🤖
            </div>
            <span className="text-sm font-semibold text-[var(--neon-cyan)] truncate flex-1">
              {match.bot1.name}
            </span>
          </div>
          <HPBar current={match.bot1.hp} max={100} />
        </div>

        <div className="flex items-center justify-center">
          <Swords className="w-4 h-4 text-[var(--text-muted)]" />
        </div>

        {/* Bot 2 */}
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-7 h-7 bg-gradient-to-br from-red-600 to-red-800 rounded-md flex items-center justify-center text-xs shadow-lg shadow-red-500/10">
              👾
            </div>
            <span className="text-sm font-semibold text-red-300 truncate flex-1">
              {match.bot2.name}
            </span>
          </div>
          <HPBar current={match.bot2.hp} max={100} />
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
          <Clock className="w-3 h-3" />
          Round {match.round} • {timeSince}
        </div>
        <button
          onClick={onWatch}
          className="flex items-center gap-1.5 px-4 py-2 bg-[var(--neon-cyan)] hover:bg-[var(--neon-cyan)] text-white text-sm font-medium rounded-sm transition group-hover:shadow-lg group-hover:shadow-purple-500/20"
        >
          <Eye className="w-3.5 h-3.5" />
          Watch
        </button>
      </div>
    </div>
  )
}

function getTimeSince(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just started'
  if (mins === 1) return '1 min ago'
  return `${mins} min ago`
}

// ============================================================
// Watching View
// ============================================================

function WatchingView({
  match,
  onLeave,
}: {
  match: ActiveMatch
  onLeave: () => void
}) {
  const [bot1Hp, setBot1Hp] = useState(match.bot1.hp)
  const [bot2Hp, setBot2Hp] = useState(match.bot2.hp)
  const [round, setRound] = useState(match.round)
  const [rounds, setRounds] = useState<RoundAction[]>([])
  const [matchEnded, setMatchEnded] = useState(false)
  const [matchEndData, setMatchEndData] = useState<MatchEndData | null>(null)
  const [connected, setConnected] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const socketRef = useRef<Socket | null>(null)

  // Auto-scroll combat log
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [rounds])

  // WebSocket connection for spectating
  useEffect(() => {
    const socket = connectSocket()
    socketRef.current = socket
    setConnected(socket.connected)

    const onConnect = () => setConnected(true)
    const onDisconnect = () => setConnected(false)

    socket.on('connect', onConnect)
    socket.on('disconnect', onDisconnect)

    // Join as spectator
    socket.emit('spectate_match', { match_id: match.id })

    // Listen for round events
    const onRoundStart = (data: { round: number; time_limit_seconds?: number }) => {
      setRound(data.round)
    }

    const onRoundComplete = (data: RoundAction) => {
      setRounds((prev) => [...prev, data])
      setBot1Hp(data.bot1_hp)
      setBot2Hp(data.bot2_hp)
      setRound(data.round)
    }

    const onMatchEnd = (data: MatchEndData) => {
      setBot1Hp(data.bot1_hp)
      setBot2Hp(data.bot2_hp)
      setMatchEnded(true)
      setMatchEndData(data)
    }

    socket.on('round_start', onRoundStart)
    socket.on('round_complete', onRoundComplete)
    socket.on('match_end', onMatchEnd)

    return () => {
      socket.off('connect', onConnect)
      socket.off('disconnect', onDisconnect)
      socket.off('round_start', onRoundStart)
      socket.off('round_complete', onRoundComplete)
      socket.off('match_end', onMatchEnd)
      // Leave spectate
      socket.emit('leave_spectate', { match_id: match.id })
    }
  }, [match.id])

  function getActionEmoji(action: string): string {
    switch (action) {
      case 'attack':
        return '⚔️'
      case 'defend':
        return '🛡️'
      case 'skill':
        return '✨'
      default:
        return '❓'
    }
  }

  function getActionLabel(action: string, target: string | null): string {
    if (action === 'defend') return 'Defend'
    if (action === 'skill') return 'Skill'
    return `Attack → ${target || 'core'}`
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-8 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onLeave}
          className="flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to matches
        </button>

        <div className="flex items-center gap-3">
          {/* Connection status */}
          <div
            className={`flex items-center gap-1.5 text-xs ${
              connected ? 'text-green-500' : 'text-red-500'
            }`}
          >
            <Radio className={`w-3 h-3 ${connected ? 'animate-pulse' : ''}`} />
            {connected ? 'Connected' : 'Disconnected'}
          </div>

          {/* LIVE badge */}
          <div className="flex items-center gap-1.5 bg-red-900/30 border border-red-700/40 px-3 py-1 rounded-full">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
            </span>
            <span className="text-xs font-bold text-red-400 uppercase tracking-wider">
              Spectating
            </span>
          </div>

          {/* Round counter */}
          <div className="bg-[var(--bg-panel)] rounded-sm border border-[var(--border-dim)] px-3 py-1.5 flex items-center gap-2">
            <span className="text-xs text-[var(--text-muted)]">Round</span>
            <span className="text-lg font-bold text-[var(--neon-cyan)] font-mono">
              {round}
            </span>
          </div>
        </div>
      </div>

      {/* Bot Panels */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Bot 1 */}
        <div className="bg-[var(--bg-panel)] rounded-sm border border-[var(--neon-cyan)] p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-purple-800 rounded-sm flex items-center justify-center text-lg shadow-lg shadow-purple-500/10">
              🤖
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-[var(--neon-cyan)] text-sm truncate">
                {match.bot1.name}
              </div>
              <div className="text-xs text-[var(--text-muted)]">Player 1</div>
            </div>
          </div>
          <HPBar current={bot1Hp} max={100} label="HP" />
        </div>

        {/* Bot 2 */}
        <div className="bg-[var(--bg-panel)] rounded-sm border border-red-800/30 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-red-800 rounded-sm flex items-center justify-center text-lg shadow-lg shadow-red-500/10">
              👾
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-red-300 text-sm truncate">
                {match.bot2.name}
              </div>
              <div className="text-xs text-[var(--text-muted)]">Player 2</div>
            </div>
          </div>
          <HPBar current={bot2Hp} max={100} label="HP" />
        </div>
      </div>

      {/* Combat Log */}
      <div className="bg-[var(--bg-panel)] rounded-sm border border-[var(--border-dim)] p-4">
        <h3 className="text-sm font-semibold text-[var(--text-secondary)] mb-3 flex items-center gap-2">
          📜 Combat Log
        </h3>
        <div
          ref={scrollRef}
          className="max-h-80 overflow-y-auto space-y-2 scrollbar-thin scrollbar-thumb-gray-700"
        >
          {rounds.length === 0 && (
            <p className="text-sm text-[var(--text-muted)] text-center py-6">
              Waiting for combat rounds...
            </p>
          )}
          {rounds.map((r) => (
            <div
              key={r.round}
              className="bg-[var(--bg-raised)] rounded-sm p-3 border border-[var(--border-mid)]"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-[var(--neon-cyan)]">
                  Round {r.round}
                </span>
                <div className="flex gap-2 text-xs text-[var(--text-muted)]">
                  {r.bot1_timed_out && (
                    <span className="text-red-400">⏰ {match.bot1.name} timeout</span>
                  )}
                  {r.bot2_timed_out && (
                    <span className="text-red-400">⏰ {match.bot2.name} timeout</span>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-[var(--text-muted)] text-xs">{match.bot1.name}</span>
                  <div className="flex items-center gap-1">
                    <span>{getActionEmoji(r.bot1_action)}</span>
                    <span className="text-[var(--text-primary)]">
                      {getActionLabel(r.bot1_action, r.bot1_target)}
                    </span>
                  </div>
                  <span className="text-xs text-orange-400">
                    {r.bot1_damage_dealt > 0
                      ? `-${r.bot1_damage_dealt} dmg`
                      : 'No damage'}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[var(--text-muted)] text-xs">{match.bot2.name}</span>
                  <div className="flex items-center justify-end gap-1">
                    <span className="text-[var(--text-primary)]">
                      {getActionLabel(r.bot2_action, r.bot2_target)}
                    </span>
                    <span>{getActionEmoji(r.bot2_action)}</span>
                  </div>
                  <span className="text-xs text-orange-400">
                    {r.bot2_damage_dealt > 0
                      ? `-${r.bot2_damage_dealt} dmg`
                      : 'No damage'}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between mt-2 text-xs text-[var(--text-muted)]">
                <span>HP: {r.bot1_hp}</span>
                <span>HP: {r.bot2_hp}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Match Ended Overlay */}
      {matchEnded && matchEndData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-[var(--bg-panel)] border border-[var(--border-mid)] rounded-sm p-8 max-w-md w-full mx-4 text-center shadow-2xl">
            <Trophy className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Match Ended!</h2>
            {matchEndData.winner_name ? (
              <p className="text-[var(--text-primary)] mb-2">
                🏆{' '}
                <span className="text-[var(--neon-cyan)] font-semibold">
                  {matchEndData.winner_name}
                </span>{' '}
                wins!
              </p>
            ) : (
              <p className="text-[var(--text-primary)] mb-2">It&apos;s a draw!</p>
            )}
            {matchEndData.reason && (
              <p className="text-xs text-[var(--text-muted)] mb-6 capitalize">
                {matchEndData.reason.replace(/_/g, ' ')}
              </p>
            )}
            <div className="flex items-center justify-center gap-6 mb-6">
              <div className="text-center">
                <div className="text-sm text-[var(--neon-cyan)] font-medium mb-1">
                  {match.bot1.name}
                </div>
                <div className="text-2xl font-bold font-mono text-white">
                  {matchEndData.bot1_hp}
                </div>
                <div className="text-xs text-[var(--text-muted)]">HP</div>
              </div>
              <Swords className="w-5 h-5 text-[var(--text-muted)]" />
              <div className="text-center">
                <div className="text-sm text-red-300 font-medium mb-1">
                  {match.bot2.name}
                </div>
                <div className="text-2xl font-bold font-mono text-white">
                  {matchEndData.bot2_hp}
                </div>
                <div className="text-xs text-[var(--text-muted)]">HP</div>
              </div>
            </div>
            <button
              onClick={onLeave}
              className="w-full px-6 py-3 bg-[var(--neon-cyan)] hover:bg-[var(--neon-cyan)] text-white font-medium rounded-sm transition"
            >
              Back to Match List
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================================
// Main Spectate Page
// ============================================================

function SpectateContent() {
  const [matches, setMatches] = useState<ActiveMatch[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [watching, setWatching] = useState<ActiveMatch | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchMatches = useCallback(async () => {
    try {
      const data = await api<{ matches: ActiveMatch[] }>('/api/matches/active')
      setMatches(data.matches)
      setError(null)
    } catch (err: any) {
      setError(err.message || 'Failed to load matches')
    } finally {
      setLoading(false)
    }
  }, [])

  // Poll for active matches every 10s when on the list view
  useEffect(() => {
    if (watching) return

    fetchMatches()
    pollRef.current = setInterval(fetchMatches, 10000)
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [watching, fetchMatches])

  if (watching) {
    return (
      <WatchingView
        match={watching}
        onLeave={() => setWatching(null)}
      />
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Eye className="w-6 h-6 text-[var(--neon-cyan)]" />
          <h1 className="text-2xl font-bold text-white">Spectate</h1>
          <div className="flex items-center gap-1.5 bg-red-900/30 border border-red-700/40 px-2.5 py-0.5 rounded-full">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
            </span>
            <span className="text-xs font-bold text-red-400 uppercase tracking-wider">
              Live
            </span>
          </div>
        </div>
        <p className="text-sm text-[var(--text-muted)]">
          Watch ongoing matches in real-time. Pick a match to spectate!
        </p>
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-16">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[var(--text-muted)] text-sm">Loading active matches...</p>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="text-center py-12">
          <div className="bg-red-900/20 border border-red-700/30 rounded-sm p-6 max-w-md mx-auto">
            <p className="text-red-400 text-sm mb-3">{error}</p>
            <button
              onClick={() => {
                setLoading(true)
                fetchMatches()
              }}
              className="text-sm text-[var(--neon-cyan)] hover:text-[var(--neon-cyan)] transition"
            >
              Try again
            </button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && matches.length === 0 && (
        <div className="text-center py-20">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[var(--bg-panel)] rounded-sm border border-[var(--border-dim)] mb-4">
            <Swords className="w-8 h-8 text-[var(--text-muted)]" />
          </div>
          <h3 className="text-lg font-medium text-[var(--text-secondary)] mb-2">
            No live matches right now
          </h3>
          <p className="text-sm text-[var(--text-muted)]">
            Check back soon! Matches start when players queue up.
          </p>
        </div>
      )}

      {/* Match Grid */}
      {!loading && !error && matches.length > 0 && (
        <>
          <div className="flex items-center gap-2 mb-4 text-sm text-[var(--text-muted)]">
            <Users className="w-4 h-4" />
            <span>
              {matches.length} active match{matches.length !== 1 ? 'es' : ''}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {matches.map((match) => (
              <MatchCard
                key={match.id}
                match={match}
                onWatch={() => setWatching(match)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default function SpectatePage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[var(--bg-void)]">
        <Navbar />
        <SpectateContent />
      </div>
    </ProtectedRoute>
  )
}
