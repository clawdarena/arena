'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { Arena3DView } from '@/components/3d/Arena3DWrapper'
import { Play, SkipForward, Gauge, RotateCcw, Volume2, VolumeX } from 'lucide-react'
import type { RoundResult } from '../../../shared/types'

// ============================================================
// Mock Match Data — 7-round scripted match
// ============================================================

const BOT1_NAME = 'CLAWD-X9'
const BOT2_NAME = 'NEUROVIPER'
const BOT1_MAX_HP = 100
const BOT2_MAX_HP = 100

const MOCK_ROUNDS: RoundResult[] = [
  {
    round: 1,
    bot1_action: 'attack', bot1_target: 'core',
    bot2_action: 'defend', bot2_target: null,
    bot1_damage_dealt: 8, bot2_damage_dealt: 0,
    bot1_hp: 100, bot2_hp: 92,
    bot1_response_ms: 120, bot2_response_ms: 85,
    bot1_timed_out: false, bot2_timed_out: false,
    bot1_counter: 'none', bot2_counter: 'defend_vs_attack',
    bot1_momentum: 1, bot2_momentum: 0,
    bot1_energy: 85, bot2_energy: 100,
    effects_applied: [],
  },
  {
    round: 2,
    bot1_action: 'skill', bot1_target: 'core',
    bot2_action: 'attack', bot2_target: 'core',
    bot1_damage_dealt: 22, bot2_damage_dealt: 15,
    bot1_hp: 85, bot2_hp: 70,
    bot1_response_ms: 200, bot2_response_ms: 150,
    bot1_timed_out: false, bot2_timed_out: false,
    bot1_counter: 'none', bot2_counter: 'attack_vs_skill',
    bot1_momentum: 2, bot2_momentum: 1,
    bot1_energy: 70, bot2_energy: 85,
    effects_applied: [{ bot: 'bot2', effect: 'burning', duration: 2 }],
  },
  {
    round: 3,
    bot1_action: 'attack', bot1_target: 'processor',
    bot2_action: 'skill', bot2_target: 'core',
    bot1_damage_dealt: 18, bot2_damage_dealt: 20,
    bot1_hp: 65, bot2_hp: 52,
    bot1_response_ms: 90, bot2_response_ms: 180,
    bot1_timed_out: false, bot2_timed_out: false,
    bot1_counter: 'attack_vs_skill', bot2_counter: 'none',
    bot1_momentum: 3, bot2_momentum: 0,
    bot1_energy: 70, bot2_energy: 60,
    effects_applied: [
      { bot: 'bot2', effect: 'burning', duration: 1 },
      { bot: 'bot1', effect: 'stunned', duration: 1 },
    ],
  },
  {
    round: 4,
    bot1_action: 'defend', bot1_target: null,
    bot2_action: 'attack', bot2_target: 'armor',
    bot1_damage_dealt: 0, bot2_damage_dealt: 12,
    bot1_hp: 53, bot2_hp: 52,
    bot1_response_ms: 50, bot2_response_ms: 110,
    bot1_timed_out: false, bot2_timed_out: false,
    bot1_counter: 'defend_vs_attack', bot2_counter: 'none',
    bot1_momentum: 0, bot2_momentum: 2,
    bot1_energy: 85, bot2_energy: 60,
    effects_applied: [{ bot: 'bot1', effect: 'armor_broken', duration: 1 }],
  },
  {
    round: 5,
    bot1_action: 'skill', bot1_target: 'core',
    bot2_action: 'defend', bot2_target: null,
    bot1_damage_dealt: 14, bot2_damage_dealt: 0,
    bot1_hp: 53, bot2_hp: 38,
    bot1_response_ms: 160, bot2_response_ms: 70,
    bot1_timed_out: false, bot2_timed_out: false,
    bot1_counter: 'skill_vs_defend', bot2_counter: 'none',
    bot1_momentum: 1, bot2_momentum: 0,
    bot1_energy: 60, bot2_energy: 75,
    effects_applied: [{ bot: 'bot2', effect: 'overclock', duration: 2 }],
  },
  {
    round: 6,
    bot1_action: 'attack', bot1_target: 'core',
    bot2_action: 'attack', bot2_target: 'core',
    bot1_damage_dealt: 25, bot2_damage_dealt: 28,
    bot1_hp: 25, bot2_hp: 13,
    bot1_response_ms: 95, bot2_response_ms: 100,
    bot1_timed_out: false, bot2_timed_out: false,
    bot1_counter: 'none', bot2_counter: 'none',
    bot1_momentum: 2, bot2_momentum: 1,
    bot1_energy: 60, bot2_energy: 75,
    effects_applied: [],
  },
  {
    round: 7,
    bot1_action: 'skill', bot1_target: 'core',
    bot2_action: 'attack', bot2_target: 'core',
    bot1_damage_dealt: 30, bot2_damage_dealt: 10,
    bot1_hp: 15, bot2_hp: 0,
    bot1_response_ms: 140, bot2_response_ms: 130,
    bot1_timed_out: false, bot2_timed_out: false,
    bot1_counter: 'none', bot2_counter: 'attack_vs_skill',
    bot1_momentum: 4, bot2_momentum: 0,
    bot1_energy: 35, bot2_energy: 75,
    effects_applied: [{ bot: 'bot2', effect: 'burning', duration: 2 }],
  },
]

