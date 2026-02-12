'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useMatchStore, useAuthStore } from '@/lib/store'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { Navbar } from '@/components/Navbar'
import { BattleArena, BATTLE_CSS, type BattleRoundData } from '@/components/combat/BattleArena'
import { connectSocket } from '@/lib/socket'
import type {
  RoundCompletePayload,
  RoundStartPayload,
  MatchStartPayload,
  MatchEndPayload,
  MatchSkillInfo,
} from '../../../shared/types'
import { Shield, Swords, Timer, Trophy, Wifi, WifiOff, Zap, Lock } from 'lucide-react'

// ============================================================
// Skill display helpers
// ============================================================

const SKILL_EMOJI: Record<string, string> = {
  firewall: '🛡️', iron_fortress: '🏰', mirror_coat: '🪞', rollback: '💚',
  power_strike: '⚔️', reasoning_burst: '⚡', spawn_attack: '👻', berserker_rush: '😤',
  sleep_bomb: '💤', emp_pulse: '🔋', time_bomb: '💣', overclock: '⏫',
  scan: '🔍', prompt_injection: '💉', memory_bomb: '🧠', virus: '🦠',
}

const CATEGORY_COLORS: Record<string, string> = {
  defensive: 'border-cyan-600 bg-cyan-950/40 hover:bg-cyan-900/50 text-cyan-300',
  aggressive: 'border-red-600 bg-red-950/40 hover:bg-red-900/50 text-red-300',
  tactical: 'border-amber-600 bg-amber-950/40 hover:bg-amber-900/50 text-amber-300',
  exploit: 'border-purple-600 bg-purple-950/40 hover:bg-purple-900/50 text-purple-300',
}

const CATEGORY_GLOW: Record<string, string> = {
  defensive: 'shadow-cyan-500/20',
  aggressive: 'shadow-red-500/20',
  tactical: 'shadow-amber-500/20',
  exploit: 'shadow-purple-500/20',
}

// ============================================================
// Match Page
// ============================================================

