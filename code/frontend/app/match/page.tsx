'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useMatchStore, useAuthStore } from '@/lib/store'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { Navbar } from '@/components/Navbar'
import { HPBar } from '@/components/HPBar'
import { ActionLog } from '@/components/ActionLog'
import { MatchResult } from '@/components/MatchResult'
import { ArenaView } from '@/components/ArenaView'
import { connectSocket } from '@/lib/socket'
import type {
  RoundResult,
  RoundCompletePayload,
  RoundStartPayload,
  MatchStartPayload,
  MatchEndPayload,
} from '../../../shared/types'
import { Shield, Swords, Zap, Timer, Trophy, Wifi, WifiOff } from 'lucide-react'

// ============================================================
// Live Match WebSocket Hook
// ============================================================

function useLiveMatch() {
  const {
    phase,
    matchData,
    roundHistory,
    setPhase,
    setCurrentRound,
    setRoundResult,
    setMatchResult,
  } = useMatchStore()

  const [currentAnimRound, setCurrentAnimRound] = useState<RoundResult | null>(null)
  const [previousAnimRound, setPreviousAnimRound] = useState<RoundResult | null>(null)
  const [isAnimating, setIsAnimating] = useState(false)
  const [timer, setTimer] = useState(30)
  const [timeLimit, setTimeLimit] = useState(30)
  const [connected, setConnected] = useState(false)
  const [matchStartData, setMatchStartData] = useState<MatchStartPayload | null>(null)
  const roundQueueRef = useRef<RoundCompletePayload[]>([])
  const processingRef = useRef(false)

  // Process queued rounds one at a time (with animation delay)
  const processNextRound = useCallback(() => {
    if (processingRef.current || roundQueueRef.current.length === 0) return
    processingRef.current = true

    const round = roundQueueRef.current.shift()!
    const prevRounds = useMatchStore.getState().roundHistory
    const prev = prevRounds.length > 0 ? prevRounds[prevRounds.length - 1] : null

    setPreviousAnimRound(prev)
    setCurrentAnimRound(round)
    setIsAnimating(true)
    setRoundResult(round)
  }, [setRoundResult])

  const onAnimationComplete = useCallback(() => {
    setIsAnimating(false)
    processingRef.current = false
    // Process next queued round if any
    setTimeout(() => {
      if (roundQueueRef.current.length > 0) {
        processNextRound()
      }
    }, 300)
  }, [processNextRound])

  // Connect to WebSocket and listen for combat events
  useEffect(() => {
    if (!matchData) return

    const socket = connectSocket()
    setConnected(socket.connected)

    socket.on('connect', () => setConnected(true))
    socket.on('disconnect', () => setConnected(false))

    // Match officially starts (both players ready)
    socket.on('match_start', (data: MatchStartPayload) => {
      setMatchStartData(data)
      setTimeLimit(data.time_limit_seconds)
      setTimer(data.time_limit_seconds)
      setPhase('fighting')
    })

    // New round begins
    socket.on('round_start', (data: RoundStartPayload) => {
      setCurrentRound(data)
      setTimer(data.time_limit_seconds)
    })

    // Round resolved by server
    socket.on('round_complete', (data: RoundCompletePayload) => {
      roundQueueRef.current.push(data)
      processNextRound()
    })

    // Match ended
    socket.on('match_end', (data: MatchEndPayload) => {
      // Small delay so last round animation can finish
      setTimeout(() => {
        setMatchResult(data)
      }, isAnimating ? 2000 : 500)
    })

    // Opponent disconnected
    socket.on('player_disconnected', (data: any) => {
      console.log('Opponent disconnected, grace period:', data.grace_period_seconds)
    })

    // Error
    socket.on('error', (err: any) => {
      console.error('Match error:', err)
    })

    return () => {
      socket.off('connect')
      socket.off('disconnect')
      socket.off('match_start')
      socket.off('round_start')
      socket.off('round_complete')
      socket.off('match_end')
      socket.off('player_disconnected')
      socket.off('error')
    }
  }, [matchData, setPhase, setCurrentRound, setRoundResult, setMatchResult, processNextRound, isAnimating])

  // Timer countdown
  useEffect(() => {
    if (phase !== 'fighting') return
    const interval = setInterval(() => {
      setTimer((t) => Math.max(0, t - 1))
    }, 1000)
    return () => clearInterval(interval)
  }, [phase, roundHistory.length])

  // Reset timer when new round starts
  useEffect(() => {
    if (roundHistory.length > 0) {
      setTimer(timeLimit)
    }
  }, [roundHistory.length, timeLimit])

  return {
    currentAnimRound,
    previousAnimRound,
    isAnimating,
    onAnimationComplete,
    timer,
    connected,
    matchStartData,
  }
}