// ============================================================
// Helper: action label
// ============================================================
function actionLabel(action: string): string {
  switch (action) {
    case 'attack': return '⚔️ ATTACK'
    case 'defend': return '🛡️ DEFEND'
    case 'skill': return '✨ SKILL'
    default: return action.toUpperCase()
  }
}

function counterLabel(counter: string): string {
  switch (counter) {
    case 'attack_vs_skill': return 'COUNTER!'
    case 'defend_vs_attack': return 'COUNTER!'
    case 'skill_vs_defend': return 'COUNTER!'
    default: return ''
  }
}

// ============================================================
// Delayed HP Bar Component (Dark Souls style)
// ============================================================
function DelayedHPBar({
  current,
  max,
  name,
  side,
  showDamage,
  damageAmount,
  isCounter,
}: {
  current: number
  max: number
  name: string
  side: 'left' | 'right'
  showDamage: boolean
  damageAmount: number
  isCounter: boolean
}) {
  const [displayHp, setDisplayHp] = useState(current)
  const [delayedHp, setDelayedHp] = useState(current)
  const prevHpRef = useRef(current)

  // Immediate green bar update
  useEffect(() => {
    setDisplayHp(current)
  }, [current])

  // Delayed red bar drain (the Dark Souls effect)
  useEffect(() => {
    const prev = prevHpRef.current
    prevHpRef.current = current
    if (current >= prev) {
      setDelayedHp(current)
      return
    }
    // Start delayed drain after 600ms
    const timeout = setTimeout(() => {
      setDelayedHp(current)
    }, 800)
    return () => clearTimeout(timeout)
  }, [current])

  const pct = Math.max(0, (displayHp / max) * 100)
  const delayedPct = Math.max(0, (delayedHp / max) * 100)
  const hpColor = pct <= 25 ? 'from-red-600 to-red-400' : pct <= 50 ? 'from-yellow-600 to-yellow-400' : side === 'left' ? 'from-cyan-500 to-emerald-400' : 'from-red-500 to-orange-400'

  return (
    <div className={`flex-1 min-w-0 ${side === 'right' ? 'text-right' : ''}`}>
      {/* Name & HP numbers */}
      <div className={`flex items-baseline gap-2 mb-1 ${side === 'right' ? 'flex-row-reverse' : ''}`}>
        <span
          className={`text-xs font-bold tracking-wider uppercase truncate ${
            side === 'left' ? 'text-cyan-400' : 'text-red-400'
          }`}
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {name}
        </span>
        <span className="text-[11px] font-mono text-white/70 tabular-nums whitespace-nowrap">
          {displayHp}/{max}
        </span>
      </div>

      {/* HP Bar Container */}
      <div className="relative h-4 bg-black/60 rounded-sm overflow-hidden border border-white/10 backdrop-blur-sm">
        {/* Delayed drain bar (red/amber behind green) */}
        <div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-red-700 to-amber-600 transition-all duration-[1200ms] ease-out"
          style={{ width: `${delayedPct}%` }}
        />
        {/* Current HP bar (green, instant) */}
        <div
          className={`absolute inset-y-0 left-0 bg-gradient-to-r ${hpColor} transition-all duration-300 ease-out`}
          style={{ width: `${pct}%` }}
        />
        {/* Shine effect */}
        <div
          className="absolute inset-y-0 left-0 bg-gradient-to-b from-white/20 to-transparent transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
        {/* Grid overlay for style */}
        <div className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 9.9%, rgba(0,0,0,0.4) 10%, rgba(0,0,0,0.4) 10.1%)',
          }}
        />
      </div>

      {/* Floating damage number */}
      {showDamage && damageAmount > 0 && (
        <div className={`absolute ${side === 'left' ? 'left-4' : 'right-4'} -top-8 animate-[floatDamage_1.2s_ease-out_forwards] pointer-events-none z-50`}>
          <span
            className={`text-2xl font-black tabular-nums ${
              isCounter ? 'text-yellow-300 text-3xl' : 'text-white'
            }`}
            style={{
              fontFamily: 'var(--font-display)',
              textShadow: isCounter
                ? '0 0 20px rgba(255,200,0,0.8), 0 0 40px rgba(255,100,0,0.5)'
                : '0 0 10px rgba(255,50,50,0.7), 0 2px 4px rgba(0,0,0,0.8)',
            }}
          >
            -{damageAmount}
          </span>
        </div>
      )}
    </div>
  )
}

