'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type { RoundResult, CombatActionType } from '../../shared/types'

interface ArenaViewProps {
  bot1Name: string
  bot2Name: string
  bot1MaxHp: number
  bot2MaxHp: number
  currentRound: RoundResult | null
  previousRound: RoundResult | null
  isAnimating: boolean
  onAnimationComplete?: () => void
}

interface FloatingNumber {
  id: number
  value: number
  x: number
  y: number
  isHeal: boolean
  startTime: number
}

/**
 * 2D CSS-based arena visualization.
 * Shows two bot avatars with attack, defend, and skill animations.
 */
export function ArenaView({
  bot1Name,
  bot2Name,
  bot1MaxHp,
  bot2MaxHp,
  currentRound,
  previousRound,
  isAnimating,
  onAnimationComplete,
}: ArenaViewProps) {
  const [bot1Hp, setBot1Hp] = useState(bot1MaxHp)
  const [bot2Hp, setBot2Hp] = useState(bot2MaxHp)
  const [bot1Anim, setBot1Anim] = useState<string>('')
  const [bot2Anim, setBot2Anim] = useState<string>('')
  const [bot1Effect, setBot1Effect] = useState<string>('')
  const [bot2Effect, setBot2Effect] = useState<string>('')
  const [floatingNums, setFloatingNums] = useState<FloatingNumber[]>([])
  const [showSlash1, setShowSlash1] = useState(false)
  const [showSlash2, setShowSlash2] = useState(false)
  const [showFireball, setShowFireball] = useState<'left' | 'right' | null>(null)
  const [showShield, setShowShield] = useState<'left' | 'right' | null>(null)
  const [showEmp, setShowEmp] = useState(false)
  const [shakeScreen, setShakeScreen] = useState(false)
  const numIdRef = useRef(0)

  // Update HP from previous rounds
  useEffect(() => {
    if (previousRound) {
      setBot1Hp(previousRound.bot1_hp)
      setBot2Hp(previousRound.bot2_hp)
    }
  }, [previousRound])

  const addFloatingNum = useCallback((value: number, side: 'left' | 'right', isHeal: boolean) => {
    const id = ++numIdRef.current
    const x = side === 'left' ? 25 : 75
    const y = 40 + Math.random() * 10
    setFloatingNums((prev) => [...prev, { id, value, x, y, isHeal, startTime: Date.now() }])
    setTimeout(() => {
      setFloatingNums((prev) => prev.filter((n) => n.id !== id))
    }, 1200)
  }, [])

  // Animate current round
  useEffect(() => {
    if (!currentRound || !isAnimating) return

    const timeline = async () => {
      // Phase 1: Actions (500ms delay)
      await delay(300)

      // Animate bot1 action
      animateAction(currentRound.bot1_action, 'left', currentRound)
      // Animate bot2 action
      animateAction(currentRound.bot2_action, 'right', currentRound)

      await delay(600)

      // Phase 2: Damage numbers
      if (currentRound.bot1_damage_dealt > 0) {
        addFloatingNum(currentRound.bot1_damage_dealt, 'right', false)
        setShakeScreen(true)
        setTimeout(() => setShakeScreen(false), 200)
      }
      if (currentRound.bot2_damage_dealt > 0) {
        addFloatingNum(currentRound.bot2_damage_dealt, 'left', false)
      }

      await delay(400)

      // Phase 3: HP update (smooth)
      setBot1Hp(currentRound.bot1_hp)
      setBot2Hp(currentRound.bot2_hp)

      // Phase 4: Effects
      for (const effect of currentRound.effects_applied) {
        if (effect.bot === 'bot1') {
          setBot1Effect(effect.effect)
        } else {
          setBot2Effect(effect.effect)
        }
      }

      await delay(800)

      // Cleanup
      setBot1Anim('')
      setBot2Anim('')
      setBot1Effect('')
      setBot2Effect('')
      setShowSlash1(false)
      setShowSlash2(false)
      setShowFireball(null)
      setShowShield(null)
      setShowEmp(false)

      onAnimationComplete?.()
    }

    timeline()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentRound, isAnimating])

  function animateAction(action: CombatActionType, side: 'left' | 'right', round: RoundResult) {
    const isBot1 = side === 'left'
    const setAnim = isBot1 ? setBot1Anim : setBot2Anim

    switch (action) {
      case 'attack':
        setAnim('animate-lunge-' + side)
        if (isBot1) setShowSlash1(true)
        else setShowSlash2(true)
        setTimeout(() => {
          if (isBot1) setShowSlash1(false)
          else setShowSlash2(false)
        }, 600)
        break
      case 'defend':
        setAnim('animate-defend')
        setShowShield(side)
        setTimeout(() => setShowShield(null), 800)
        break
      case 'skill': {
        // Check effects to determine skill type
        const effects = round.effects_applied.filter(e => e.bot === (isBot1 ? 'bot1' : 'bot2') || e.bot === (isBot1 ? 'bot2' : 'bot1'))
        const hasFireEffect = effects.some(e => e.effect === 'burning')
        const hasEmpEffect = effects.some(e => e.effect === 'stunned')
        const hasShieldEffect = effects.some(e => e.effect === 'shield_wall' || e.effect === 'iron_fortress')
        const hasRegenEffect = effects.some(e => e.effect === 'regenerating')

        if (hasFireEffect) {
          setShowFireball(side)
          setAnim('animate-cast')
          setTimeout(() => setShowFireball(null), 800)
        } else if (hasEmpEffect) {
          setShowEmp(true)
          setAnim('animate-cast')
          setTimeout(() => setShowEmp(false), 800)
        } else if (hasShieldEffect) {
          setShowShield(isBot1 ? 'left' : 'right')
          setAnim('animate-defend')
          setTimeout(() => setShowShield(null), 800)
        } else if (hasRegenEffect) {
          setAnim('animate-heal')
          addFloatingNum(8, side, true)
        } else {
          setAnim('animate-cast')
        }
        break
      }
    }
  }

  const bot1HpPct = Math.max(0, (bot1Hp / bot1MaxHp) * 100)
  const bot2HpPct = Math.max(0, (bot2Hp / bot2MaxHp) * 100)

  function hpColor(pct: number) {
    if (pct <= 25) return 'bg-red-500'
    if (pct <= 50) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  return (
    <div className={`relative w-full aspect-[16/9] max-h-[400px] bg-gradient-to-b from-[var(--bg-panel)] via-[var(--bg-panel)] to-[var(--bg-void)] rounded-sm border border-[var(--border-dim)] overflow-hidden ${shakeScreen ? 'animate-shake' : ''}`}>
      {/* Arena floor gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-[var(--neon-cyan)]/5 to-transparent" />

      {/* Grid lines for depth */}
      <div className="absolute bottom-0 left-0 right-0 h-1/3 opacity-10">
        <div className="absolute bottom-0 left-0 right-0 h-px bg-[var(--neon-cyan)]" />
        <div className="absolute bottom-[33%] left-[10%] right-[10%] h-px bg-[var(--neon-cyan)]/50" />
        <div className="absolute bottom-[66%] left-[20%] right-[20%] h-px bg-[var(--neon-cyan)]/30" />
      </div>

      {/* VS Badge */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
        <div className="text-xl font-black text-[var(--text-ghost)] tracking-widest">VS</div>
      </div>

      {/* Bot 1 (Left) */}
      <div className={`absolute left-[15%] bottom-[25%] transition-all duration-300 ${bot1Anim}`}>
        {/* Bot avatar */}
        <div className="relative">
          {/* Shield effect */}
          {showShield === 'left' && (
            <div className="absolute -inset-4 rounded-full border-2 border-blue-400/60 bg-blue-500/10 animate-pulse-fast" />
          )}
          {/* Status glow */}
          {bot1Effect === 'burning' && (
            <div className="absolute -inset-3 rounded-full bg-orange-500/20 animate-pulse" />
          )}
          {bot1Effect === 'stunned' && (
            <div className="absolute -inset-3 rounded-full bg-yellow-500/20 animate-pulse" />
          )}
          {bot1Effect === 'regenerating' && (
            <div className="absolute -inset-3 rounded-full bg-green-500/15 animate-pulse" />
          )}
          <div className="w-20 h-20 sm:w-24 sm:h-24 bg-[var(--bg-raised)] border border-[var(--border-mid)] rounded-sm flex items-center justify-center text-3xl sm:text-4xl  border border-[var(--neon-cyan)]/30">
            🤖
          </div>
          {/* Status icon */}
          {bot1Effect && (
            <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[var(--bg-panel)] border border-[var(--border-mid)] flex items-center justify-center text-xs animate-bounce-slow">
              {bot1Effect === 'burning' ? '🔥' : bot1Effect === 'stunned' ? '⚡' : bot1Effect === 'regenerating' ? '💚' : '✨'}
            </div>
          )}
        </div>
        {/* Name */}
        <div className="text-center mt-2">
          <div className="text-xs sm:text-sm font-semibold text-[var(--neon-cyan)] truncate max-w-[100px]">{bot1Name}</div>
        </div>
      </div>

      {/* Bot 2 (Right) */}
      <div className={`absolute right-[15%] bottom-[25%] transition-all duration-300 ${bot2Anim}`}>
        <div className="relative">
          {showShield === 'right' && (
            <div className="absolute -inset-4 rounded-full border-2 border-blue-400/60 bg-blue-500/10 animate-pulse-fast" />
          )}
          {bot2Effect === 'burning' && (
            <div className="absolute -inset-3 rounded-full bg-orange-500/20 animate-pulse" />
          )}
          {bot2Effect === 'stunned' && (
            <div className="absolute -inset-3 rounded-full bg-yellow-500/20 animate-pulse" />
          )}
          {bot2Effect === 'regenerating' && (
            <div className="absolute -inset-3 rounded-full bg-green-500/15 animate-pulse" />
          )}
          <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-red-600 to-red-800 rounded-sm flex items-center justify-center text-3xl sm:text-4xl shadow-lg shadow-red-500/20 border border-red-500/30">
            👾
          </div>
          {bot2Effect && (
            <div className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-[var(--bg-panel)] border border-[var(--border-mid)] flex items-center justify-center text-xs animate-bounce-slow">
              {bot2Effect === 'burning' ? '🔥' : bot2Effect === 'stunned' ? '⚡' : bot2Effect === 'regenerating' ? '💚' : '✨'}
            </div>
          )}
        </div>
        <div className="text-center mt-2">
          <div className="text-xs sm:text-sm font-semibold text-red-300 truncate max-w-[100px]">{bot2Name}</div>
        </div>
      </div>

      {/* Slash Effect (Bot1 attacking Bot2) */}
      {showSlash1 && (
        <div className="absolute right-[18%] bottom-[30%] z-20 animate-slash">
          <div className="text-4xl sm:text-5xl rotate-12 opacity-90">⚔️</div>
        </div>
      )}

      {/* Slash Effect (Bot2 attacking Bot1) */}
      {showSlash2 && (
        <div className="absolute left-[18%] bottom-[30%] z-20 animate-slash">
          <div className="text-4xl sm:text-5xl -rotate-12 opacity-90">⚔️</div>
        </div>
      )}

      {/* Fireball projectile */}
      {showFireball && (
        <div className={`absolute bottom-[35%] z-20 ${
          showFireball === 'left' ? 'animate-projectile-right' : 'animate-projectile-left'
        }`} style={{ left: showFireball === 'left' ? '25%' : '65%' }}>
          <div className="text-3xl sm:text-4xl">🔥</div>
        </div>
      )}

      {/* EMP Flash */}
      {showEmp && (
        <div className="absolute inset-0 z-20 bg-cyan-500/10 animate-emp-flash flex items-center justify-center">
          <div className="text-5xl animate-pulse-fast">⚡</div>
        </div>
      )}

      {/* Floating damage/heal numbers */}
      {floatingNums.map((num) => (
        <div
          key={num.id}
          className="absolute z-30 animate-float-up pointer-events-none"
          style={{ left: `${num.x}%`, top: `${num.y}%` }}
        >
          <span className={`text-lg sm:text-2xl font-black ${
            num.isHeal ? 'text-green-400' : 'text-red-400'
          } drop-shadow-lg`}>
            {num.isHeal ? '+' : '-'}{num.value}
          </span>
        </div>
      ))}

      {/* HP Bars at bottom */}
      <div className="absolute bottom-3 left-3 right-3 flex gap-4 z-10">
        {/* Bot1 HP */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-[var(--neon-cyan)] font-medium">{bot1Name}</span>
            <span className="text-[10px] text-[var(--text-secondary)] font-mono">{bot1Hp}/{bot1MaxHp}</span>
          </div>
          <div className="h-2.5 bg-[var(--bg-raised)] rounded-full overflow-hidden border border-[var(--border-mid)]">
            <div
              className={`h-full rounded-full transition-all duration-700 ease-out ${hpColor(bot1HpPct)}`}
              style={{ width: `${bot1HpPct}%` }}
            />
          </div>
        </div>
        {/* Bot2 HP */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-red-300 font-medium">{bot2Name}</span>
            <span className="text-[10px] text-[var(--text-secondary)] font-mono">{bot2Hp}/{bot2MaxHp}</span>
          </div>
          <div className="h-2.5 bg-[var(--bg-raised)] rounded-full overflow-hidden border border-[var(--border-mid)]">
            <div
              className={`h-full rounded-full transition-all duration-700 ease-out ${hpColor(bot2HpPct)}`}
              style={{ width: `${bot2HpPct}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
