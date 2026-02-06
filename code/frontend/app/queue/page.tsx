'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQueueStore, useMatchStore } from '@/lib/store'
import { getEntryFee, formatDuration } from '@/lib/utils'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { Navbar } from '@/components/Navbar'

function QueueContent() {
  const router = useRouter()
  const { isQueuing, matchType, queueStartTime, stopQueuing } = useQueueStore()
  const { phase } = useMatchStore()
  const [elapsed, setElapsed] = useState(0)

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
    if (phase === 'found' || phase === 'fighting') {
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
    stopQueuing()
    router.push('/dashboard')
  }

  const entryFee = matchType ? getEntryFee(matchType) : 0
  const tierName = matchType?.replace('ranked_', '').replace(/^\w/, (c) => c.toUpperCase()) ?? 'Unknown'

  return (
    <div className="max-w-lg mx-auto px-8 py-16">
      <div className="bg-gray-900 rounded-2xl border border-gray-800 p-8 text-center">
        {/* Animated searching indicator */}
        <div className="relative w-24 h-24 mx-auto mb-8">
          {/* Outer ring */}
          <div className="absolute inset-0 border-4 border-purple-500/20 rounded-full" />
          {/* Spinning ring */}
          <div className="absolute inset-0 border-4 border-transparent border-t-purple-500 rounded-full animate-spin" />
          {/* Inner icon */}
          <div className="absolute inset-0 flex items-center justify-center text-3xl">
            ⚔️
          </div>
        </div>

        <h2 className="text-2xl font-bold mb-2">Searching for Opponent...</h2>
        <p className="text-gray-400 mb-8">Finding a worthy challenger</p>

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
