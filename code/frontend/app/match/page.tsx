'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useMatchStore, useAuthStore } from '@/lib/store'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { Navbar } from '@/components/Navbar'
import { HPBar } from '@/components/HPBar'
import { ActionLog } from '@/components/ActionLog'
import { MatchResult } from '@/components/MatchResult'
import { ArenaView } from '@/components/ArenaView'
import {
  MOCK_LIVE_MATCH_ROUNDS,
  MOCK_MATCH_END,
  MOCK_USER,
  MOCK_BOT,
  loadMockData,
} from '@/lib/mock-api'
import type { RoundResult, RoundCompletePayload, MatchFoundPayload } from '../../../shared/types'
import { Shield, Swords, Zap, Timer, Trophy } from 'lucide-react'

// For demo: simulate a live match by feeding rounds one at a time
function useMockMatchSimulation() {
  const {
    phase,
    setPhase,
    setMatchData,
    setCurrentRound,
    setRoundResult,
    setMatchResult,
    roundHistory,
    matchData,
    matchResult,
  } = useMatchStore()

  const [currentAnimRound, setCurrentAnimRound] = useState<RoundResult | null>(null)
  const [previousAnimRound, setPreviousAnimRound] = useState<RoundResult | null>(null)
  const [isAnimating, setIsAnimating] = useState(false)
  const [demoIndex, setDemoIndex] = useState(0)
  const [demoStarted, setDemoStarted] = useState(false)
  const [timer, setTimer] = useState(30)

  // Initialize demo match data
  const startDemo = useCallback(() => {
    const mockMatchFound: MatchFoundPayload = {
      match_id: 'match_live_001',
      match_type: 'ranked_gold',
      entry_fee: 200,
      start_in_seconds: 3,
      my_bot: {
        id: MOCK_BOT.id,
        name: MOCK_BOT.name,
        hp: MOCK_BOT.base_hp,
        attack: MOCK_BOT.base_attack,
        defense: MOCK_BOT.base_defense,
        speed: MOCK_BOT.base_speed,
        status_effects: [],
      },
      opponent: {
        name: 'ChromeReaper',
        elo: 1540,
      },
    }
    setMatchData(mockMatchFound)
    setDemoStarted(true)
    setDemoIndex(0)

    // Start feeding rounds after a delay
    setTimeout(() => {
      setPhase('fighting')
    }, 1500)
  }, [setMatchData, setPhase])

  // Feed rounds one by one
  useEffect(() => {
    if (!demoStarted || phase !== 'fighting') return
    if (demoIndex >= MOCK_LIVE_MATCH_ROUNDS.length) {
      // Match over
      setTimeout(() => {
        setMatchResult(MOCK_MATCH_END)
      }, 1000)
      return
    }

    const timeout = setTimeout(() => {
      const round = MOCK_LIVE_MATCH_ROUNDS[demoIndex]
      setPreviousAnimRound(demoIndex > 0 ? MOCK_LIVE_MATCH_ROUNDS[demoIndex - 1] : null)
      setCurrentAnimRound(round)
      setIsAnimating(true)
      setTimer(30)

      // Also push to store
      const payload: RoundCompletePayload = {
        ...round,
        match_id: 'match_live_001',
      }
      setRoundResult(payload)
    }, demoIndex === 0 ? 500 : 2500)

    return () => clearTimeout(timeout)
  }, [demoStarted, phase, demoIndex, setRoundResult, setMatchResult])

  const onAnimationComplete = useCallback(() => {
    setIsAnimating(false)
    setDemoIndex((prev) => prev + 1)
  }, [])

  // Timer countdown
  useEffect(() => {
    if (phase !== 'fighting' || !demoStarted) return
    const interval = setInterval(() => {
      setTimer((t) => Math.max(0, t - 1))
    }, 1000)
    return () => clearInterval(interval)
  }, [phase, demoStarted, demoIndex])

  return {
    startDemo,
    demoStarted,
    currentAnimRound,
    previousAnimRound,
    isAnimating,
    onAnimationComplete,
    timer,
  }
}

function MatchContent() {
  const router = useRouter()
  const { user, setUser, setBots, setToken } = useAuthStore()
  const {
    phase,
    matchData,
    roundHistory,
    matchResult,
    reset,
  } = useMatchStore()

  const {
    startDemo,
    demoStarted,
    currentAnimRound,
    previousAnimRound,
    isAnimating,
    onAnimationComplete,
    timer,
  } = useMockMatchSimulation()

  // Load mock user if needed
  useEffect(() => {
    if (!user) {
      const mock = loadMockData()
      setUser(mock.user)
      setBots(mock.bots)
      setToken(mock.token)
    }
  }, [user, setUser, setBots, setToken])

  // On mount, clean previous match and start demo
  useEffect(() => {
    reset()
    startDemo()
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

  // Get current HP from latest round
  const myHp = latestRound ? latestRound.bot1_hp : myBot.hp
  const oppHp = latestRound ? latestRound.bot2_hp : 100
  const oppMaxHp = 100

  // Status effects from latest round
  const myEffects: string[] = latestRound
    ? latestRound.effects_applied.filter(e => e.bot === 'bot1').map(e => e.effect)
    : []
  const oppEffects: string[] = latestRound
    ? latestRound.effects_applied.filter(e => e.bot === 'bot2').map(e => e.effect)
    : []

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
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-500 uppercase tracking-wide">
          <Trophy className="w-4 h-4" />
          {matchData.match_type.replace('ranked_', '').replace(/^\w/, (c) => c.toUpperCase())} Ranked
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-gray-900 rounded-lg border border-gray-800 px-3 py-1.5 flex items-center gap-2">
            <span className="text-xs text-gray-500">Round</span>
            <span className="text-lg font-bold text-purple-400 font-mono">{roundNumber}/10</span>
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
      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* My Bot Panel */}
        <div className="bg-gray-900 rounded-xl border border-purple-800/30 p-4">
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
        <div className="bg-gray-900 rounded-xl border border-red-800/30 p-4">
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
          {oppEffects.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1">
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
            <span className="text-purple-300 font-medium">Match starting...</span>
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
