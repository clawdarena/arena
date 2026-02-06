'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMatchStore, useAuthStore } from '@/lib/store'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { Navbar } from '@/components/Navbar'
import { HPBar } from '@/components/HPBar'
import { ActionLog } from '@/components/ActionLog'
import { MatchResult } from '@/components/MatchResult'

function MatchContent() {
  const router = useRouter()
  const { user, bots } = useAuthStore()
  const {
    phase,
    matchData,
    currentRound,
    roundHistory,
    matchResult,
  } = useMatchStore()

  const [timer, setTimer] = useState(0)

  // Round timer
  useEffect(() => {
    if (phase !== 'fighting' || !currentRound) return

    setTimer(currentRound.time_limit_seconds)
    const interval = setInterval(() => {
      setTimer((t) => {
        if (t <= 0) {
          clearInterval(interval)
          return 0
        }
        return t - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [phase, currentRound])

  // Redirect if no match data
  useEffect(() => {
    if (phase === 'idle' && !matchData) {
      router.push('/dashboard')
    }
  }, [phase, matchData, router])

  if (!matchData) {
    return (
      <div className="max-w-4xl mx-auto px-8 py-8 text-center">
        <div className="text-gray-400">No active match. Redirecting...</div>
      </div>
    )
  }

  const myBot = matchData.my_bot
  const myBotId = myBot.id

  // Get current HP from latest round or initial state
  const latestRound = roundHistory.length > 0 ? roundHistory[roundHistory.length - 1] : null
  // We need to figure out if myBot is bot1 or bot2 based on the round data
  const myCurrentHP = latestRound
    ? (latestRound.bot1_hp !== undefined ? latestRound.bot1_hp : myBot.hp)
    : myBot.hp
  const oppCurrentHP = latestRound
    ? (latestRound.bot2_hp !== undefined ? latestRound.bot2_hp : 100)
    : 100

  const roundNumber = currentRound?.round ?? (latestRound?.round ?? 0)

  return (
    <div className="max-w-4xl mx-auto px-8 py-8">
      {/* Match Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="text-sm text-gray-500 uppercase tracking-wide">
          {matchData.match_type.replace('_', ' ')}
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-gray-900 rounded-lg border border-gray-800 px-4 py-2">
            <span className="text-sm text-gray-400">Round </span>
            <span className="text-lg font-bold text-purple-400">{roundNumber}</span>
          </div>
          {phase === 'fighting' && (
            <div className={`bg-gray-900 rounded-lg border border-gray-800 px-4 py-2 ${
              timer <= 5 ? 'border-red-600 animate-pulse' : ''
            }`}>
              <span className="text-sm text-gray-400">⏱ </span>
              <span className={`text-lg font-bold font-mono ${
                timer <= 5 ? 'text-red-400' : 'text-white'
              }`}>
                {timer}s
              </span>
            </div>
          )}
        </div>
        <div className="text-sm text-gray-500">
          Entry: {matchData.entry_fee} AC
        </div>
      </div>

      {/* Bot Arena */}
      <div className="grid grid-cols-2 gap-8 mb-8">
        {/* My Bot */}
        <div className="bg-gray-900 rounded-xl border border-purple-800/50 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center text-xl">
              🤖
            </div>
            <div>
              <div className="font-semibold text-purple-300">{myBot.name}</div>
              <div className="text-xs text-gray-500">Your Bot</div>
            </div>
          </div>
          <HPBar current={myCurrentHP} max={myBot.hp} label="HP" />
          <div className="grid grid-cols-3 gap-2 mt-4 text-center">
            <div>
              <div className="text-sm font-medium text-orange-400">{myBot.attack}</div>
              <div className="text-xs text-gray-600">ATK</div>
            </div>
            <div>
              <div className="text-sm font-medium text-blue-400">{myBot.defense}</div>
              <div className="text-xs text-gray-600">DEF</div>
            </div>
            <div>
              <div className="text-sm font-medium text-green-400">{myBot.speed}</div>
              <div className="text-xs text-gray-600">SPD</div>
            </div>
          </div>
          {myBot.status_effects.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1">
              {myBot.status_effects.map((effect, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 bg-purple-900/40 border border-purple-700/50 rounded text-xs text-purple-300"
                >
                  {effect}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Opponent Bot */}
        <div className="bg-gray-900 rounded-xl border border-red-800/50 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center text-xl">
              👾
            </div>
            <div>
              <div className="font-semibold text-red-300">{matchData.opponent.name}</div>
              <div className="text-xs text-gray-500">
                {matchData.opponent.elo} ELO
              </div>
            </div>
          </div>
          <HPBar current={oppCurrentHP} max={100} label="HP" />
        </div>
      </div>

      {/* VS Divider */}
      {phase === 'found' && (
        <div className="text-center mb-8">
          <div className="text-4xl font-bold text-gray-600 animate-pulse">
            ⚔️ Match starting in {matchData.start_in_seconds}s...
          </div>
        </div>
      )}

      {phase === 'fighting' && (
        <div className="text-center mb-4">
          <div className="inline-flex items-center gap-2 bg-green-900/30 border border-green-700/50 rounded-lg px-4 py-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm text-green-400">Combat in progress</span>
          </div>
        </div>
      )}

      {/* Action Log */}
      <ActionLog rounds={roundHistory} myBotId={myBotId} />

      {/* Match Result Overlay */}
      {phase === 'result' && matchResult && (
        <MatchResult result={matchResult} myBotId={myBotId} />
      )}
    </div>
  )
}

export default function MatchPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-950">
        <Navbar />
        <MatchContent />
      </div>
    </ProtectedRoute>
  )
}