// ============================================================
// Announcement Banner Component
// ============================================================
function AnnouncementBanner({
  text,
  subtext,
  color,
  visible,
}: {
  text: string
  subtext?: string
  color: 'cyan' | 'red' | 'amber' | 'green' | 'white'
  visible: boolean
}) {
  const colorMap = {
    cyan: { text: 'text-cyan-300', glow: 'rgba(0,240,255,0.6)', border: 'border-cyan-500/50' },
    red: { text: 'text-red-300', glow: 'rgba(255,46,76,0.6)', border: 'border-red-500/50' },
    amber: { text: 'text-amber-300', glow: 'rgba(255,157,0,0.6)', border: 'border-amber-500/50' },
    green: { text: 'text-green-300', glow: 'rgba(0,255,136,0.6)', border: 'border-green-500/50' },
    white: { text: 'text-white', glow: 'rgba(255,255,255,0.5)', border: 'border-white/30' },
  }
  const c = colorMap[color]

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center pointer-events-none transition-all duration-200 ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div
        className={`transform transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
          visible ? 'scale-100 translate-y-0' : 'scale-50 translate-y-8'
        }`}
      >
        <div
          className={`px-8 py-3 bg-black/80 backdrop-blur-md border-2 ${c.border} rounded-sm`}
          style={{ boxShadow: `0 0 40px ${c.glow}, 0 0 80px ${c.glow}` }}
        >
          <div
            className={`text-3xl sm:text-5xl font-black tracking-[0.2em] ${c.text}`}
            style={{ fontFamily: 'var(--font-display)', textShadow: `0 0 30px ${c.glow}` }}
          >
            {text}
          </div>
          {subtext && (
            <div className="text-center text-sm text-white/60 font-mono mt-1 tracking-wider">
              {subtext}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ============================================================
// Screen Flash Component
// ============================================================
function ScreenFlash({ active, intensity }: { active: boolean; intensity: 'normal' | 'heavy' }) {
  return (
    <div
      className={`fixed inset-0 z-[90] pointer-events-none transition-opacity ${
        active ? (intensity === 'heavy' ? 'opacity-40' : 'opacity-20') : 'opacity-0'
      }`}
      style={{
        background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.8) 0%, transparent 70%)',
        transitionDuration: active ? '50ms' : '400ms',
      }}
    />
  )
}

// ============================================================
// Match Result Overlay with Circle Wipe
// ============================================================
function MatchResultOverlay({
  visible,
  winner,
  bot1Name,
  bot2Name,
  rounds,
  onReplay,
}: {
  visible: boolean
  winner: 'bot1' | 'bot2' | 'draw'
  bot1Name: string
  bot2Name: string
  rounds: number
  onReplay: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [showContent, setShowContent] = useState(false)

  useEffect(() => {
    if (visible) {
      // Circle wipe expand
      const t1 = setTimeout(() => setExpanded(true), 100)
      const t2 = setTimeout(() => setShowContent(true), 700)
      return () => { clearTimeout(t1); clearTimeout(t2) }
    } else {
      setExpanded(false)
      setShowContent(false)
    }
  }, [visible])

  if (!visible) return null

  const winnerName = winner === 'bot1' ? bot1Name : winner === 'bot2' ? bot2Name : 'DRAW'
  const isBot1 = winner === 'bot1'

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center">
      {/* Circle wipe background */}
      <div
        className="absolute inset-0 bg-black/95 transition-all ease-[cubic-bezier(0.4,0,0.2,1)]"
        style={{
          clipPath: expanded
            ? 'circle(150% at 50% 50%)'
            : 'circle(0% at 50% 50%)',
          transitionDuration: '800ms',
        }}
      />

      {/* Content */}
      <div className={`relative z-10 text-center transition-all duration-500 ${showContent ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
        {/* Victory / Defeat label */}
        <div
          className="text-sm tracking-[0.5em] text-white/40 font-mono uppercase mb-2"
        >
          {winner === 'draw' ? 'MATCH RESULT' : 'MATCH WINNER'}
        </div>

        {/* Winner name */}
        <div
          className={`text-4xl sm:text-6xl font-black tracking-wider mb-4 ${
            isBot1 ? 'text-cyan-400' : winner === 'draw' ? 'text-amber-400' : 'text-red-400'
          }`}
          style={{
            fontFamily: 'var(--font-display)',
            textShadow: isBot1
              ? '0 0 40px rgba(0,240,255,0.5)'
              : winner === 'draw'
              ? '0 0 40px rgba(255,157,0,0.5)'
              : '0 0 40px rgba(255,46,76,0.5)',
          }}
        >
          {winnerName}
        </div>

        {winner !== 'draw' && (
          <div
            className="text-6xl sm:text-8xl mb-6 animate-[bounceIn_0.6s_ease-out]"
          >
            🏆
          </div>
        )}

        {/* Stats */}
        <div className="flex gap-6 justify-center text-sm font-mono text-white/50 mb-8">
          <div>
            <span className="text-white/80">{rounds}</span> rounds
          </div>
          <div>
            {winner === 'bot1' ? 'VICTORY' : winner === 'bot2' ? 'DEFEAT' : 'STALEMATE'}
          </div>
        </div>

        {/* Replay button */}
        <button
          onClick={onReplay}
          className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 border border-white/20 rounded-sm hover:bg-white/20 transition-all text-white font-mono tracking-wider"
        >
          <RotateCcw className="w-4 h-4" />
          REPLAY MATCH
        </button>
      </div>
    </div>
  )
}

// ============================================================
// Action Log Ticker
// ============================================================
function ActionLogTicker({ entries }: { entries: string[] }) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth
    }
  }, [entries.length])

  if (entries.length === 0) return null

  return (
    <div className="w-full bg-black/60 backdrop-blur-sm border-t border-white/5">
      <div
        ref={scrollRef}
        className="flex gap-4 px-4 py-2 overflow-x-auto scrollbar-hide"
        style={{ scrollBehavior: 'smooth' }}
      >
        {entries.map((entry, i) => (
          <span
            key={i}
            className="text-[11px] font-mono text-white/50 whitespace-nowrap flex-shrink-0 animate-[fadeSlideIn_0.3s_ease-out]"
          >
            <span className="text-white/20 mr-1">▸</span>
            {entry}
          </span>
        ))}
      </div>
    </div>
  )
}

// ============================================================
// Main Demo Page
// ============================================================
type DemoPhase = 'idle' | 'playing' | 'round-intro' | 'animating' | 'ko-pause' | 'result'

export default function MatchV2Page() {
  // Playback state
  const [phase, setPhase] = useState<DemoPhase>('idle')
  const [currentRoundIdx, setCurrentRoundIdx] = useState(-1)
  const [speed, setSpeed] = useState<1 | 2>(1)
  const [roundHistory, setRoundHistory] = useState<RoundResult[]>([])

  // Animation state for Arena3DView
  const [animRound, setAnimRound] = useState<RoundResult | null>(null)
  const [prevRound, setPrevRound] = useState<RoundResult | null>(null)
  const [isAnimating, setIsAnimating] = useState(false)

  // VFX states
  const [screenFlash, setScreenFlash] = useState(false)
  const [flashIntensity, setFlashIntensity] = useState<'normal' | 'heavy'>('normal')
  const [announcement, setAnnouncement] = useState<{ text: string; subtext?: string; color: 'cyan' | 'red' | 'amber' | 'green' | 'white' } | null>(null)
  const [showAnnouncement, setShowAnnouncement] = useState(false)
  const [showResult, setShowResult] = useState(false)
  const [winner, setWinner] = useState<'bot1' | 'bot2' | 'draw'>('bot1')

  // HP display (for overlaid HP bars)
  const [bot1Hp, setBot1Hp] = useState(BOT1_MAX_HP)
  const [bot2Hp, setBot2Hp] = useState(BOT2_MAX_HP)

  // Damage number display
  const [bot1Damage, setBot1Damage] = useState({ show: false, amount: 0, isCounter: false })
  const [bot2Damage, setBot2Damage] = useState({ show: false, amount: 0, isCounter: false })

  // Action log
  const [logEntries, setLogEntries] = useState<string[]>([])

  // Refs for cleanup
  const timeoutRefs = useRef<ReturnType<typeof setTimeout>[]>([])
  const abortRef = useRef(false)

  const delay = useCallback((ms: number) => {
    return new Promise<void>((resolve) => {
      const t = setTimeout(resolve, ms / speed)
      timeoutRefs.current.push(t)
    })
  }, [speed])

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      timeoutRefs.current.forEach(clearTimeout)
    }
  }, [])

  const clearAllTimeouts = useCallback(() => {
    timeoutRefs.current.forEach(clearTimeout)
    timeoutRefs.current = []
  }, [])

  // Flash helper
  const flash = useCallback((intensity: 'normal' | 'heavy' = 'normal') => {
    setFlashIntensity(intensity)
    setScreenFlash(true)
    setTimeout(() => setScreenFlash(false), 150)
  }, [])

  // Announcement helper
  const announce = useCallback((text: string, color: 'cyan' | 'red' | 'amber' | 'green' | 'white', durationMs: number, subtext?: string) => {
    setAnnouncement({ text, color, subtext })
    setShowAnnouncement(true)
    return new Promise<void>((resolve) => {
      const t = setTimeout(() => {
        setShowAnnouncement(false)
        setTimeout(resolve, 200)
      }, durationMs)
      timeoutRefs.current.push(t)
    })
  }, [])

  // Add log entry
  const addLog = useCallback((msg: string) => {
    setLogEntries((prev) => [...prev, msg])
  }, [])

  // ============================================================
  // Play through one round
  // ============================================================
  const playRound = useCallback(async (roundIdx: number) => {
    if (abortRef.current) return

    const round = MOCK_ROUNDS[roundIdx]
    const prev = roundIdx > 0 ? MOCK_ROUNDS[roundIdx - 1] : null
    const isLastRound = round.bot1_hp <= 0 || round.bot2_hp <= 0

    // === Round intro announcement ===
    setPhase('round-intro')
    await announce(`ROUND ${round.round}`, 'white', 800 / speed)
    if (abortRef.current) return

    await delay(300)
    if (abortRef.current) return

    // === Check for counters and announce them ===
    const bot1Counter = round.bot1_counter !== 'none'
    const bot2Counter = round.bot2_counter !== 'none'

    // === KO pause for final blow ===
    if (isLastRound) {
      setPhase('ko-pause')
      await announce('FINAL BLOW', 'red', 1500 / speed, 'decisive moment...')
      if (abortRef.current) return
    }

    // === Play the 3D animation ===
    setPhase('animating')
    setPrevRound(prev)
    setAnimRound(round)
    setIsAnimating(true)

    // Show damage numbers after a brief delay (synced with animation)
    await delay(900)
    if (abortRef.current) return

    // Bot1 deals damage to bot2
    if (round.bot1_damage_dealt > 0) {
      setBot2Damage({ show: true, amount: round.bot1_damage_dealt, isCounter: bot1Counter })
      if (round.bot1_damage_dealt >= 20) flash('heavy')
      else flash('normal')

      addLog(`R${round.round}: ${BOT1_NAME} ${actionLabel(round.bot1_action)} → ${round.bot1_damage_dealt} DMG`)
    }

    if (bot1Counter) {
      await delay(200)
      if (abortRef.current) return
      await announce('COUNTER!', 'amber', 600 / speed)
      addLog(`R${round.round}: ${BOT1_NAME} COUNTER! (${round.bot1_counter.replace(/_/g, ' ')})`)
    }

    await delay(600)
    if (abortRef.current) return
    setBot2Damage({ show: false, amount: 0, isCounter: false })

    // Bot2 deals damage to bot1
    if (round.bot2_damage_dealt > 0) {
      setBot1Damage({ show: true, amount: round.bot2_damage_dealt, isCounter: bot2Counter })
      if (round.bot2_damage_dealt >= 20) flash('heavy')
      else if (round.bot2_damage_dealt > 0) flash('normal')

      addLog(`R${round.round}: ${BOT2_NAME} ${actionLabel(round.bot2_action)} → ${round.bot2_damage_dealt} DMG`)
    }

    if (bot2Counter) {
      await delay(200)
      if (abortRef.current) return
      await announce('COUNTER!', 'amber', 600 / speed)
      addLog(`R${round.round}: ${BOT2_NAME} COUNTER! (${round.bot2_counter.replace(/_/g, ' ')})`)
    }

    await delay(600)
    if (abortRef.current) return
    setBot1Damage({ show: false, amount: 0, isCounter: false })

    // Update HP (with delayed drain effect)
    setBot1Hp(round.bot1_hp)
    setBot2Hp(round.bot2_hp)

    // Log effects
    for (const eff of round.effects_applied) {
      addLog(`R${round.round}: ${eff.bot === 'bot1' ? BOT1_NAME : BOT2_NAME} — ${eff.effect} (${eff.duration} rounds)`)
    }

    // Update round history
    setRoundHistory((prev) => [...prev, round])
    setCurrentRoundIdx(roundIdx)

    await delay(800)
    if (abortRef.current) return

    // Critical hit announcement for big damage
    const maxDmg = Math.max(round.bot1_damage_dealt, round.bot2_damage_dealt)
    if (maxDmg >= 25) {
      await announce('CRITICAL!', 'red', 600 / speed, `${maxDmg} DAMAGE`)
      flash('heavy')
    }

  }, [speed, announce, delay, flash, addLog])

  // ============================================================
  // Arena3D animation complete callback
  // ============================================================
  const onAnimationComplete = useCallback(() => {
    setIsAnimating(false)
  }, [])

  // ============================================================
  // Start Demo Match
  // ============================================================
  const startDemo = useCallback(async () => {
    // Reset everything
    abortRef.current = false
    clearAllTimeouts()
    setPhase('playing')
    setCurrentRoundIdx(-1)
    setRoundHistory([])
    setAnimRound(null)
    setPrevRound(null)
    setIsAnimating(false)
    setBot1Hp(BOT1_MAX_HP)
    setBot2Hp(BOT2_MAX_HP)
    setBot1Damage({ show: false, amount: 0, isCounter: false })
    setBot2Damage({ show: false, amount: 0, isCounter: false })
    setLogEntries([])
    setShowResult(false)
    setShowAnnouncement(false)
    setScreenFlash(false)

    // Opening announcement
    await announce('MATCH START', 'cyan', 1200 / speed, `${BOT1_NAME} vs ${BOT2_NAME}`)
    if (abortRef.current) return

    addLog(`Match: ${BOT1_NAME} vs ${BOT2_NAME} — 7 rounds`)

    // Play each round
    for (let i = 0; i < MOCK_ROUNDS.length; i++) {
      if (abortRef.current) return
      await playRound(i)
      if (abortRef.current) return
      // Inter-round pause
      if (i < MOCK_ROUNDS.length - 1) {
        await delay(600)
      }
    }

    if (abortRef.current) return

    // Determine winner
    const lastRound = MOCK_ROUNDS[MOCK_ROUNDS.length - 1]
    const w = lastRound.bot1_hp <= 0 && lastRound.bot2_hp <= 0
      ? 'draw'
      : lastRound.bot2_hp <= 0
      ? 'bot1'
      : lastRound.bot1_hp <= 0
      ? 'bot2'
      : lastRound.bot1_hp >= lastRound.bot2_hp ? 'bot1' : 'bot2'

    await delay(500)
    setWinner(w)
    setPhase('result')
    setShowResult(true)
    addLog(`Result: ${w === 'bot1' ? BOT1_NAME : w === 'bot2' ? BOT2_NAME : 'DRAW'} wins!`)

  }, [speed, clearAllTimeouts, announce, addLog, playRound, delay])

  // Skip to result
  const skipToResult = useCallback(() => {
    abortRef.current = true
    clearAllTimeouts()
    setShowAnnouncement(false)
    setScreenFlash(false)

    // Set all rounds as played
    setRoundHistory(MOCK_ROUNDS)
    setCurrentRoundIdx(MOCK_ROUNDS.length - 1)

    const lastRound = MOCK_ROUNDS[MOCK_ROUNDS.length - 1]
    setBot1Hp(lastRound.bot1_hp)
    setBot2Hp(lastRound.bot2_hp)
    setAnimRound(lastRound)
    setPrevRound(MOCK_ROUNDS[MOCK_ROUNDS.length - 2])
    setIsAnimating(false)

    const w = lastRound.bot1_hp <= 0 && lastRound.bot2_hp <= 0
      ? 'draw'
      : lastRound.bot2_hp <= 0
      ? 'bot1'
      : lastRound.bot1_hp <= 0
      ? 'bot2'
      : lastRound.bot1_hp >= lastRound.bot2_hp ? 'bot1' : 'bot2'

    setWinner(w)
    setPhase('result')

    // Fill log
    const logs: string[] = [`Match: ${BOT1_NAME} vs ${BOT2_NAME} — 7 rounds`]
    for (const r of MOCK_ROUNDS) {
      if (r.bot1_damage_dealt > 0) logs.push(`R${r.round}: ${BOT1_NAME} → ${r.bot1_damage_dealt} DMG`)
      if (r.bot2_damage_dealt > 0) logs.push(`R${r.round}: ${BOT2_NAME} → ${r.bot2_damage_dealt} DMG`)
    }
    logs.push(`Result: ${w === 'bot1' ? BOT1_NAME : w === 'bot2' ? BOT2_NAME : 'DRAW'} wins!`)
    setLogEntries(logs)

    setTimeout(() => setShowResult(true), 300)
  }, [clearAllTimeouts])

  // Replay
  const replay = useCallback(() => {
    setShowResult(false)
    abortRef.current = false
    setTimeout(() => startDemo(), 300)
  }, [startDemo])

  // Current round display number
  const displayRound = currentRoundIdx >= 0 ? MOCK_ROUNDS[currentRoundIdx].round : 0

  return (
    <>
      {/* Inject keyframes */}
      <style jsx global>{`
        @keyframes floatDamage {
          0% { transform: translateY(0) scale(1); opacity: 1; }
          30% { transform: translateY(-20px) scale(1.3); opacity: 1; }
          100% { transform: translateY(-50px) scale(0.8); opacity: 0; }
        }
        @keyframes fadeSlideIn {
          from { transform: translateX(20px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes bounceIn {
          0% { transform: scale(0) rotate(-15deg); opacity: 0; }
          50% { transform: scale(1.2) rotate(5deg); }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        @keyframes slideUpCard {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 10px rgba(0,240,255,0.3); }
          50% { box-shadow: 0 0 25px rgba(0,240,255,0.6); }
        }
      `}</style>

      <div className="h-screen w-screen flex flex-col bg-[var(--bg-void)] overflow-hidden relative">
        {/* === Top Control Bar === */}
        <div className="flex-shrink-0 flex items-center justify-between px-4 py-2 bg-black/40 border-b border-white/5 z-50">
          {/* Left: Title */}
          <div className="flex items-center gap-3">
            <span
              className="text-xs font-bold tracking-[0.3em] text-white/40 uppercase"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              ClawdArena
            </span>
            <span className="text-[10px] text-white/20 font-mono">v2 PROTOTYPE</span>
          </div>

          {/* Center: Demo controls */}
          <div className="flex items-center gap-2">
            {phase === 'idle' ? (
              <button
                onClick={startDemo}
                className="flex items-center gap-2 px-4 py-1.5 bg-cyan-600/20 border border-cyan-500/40 rounded-sm hover:bg-cyan-600/30 hover:border-cyan-400 transition-all text-cyan-400 text-xs font-mono uppercase tracking-wider"
                style={{ animation: 'pulseGlow 2s ease-in-out infinite' }}
              >
                <Play className="w-3.5 h-3.5" />
                Play Demo Match
              </button>
            ) : phase === 'result' ? (
              <button
                onClick={replay}
                className="flex items-center gap-2 px-4 py-1.5 bg-white/10 border border-white/20 rounded-sm hover:bg-white/20 transition-all text-white text-xs font-mono uppercase tracking-wider"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Replay
              </button>
            ) : (
              <button
                onClick={skipToResult}
                className="flex items-center gap-2 px-4 py-1.5 bg-white/10 border border-white/20 rounded-sm hover:bg-white/15 transition-all text-white/70 text-xs font-mono uppercase tracking-wider"
              >
                <SkipForward className="w-3.5 h-3.5" />
                Skip to Result
              </button>
            )}
          </div>

          {/* Right: Speed + Round */}
          <div className="flex items-center gap-3">
            {/* Speed toggle */}
            <button
              onClick={() => setSpeed((s) => (s === 1 ? 2 : 1))}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-sm border text-[11px] font-mono transition-all ${
                speed === 2
                  ? 'bg-amber-600/20 border-amber-500/40 text-amber-400'
                  : 'bg-white/5 border-white/10 text-white/40'
              }`}
            >
              <Gauge className="w-3 h-3" />
              {speed}x
            </button>

            {/* Round indicator */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/5 border border-white/10 rounded-sm">
              <span className="text-[10px] text-white/30 font-mono">RND</span>
              <span
                className="text-sm font-bold text-cyan-400 tabular-nums"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {displayRound}/{MOCK_ROUNDS.length}
              </span>
            </div>
          </div>
        </div>

        {/* === Arena (60% of viewport) === */}
        <div className="relative flex-shrink-0" style={{ height: '60vh' }}>
          <Arena3DView
            bot1Name={BOT1_NAME}
            bot2Name={BOT2_NAME}
            bot1MaxHp={BOT1_MAX_HP}
            bot2MaxHp={BOT2_MAX_HP}
            currentRound={animRound}
            previousRound={prevRound}
            isAnimating={isAnimating}
            onAnimationComplete={onAnimationComplete}
          />

          {/* Overlaid HP bars at bottom of arena */}
          <div className="absolute bottom-4 left-4 right-4 flex gap-4 z-30">
            <div className="relative flex-1">
              <DelayedHPBar
                current={bot1Hp}
                max={BOT1_MAX_HP}
                name={BOT1_NAME}
                side="left"
                showDamage={bot1Damage.show}
                damageAmount={bot1Damage.amount}
                isCounter={bot1Damage.isCounter}
              />
            </div>

            {/* VS separator */}
            <div className="flex items-end pb-1">
              <span
                className="text-xs font-black text-white/20 tracking-widest"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                VS
              </span>
            </div>

            <div className="relative flex-1">
              <DelayedHPBar
                current={bot2Hp}
                max={BOT2_MAX_HP}
                name={BOT2_NAME}
                side="right"
                showDamage={bot2Damage.show}
                damageAmount={bot2Damage.amount}
                isCounter={bot2Damage.isCounter}
              />
            </div>
          </div>
        </div>

        {/* === Bottom Section: Effects & Log === */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Status Effects Row */}
          {roundHistory.length > 0 && (
            <div className="flex-shrink-0 px-4 py-2 flex items-center justify-between border-b border-white/5 bg-black/30">
              {/* Bot1 effects */}
              <div className="flex gap-1.5">
                {roundHistory[roundHistory.length - 1]?.effects_applied
                  .filter((e) => e.bot === 'bot1')
                  .map((e, i) => (
                    <span key={i} className="px-2 py-0.5 text-[10px] font-mono rounded bg-cyan-900/30 border border-cyan-700/30 text-cyan-300">
                      {e.effect}
                    </span>
                  ))}
              </div>

              {/* Momentum display */}
              <div className="flex items-center gap-4">
                {roundHistory[roundHistory.length - 1] && (
                  <>
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-cyan-400/60 font-mono">MTM</span>
                      <div className="flex gap-0.5">
                        {Array.from({ length: Math.min(roundHistory[roundHistory.length - 1].bot1_momentum, 4) }).map((_, i) => (
                          <div key={i} className="w-2 h-2 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400/50" />
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="flex gap-0.5">
                        {Array.from({ length: Math.min(roundHistory[roundHistory.length - 1].bot2_momentum, 4) }).map((_, i) => (
                          <div key={i} className="w-2 h-2 rounded-full bg-red-400 shadow-sm shadow-red-400/50" />
                        ))}
                      </div>
                      <span className="text-[10px] text-red-400/60 font-mono">MTM</span>
                    </div>
                  </>
                )}
              </div>

              {/* Bot2 effects */}
              <div className="flex gap-1.5">
                {roundHistory[roundHistory.length - 1]?.effects_applied
                  .filter((e) => e.bot === 'bot2')
                  .map((e, i) => (
                    <span key={i} className="px-2 py-0.5 text-[10px] font-mono rounded bg-red-900/30 border border-red-700/30 text-red-300">
                      {e.effect}
                    </span>
                  ))}
              </div>
            </div>
          )}

          {/* Round History Timeline */}
          {roundHistory.length > 0 && (
            <div className="flex-shrink-0 px-4 py-2 border-b border-white/5 bg-black/20">
              <div className="flex gap-1 justify-center">
                {MOCK_ROUNDS.map((r, i) => {
                  const played = i <= currentRoundIdx
                  const bot1Won = r.bot1_damage_dealt > r.bot2_damage_dealt
                  const draw = r.bot1_damage_dealt === r.bot2_damage_dealt
                  return (
                    <div
                      key={i}
                      className={`w-8 h-1.5 rounded-full transition-all duration-300 ${
                        !played
                          ? 'bg-white/10'
                          : draw
                          ? 'bg-amber-500/60'
                          : bot1Won
                          ? 'bg-cyan-400/60'
                          : 'bg-red-400/60'
                      }`}
                    />
                  )
                })}
              </div>
            </div>
          )}

          {/* Idle state / instructions */}
          {phase === 'idle' && (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="text-4xl mb-3">⚔️</div>
                <h2
                  className="text-lg font-bold tracking-wider text-white/60 mb-1"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  COMBAT ARENA v2
                </h2>
                <p className="text-xs text-white/30 font-mono">
                  Press ▶ Play Demo Match to watch a 7-round simulated battle
                </p>
              </div>
            </div>
          )}

          {/* Action Log Ticker (always at bottom when playing) */}
          {logEntries.length > 0 && (
            <div className="flex-shrink-0 mt-auto">
              <ActionLogTicker entries={logEntries} />
            </div>
          )}
        </div>

        {/* === VFX Overlays === */}
        <ScreenFlash active={screenFlash} intensity={flashIntensity} />
        <AnnouncementBanner
          text={announcement?.text ?? ''}
          subtext={announcement?.subtext}
          color={announcement?.color ?? 'white'}
          visible={showAnnouncement}
        />
        <MatchResultOverlay
          visible={showResult}
          winner={winner}
          bot1Name={BOT1_NAME}
          bot2Name={BOT2_NAME}
          rounds={MOCK_ROUNDS.length}
          onReplay={replay}
        />
      </div>
    </>
  )
}
