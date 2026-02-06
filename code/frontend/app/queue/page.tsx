'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQueueStore, useMatchStore, useAuthStore } from '@/lib/store'
import { getEntryFee, formatDuration } from '@/lib/utils'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { Navbar } from '@/components/Navbar'
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

  // Connect WebSocket and join queue
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
      // Auto-ready (accept match)
      socket.emit('ready', { match_id: data.match_id, bot_id: botId })
      setStatus('waiting_accept')
      setStatusMessage('Waiting for opponent to accept...')
    })

    socket.on('opponent_accepted', () => {
      setStatusMessage('Opponent accepted! Starting match...')
    })

    socket.on('match_cancelled', (data: any) => {
      setAcceptCountdown(null)

      if (data.re_queued) {
        // We accepted but opponent didn't — we're re-queued with priority
        setStatus('re_queued')
        setStatusMessage('Opponent didn\'t accept. Re-queuing you with priority...')
        setPhase('idle')
        // Stay on queue page, backend already re-queued us
        setTimeout(() => {
          setStatus('searching')
          setStatusMessage('')
        }, 3000)
      } else {
        // We didn't accept, or neither did — back to dashboard
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

  // Accept countdown timer (60s)
  useEffect(() => {
    if (acceptCountdown === null || acceptCountdown <= 0) return
    const timer = setTimeout(() => setAcceptCountdown((c) => (c !== null ? c - 1 : null)), 1000)
    return () => clearTimeout(timer)
  }, [acceptCountdown])

  // Elapsed timer
  useEffect(() => {
    if (!isQueuing || !queueStartTime) return

    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - queueStartTime) / 1000))
    }, 1000)

    return () => clearInterval(interval)
  }, [isQueuing, queueStartTime])

  // Redirect to match when found
  useEffect(() => {
    if (phase === 'fighting') {
      stopQueuing()
      router.push('/match')
    }
  }, [phase, router, stopQueuing])

  // If not queuing, redirect back to dashboard
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
  const tierName = matchType?.replace('ranked_', '').replace(/^\w/, (c) => c.toUpperCase()) ?? 'Unknown'

  return (
    <div className="max-w-lg mx-auto px-8 py-16">
      <div className="bg-gray-900 rounded-2xl border border-gray-800 p-8 text-center">
        {/* Animated indicator */}
        <div className="relative w-24 h-24 mx-auto mb-8">
          {/* Outer ring */}
          <div className={`absolute inset-0 border-4 rounded-full ${
            status === 'waiting_accept' ? 'border-yellow-500/20' :
            status === 're_queued' ? 'border-green-500/20' :
            'border-purple-500/20'
          }`} />
          {/* Spinning ring */}
          <div className={`absolute inset-0 border-4 border-transparent rounded-full animate-spin ${
            status === 'waiting_accept' ? 'border-t-yellow-500' :
            status === 're_queued' ? 'border-t-green-500' :
            'border-t-purple-500'
          }`} />
          {/* Inner icon */}
          <div className="absolute inset-0 flex items-center justify-center text-3xl">
            {status === 'waiting_accept' ? '⏳' : status === 're_queued' ? '🔄' : '⚔️'}
          </div>
        </div>

        <h2 className="text-2xl font-bold mb-2">
          {status === 'waiting_accept' ? 'Match Found!' :
           status === 're_queued' ? 'Re-queued (Priority)' :
           'Searching for Opponent...'}
        </h2>
        <p className="text-gray-400 mb-2">
          {status === 'waiting_accept' ? 'You accepted — waiting for opponent' :
           status === 're_queued' ? 'Finding you a new match faster' :
           'Finding a worthy challenger'}
        </p>
        {statusMessage && (
          <p className={`text-sm mb-4 ${
            status === 're_queued' ? 'text-green-400' :
            status === 'waiting_accept' ? 'text-yellow-400' :
            'text-gray-500'
          }`}>
            {statusMessage}
          </p>
        )}
        {acceptCountdown !== null && acceptCountdown > 0 && (
          <div className="mb-4">
            <span className={`text-lg font-mono font-bold ${
              acceptCountdown <= 10 ? 'text-red-400 animate-pulse' : 'text-yellow-400'
            }`}>
              {acceptCountdown}s
            </span>
            <span className="text-gray-500 text-sm ml-2">for opponent to accept</span>
          </div>
        )}

        {/* Match Info */}
        <div className="space-y-3 mb-8">
          <div className="flex items-center justify-between bg-gray-800 rounded-lg px-4 py-3">
            <span className="text-gray-400">Tier</span>
            <span className="font-medium text-purple-400">{tierName}</span>
          </div>
          <div className="flex items-center justify-between bg-gray-800 rounded-lg px-4 py-3">
            <span className="text-gray-400">Entry Fee</span>
            <span className="font-medium text-yellow-400">{entryFee} AC</span>
          </div>
          <div className="flex items-center justify-between bg-gray-800 rounded-lg px-4 py-3">
            <span className="text-gray-400">Time in Queue</span>
            <span className="font-mono text-lg font-medium">{formatDuration(elapsed)}</span>
          </div>
        </div>

        {/* Fun facts / tips while waiting */}
        <div className="bg-gray-800/50 rounded-lg p-4 mb-8">
          <p className="text-sm text-gray-500">
            💡 Tip: Your bot&apos;s strategy and reasoning never leave your machine.
            Only combat actions are sent to the server.
          </p>
        </div>

        {/* Cancel Button */}
        <button
          onClick={handleCancel}
          className="w-full py-3 bg-red-600/20 hover:bg-red-600/30 border border-red-600/40 text-red-400 rounded-lg font-medium transition"
        >
          Cancel Queue
        </button>
      </div>
    </div>
  )
}

export default function QueuePage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-950">
        <Navbar />
        <QueueContent />
      </div>
    </ProtectedRoute>
  )
}