// ============================================================
// Match Page Content
// ============================================================

function MatchContent() {
  const router = useRouter()
  const { user } = useAuthStore()
  const {
    phase,
    matchData,
    roundHistory,
    matchResult,
    reset,
  } = useMatchStore()

  const {
    currentAnimRound,
    previousAnimRound,
    isAnimating,
    onAnimationComplete,
    timer,
    connected,
    matchStartData,
  } = useLiveMatch()

  // If no match data, redirect to dashboard
  useEffect(() => {
    if (!matchData && phase === 'idle') {
      router.push('/dashboard')
    }
  }, [matchData, phase, router])

  // Cleanup on unmount
  useEffect(() => {
    return () => { reset() }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!matchData) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-8 py-8 text-center">
        <div className="text-gray-400">Loading match...</div>
      </div>
    )
  }

  const myBot = matchData.my_bot
  const myBotId = myBot.id
  const latestRound = roundHistory.length > 0 ? roundHistory[roundHistory.length - 1] : null
  const roundNumber = latestRound?.round ?? 0
  const maxRounds = matchStartData?.max_rounds ?? 10

  // Get current HP from latest round
  const myHp = latestRound ? latestRound.bot1_hp : myBot.hp
  const oppHp = latestRound ? latestRound.bot2_hp : (matchStartData?.bot2.hp ?? 100)
  const oppMaxHp = matchStartData?.bot2.hp ?? 100

  // Energy from latest round
  const myEnergy = latestRound ? (latestRound as any).bot1_energy ?? 100 : 100
  const oppEnergy = latestRound ? (latestRound as any).bot2_energy ?? 100 : 100

  // Counter & momentum from latest round
  const myCounter = latestRound ? (latestRound as any).bot1_counter ?? 'none' : 'none'
  const oppCounter = latestRound ? (latestRound as any).bot2_counter ?? 'none' : 'none'
  const myMomentum = latestRound ? (latestRound as any).bot1_momentum ?? 0 : 0
  const oppMomentum = latestRound ? (latestRound as any).bot2_momentum ?? 0 : 0

  // Status effects from latest round
  const myEffects: string[] = latestRound
    ? latestRound.effects_applied.filter(e => e.bot === 'bot1').map(e => e.effect)
    : []
  const oppEffects: string[] = latestRound
    ? latestRound.effects_applied.filter(e => e.bot === 'bot2').map(e => e.effect)
    : []

  function counterLabel(counter: string): string {
    switch (counter) {
      case 'attack_vs_skill': return '⚔️ COUNTER! Attack vs Skill'
      case 'defend_vs_attack': return '🛡️ COUNTER! Defend vs Attack'
      case 'skill_vs_defend': return '✨ COUNTER! Skill vs Defend'
      default: return ''
    }
  }

  function effectEmoji(effect: string): string {
    switch (effect) {
      case 'burning': return '🔥'
      case 'stunned': return '⚡'
      case 'armor_broken': return '💔'
      case 'overclock': return '⚡'
      case 'iron_fortress': return '🏰'
      case 'regenerating': return '💚'
      case 'berserker': return '😤'
      case 'mirror_coat': return '🪞'
      default: return '✨'
    }
  }

  function effectColor(effect: string): string {
    switch (effect) {
      case 'burning': return 'bg-orange-900/30 border-orange-700/50 text-orange-300'
      case 'stunned': return 'bg-yellow-900/30 border-yellow-700/50 text-yellow-300'
      case 'armor_broken': return 'bg-red-900/30 border-red-700/50 text-red-300'
      case 'overclock': return 'bg-cyan-900/30 border-cyan-700/50 text-cyan-300'
      case 'iron_fortress': return 'bg-blue-900/30 border-blue-700/50 text-blue-300'
      case 'regenerating': return 'bg-green-900/30 border-green-700/50 text-green-300'
      case 'berserker': return 'bg-red-900/30 border-red-700/50 text-red-300'
      case 'mirror_coat': return 'bg-purple-900/30 border-purple-700/50 text-purple-300'
      default: return 'bg-gray-800/30 border-gray-700/50 text-gray-300'
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-8 py-6">
      {/* Match Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500 uppercase tracking-wide">
          <Trophy className="w-4 h-4" />
          {matchData.match_type.replace('ranked_', '').replace(/^\w/, (c) => c.toUpperCase())} Ranked
        </div>
        <div className="flex items-center gap-3">
          {/* Connection indicator */}
          <div className={`flex items-center gap-1 text-xs ${connected ? 'text-green-500' : 'text-red-500'}`}>
            {connected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
          </div>
          <div className="bg-gray-900 rounded-lg border border-gray-800 px-3 py-1.5 flex items-center gap-2">
            <span className="text-xs text-gray-500">Round</span>
            <span className="text-lg font-bold text-purple-400 font-mono">{roundNumber}/{maxRounds}</span>
          </div>
          {phase === 'fighting' && (
            <div className={`bg-gray-900 rounded-lg border px-3 py-1.5 flex items-center gap-2 ${
              timer <= 5 ? 'border-red-600/50 bg-red-900/10' : 'border-gray-800'
            }`}>
              <Timer className={`w-3.5 h-3.5 ${timer <= 5 ? 'text-red-400' : 'text-gray-500'}`} />
              <span className={`text-lg font-bold font-mono ${
                timer <= 5 ? 'text-red-400 animate-pulse' : 'text-white'
              }`}>
                {timer}s
              </span>
            </div>
          )}
        </div>
        <div className="text-sm text-gray-500">
          Entry: <span className="text-yellow-400 font-medium">{matchData.entry_fee} AC</span>
        </div>
      </div>

      {/* Arena Visualization */}
      <div className="mb-4">
        <ArenaView
          bot1Name={myBot.name}
          bot2Name={matchData.opponent.name}
          bot1MaxHp={myBot.hp}
          bot2MaxHp={oppMaxHp}
          currentRound={currentAnimRound}
          previousRound={previousAnimRound}
          isAnimating={isAnimating}
          onAnimationComplete={onAnimationComplete}
        />
      </div>

      {/* Bot Panels */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4">
        {/* My Bot Panel */}
        <div className="bg-gray-900 rounded-xl border border-purple-800/30 p-3 sm:p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-purple-800 rounded-lg flex items-center justify-center text-lg shadow-lg shadow-purple-500/10">
              🤖
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-purple-300 text-sm truncate">{myBot.name}</div>
              <div className="text-xs text-gray-500">Your Bot</div>
            </div>
          </div>
          <HPBar current={myHp} max={myBot.hp} label="HP" />
          {/* Energy Bar */}
          <div className="mt-2">
            <div className="flex items-center justify-between text-[10px] mb-0.5">
              <span className="text-cyan-400">⚡ Energy</span>
              <span className="text-cyan-300 font-mono">{myEnergy}/100</span>
            </div>
            <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 rounded-full transition-all duration-500"
                style={{ width: `${myEnergy}%` }}
              />
            </div>
          </div>
          {/* Momentum */}
          {myMomentum > 0 && (
            <div className="mt-2 flex items-center gap-1.5">
              <span className="text-[10px] text-yellow-400">🔥 Momentum</span>
              <div className="flex gap-0.5">
                {Array.from({ length: Math.min(myMomentum, 4) }).map((_, i) => (
                  <div key={i} className="w-3 h-3 rounded-full bg-yellow-500 shadow-sm shadow-yellow-500/50" />
                ))}
              </div>
              <span className="text-[10px] text-yellow-300 font-mono">
                {myMomentum >= 4 ? '1.5x' : myMomentum === 3 ? '1.25x' : myMomentum === 2 ? '1.1x' : ''}
              </span>
            </div>
          )}
          {/* Counter indicator */}
          {myCounter !== 'none' && (
            <div className="mt-2 bg-yellow-900/30 border border-yellow-700/50 rounded px-2 py-1 text-xs text-yellow-300 text-center animate-pulse">
              {counterLabel(myCounter)}
            </div>
          )}
          <div className="grid grid-cols-3 gap-2 mt-3 text-center">
            <div className="bg-gray-800/50 rounded py-1.5">
              <div className="text-xs font-medium text-orange-400">{myBot.attack}</div>
              <div className="text-[10px] text-gray-600">ATK</div>
            </div>
            <div className="bg-gray-800/50 rounded py-1.5">
              <div className="text-xs font-medium text-blue-400">{myBot.defense}</div>
              <div className="text-[10px] text-gray-600">DEF</div>
            </div>
            <div className="bg-gray-800/50 rounded py-1.5">
              <div className="text-xs font-medium text-green-400">{myBot.speed}</div>
              <div className="text-[10px] text-gray-600">SPD</div>
            </div>
          </div>
          {myEffects.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {myEffects.map((effect, i) => (
                <span
                  key={i}
                  className={`px-2 py-0.5 border rounded text-xs ${effectColor(effect)}`}
                >
                  {effectEmoji(effect)} {effect}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Opponent Bot Panel */}
        <div className="bg-gray-900 rounded-xl border border-red-800/30 p-3 sm:p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-red-800 rounded-lg flex items-center justify-center text-lg shadow-lg shadow-red-500/10">
              👾
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-red-300 text-sm truncate">{matchData.opponent.name}</div>
              <div className="text-xs text-gray-500">{matchData.opponent.elo} ELO</div>
            </div>
          </div>
          <HPBar current={oppHp} max={oppMaxHp} label="HP" />
          {/* Energy Bar */}
          <div className="mt-2">
            <div className="flex items-center justify-between text-[10px] mb-0.5">
              <span className="text-cyan-400">⚡ Energy</span>
              <span className="text-cyan-300 font-mono">{oppEnergy}/100</span>
            </div>
            <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 rounded-full transition-all duration-500"
                style={{ width: `${oppEnergy}%` }}
              />
            </div>
          </div>
          {/* Momentum */}
          {oppMomentum > 0 && (
            <div className="mt-2 flex items-center gap-1.5">
              <span className="text-[10px] text-yellow-400">🔥 Momentum</span>
              <div className="flex gap-0.5">
                {Array.from({ length: Math.min(oppMomentum, 4) }).map((_, i) => (
                  <div key={i} className="w-3 h-3 rounded-full bg-yellow-500 shadow-sm shadow-yellow-500/50" />
                ))}
              </div>
              <span className="text-[10px] text-yellow-300 font-mono">
                {oppMomentum >= 4 ? '1.5x' : oppMomentum === 3 ? '1.25x' : oppMomentum === 2 ? '1.1x' : ''}
              </span>
            </div>
          )}
          {/* Counter indicator */}
          {oppCounter !== 'none' && (
            <div className="mt-2 bg-red-900/30 border border-red-700/50 rounded px-2 py-1 text-xs text-red-300 text-center animate-pulse">
              {counterLabel(oppCounter)}
            </div>
          )}
          {matchStartData && (
            <div className="grid grid-cols-3 gap-2 mt-3 text-center">
              <div className="bg-gray-800/50 rounded py-1.5">
                <div className="text-xs font-medium text-orange-400">{matchStartData.bot2.attack}</div>
                <div className="text-[10px] text-gray-600">ATK</div>
              </div>
              <div className="bg-gray-800/50 rounded py-1.5">
                <div className="text-xs font-medium text-blue-400">{matchStartData.bot2.defense}</div>
                <div className="text-[10px] text-gray-600">DEF</div>
              </div>
              <div className="bg-gray-800/50 rounded py-1.5">
                <div className="text-xs font-medium text-green-400">{matchStartData.bot2.speed}</div>
                <div className="text-[10px] text-gray-600">SPD</div>
              </div>
            </div>
          )}
          {oppEffects.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {oppEffects.map((effect, i) => (
                <span
                  key={i}
                  className={`px-2 py-0.5 border rounded text-xs ${effectColor(effect)}`}
                >
                  {effectEmoji(effect)} {effect}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Status indicators */}
      {phase === 'found' && (
        <div className="text-center mb-4">
          <div className="inline-flex items-center gap-2 bg-purple-900/20 border border-purple-700/30 rounded-lg px-5 py-3 animate-pulse">
            <Swords className="w-5 h-5 text-purple-400" />
            <span className="text-purple-300 font-medium">Waiting for opponent to accept...</span>
          </div>
        </div>
      )}

      {phase === 'fighting' && (
        <div className="text-center mb-4">
          <div className="inline-flex items-center gap-2 bg-green-900/20 border border-green-700/30 rounded-lg px-4 py-2">
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
