'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQueueStore, useMatchStore, useAuthStore } from '@/lib/store'
import { getEntryFee, formatDuration } from '@/lib/utils'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { Navbar } from '@/components/Navbar'
import { useToast } from '@/components/Toast'
import { connectSocket, disconnectSocket } from '@/lib/socket'

function getTierForElo(elo: number) {
  const tiers = [
    { id: 'ranked_legend', name: 'LEGEND', fee: 800, minElo: 1800, color: 'var(--neon-red)' },
    { id: 'ranked_platinum', name: 'PLATINUM', fee: 400, minElo: 1600, color: 'var(--neon-cyan)' },
    { id: 'ranked_gold', name: 'GOLD', fee: 200, minElo: 1400, color: 'var(--neon-amber)' },
    { id: 'ranked_silver', name: 'SILVER', fee: 100, minElo: 1200, color: 'var(--text-secondary)' },
    { id: 'ranked_bronze', name: 'BRONZE', fee: 50, minElo: 0, color: '#cd7f32' },
  ]
  // Find the highest tier the player qualifies for
  for (const tier of tiers) {
    if (elo >= tier.minElo) return tier
  }
  return tiers[tiers.length - 1]
}

const ALL_TIERS = [
  { id: 'ranked_bronze', name: 'BRONZE', fee: 50, minElo: 0, maxElo: 1199, color: '#cd7f32' },
  { id: 'ranked_silver', name: 'SILVER', fee: 100, minElo: 1200, maxElo: 1399, color: 'var(--text-secondary)' },
  { id: 'ranked_gold', name: 'GOLD', fee: 200, minElo: 1400, maxElo: 1599, color: 'var(--neon-amber)' },
  { id: 'ranked_platinum', name: 'PLATINUM', fee: 400, minElo: 1600, maxElo: 1799, color: 'var(--neon-cyan)' },
  { id: 'ranked_legend', name: 'LEGEND', fee: 800, minElo: 1800, maxElo: 9999, color: 'var(--neon-red)' },
]

function TierSelectUI() {
  const router = useRouter()
  const { user, bots } = useAuthStore()
  const { startQueuing } = useQueueStore()

  const elo = user?.current_elo ?? 1000
  const credits = user?.credits ?? 0
  const currentTier = getTierForElo(elo)
  const cantAfford = credits < currentTier.fee

  function handleStart() {
    if (cantAfford) {
      alert(`Need ${currentTier.fee} CR. You have ${credits}.`)
      return
    }
    startQueuing(currentTier.id)
  }

  return (
    <div className="max-w-md mx-auto px-6 py-16">
      <div className="panel p-8 corner-brackets">
        <h2 className="arena-title text-xl text-center mb-2">FIND MATCH</h2>
        <p className="text-[var(--text-muted)] text-sm text-center mb-6">Your ELO determines your tier</p>

        {/* Current tier display */}
        <div className="mb-6">
          <div className="panel-raised p-5 text-center border-l-2" style={{ borderLeftColor: currentTier.color }}>
            <div className="arena-subtitle text-[10px] text-[var(--text-muted)] mb-2">YOUR TIER</div>
            <div className="arena-title text-2xl mb-1" style={{ color: currentTier.color }}>
              {currentTier.name}
            </div>
            <div className="font-mono text-sm text-[var(--text-secondary)]">{elo} ELO</div>
            <div className="font-mono text-xs text-[var(--neon-amber)] mt-2">{currentTier.fee} CR entry fee</div>
          </div>
        </div>

        {/* All tiers overview */}
        <div className="space-y-1 mb-6">
          {ALL_TIERS.map((tier) => {
            const isCurrent = tier.id === currentTier.id
            return (
              <div
                key={tier.id}
                className={`flex items-center justify-between px-3 py-2 rounded-sm text-xs transition ${
                  isCurrent
                    ? 'border border-[var(--border-bright)] bg-[var(--bg-raised)]'
                    : 'border border-transparent text-[var(--text-muted)] opacity-40'
                }`}
              >
                <div className="flex items-center gap-2">
                  {isCurrent && <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: tier.color }} />}
                  <span className="arena-subtitle text-[10px]" style={{ color: isCurrent ? tier.color : undefined }}>
                    {tier.name}
                  </span>
                </div>
                <span className="font-mono text-[10px]">
                  {tier.minElo}–{tier.maxElo === 9999 ? '∞' : tier.maxElo} ELO · {tier.fee} CR
                </span>
              </div>
            )
          })}
        </div>

        <button
          onClick={handleStart}
          disabled={cantAfford}
          className={`w-full py-3 mb-4 ${cantAfford ? 'btn-secondary opacity-50 cursor-not-allowed' : 'btn-primary'}`}
        >
          {cantAfford ? `⚠ NEED ${currentTier.fee} CR` : `⚔️ FIGHT IN ${currentTier.name} →`}
        </button>

        <div className="h-px bg-[var(--border-dim)] my-4" />

        <div className="text-center">
          <p className="text-[var(--text-muted)] text-xs mb-3">Or train solo against AI</p>
          <div className="flex gap-2 justify-center">
            <a href="/pve" className="btn-secondary py-2 px-4 text-xs">PVE ARENA</a>
            <a href="/gauntlet" className="btn-secondary py-2 px-4 text-xs">GAUNTLET</a>
          </div>
        </div>
      </div>
    </div>
  )
}

