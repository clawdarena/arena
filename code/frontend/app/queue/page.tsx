'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQueueStore, useMatchStore, useAuthStore } from '@/lib/store'
import { getEntryFee, formatDuration } from '@/lib/utils'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { Navbar } from '@/components/Navbar'
import { useToast } from '@/components/Toast'
import { connectSocket, disconnectSocket } from '@/lib/socket'

function TierSelectUI() {
  const router = useRouter()
  const { user, bots } = useAuthStore()
  const { startQueuing } = useQueueStore()
  const [selectedTier, setSelectedTier] = useState('ranked_bronze')

  const tiers = [
    { id: 'ranked_bronze', name: 'BRONZE', fee: 50, minElo: 0 },
    { id: 'ranked_silver', name: 'SILVER', fee: 100, minElo: 1200 },
    { id: 'ranked_gold', name: 'GOLD', fee: 200, minElo: 1400 },
    { id: 'ranked_platinum', name: 'PLATINUM', fee: 400, minElo: 1600 },
    { id: 'ranked_legend', name: 'LEGEND', fee: 800, minElo: 1800 },
  ]

  const elo = user?.current_elo ?? 1200
  const credits = user?.credits ?? 0

  function handleStart() {
    const tier = tiers.find(t => t.id === selectedTier)
    if (!tier) return
    if (credits < tier.fee) {
      alert(`Need ${tier.fee} CR. You have ${credits}.`)
      return
    }
    startQueuing(selectedTier)
  }

  return (
    <div className="max-w-md mx-auto px-6 py-16">
      <div className="panel p-8 corner-brackets">
        <h2 className="arena-title text-xl text-center mb-2">FIND MATCH</h2>
        <p className="text-[var(--text-muted)] text-sm text-center mb-6">Select a tier and enter the queue</p>

        <div className="space-y-1.5 mb-6">
          {tiers.map((tier) => {
            const locked = elo < tier.minElo
            const cantAfford = credits < tier.fee
            return (
              <button
                key={tier.id}
                onClick={() => !locked && setSelectedTier(tier.id)}
                className={`w-full flex items-center justify-between p-3 rounded-sm border text-sm transition ${
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
                  {locked ? `🔒 ${tier.minElo}+ ELO` : cantAfford ? `⚠ ${tier.fee} CR` : `${tier.fee} CR`}
                </span>
              </button>
            )
          })}
        </div>

        <button onClick={handleStart} className="btn-primary w-full py-3 mb-4">
          ⚔️ JOIN QUEUE →
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
      if (err.code === 'ALREADY_IN_QUEUE' || err.code === 'INSUFFICIENT_CREDITS' || err.code === 'ELO_TOO_LOW') {
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
