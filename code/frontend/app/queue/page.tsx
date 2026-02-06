'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQueueStore, useMatchStore, useAuthStore } from '@/lib/store'
import { getEntryFee, formatDuration } from '@/lib/utils'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { Navbar } from '@/components/Navbar'
import { useToast } from '@/components/Toast'
import { connectSocket, disconnectSocket } from '@/lib/socket'

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

  useEffect(() => {
    if (!isQueuing && phase === 'idle') {
      router.push('/dashboard')
    }
  }, [isQueuing, phase, router])

  function handleCancel() {
    const socket = connectSocket()
    const botId = bots[0]?.id
    if (botId) socket.emit('leave_queue', { bot_id: botId })
    stopQueuing()
    router.push('/dashboard')
  }

  const entryFee = matchType ? getEntryFee(matchType) : 0
  const tierName = matchType?.replace('ranked_', '').toUpperCase() ?? 'UNKNOWN'

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