function QueueContent() {
  const router = useRouter()
  const { isQueuing, matchType, queueStartTime, stopQueuing } = useQueueStore()
  const { phase, setMatchData, setPhase } = useMatchStore()
  const { bots } = useAuthStore()
  const [elapsed, setElapsed] = useState(0)
  const [acceptCountdown, setAcceptCountdown] = useState<number | null>(null)
  const [status, setStatus] = useState<'searching' | 'found' | 'waiting_accept' | 're_queued'>('searching')
  const [statusMessage, setStatusMessage] = useState('')
  const toast = useToast()

  useEffect(() => {
    if (!isQueuing || !matchType) return

    const socket = connectSocket()
    const botId = bots[0]?.id

    if (botId) {
      socket.emit('join_queue', { bot_id: botId, match_type: matchType })
    }

    socket.on('match_found', (data: any) => {
      setMatchData(data)
      setPhase('found')
      setStatus('found')
      setAcceptCountdown(60)
      socket.emit('ready', { match_id: data.match_id, bot_id: botId })
      setStatus('waiting_accept')
      setStatusMessage('Waiting for opponent to accept...')
      toast.matchFound(data.opponent?.name || 'Unknown')
    })

    socket.on('opponent_accepted', () => {
      setStatusMessage('Opponent accepted! Starting match...')
    })

    socket.on('match_cancelled', (data: any) => {
      setAcceptCountdown(null)
      if (data.re_queued) {
        setStatus('re_queued')
        setStatusMessage('Opponent didn\'t accept. Re-queuing with priority...')
        toast.info('Opponent didn\'t accept', 'Re-queuing with priority...')
        setPhase('idle')
        setTimeout(() => {
          setStatus('searching')
          setStatusMessage('')
        }, 3000)
      } else {
        stopQueuing()
        router.push('/dashboard')
      }
    })

    socket.on('match_start', () => {
      setAcceptCountdown(null)
      setPhase('fighting')
    })

    socket.on('error', (err: any) => {
      console.error('Queue error:', err)
      if (err.code === 'ALREADY_IN_QUEUE' || err.code === 'INSUFFICIENT_CREDITS' || err.code === 'ELO_TOO_LOW' || err.code === 'TIER_MISMATCH') {
        setStatusMessage(err.message)
        setTimeout(() => {
          stopQueuing()
          router.push('/dashboard')
        }, 2000)
      }
    })

    return () => {
      socket.off('match_found')
      socket.off('opponent_accepted')
      socket.off('match_cancelled')
      socket.off('match_start')
      socket.off('error')
    }
  }, [isQueuing, matchType, bots, setMatchData, setPhase, stopQueuing, router])

  useEffect(() => {
    if (acceptCountdown === null || acceptCountdown <= 0) return
    const timer = setTimeout(() => setAcceptCountdown((c) => (c !== null ? c - 1 : null)), 1000)
    return () => clearTimeout(timer)
  }, [acceptCountdown])

  useEffect(() => {
    if (!isQueuing || !queueStartTime) return
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - queueStartTime) / 1000))
    }, 1000)
    return () => clearInterval(interval)
  }, [isQueuing, queueStartTime])

  useEffect(() => {
    if (phase === 'fighting') {
      stopQueuing()
      router.push('/match')
    }
  }, [phase, router, stopQueuing])

  // Don't auto-redirect — show tier selection instead

  function handleCancel() {
    const socket = connectSocket()
    const botId = bots[0]?.id
    if (botId) socket.emit('leave_queue', { bot_id: botId })
    stopQueuing()
    router.push('/dashboard')
  }

  const entryFee = matchType ? getEntryFee(matchType) : 0
  const tierName = matchType?.replace('ranked_', '').toUpperCase() ?? 'UNKNOWN'

  // ── Not queuing: show tier selection ──
  if (!isQueuing) {
    return <TierSelectUI />
  }

  return (
    <div className="max-w-md mx-auto px-6 py-16">
      <div className="panel p-8 text-center corner-brackets relative">
        {/* Animated indicator */}
        <div className="relative w-20 h-20 mx-auto mb-8">
          {/* Outer ring */}
          <div className={`absolute inset-0 border-2 rounded-full ${
            status === 'waiting_accept' ? 'border-[var(--neon-amber-dim)]' :
            status === 're_queued' ? 'border-[var(--neon-green-dim)]' :
            'border-[var(--neon-cyan-dim)]'
          }`} />
          {/* Spinning ring */}
          <div className={`absolute inset-0 border-2 border-transparent rounded-full animate-spin ${
            status === 'waiting_accept' ? 'border-t-[var(--neon-amber)]' :
            status === 're_queued' ? 'border-t-[var(--neon-green)]' :
            'border-t-[var(--neon-cyan)]'
          }`} style={{ animationDuration: '1.5s' }} />
          {/* Inner icon */}
          <div className="absolute inset-0 flex items-center justify-center text-2xl">
            {status === 'waiting_accept' ? '⏳' : status === 're_queued' ? '🔄' : '⚔️'}
          </div>
        </div>

        <h2 className="arena-title text-lg mb-2">
          {status === 'waiting_accept' ? 'MATCH FOUND' :
           status === 're_queued' ? 'RE-QUEUED' :
           'SCANNING FOR TARGETS'}
        </h2>
        <p className="text-sm text-[var(--text-secondary)] mb-2">
          {status === 'waiting_accept' ? 'Auto-accepted — waiting for opponent' :
           status === 're_queued' ? 'Priority queue — finding next match' :
           'Searching for a worthy challenger'}
        </p>
        {statusMessage && (
          <p className={`text-xs font-mono mb-4 ${
            status === 're_queued' ? 'text-[var(--neon-green)]' :
            status === 'waiting_accept' ? 'text-[var(--neon-amber)]' :
            'text-[var(--text-muted)]'
          }`}>
            {statusMessage}
          </p>
        )}
        {acceptCountdown !== null && acceptCountdown > 0 && (
          <div className="mb-4">
            <span className={`text-2xl font-mono font-bold ${
              acceptCountdown <= 10 ? 'text-[var(--neon-red)] animate-pulse glow-red' : 'text-[var(--neon-amber)] glow-amber'
            }`}>
              {acceptCountdown}
            </span>
            <span className="text-[var(--text-muted)] text-xs ml-2 font-mono">SEC</span>
          </div>
        )}

        {/* Match Info */}
        <div className="space-y-1.5 mb-6 text-left">
          <div className="flex items-center justify-between bg-[var(--bg-void)] border border-[var(--border-dim)] rounded-sm px-4 py-2.5">
            <span className="arena-subtitle text-[10px] text-[var(--text-muted)]">TIER</span>
            <span className="font-mono text-sm font-bold text-[var(--neon-cyan)]">{tierName}</span>
          </div>
          <div className="flex items-center justify-between bg-[var(--bg-void)] border border-[var(--border-dim)] rounded-sm px-4 py-2.5">
            <span className="arena-subtitle text-[10px] text-[var(--text-muted)]">ENTRY FEE</span>
            <span className="font-mono text-sm font-bold text-[var(--neon-amber)]">{entryFee} CR</span>
          </div>
          <div className="flex items-center justify-between bg-[var(--bg-void)] border border-[var(--border-dim)] rounded-sm px-4 py-2.5">
            <span className="arena-subtitle text-[10px] text-[var(--text-muted)]">ELAPSED</span>
            <span className="font-mono text-lg font-bold text-[var(--text-primary)]">{formatDuration(elapsed)}</span>
          </div>
        </div>

        {/* Tip */}
        <div className="panel-raised p-3 mb-6 text-left border-l-2 border-l-[var(--neon-cyan)]">
          <p className="text-xs text-[var(--text-muted)] font-mono">
            // your bot&apos;s strategy never leaves your machine
          </p>
        </div>

        {/* Cancel */}
        <button onClick={handleCancel} className="btn-danger w-full py-3">
          CANCEL QUEUE
        </button>
      </div>
    </div>
  )
}

export default function QueuePage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[var(--bg-void)] arena-grid-bg">
        <Navbar />
        <QueueContent />
      </div>
    </ProtectedRoute>
  )
}