function MatchContent() {
  const router = useRouter()
  const {
    phase,
    matchData,
    currentRound,
    roundHistory,
    matchResult,
    setPhase,
    setCurrentRound,
    setRoundResult,
    setMatchResult,
    reset,
  } = useMatchStore()

  // WebSocket state
  const [connected, setConnected] = useState(false)
  const [matchStartData, setMatchStartData] = useState<MatchStartPayload | null>(null)
  const [timer, setTimer] = useState(30)
  const [actionSubmitted, setActionSubmitted] = useState(false)

  // Animation queue
  const [currentAnimRound, setCurrentAnimRound] = useState<BattleRoundData | null>(null)
  const [isAnimating, setIsAnimating] = useState(false)
  const roundQueueRef = useRef<RoundCompletePayload[]>([])

  // Skills
  const [mySkills, setMySkills] = useState<MatchSkillInfo[]>([])
  const [oppSkills, setOppSkills] = useState<MatchSkillInfo[]>([])
  const [skillCooldowns, setSkillCooldowns] = useState<Record<string, number>>({})
  const [disabledSkills, setDisabledSkills] = useState<string[]>([])
  const [myEnergy, setMyEnergy] = useState(100)

  // Action log
  const [actionLog, setActionLog] = useState<string[]>([])
  const logRef = useRef<HTMLDivElement>(null)

  const addLog = useCallback((msg: string) => {
    setActionLog(prev => [...prev, msg])
    setTimeout(() => logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: 'smooth' }), 50)
  }, [])

  // Process animation queue
  const processNextRound = useCallback(() => {
    if (roundQueueRef.current.length === 0) return
    const r = roundQueueRef.current.shift()!

    const battleRound: BattleRoundData = {
      round: r.round,
      bot1Action: r.bot1_action,
      bot1SkillId: (r as any).bot1_skill_id,
      bot2Action: r.bot2_action,
      bot2SkillId: (r as any).bot2_skill_id,
      bot1Dmg: r.bot1_damage_dealt,
      bot2Dmg: r.bot2_damage_dealt,
      bot1HpAfter: r.bot1_hp,
      bot2HpAfter: r.bot2_hp,
      bot1Counter: (r as any).bot1_counter || 'none',
      bot2Counter: (r as any).bot2_counter || 'none',
      bot1Energy: (r as any).bot1_energy ?? 100,
      bot2Energy: (r as any).bot2_energy ?? 100,
      effectsApplied: r.effects_applied?.map(e => ({ bot: e.bot, effect: e.effect, duration: e.duration })) || [],
    }

    setCurrentAnimRound(battleRound)
    setIsAnimating(true)

    // Log the round
    const sk1 = (r as any).bot1_skill_id
    const sk2 = (r as any).bot2_skill_id
    const act1 = sk1 ? `${SKILL_EMOJI[sk1] || '⚔️'} ${sk1}` : r.bot1_action
    const act2 = sk2 ? `${SKILL_EMOJI[sk2] || '⚔️'} ${sk2}` : r.bot2_action
    addLog(`══ Round ${r.round} ══`)
    addLog(`  YOU: ${act1} → ${r.bot1_damage_dealt} dmg`)
    addLog(`  OPP: ${act2} → ${r.bot2_damage_dealt} dmg`)
    if ((r as any).bot1_counter !== 'none') addLog(`  ⚡ Your COUNTER!`)
    if ((r as any).bot2_counter !== 'none') addLog(`  ⚡ Opponent COUNTER!`)
  }, [addLog])

  const onAnimationComplete = useCallback(() => {
    setIsAnimating(false)
    setTimeout(() => {
      if (roundQueueRef.current.length > 0) processNextRound()
    }, 300)
  }, [processNextRound])

  // Connect to WebSocket
  useEffect(() => {
    if (!matchData) return

    const socket = connectSocket()
    setConnected(socket.connected)

    socket.on('connect', () => setConnected(true))
    socket.on('disconnect', () => setConnected(false))

    socket.on('match_start', (data: MatchStartPayload) => {
      setMatchStartData(data)
      setTimer(data.time_limit_seconds)
      setPhase('fighting')
      addLog('⚔️ MATCH START')
      addLog(`${data.bot1.name} vs ${data.bot2.name}`)

      // Extract skills
      if ((data.bot1 as any).skills) setMySkills((data.bot1 as any).skills)
      if ((data.bot2 as any).skills) setOppSkills((data.bot2 as any).skills)
    })

    socket.on('round_start', (data: RoundStartPayload) => {
      setCurrentRound(data)
      setTimer(data.time_limit_seconds)
      setActionSubmitted(false)

      // Update cooldowns + energy from round_start
      if ((data.bot1 as any).skill_cooldowns) setSkillCooldowns((data.bot1 as any).skill_cooldowns)
      if ((data.bot1 as any).disabled_skills) setDisabledSkills((data.bot1 as any).disabled_skills)
      setMyEnergy(data.bot1.energy ?? 100)
    })

    socket.on('round_complete', (data: RoundCompletePayload) => {
      setRoundResult(data)
      roundQueueRef.current.push(data)
      if (!isAnimating) processNextRound()
    })

    socket.on('match_end', (data: MatchEndPayload) => {
      setTimeout(() => {
        setMatchResult(data)
        if (data.result === 'win') addLog('🏆 VICTORY!')
        else if (data.result === 'loss') addLog('💀 DEFEAT')
        else addLog('🤝 DRAW')
      }, isAnimating ? 3000 : 500)
    })

    socket.on('error', (err: any) => {
      console.error('Match error:', err)
      addLog(`⚠️ Error: ${err.message || err.code}`)
    })

    return () => {
      socket.off('connect')
      socket.off('disconnect')
      socket.off('match_start')
      socket.off('round_start')
      socket.off('round_complete')
      socket.off('match_end')
      socket.off('error')
    }
  }, [matchData, setPhase, setCurrentRound, setRoundResult, setMatchResult, addLog, processNextRound, isAnimating])

  // Timer countdown
  useEffect(() => {
    if (phase !== 'fighting' || actionSubmitted) return
    const interval = setInterval(() => setTimer(t => Math.max(0, t - 1)), 1000)
    return () => clearInterval(interval)
  }, [phase, actionSubmitted, roundHistory.length])

  // Reset timer on new round
  useEffect(() => {
    if (matchStartData) setTimer(matchStartData.time_limit_seconds)
  }, [roundHistory.length, matchStartData])

  // Send action
  function sendAction(action: 'attack' | 'defend' | 'skill', skillId?: string) {
    if (actionSubmitted || phase !== 'fighting') return
    const socket = connectSocket()
    socket.emit('combat_action', {
      action: { action, target: action === 'defend' ? null : 'opponent', skill_id: skillId || null },
      signature: 'web_client',
    })
    setActionSubmitted(true)
    const label = skillId ? `${SKILL_EMOJI[skillId] || '⚔️'} ${skillId}` : action
    addLog(`→ You chose: ${label}`)
  }

  // Redirect if no match
  useEffect(() => {
    if (!matchData && phase === 'idle') router.push('/dashboard')
  }, [matchData, phase, router])

  // Cleanup
  useEffect(() => { return () => { reset() } }, [])

  if (!matchData) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center">
        <div className="bg-[#0a0a1a] border border-gray-800 rounded-lg p-8 max-w-sm mx-auto">
          <div className="text-3xl mb-4">⚔️</div>
          <h2 className="text-lg font-bold text-white mb-2" style={{ fontFamily: 'Orbitron, sans-serif' }}>NO ACTIVE MATCH</h2>
          <p className="text-gray-500 text-sm mb-4">Join a queue or start PvE to fight.</p>
          <a href="/dashboard" className="inline-block bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-bold px-6 py-2 rounded transition">GO TO HQ</a>
        </div>
      </div>
    )
  }

  const myBot = matchData.my_bot
  const oppName = matchData.opponent.name
  const maxRounds = matchStartData?.max_rounds ?? 10
  const roundNumber = roundHistory.length

  // Determine winner side for arena
  let winnerSide: 'bot1' | 'bot2' | 'draw' | null = null
  if (matchResult) {
    winnerSide = matchResult.result === 'win' ? 'bot1' : matchResult.result === 'loss' ? 'bot2' : 'draw'
  }

  // Can use skill?
  function canUseSkill(skill: MatchSkillInfo): boolean {
    if (actionSubmitted) return false
    if (myEnergy < skill.energyCost) return false
    if ((skillCooldowns[skill.id] || 0) > 0) return false
    if (disabledSkills.includes(skill.id)) return false
    return true
  }

  function skillTooltip(skill: MatchSkillInfo): string {
    const cd = skillCooldowns[skill.id] || 0
    if (disabledSkills.includes(skill.id)) return `${skill.name} — DISABLED by Memory Bomb`
    if (cd > 0) return `${skill.name} — Cooldown: ${cd} rounds`
    if (myEnergy < skill.energyCost) return `${skill.name} — Need ${skill.energyCost} energy (have ${myEnergy})`
    return `${skill.name} — ${skill.energyCost} energy, ${skill.cooldown}r cooldown`
  }

  return (
    <div className="min-h-screen bg-[#050510]">
      <Navbar />

      {/* Header bar */}
      <div className="sticky top-12 z-50 bg-[#0a0a1aee] border-b border-gray-800 px-3 sm:px-4 py-2 flex items-center justify-between backdrop-blur-sm">
        <div className="flex items-center gap-2 text-xs text-gray-400 uppercase tracking-wide">
          <Trophy className="w-3.5 h-3.5" />
          {(matchData.match_type as string) === 'pve' ? 'PvE' : (matchData.match_type as string).replace('ranked_', '').replace(/^\w/, c => c.toUpperCase())}
          <div className={`flex items-center gap-1 ml-2 ${connected ? 'text-green-500' : 'text-red-500'}`}>
            {connected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-xs font-mono text-gray-500">R{roundNumber}/{maxRounds}</div>
          {phase === 'fighting' && !actionSubmitted && (
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded border ${timer <= 5 ? 'border-red-600/50 bg-red-900/20' : 'border-gray-700'}`}>
              <Timer className={`w-3.5 h-3.5 ${timer <= 5 ? 'text-red-400' : 'text-gray-400'}`} />
              <span className={`text-lg font-bold font-mono ${timer <= 5 ? 'text-red-400 animate-pulse' : 'text-white'}`}>{timer}s</span>
            </div>
          )}
          {actionSubmitted && phase === 'fighting' && (
            <div className="text-xs text-green-400 font-mono bg-green-900/20 border border-green-800/40 px-3 py-1.5 rounded">✓ ACTION SENT</div>
          )}
        </div>
        <div className="text-xs text-gray-500">
          {matchData.entry_fee > 0 && <span>Entry: <span className="text-yellow-400">{matchData.entry_fee} CR</span></span>}
        </div>
      </div>

      {/* Battle Arena */}
      <div className="px-2 sm:px-4 pt-3">
        <BattleArena
          bot1={{ name: myBot.name, maxHp: myBot.hp, color: '#00f0ff' }}
          bot2={{ name: oppName, maxHp: matchStartData?.bot2.hp ?? 100, color: '#ff4040' }}
          round={currentAnimRound}
          phase={phase === 'fighting' ? 'fighting' : phase === 'result' ? 'result' : 'waiting'}
          winner={winnerSide}
          onAnimationComplete={onAnimationComplete}
        />
      </div>

      {/* Action Buttons */}
      {phase === 'fighting' && (
        <div className="px-2 sm:px-4 py-3">
          {/* Basic actions */}
          <div className="flex gap-2 mb-3">
            <button
              onClick={() => sendAction('attack')}
              disabled={actionSubmitted}
              className="flex-1 flex items-center justify-center gap-2 bg-red-900/40 border border-red-700 hover:bg-red-800/50 disabled:opacity-30 disabled:cursor-not-allowed text-red-300 font-bold text-sm py-3 rounded-lg transition shadow-lg shadow-red-500/10"
            >
              <Swords className="w-4 h-4" /> ATTACK
            </button>
            <button
              onClick={() => sendAction('defend')}
              disabled={actionSubmitted}
              className="flex-1 flex items-center justify-center gap-2 bg-cyan-900/40 border border-cyan-700 hover:bg-cyan-800/50 disabled:opacity-30 disabled:cursor-not-allowed text-cyan-300 font-bold text-sm py-3 rounded-lg transition shadow-lg shadow-cyan-500/10"
            >
              <Shield className="w-4 h-4" /> DEFEND
            </button>
          </div>

          {/* Skill buttons */}
          {mySkills.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {mySkills.map(skill => {
                const usable = canUseSkill(skill)
                const cd = skillCooldowns[skill.id] || 0
                const disabled = disabledSkills.includes(skill.id)
                const catColor = CATEGORY_COLORS[skill.category] || CATEGORY_COLORS.aggressive
                const catGlow = CATEGORY_GLOW[skill.category] || ''

                return (
                  <button
                    key={skill.id}
                    onClick={() => usable && sendAction('skill', skill.id)}
                    disabled={!usable}
                    title={skillTooltip(skill)}
                    className={`relative flex flex-col items-center gap-1 border rounded-lg py-2.5 px-2 transition shadow-lg ${
                      usable ? `${catColor} ${catGlow} cursor-pointer` : 'border-gray-700 bg-gray-900/40 text-gray-600 cursor-not-allowed opacity-50'
                    }`}
                  >
                    {/* Cooldown/disabled overlay */}
                    {(cd > 0 || disabled) && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
                        {disabled ? (
                          <Lock className="w-4 h-4 text-red-400" />
                        ) : (
                          <span className="text-lg font-bold font-mono text-gray-400">{cd}</span>
                        )}
                      </div>
                    )}
                    <span className="text-lg">{SKILL_EMOJI[skill.id] || '⚔️'}</span>
                    <span className="text-[11px] font-bold leading-tight text-center">{skill.name}</span>
                    <div className="flex items-center gap-1 text-[9px] opacity-70">
                      <Zap className="w-2.5 h-2.5" />
                      <span>{skill.energyCost}</span>
                    </div>
                  </button>
                )
              })}
            </div>
          )}

          {/* Energy bar */}
          <div className="mt-3 flex items-center gap-2">
            <span className="text-[10px] text-cyan-400 font-mono">⚡ ENERGY</span>
            <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 rounded-full transition-all duration-500" style={{ width: `${myEnergy}%` }} />
            </div>
            <span className="text-[10px] text-cyan-300 font-mono">{myEnergy}/100</span>
          </div>
        </div>
      )}

      {/* Waiting state */}
      {phase === 'found' && (
        <div className="px-4 py-8 text-center">
          <div className="inline-flex items-center gap-2 bg-cyan-900/20 border border-cyan-700/50 rounded-lg px-6 py-3 animate-pulse">
            <Swords className="w-5 h-5 text-cyan-400" />
            <span className="text-cyan-300 font-medium">Waiting for opponent...</span>
          </div>
        </div>
      )}

      {/* Match result */}
      {phase === 'result' && matchResult && (
        <div className="px-4 py-6">
          <div className="bg-[#0a0a1a] border border-gray-800 rounded-lg p-6 max-w-md mx-auto text-center">
            <div className={`text-4xl font-black mb-3 ${matchResult.result === 'win' ? 'text-cyan-400' : matchResult.result === 'loss' ? 'text-red-400' : 'text-amber-400'}`} style={{ fontFamily: 'Orbitron, sans-serif' }}>
              {matchResult.result === 'win' ? '🏆 VICTORY' : matchResult.result === 'loss' ? '💀 DEFEAT' : '🤝 DRAW'}
            </div>
            <div className="text-sm text-gray-400 mb-4">{matchResult.rounds_fought} rounds • {matchResult.duration_seconds}s</div>
            <div className="flex justify-center gap-6 text-sm font-mono">
              {matchResult.credits_earned !== undefined && matchResult.credits_earned > 0 && (
                <div className="text-amber-400">+{matchResult.credits_earned} CR</div>
              )}
              {matchResult.xp && (
                <div className="text-green-400">+{matchResult.xp.totalXp} XP</div>
              )}
              {matchResult.winner?.elo_change !== undefined && (
                <div className={matchResult.winner.elo_change >= 0 ? 'text-green-400' : 'text-red-400'}>
                  {matchResult.winner.elo_change >= 0 ? '+' : ''}{matchResult.winner.elo_change} ELO
                </div>
              )}
            </div>
            <div className="mt-5 flex gap-3 justify-center">
              <a href="/dashboard" className="bg-gray-800 hover:bg-gray-700 text-white text-sm px-5 py-2 rounded transition">HQ</a>
              <a href="/pve" className="bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-bold px-5 py-2 rounded transition">PLAY AGAIN</a>
            </div>
          </div>
        </div>
      )}

      {/* Action Log */}
      <div className="bg-[#0a0a1a] border-t border-gray-800 px-4 py-2">
        <div ref={logRef} className="max-h-28 overflow-y-auto scrollbar-thin">
          {actionLog.length === 0 ? (
            <div className="text-gray-600 text-xs font-mono text-center py-3">{'// waiting for match to start'}</div>
          ) : actionLog.map((log, i) => (
            <div key={i} className="text-[11px] font-mono text-gray-400 py-0.5 leading-relaxed">
              {log.includes('COUNTER') ? <span className="text-amber-400 font-bold">{log}</span> :
               log.includes('VICTORY') || log.includes('wins') ? <span className="text-cyan-400 font-bold">{log}</span> :
               log.includes('DEFEAT') ? <span className="text-red-400 font-bold">{log}</span> :
               log.includes('dmg') ? <span className="text-red-300">{log}</span> :
               log.startsWith('══') ? <span className="text-gray-500 font-bold">{log}</span> :
               log.includes('MATCH START') ? <span className="text-cyan-300 font-bold">{log}</span> :
               log.startsWith('→') ? <span className="text-green-400">{log}</span> :
               log}
            </div>
          ))}
        </div>
      </div>

      <style jsx global>{BATTLE_CSS}</style>
    </div>
  )
}

export default function MatchPage() {
  return (
    <ProtectedRoute>
      <MatchContent />
    </ProtectedRoute>
  )
}
